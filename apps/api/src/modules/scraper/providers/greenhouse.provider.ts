import { Injectable, Logger } from '@nestjs/common';
import { exec } from 'child_process';
import { promisify } from 'util';
import { JobProvider, JobSearchInput } from './provider.interface';
import { NormalizedJob } from './normalized-job.interface';

const execAsync = promisify(exec);

const KNOWN_BOARDS: Record<string, string> = {
  gitlab: 'GitLab',
  hashicorp: 'HashiCorp',
  datadog: 'Datadog',
  dropbox: 'Dropbox',
  pinterest: 'Pinterest',
  coinbase: 'Coinbase',
  instacart: 'Instacart',
  reddit: 'Reddit',
  doordash: 'DoorDash',
  spotify: 'Spotify',
};

@Injectable()
export class GreenhouseProvider implements JobProvider {
  readonly name = 'GREENHOUSE';
  private readonly logger = new Logger(GreenhouseProvider.name);

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
      const url = `https://boards-api.greenhouse.io/v1/boards/${board}/jobs?content=true`;
      const { stdout } = await execAsync(`curl -s --max-time 10 "${url}"`, { timeout: 15000 });
      const data = JSON.parse(stdout);
      const items: any[] = data.jobs || [];

      for (const job of items) {
        const title = job.title || '';
        const office = job.offices?.[0];
        const jobLocation = office ? `${office.name}${office.city ? `, ${office.city}` : ''}` : '';

        if (!title) continue;
        if (query && !title.toLowerCase().includes(query)) continue;
        if (location && !jobLocation.toLowerCase().includes(location.toLowerCase())) continue;

        result.push({
          title,
          company,
          location: jobLocation,
          description: (job.content || '').replace(/<[^>]*>/g, '').slice(0, 2000),
          source: this.name,
          sourceUrl: `https://boards.greenhouse.io/${board}/jobs/${job.id}`,
          postedAt: job.updated_at ? new Date(job.updated_at) : undefined,
        });
      }
    } catch (err) {
      this.logger.warn(`Greenhouse ${board}: ${err instanceof Error ? err.message : err}`);
    }
    return result;
  }
}
