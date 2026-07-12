import { NormalizedJob } from './normalized-job.interface';

export interface JobSearchInput {
  query: string;
  location?: string;
  jobType?: 'FULL_TIME' | 'PART_TIME' | 'CONTRACT' | 'INTERNSHIP';
  remote?: boolean;
  salaryMin?: number;
  salaryMax?: number;
}

export interface JobProvider {
  readonly name: string;

  search(params: JobSearchInput): Promise<NormalizedJob[]>;
}
