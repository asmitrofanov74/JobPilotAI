import { Injectable } from '@nestjs/common';
import { JobProvider, JobSearchInput } from './provider.interface';
import { NormalizedJob } from './normalized-job.interface';
import { PlaywrightScraper } from './playwright.scraper';

@Injectable()
export class LinkedInProvider implements JobProvider {
  readonly name = 'LINKEDIN';

  async search(params: JobSearchInput): Promise<NormalizedJob[]> {
    const url = `https://www.linkedin.com/jobs/search?keywords=${encodeURIComponent(params.query)}&location=${encodeURIComponent(params.location || '')}`;
    return PlaywrightScraper.run(this.name, url, params.query, params.location);
  }
}
