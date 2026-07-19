export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface ChatOptions {
  model?: string;
  messages: ChatMessage[];
  temperature?: number;
  max_tokens?: number;
  response_format?: { type: 'json_object' | 'text' };
}

export interface ChatResult {
  content: string;
  model: string;
}

export interface AIProvider {
  readonly name: string;
  chat(options: ChatOptions): Promise<ChatResult>;
}
