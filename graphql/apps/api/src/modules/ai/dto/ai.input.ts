import { InputType, Field } from '@nestjs/graphql';
import { IsOptional, IsString, MinLength } from 'class-validator';
import { QuestionTypeEnum } from '../../interview-questions/dto/interview-questions.types';

@InputType()
export class GenerateCoverLetterInput {
  @Field()
  @MinLength(1)
  jobTitle: string;

  @Field()
  @MinLength(1)
  companyName: string;

  @Field()
  @MinLength(1)
  jobDescription: string;

  @Field({ nullable: true, defaultValue: 'professional' })
  @IsOptional()
  @IsString()
  tone?: string;
}

@InputType()
export class SkillGapInput {
  @Field()
  @MinLength(1)
  jobDescription: string;

  @Field()
  @MinLength(1)
  jobTitle: string;

  @Field()
  @MinLength(1)
  companyName: string;

  @Field()
  @MinLength(1)
  userSkills: string;
}

@InputType()
export class InterviewQuestionsInput {
  @Field()
  @MinLength(1)
  jobDescription: string;

  @Field()
  @MinLength(1)
  role: string;

  @Field(() => QuestionTypeEnum, { nullable: true })
  @IsOptional()
  questionType?: QuestionTypeEnum;
}
