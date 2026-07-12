import { Controller, Get } from '@nestjs/common';
import { OpenRouterProvider } from './providers/openrouter.provider';
import { ConfigService } from '@nestjs/config';

@Controller('ai')
export class AiController {
  constructor(
    private readonly openRouterProvider: OpenRouterProvider,
    private readonly configService: ConfigService,
  ) {}

  @Get('status')
  getStatus() {
    const apiKey = this.configService.get<string>('OPENROUTER_API_KEY', '');
    const model = this.configService.get<string>('OPENROUTER_MODEL', 'openrouter/free');

    return {
      provider: 'OpenRouter',
      model,
      healthy: !!apiKey,
    };
  }
}
