import { Injectable, OnModuleInit } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { JobProvider } from './provider.interface';
import { GreenhouseProvider } from './greenhouse.provider';
import { LeverProvider } from './lever.provider';
import { WorkdayProvider } from './workday.provider';
import { IndeedProvider } from './indeed.provider';
import { LinkedInProvider } from './linkedin.provider';
import { ZipRecruiterProvider } from './ziprecruiter.provider';
import { WorkopolisProvider } from './workopolis.provider';

export const PROVIDER_NAMES = [
  'GREENHOUSE', 'LEVER', 'WORKDAY',
  'INDEED', 'WORKOPOLIS',
  'LINKEDIN', 'ZIPRECRUITER',
] as const;

export type ProviderName = typeof PROVIDER_NAMES[number];

export const PROVIDER_PRIORITY: Record<ProviderName, number> = {
  GREENHOUSE: 1,
  LEVER: 1,
  WORKDAY: 1,
  INDEED: 2,
  WORKOPOLIS: 2,
  LINKEDIN: 3,
  ZIPRECRUITER: 3,
};

@Injectable()
export class ProviderFactory implements OnModuleInit {
  private providers = new Map<string, JobProvider>();

  constructor(
    private moduleRef: ModuleRef,
    private configService: ConfigService,
  ) {}

  onModuleInit() {
    const enabled = this.configService.get<string>('SCRAPER_PROVIDERS', '')
      .split(',')
      .map((s) => s.trim().toUpperCase())
      .filter(Boolean);

    const allProviders: Record<string, new (...args: any[]) => JobProvider> = {
      GREENHOUSE: GreenhouseProvider,
      LEVER: LeverProvider,
      WORKDAY: WorkdayProvider,
      INDEED: IndeedProvider,
      LINKEDIN: LinkedInProvider,
      ZIPRECRUITER: ZipRecruiterProvider,
      WORKOPOLIS: WorkopolisProvider,
    };

    const active = enabled.length > 0 ? enabled : Object.keys(allProviders);

    for (const name of active) {
      const Ctor = allProviders[name];
      if (Ctor) {
        this.providers.set(name, this.moduleRef.get(Ctor, { strict: false }));
      }
    }
  }

  getProvider(name: string): JobProvider | undefined {
    return this.providers.get(name.toUpperCase());
  }

  getAllProviders(): JobProvider[] {
    return Array.from(this.providers.values());
  }

  getEnabledNames(): string[] {
    return Array.from(this.providers.keys());
  }
}
