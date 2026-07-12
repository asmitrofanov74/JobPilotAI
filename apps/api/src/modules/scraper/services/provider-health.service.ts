import { Injectable } from '@nestjs/common';

export interface ProviderHealthEntry {
  provider: string;
  healthy: boolean;
  lastRun: Date;
  lastError?: string;
}

@Injectable()
export class ProviderHealthService {
  private store = new Map<string, ProviderHealthEntry>();

  recordSuccess(provider: string) {
    this.store.set(provider.toUpperCase(), {
      provider: provider.toUpperCase(),
      healthy: true,
      lastRun: new Date(),
      lastError: undefined,
    });
  }

  recordFailure(provider: string, error: string) {
    this.store.set(provider.toUpperCase(), {
      provider: provider.toUpperCase(),
      healthy: false,
      lastRun: new Date(),
      lastError: error,
    });
  }

  getAll(): ProviderHealthEntry[] {
    return Array.from(this.store.values());
  }

  get(provider: string): ProviderHealthEntry | undefined {
    return this.store.get(provider.toUpperCase());
  }
}
