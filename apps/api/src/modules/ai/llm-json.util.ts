import type { ChatOptions, ChatResult } from './providers/ai-provider.interface';

export interface LlmChatProvider {
  chat(options: ChatOptions): Promise<ChatResult>;
}

export function parseLlmJson(raw: string): unknown {
  try {
    return JSON.parse(raw);
  } catch {
    // Model output may be wrapped in text or truncated; try to extract the
    // outermost JSON value before giving up.
    const starts = ['{', '[']
      .map((c) => raw.indexOf(c))
      .filter((i) => i !== -1);
    const ends = ['}', ']']
      .map((c) => raw.lastIndexOf(c))
      .filter((i) => i !== -1);
    const start = starts.length ? Math.min(...starts) : -1;
    const end = ends.length ? Math.max(...ends) : -1;
    if (start !== -1 && end > start) {
      try {
        return JSON.parse(raw.slice(start, end + 1));
      } catch {
        // fall through
      }
    }
    throw new Error(`LLM returned invalid JSON: ${raw.slice(0, 200)}`);
  }
}

export async function chatJson(
  provider: LlmChatProvider,
  options: ChatOptions,
  retries = 2,
): Promise<unknown> {
  let lastError: unknown;
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      const { content: raw } = await provider.chat(options);
      return parseLlmJson(raw);
    } catch (err) {
      lastError = err;
    }
  }
  throw lastError;
}

const TEXT_KEYS = ['question', 'text', 'content', 'title', 'name', 'value', 'prompt'];

export function extractNestedString(value: unknown): string {
  if (typeof value === 'string') return value.trim();
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  if (Array.isArray(value)) {
    for (const item of value) {
      const found = extractNestedString(item);
      if (found) return found;
    }
    return '';
  }
  if (value && typeof value === 'object') {
    const obj = value as Record<string, unknown>;
    for (const key of TEXT_KEYS) {
      if (key in obj) {
        const found = extractNestedString(obj[key]);
        if (found) return found;
      }
    }
    for (const val of Object.values(obj)) {
      const found = extractNestedString(val);
      if (found) return found;
    }
  }
  return '';
}

