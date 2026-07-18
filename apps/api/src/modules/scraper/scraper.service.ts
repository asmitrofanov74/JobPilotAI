import { Injectable, Logger } from '@nestjs/common';
import { JobProvider, JobSearchInput } from './providers/provider.interface';
import { NormalizedJob } from './providers/normalized-job.interface';
import { ProviderFactory, PROVIDER_PRIORITY, ProviderName } from './providers/provider.factory';
import { DedupService } from './services/dedup.service';
import { ProviderHealthService } from './services/provider-health.service';

export enum PostedWithin {
  H24 = '24h',
  D3 = '3d',
  D7 = '7d',
  D14 = '14d',
  D30 = '30d',
}

export interface ScrapedJob {
  companyName: string;
  jobTitle: string;
  jobDescription: string;
  jobUrl: string;
  location: string;
  salaryRange: string | null;
  source: string;
  sourceUrl: string;
  sourceId: string;
  employmentType: string | null;
  workMode: string | null;
  postedDate: string | null;
}

export interface ProviderStats {
  [provider: string]: number;
}

export interface JobSourceFilter {
  linkedin?: boolean;
  indeed?: boolean;
  workopolis?: boolean;
  ziprecruiter?: boolean;
  greenhouse?: boolean;
  lever?: boolean;
  workday?: boolean;
}

function toScrapedJob(n: NormalizedJob): ScrapedJob {
  return {
    companyName: n.company,
    jobTitle: n.title,
    jobDescription: n.description || '',
    jobUrl: n.sourceUrl,
    location: n.location || '',
    salaryRange: n.salary || null,
    source: n.source,
    sourceUrl: n.sourceUrl,
    sourceId: `${n.source.toLowerCase()}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    employmentType: n.employmentType || null,
    workMode: n.remote ? 'Remote' : null,
    postedDate: n.postedAt?.toISOString() || null,
  };
}

@Injectable()
export class ScraperService {
  private readonly logger = new Logger(ScraperService.name);

  constructor(
    private readonly providerFactory: ProviderFactory,
    private readonly dedupService: DedupService,
    private readonly healthService: ProviderHealthService,
  ) {}

  async scrapeAll(
    keywords: string,
    location: string,
    postedWithin?: PostedWithin,
    source?: string,
    jobType?: string,
    remote?: boolean,
    salaryMin?: number,
    salaryMax?: number,
    sources?: JobSourceFilter,
  ): Promise<{ jobs: ScrapedJob[]; stats: ProviderStats }> {
    let providers: JobProvider[];

    if (source) {
      const p = this.providerFactory.getProvider(source);
      providers = p ? [p] : [];
    } else if (sources) {
      const providerNameMap: Record<string, string> = {
        linkedin: 'LINKEDIN',
        indeed: 'INDEED',
        workopolis: 'WORKOPOLIS',
        ziprecruiter: 'ZIPRECRUITER',
        greenhouse: 'GREENHOUSE',
        lever: 'LEVER',
        workday: 'WORKDAY',
      };
      providers = [];
      for (const [key, name] of Object.entries(providerNameMap)) {
        if (sources[key as keyof JobSourceFilter] !== false) {
          const p = this.providerFactory.getProvider(name);
          if (p) providers.push(p);
        }
      }
    } else {
      providers = this.providerFactory.getAllProviders();
    }

    const allNormalized: NormalizedJob[] = [];
    const stats: ProviderStats = {};

    const results = await Promise.allSettled(
      providers.map(async (provider) => {
        try {
          const jobs = await provider.search({
            query: keywords,
            location,
            jobType: jobType as JobSearchInput['jobType'],
            remote,
            salaryMin,
            salaryMax,
          });
          this.healthService.recordSuccess(provider.name);
          stats[provider.name] = jobs.length;
          allNormalized.push(...jobs);
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err);
          this.healthService.recordFailure(provider.name, msg);
          stats[provider.name] = 0;
        }
      }),
    );

    const deduped = this.dedupService.deduplicate(allNormalized);

    deduped.sort((a, b) => {
      const pa = PROVIDER_PRIORITY[a.source as ProviderName] || 99;
      const pb = PROVIDER_PRIORITY[b.source as ProviderName] || 99;
      if (pa !== pb) return pa - pb;
      return (b.postedAt?.getTime() || 0) - (a.postedAt?.getTime() || 0);
    });

    let jobs = deduped.map(toScrapedJob);

    if (postedWithin) {
      const cutoff = Date.now() - postedWithinMs(postedWithin);
      jobs = jobs.filter((j) => {
        if (!j.postedDate) return true;
        return new Date(j.postedDate).getTime() >= cutoff;
      });
    }

    return { jobs, stats };
  }

  getHealth() {
    return this.healthService.getAll();
  }
}

function postedWithinMs(within: PostedWithin | undefined): number {
  const hours: Record<string, number> = { '24h': 24, '3d': 72, '7d': 168, '14d': 336, '30d': 720 };
  return (hours[within ?? '30d'] ?? 720) * 60 * 60 * 1000;
}
