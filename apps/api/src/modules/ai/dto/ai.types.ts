import { ObjectType, Field, Float } from '@nestjs/graphql';
import GraphQLJSON from 'graphql-type-json';
import { CoverLetterType } from '../../cover-letters/dto/cover-letters.types';
import { InterviewQuestionType } from '../../interview-questions/dto/interview-questions.types';
import { SkillGapReportType } from '../../skill-gap-reports/dto/skill-gap-reports.types';

@ObjectType()
export class GeneratedCoverLetter {
  @Field(() => CoverLetterType)
  coverLetter: CoverLetterType;

  @Field()
  content: string;
}

@ObjectType()
export class SkillGapResult {
  @Field(() => SkillGapReportType)
  report: SkillGapReportType;

  @Field(() => GraphQLJSON)
  requiredSkills: any;

  @Field(() => GraphQLJSON)
  missingSkills: any;

  @Field(() => Float)
  matchScore: number;

  @Field(() => GraphQLJSON, { nullable: true })
  recommendations?: any;
}

@ObjectType()
export class GeneratedQuestions {
  @Field(() => [InterviewQuestionType])
  questions: InterviewQuestionType[];
}
