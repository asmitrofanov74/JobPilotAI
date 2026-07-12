import { Injectable } from '@nestjs/common';
import { JobProvider, JobSearchInput } from './provider.interface';
import { NormalizedJob } from './normalized-job.interface';
import { PlaywrightScraper } from './playwright.scraper';

@Injectable()
export class IndeedProvider implements JobProvider {
  readonly name = 'INDEED';

  async search(params: JobSearchInput): Promise<NormalizedJob[]> {
    const url = `https://ca.indeed.com/jobs?q=${encodeURIComponent(params.query)}&l=${encodeURIComponent(params.location || '')}`;
    return PlaywrightScraper.run(this.name, url, params.query, params.location);
  }
}
