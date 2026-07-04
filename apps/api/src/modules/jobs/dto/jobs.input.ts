import { InputType, Field } from '@nestjs/graphql';
import { IsOptional, IsString, IsEnum, MinLength } from 'class-validator';
import { JobStatus, ApplicationSource } from './jobs.types';

@InputType()
export class PaginationInput {
  @Field({ nullable: true, defaultValue: 1 })
  @IsOptional()
  page?: number;

  @Field({ nullable: true, defaultValue: 20 })
  @IsOptional()
  limit?: number;
}

@InputType()
export class CreateJobInput {
  @Field()
  @MinLength(1)
  companyName: string;

  @Field()
  @MinLength(1)
  jobTitle: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  jobDescription?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  jobUrl?: string;

  @Field(() => JobStatus, { nullable: true, defaultValue: JobStatus.SAVED })
  @IsOptional()
  @IsEnum(JobStatus)
  status?: JobStatus;

  @Field(() => ApplicationSource, { nullable: true })
  @IsOptional()
  @IsEnum(ApplicationSource)
  source?: ApplicationSource;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  salaryRange?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  location?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  notes?: string;
}

@InputType()
export class UpdateJobInput {
  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  companyName?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  jobTitle?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  jobDescription?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  jobUrl?: string;

  @Field(() => JobStatus, { nullable: true })
  @IsOptional()
  @IsEnum(JobStatus)
  status?: JobStatus;

  @Field(() => ApplicationSource, { nullable: true })
  @IsOptional()
  @IsEnum(ApplicationSource)
  source?: ApplicationSource;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  salaryRange?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  location?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  notes?: string;
}
