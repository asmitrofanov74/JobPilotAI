import { ObjectType, Field, Int, registerEnumType } from '@nestjs/graphql';

export enum JobStatus {
  SAVED = 'SAVED',
  APPLIED = 'APPLIED',
  PHONE_SCREEN = 'PHONE_SCREEN',
  TECHNICAL = 'TECHNICAL',
  ONSITE = 'ONSITE',
  OFFER = 'OFFER',
  REJECTED = 'REJECTED',
  WITHDRAWN = 'WITHDRAWN',
  ACCEPTED = 'ACCEPTED',
}

export enum ApplicationSource {
  MANUAL = 'MANUAL',
  LINKEDIN = 'LINKEDIN',
  INDEED = 'INDEED',
  GLASSDOOR = 'GLASSDOOR',
  COMPANY_SITE = 'COMPANY_SITE',
  REFERRAL = 'REFERRAL',
  SCRAPED = 'SCRAPED',
  OTHER = 'OTHER',
}

registerEnumType(JobStatus, { name: 'JobStatus' });
registerEnumType(ApplicationSource, { name: 'ApplicationSource' });

@ObjectType()
export class JobInterviewBrief {
  @Field()
  id: string;

  @Field()
  type: string;

  @Field(() => Date, { nullable: true })
  scheduledAt?: Date;

  @Field({ nullable: true })
  isCompleted?: boolean;
}

@ObjectType()
export class JobType {
  @Field()
  id: string;

  @Field()
  companyName: string;

  @Field()
  jobTitle: string;

  @Field({ nullable: true })
  jobDescription?: string;

  @Field({ nullable: true })
  jobUrl?: string;

  @Field(() => JobStatus)
  status: JobStatus;

  @Field(() => ApplicationSource, { nullable: true })
  source?: ApplicationSource;

  @Field({ nullable: true })
  sourceUrl?: string;

  @Field({ nullable: true })
  sourceId?: string;

  @Field(() => Date, { nullable: true })
  scrapedAt?: Date;

  @Field({ nullable: true })
  salaryRange?: string;

  @Field({ nullable: true })
  location?: string;

  @Field({ nullable: true })
  notes?: string;

  @Field()
  userId: string;

  @Field(() => Date)
  createdAt: Date;

  @Field(() => Date)
  updatedAt: Date;

  @Field(() => [JobInterviewBrief], { nullable: true })
  interviews?: JobInterviewBrief[];
}

@ObjectType()
export class PaginationMeta {
  @Field(() => Int)
  total: number;

  @Field(() => Int)
  totalPages: number;

  @Field(() => Int)
  page: number;

  @Field(() => Int)
  limit: number;
}

@ObjectType()
export class PaginatedJobs {
  @Field(() => [JobType])
  edges: JobType[];

  @Field(() => PaginationMeta)
  meta: PaginationMeta;
}

@ObjectType()
export class FunnelAnalytics {
  @Field(() => Int)
  saved: number;

  @Field(() => Int)
  applied: number;

  @Field(() => Int)
  phoneScreen: number;

  @Field(() => Int)
  technical: number;

  @Field(() => Int)
  onsite: number;

  @Field(() => Int)
  offer: number;

  @Field(() => Int)
  rejected: number;

  @Field(() => Int)
  accepted: number;
}

@ObjectType()
export class MonthlyStat {
  @Field()
  month: string;

  @Field(() => Int)
  applications: number;

  @Field(() => Int)
  interviews: number;
}
