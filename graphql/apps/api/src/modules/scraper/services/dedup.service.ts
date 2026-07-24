import { Injectable } from '@nestjs/common';
import { NormalizedJob } from '../providers/normalized-job.interface';

function normalize(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]/g, '').trim();
}

@Injectable()
export class DedupService {
  deduplicate(jobs: NormalizedJob[]): NormalizedJob[] {
    const seen = new Set<string>();
    return jobs.filter((job) => {
      const title = normalize(job.title);
      const company = normalize(job.company);
      const location = normalize(job.location || '');
      const key = `${company}|${title}|${location}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }
}
