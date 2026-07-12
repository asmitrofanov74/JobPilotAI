import { Injectable, Logger } from '@nestjs/common';
import { exec } from 'child_process';
import { promisify } from 'util';
import { JobProvider, JobSearchInput } from './provider.interface';
import { NormalizedJob } from './normalized-job.interface';

const execAsync = promisify(exec);

const CURL_TIMEOUT = 30;

async function curlJson(url: string, method = 'GET', body?: string): Promise<any> {
  let cmd = `curl -s --max-time ${CURL_TIMEOUT} "${url}"`;
  if (method === 'POST') {
    cmd += ` -X POST -H "Content-Type: application/json" -H "Accept: application/json" -d '${body}'`;
  }
  try {
    const { stdout } = await execAsync(cmd, { timeout: CURL_TIMEOUT * 1000 + 5000 });
    return JSON.parse(stdout);
  } catch (err: any) {
    if (err.stdout) {
      try { return JSON.parse(err.stdout); } catch { /* not JSON */ }
    }
    throw err;
  }
}

interface TenantConfig {
  tenant: string;
  company: string;
}

const KNOWN_TENANTS: TenantConfig[] = [
  { tenant: 'oracle', company: 'Oracle' },
  { tenant: 'adobe', company: 'Adobe' },
  { tenant: 'cisco', company: 'Cisco' },
  { tenant: 'intel', company: 'Intel' },
  { tenant: 'servicenow', company: 'ServiceNow' },
  { tenant: 'salesforce', company: 'Salesforce' },
];

@Injectable()
export class WorkdayProvider implements JobProvider {
  readonly name = 'WORKDAY';
  private readonly logger = new Logger(WorkdayProvider.name);

  async search(params: JobSearchInput): Promise<NormalizedJob[]> {
    const jobs: NormalizedJob[] = [];

    await Promise.allSettled(
      KNOWN_TENANTS.map((cfg) =>
        this.scrapeTenant(cfg, params).then((r) => jobs.push(...r)),
      ),
    );

    return jobs;
  }

  private async scrapeTenant(cfg: TenantConfig, params: JobSearchInput): Promise<NormalizedJob[]> {
    const result: NormalizedJob[] = [];
    const { query, location, jobType, remote, salaryMin, salaryMax } = params;
    const q = (query || '').toLowerCase();

    try {
      const url = `https://${cfg.tenant}.wd5.myworkdayjobs.com/wday/cxs/${cfg.tenant}/${cfg.company}/jobs`;
      const body = JSON.stringify({ limit: 20, offset: 0, searchText: query || '' });
      const data = await curlJson(url, 'POST', body);
      const items: any[] = data.jobPostings || [];

      for (const job of items) {
        const title = job.title || '';
        if (!title) continue;

        const jobLocation = job.locations?.[0] || '';
        const desc = (job.jobDescription || '').replace(/<[^>]*>/g, '').slice(0, 2000);
        const haystack = `${title} ${desc}`.toLowerCase();

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
          company: cfg.company,
          location: jobLocation,
          remote: haystack.includes('remote'),
          description: desc,
          employmentType: empType,
          source: this.name,
          sourceUrl: job.externalPath
            ? `https://${cfg.tenant}.wd5.myworkdayjobs.com/en-US/${cfg.company}${job.externalPath}`
            : `https://${cfg.tenant}.wd5.myworkdayjobs.com/en-US/${cfg.company}/job/${job.id}`,
          postedAt: job.publicatioDate ? new Date(job.publicatioDate) : undefined,
        });
      }
    } catch (err) {
      this.logger.warn(`Workday ${cfg.tenant}: ${err instanceof Error ? err.message : String(err)}`);
    }
    return result;
  }
}
