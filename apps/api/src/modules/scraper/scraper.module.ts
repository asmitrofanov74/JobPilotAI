import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScraperService } from './scraper.service';
import { ScraperResolver } from './scraper.resolver';
import { JobsModule } from '../jobs/jobs.module';
import { ProviderFactory } from './providers/provider.factory';
import { GreenhouseProvider } from './providers/greenhouse.provider';
import { LeverProvider } from './providers/lever.provider';
import { WorkdayProvider } from './providers/workday.provider';
import { IndeedProvider } from './providers/indeed.provider';
import { LinkedInProvider } from './providers/linkedin.provider';
import { ZipRecruiterProvider } from './providers/ziprecruiter.provider';
import { WorkopolisProvider } from './providers/workopolis.provider';
import { DedupService } from './services/dedup.service';
import { ProviderHealthService } from './services/provider-health.service';
import { AtsDiscoveryService } from './services/ats-discovery.service';

@Module({
  imports: [ConfigModule, JobsModule],
  providers: [
    ScraperService,
    ScraperResolver,
    ProviderFactory,
    DedupService,
    ProviderHealthService,
    AtsDiscoveryService,
    GreenhouseProvider,
    LeverProvider,
    WorkdayProvider,
    IndeedProvider,
    LinkedInProvider,
    ZipRecruiterProvider,
    WorkopolisProvider,
  ],
  exports: [ScraperService, ProviderFactory, DedupService, ProviderHealthService, AtsDiscoveryService],
})
export class ScraperModule {}
