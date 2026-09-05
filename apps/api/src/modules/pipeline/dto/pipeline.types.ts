import { ObjectType, Field, Int } from '@nestjs/graphql';
import { JobType } from '../../jobs/dto/jobs.types';
import { CoverLetterType } from '../../cover-letters/dto/cover-letters.types';
import { SkillGapReportType } from '../../skill-gap-reports/dto/skill-gap-reports.types';
import { InterviewType } from '../../interviews/dto/interviews.types';
import { PracticeLanguage } from './pipeline.input';

@ObjectType()
export class PipelinePracticeType {
  @Field()
  id: string;

  @Field(() => PracticeLanguage)
  language: PracticeLanguage;

  @Field()
  scenario: string;

  @Field(() => Int)
  questionCount: number;
}

@ObjectType()
export class PipelineResultType {
  @Field(() => JobType)
  job: JobType;

  @Field(() => CoverLetterType)
  coverLetter: CoverLetterType;

  @Field(() => SkillGapReportType, { nullable: true })
  skillGapReport?: SkillGapReportType;

  @Field(() => InterviewType)
  interview: InterviewType;

  @Field(() => PipelinePracticeType, { nullable: true })
  practice?: PipelinePracticeType;
}