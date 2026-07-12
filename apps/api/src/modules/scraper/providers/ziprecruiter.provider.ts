import { Injectable } from '@nestjs/common';
import { JobProvider, JobSearchInput } from './provider.interface';
import { NormalizedJob } from './normalized-job.interface';
import { PlaywrightScraper } from './playwright.scraper';

@Injectable()
export class ZipRecruiterProvider implements JobProvider {
  readonly name = 'ZIPRECRUITER';

  async search(params: JobSearchInput): Promise<NormalizedJob[]> {
    const url = `https://www.ziprecruiter.ca/jobs?search=${encodeURIComponent(params.query)}&location=${encodeURIComponent(params.location || '')}`;
    return PlaywrightScraper.run(this.name, url, params.query, params.location);
  }
}
