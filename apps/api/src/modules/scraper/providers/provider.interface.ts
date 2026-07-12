import { NormalizedJob } from './normalized-job.interface';

export interface JobSearchInput {
  query: string;
  location?: string;
}

export interface JobProvider {
  readonly name: string;

  search(params: JobSearchInput): Promise<NormalizedJob[]>;
}
