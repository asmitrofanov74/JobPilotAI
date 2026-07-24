import { Injectable, Logger } from '@nestjs/common';
import { exec } from 'child_process';
import { promisify } from 'util';
import { JobProvider, JobSearchInput } from './provider.interface';
import { NormalizedJob } from './normalized-job.interface';

const execAsync = promisify(exec);

interface LeverJob {
  id: string;
  text?: string;
  descriptionPlain?: string;
  description?: string;
  hostedUrl?: string;
  createdAt?: number;
  categories?: { location?: string; department?: string; team?: string; [key: string]: string | undefined };
}

const CURL_TIMEOUT = 30;

async function curlJson(url: string): Promise<LeverJob[]> {
  try {
    const { stdout } = await execAsync(`curl -s --max-time ${CURL_TIMEOUT} "${url}"`, { timeout: CURL_TIMEOUT * 1000 + 5000 });
    return JSON.parse(stdout) as LeverJob[];
  } catch (err: unknown) {
    const error = err as { stdout?: string };
    if (error.stdout) {
      try { return JSON.parse(error.stdout) as LeverJob[]; } catch { /* not JSON */ }
    }
    throw err;
  }
}

const KNOWN_BOARDS: Record<string, string> = {
  // US / global
  stripe: 'Stripe',
  simplisafe: 'SimpliSafe',
  segment: 'Segment',
  gusto: 'Gusto',
  // Canada
  thinkific: 'Thinkific',
  clearco: 'Clearco',
  drop: 'Drop',
  article: 'Article',
  auvik: 'Auvik',
  certn: 'Certn',
};

@Injectable()
export class LeverProvider implements JobProvider {
  readonly name = 'LEVER';
  private readonly logger = new Logger(LeverProvider.name);

  async search(params: JobSearchInput): Promise<NormalizedJob[]> {
    const jobs: NormalizedJob[] = [];

    await Promise.allSettled(
      Object.entries(KNOWN_BOARDS).map(([board, company]) =>
        this.scrapeBoard(board, company, params).then((r) => jobs.push(...r)),
      ),
    );

    return jobs;
  }

  private async scrapeBoard(board: string, company: string, params: JobSearchInput): Promise<NormalizedJob[]> {
    const result: NormalizedJob[] = [];
    const { query, location, jobType, remote, salaryMin, salaryMax } = params;
    const q = (query || '').toLowerCase();

    try {
      const url = `https://api.lever.co/v0/postings/${board}?mode=json`;
      const data: LeverJob[] = await curlJson(url);

      for (const job of data || []) {
        const title = job.text || '';
        if (!title) continue;

        const jobLocation = job.categories?.location || '';
        const desc = (job.descriptionPlain || job.description || '').slice(0, 2000);
        const haystack = `${title} ${desc} ${Object.values(job.categories || {}).join(' ')}`.toLowerCase();

        if (q && !title.toLowerCase().includes(q)) continue;
        if (location && !jobLocation.toLowerCase().includes(location.toLowerCase())) continue;

        if (jobType) {
          const typeMap: Record<string, string[]> = { FULL_TIME: ['full-time', 'full time', 'fulltime', 'permanent'], PART_TIME: ['part-time', 'part time'], CONTRACT: ['contract', 'temporary', 'temp'], INTERNSHIP: ['intern', 'internship', 'co-op', 'coop'] };
          const keywords = typeMap[jobType] || [];
          if (!keywords.some((k) => haystack.includes(k))) continue;
        }
        if (remote === true && !haystack.includes('remote')) continue;
        if (salaryMin || salaryMax) {
          const salaryMatch = desc.toLowerCase().match(/\$[\d,]+(?:k)?(?:\s*-\s*\$?[\d,]+(?:k)?)?/g);
          if (salaryMatch) {
            const nums: number[] = salaryMatch.flatMap((s: string) => s.replace(/[$,k\s]/g, '').split('-').map(Number).filter((n: number) => !isNaN(n)));
            if (salaryMin && !nums.some((n: number) => n >= salaryMin)) continue;
            if (salaryMax && !nums.some((n: number) => n <= salaryMax)) continue;
          }
        }

        let empType: string | undefined;
        if (haystack.includes('intern') || haystack.includes('co-op')) empType = 'INTERNSHIP';
        else if (haystack.includes('contract') || haystack.includes('temporary')) empType = 'CONTRACT';
        else if (haystack.includes('part-time') || haystack.includes('part time')) empType = 'PART_TIME';
        else if (haystack.includes('full-time') || haystack.includes('full time')) empType = 'FULL_TIME';

        result.push({
          title,
          company,
          location: jobLocation,
          remote: haystack.includes('remote'),
          description: desc,
          employmentType: empType,
          source: this.name,
          sourceUrl: job.hostedUrl || `https://jobs.lever.co/${board}/${job.id}`,
          postedAt: job.createdAt ? new Date(job.createdAt) : undefined,
        });
      }
    } catch (err) {
      this.logger.warn(`Lever ${board}: ${err instanceof Error ? err.message : String(err)}`);
    }
    return result;
  }
}
