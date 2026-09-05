import { InputType, Field, Int, registerEnumType } from '@nestjs/graphql';
import { IsOptional, IsString, IsEnum, IsInt, IsBoolean, IsDateString, Min, Max, ValidateIf } from 'class-validator';
import { CreateJobInput } from '../../jobs/dto/jobs.input';
import { InterviewTypeEnum } from '../../interviews/dto/interviews.types';

export enum PracticeLanguage {
  ENGLISH = 'ENGLISH',
  FRENCH = 'FRENCH',
}

registerEnumType(PracticeLanguage, { name: 'PracticeLanguage' });

@InputType()
export class RunApplicationPipelineInput {
  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  jobId?: string;

  @Field(() => CreateJobInput, { nullable: true })
  @ValidateIf((o) => !o.jobId)
  scrapedJob?: CreateJobInput;

  @Field({ nullable: true, defaultValue: 'professional' })
  @IsOptional()
  @IsString()
  tone?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  userSkills?: string;

  @Field(() => InterviewTypeEnum, { nullable: true, defaultValue: InterviewTypeEnum.PHONE })
  @IsOptional()
  @IsEnum(InterviewTypeEnum)
  interviewType?: InterviewTypeEnum;

  @Field({ nullable: true })
  @IsOptional()
  @IsDateString()
  scheduledAt?: string;

  @Field(() => PracticeLanguage, { nullable: true, defaultValue: PracticeLanguage.ENGLISH })
  @IsOptional()
  @IsEnum(PracticeLanguage)
  practiceLanguage?: PracticeLanguage;

  @Field(() => Int, { nullable: true, defaultValue: 5 })
  @IsOptional()
  @IsInt()
  @Min(3)
  @Max(8)
  questionCount?: number;

  @Field({ nullable: true, defaultValue: true })
  @IsOptional()
  @IsBoolean()
  includeSkillGap?: boolean;
}