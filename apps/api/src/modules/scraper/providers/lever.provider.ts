import { Injectable, Logger } from '@nestjs/common';
import { exec } from 'child_process';
import { promisify } from 'util';
import { JobProvider, JobSearchInput } from './provider.interface';
import { NormalizedJob } from './normalized-job.interface';

const execAsync = promisify(exec);

const KNOWN_BOARDS: Record<string, string> = {
  shopify: 'Shopify',
  stripe: 'Stripe',
  simplisafe: 'SimpliSafe',
};

@Injectable()
export class LeverProvider implements JobProvider {
  readonly name = 'LEVER';
  private readonly logger = new Logger(LeverProvider.name);

  async search(params: JobSearchInput): Promise<NormalizedJob[]> {
    const jobs: NormalizedJob[] = [];
    const query = params.query.toLowerCase();

    await Promise.allSettled(
      Object.entries(KNOWN_BOARDS).map(([board, company]) =>
        this.scrapeBoard(board, company, query, params.location).then((r) => jobs.push(...r)),
      ),
    );

    return jobs;
  }

  private async scrapeBoard(board: string, company: string, query: string, location: string | undefined): Promise<NormalizedJob[]> {
    const result: NormalizedJob[] = [];
    try {
      const url = `https://api.lever.co/v0/postings/${board}?mode=json`;
      const { stdout } = await execAsync(`curl -s --max-time 10 "${url}"`, { timeout: 15000 });
      const data: any[] = JSON.parse(stdout);

      for (const job of data || []) {
        const title = job.text || '';
        const jobLocation = job.categories?.location || '';
        if (!title) continue;
        if (query && !title.toLowerCase().includes(query)) continue;
        if (location && !jobLocation.toLowerCase().includes(location.toLowerCase())) continue;

        result.push({
          title,
          company,
          location: jobLocation,
          description: (job.descriptionPlain || job.description || '').slice(0, 2000),
          source: this.name,
          sourceUrl: job.hostedUrl || `https://jobs.lever.co/${board}/${job.id}`,
          postedAt: job.createdAt ? new Date(job.createdAt) : undefined,
        });
      }
    } catch (err) {
      this.logger.warn(`Lever ${board}: ${err instanceof Error ? err.message : err}`);
    }
    return result;
  }
}
