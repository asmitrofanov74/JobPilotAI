import { Injectable, Logger } from '@nestjs/common';
import { exec } from 'child_process';
import { promisify } from 'util';
import { JobProvider, JobSearchInput } from './provider.interface';
import { NormalizedJob } from './normalized-job.interface';

const execAsync = promisify(exec);

interface TenantConfig {
  tenant: string;
  company: string;
}

const KNOWN_TENANTS: TenantConfig[] = [
  { tenant: 'oracle', company: 'Oracle' },
  { tenant: 'ibm', company: 'IBM' },
  { tenant: 'adobe', company: 'Adobe' },
  { tenant: 'cisco', company: 'Cisco' },
  { tenant: 'intel', company: 'Intel' },
];

@Injectable()
export class WorkdayProvider implements JobProvider {
  readonly name = 'WORKDAY';
  private readonly logger = new Logger(WorkdayProvider.name);

  async search(params: JobSearchInput): Promise<NormalizedJob[]> {
    const jobs: NormalizedJob[] = [];
    const query = params.query.toLowerCase();

    await Promise.allSettled(
      KNOWN_TENANTS.map((cfg) =>
        this.scrapeTenant(cfg, query, params.location).then((r) => jobs.push(...r)),
      ),
    );

    return jobs;
  }

  private async scrapeTenant(cfg: TenantConfig, query: string, location: string | undefined): Promise<NormalizedJob[]> {
    const result: NormalizedJob[] = [];
    try {
      const url = `https://${cfg.tenant}.wd5.myworkdayjobs.com/wday/cxs/${cfg.tenant}/${cfg.company}/jobs`;
      const body = JSON.stringify({ limit: 20, offset: 0, searchText: query });
      const { stdout } = await execAsync(
        `curl -s --max-time 10 "${url}" -H "Content-Type: application/json" -H "Accept: application/json" -d '${body}'`,
        { timeout: 15000 },
      );
      const data = JSON.parse(stdout);
      const items: any[] = data.jobPostings || [];

      for (const job of items) {
        const title = job.title || '';
        const jobLocation = job.locations?.[0] || '';
        if (!title) continue;
        if (query && !title.toLowerCase().includes(query)) continue;
        if (location && !jobLocation.toLowerCase().includes(location.toLowerCase())) continue;

        result.push({
          title,
          company: cfg.company,
          location: jobLocation,
          description: (job.jobDescription || '').replace(/<[^>]*>/g, '').slice(0, 2000),
          source: this.name,
          sourceUrl: job.externalPath
            ? `https://${cfg.tenant}.wd5.myworkdayjobs.com/en-US/${cfg.company}${job.externalPath}`
            : `https://${cfg.tenant}.wd5.myworkdayjobs.com/en-US/${cfg.company}/job/${job.id}`,
          postedAt: job.publicatioDate ? new Date(job.publicatioDate) : undefined,
        });
      }
    } catch (err) {
      this.logger.warn(`Workday ${cfg.tenant}: ${err instanceof Error ? err.message : err}`);
    }
    return result;
  }
}
