import { Injectable, Logger } from '@nestjs/common';
import { exec } from 'child_process';
import { promisify } from 'util';
import { JobProvider, JobSearchInput } from './provider.interface';
import { NormalizedJob } from './normalized-job.interface';

const execAsync = promisify(exec);

const KNOWN_BOARDS: Record<string, string> = {
  // US / global
  gitlab: 'GitLab',
  datadog: 'Datadog',
  dropbox: 'Dropbox',
  pinterest: 'Pinterest',
  coinbase: 'Coinbase',
  instacart: 'Instacart',
  reddit: 'Reddit',
  doordash: 'DoorDash',
  spotify: 'Spotify',
  hashicorp: 'HashiCorp',
  airtable: 'Airtable',
  vercel: 'Vercel',
  notion: 'Notion',
  linear: 'Linear',
  clerk: 'Clerk',
  supabase: 'Supabase',
  // Canada
  shopify: 'Shopify',
  wealthsimple: 'Wealthsimple',
  hootsuite: 'Hootsuite',
  lightspeed: 'Lightspeed',
  coveo: 'Coveo',
  applyboard: 'ApplyBoard',
  ritual: 'Ritual',
  freshbooks: 'FreshBooks',
  wave: 'Wave',
  ada: 'Ada',
  '1password': '1Password',
  clio: 'Clio',
  d2l: 'D2L',
  wattpad: 'Wattpad',
  stackadapt: 'StackAdapt',
  borrowell: 'Borrowell',
  koho: 'Koho',
  fullscript: 'Fullscript',
};

const CURL_TIMEOUT = 30;

async function curlJson(url: string): Promise<any> {
  try {
    const { stdout } = await execAsync(`curl -s --max-time ${CURL_TIMEOUT} "${url}"`, { timeout: CURL_TIMEOUT * 1000 + 5000 });
    return JSON.parse(stdout);
  } catch (err: any) {
    if (err.stdout) {
      try { return JSON.parse(err.stdout); } catch { /* not JSON */ }
    }
    throw err;
  }
}

@Injectable()
export class GreenhouseProvider implements JobProvider {
  readonly name = 'GREENHOUSE';
  private readonly logger = new Logger(GreenhouseProvider.name);

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
      const url = `https://boards-api.greenhouse.io/v1/boards/${board}/jobs?content=true`;
      const data = await curlJson(url);
      const items: any[] = data.jobs || [];

      for (const job of items) {
        const title = job.title || '';
        if (!title) continue;

        const office = job.offices?.[0];
        const jobLocation = office ? `${office.name}${office.city ? `, ${office.city}` : ''}` : '';
        const content = (job.content || '').replace(/<[^>]*>/g, '').slice(0, 2000);
        const contentLower = content.toLowerCase();
        const haystack = `${title} ${contentLower} ${(job.metadata || []).map((m: any) => (m.value || '') + '').join(' ').toLowerCase()}`;

        if (q && !title.toLowerCase().includes(q)) continue;
        if (location && !jobLocation.toLowerCase().includes(location.toLowerCase())) continue;

        if (jobType) {
          const typeMap: Record<string, string[]> = { FULL_TIME: ['full-time', 'full time', 'fulltime', 'permanent'], PART_TIME: ['part-time', 'part time'], CONTRACT: ['contract', 'temporary', 'temp'], INTERNSHIP: ['intern', 'internship', 'co-op', 'coop'] };
          const keywords = typeMap[jobType] || [];
          if (!keywords.some((k) => haystack.includes(k))) continue;
        }
        if (remote === true && !haystack.includes('remote')) continue;
        if (salaryMin || salaryMax) {
          const salaryMatch = contentLower.match(/\$[\d,]+(?:k)?(?:\s*-\s*\$?[\d,]+(?:k)?)?/g);
          if (salaryMatch) {
            const nums: number[] = salaryMatch.flatMap((s: string) => s.replace(/[$,k\s]/g, '').split('-').map(Number).filter((n: number) => !isNaN(n)));
            if (salaryMin && !nums.some((n: number) => n >= salaryMin)) continue;
            if (salaryMax && !nums.some((n: number) => n <= salaryMax)) continue;
          }
        }

        const isRemote = contentLower.includes('remote') || jobLocation.toLowerCase().includes('remote');

        let empType: string | undefined;
        if (haystack.includes('intern') || haystack.includes('co-op')) empType = 'INTERNSHIP';
        else if (haystack.includes('contract') || haystack.includes('temporary')) empType = 'CONTRACT';
        else if (haystack.includes('part-time') || haystack.includes('part time')) empType = 'PART_TIME';
        else if (haystack.includes('full-time') || haystack.includes('full time')) empType = 'FULL_TIME';

        result.push({
          title,
          company,
          location: jobLocation,
          remote: isRemote,
          description: content,
          employmentType: empType,
          source: this.name,
          sourceUrl: `https://boards.greenhouse.io/${board}/jobs/${job.id}`,
          postedAt: job.updated_at ? new Date(job.updated_at) : undefined,
        });
      }
    } catch (err) {
      this.logger.warn(`Greenhouse ${board}: ${err instanceof Error ? err.message : String(err)}`);
    }
    return result;
  }
}
