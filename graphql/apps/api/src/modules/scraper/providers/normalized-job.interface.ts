export interface NormalizedJob {
  title: string;
  company: string;
  location: string;
  salary?: string;
  remote?: boolean;
  description?: string;
  source: string;
  sourceUrl: string;
  postedAt?: Date;
  employmentType?: string;
}
