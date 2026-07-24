import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import { AIProvider, ChatOptions, ChatResult } from './ai-provider.interface';

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

@Injectable()
export class OpenRouterProvider implements AIProvider {
  readonly name = 'AI';
  private readonly logger = new Logger(OpenRouterProvider.name);
  private client: OpenAI | null = null;
  private model: string;

  constructor(private readonly configService: ConfigService) {
    const provider = this.configService.get<string>('AI_PROVIDER', 'openrouter');

    if (provider === 'ollama') {
      const baseURL = this.configService.get<string>('OLLAMA_BASE_URL', 'http://127.0.0.1:11434/v1');
      this.model = this.configService.get<string>('OLLAMA_MODEL', 'phi3:mini');
      this.client = new OpenAI({ apiKey: 'ollama', baseURL });
      this.logger.log(`Initialized Ollama -- model: ${this.model}, baseURL: ${baseURL}`);
    } else {
      const apiKey = this.configService.get<string>('OPENROUTER_API_KEY', '');
      const baseURL = this.configService.get<string>('OPENROUTER_BASE_URL', 'https://openrouter.ai/api/v1');
      this.model = this.configService.get<string>('OPENROUTER_MODEL', 'openrouter/free');

      if (apiKey) {
        this.client = new OpenAI({
          apiKey,
          baseURL,
          defaultHeaders: {
            'HTTP-Referer': 'https://jobpilot.ai',
            'X-Title': 'JobPilot AI',
          },
        });
        this.logger.log(`Initialized OpenRouter -- model: ${this.model}, baseURL: ${baseURL}`);
      } else {
        this.logger.warn('OPENROUTER_API_KEY not set -- provider disabled');
      }
    }
  }

  private ensureClient(): OpenAI {
    if (!this.client) {
      throw new Error('AI provider not configured. Set AI_PROVIDER env variable.');
    }
    return this.client;
  }

  async chat(options: ChatOptions): Promise<ChatResult> {
    const client = this.ensureClient();
    const maxRetries = 3;
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const completion = await client.chat.completions.create({
          model: this.model,
          messages: options.messages,
          temperature: options.temperature ?? 0.7,
          max_tokens: options.max_tokens ?? 1000,
          ...(options.response_format ? { response_format: options.response_format } : {}),
        });

        const content = completion.choices[0]?.message?.content || '';
        return { content, model: completion.model || this.model };
      } catch (err: unknown) {
        lastError = err instanceof Error ? err : new Error(String(err));
        const errorWithStatus = err as { status?: number; statusCode?: number };
        const status = errorWithStatus?.status || errorWithStatus?.statusCode || 0;

        if (status === 429 || status >= 500) {
          if (attempt < maxRetries) {
            const delay = Math.pow(2, attempt - 1) * 1000;
            this.logger.warn(
              `AI attempt ${attempt}/${maxRetries} failed (${status}), retrying in ${delay}ms: ${lastError.message}`,
            );
            await sleep(delay);
            continue;
          }
        }

        if (attempt >= maxRetries) {
          this.logger.error(
            `AI failed after ${maxRetries} attempts: ${lastError.message}`,
          );
        }
        throw lastError;
      }
    }

    throw lastError || new Error('AI chat failed');
  }
}
