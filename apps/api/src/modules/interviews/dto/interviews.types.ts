import { ObjectType, Field, Int, registerEnumType } from '@nestjs/graphql';
import GraphQLJSON from 'graphql-type-json';

export enum InterviewTypeEnum {
  PHONE = 'PHONE',
  TECHNICAL = 'TECHNICAL',
  BEHAVIORAL = 'BEHAVIORAL',
  SYSTEM_DESIGN = 'SYSTEM_DESIGN',
  CODING = 'CODING',
  ONSITE = 'ONSITE',
  PANEL = 'PANEL',
  TAKE_HOME = 'TAKE_HOME',
}

registerEnumType(InterviewTypeEnum, { name: 'InterviewTypeEnum' });

@ObjectType()
export class InterviewType {
  @Field()
  id: string;

  @Field(() => InterviewTypeEnum)
  type: InterviewTypeEnum;

  @Field(() => Int)
  round: number;

  @Field(() => Date, { nullable: true })
  scheduledAt?: Date;

  @Field(() => Int, { nullable: true })
  durationMinutes?: number;

  @Field({ nullable: true })
  interviewers?: string;

  @Field({ nullable: true })
  location?: string;

  @Field({ nullable: true })
  notes?: string;

  @Field({ nullable: true })
  feedback?: string;

  @Field(() => Int, { nullable: true })
  rating?: number;

  @Field()
  isCompleted: boolean;

  @Field()
  jobApplicationId: string;

  @Field(() => Date)
  createdAt: Date;

  @Field(() => Date)
  updatedAt: Date;
}

// --- English Interview Practice ---

export enum EnglishInterviewScenario {
  FRONTEND_DEVELOPER = 'frontend_developer',
  FULL_STACK_DEVELOPER = 'full_stack_developer',
  TEAM_LEAD = 'team_lead',
  BEHAVIORAL = 'behavioral',
  CUSTOM_JOB = 'custom_job',
}

registerEnumType(EnglishInterviewScenario, { name: 'EnglishInterviewScenario' });

@ObjectType()
export class EnglishPracticeQuestionType {
  @Field()
  id: string;

  @Field()
  question: string;

  @Field()
  category: string;
}

@ObjectType()
export class EnglishPracticeAnswerType {
  @Field()
  questionId: string;

  @Field()
  answer: string;
}

@ObjectType()
export class EnglishPracticeCorrectionType {
  @Field()
  original: string;

  @Field()
  corrected: string;

  @Field()
  explanation: string;
}

@ObjectType()
export class EnglishPracticeEvaluationType {
  @Field()
  questionId: string;

  @Field(() => Int)
  grammarScore: number;

  @Field(() => Int)
  confidenceScore: number;

  @Field(() => Int)
  technicalScore: number;

  @Field()
  feedback: string;

  @Field()
  improvedAnswer: string;

  @Field(() => GraphQLJSON)
  corrections: EnglishPracticeCorrectionType[];
}

@ObjectType()
export class EnglishInterviewPracticeType {
  @Field()
  id: string;

  @Field()
  scenario: string;

  @Field({ nullable: true })
  jobDescription?: string;

  @Field(() => Int)
  questionCount: number;

  @Field()
  status: string;

  @Field(() => GraphQLJSON)
  questions: EnglishPracticeQuestionType[];

  @Field(() => GraphQLJSON)
  answers: EnglishPracticeAnswerType[];

  @Field(() => GraphQLJSON)
  evaluations: EnglishPracticeEvaluationType[];

  @Field(() => Int, { nullable: true })
  overallScore?: number;

  @Field(() => Date)
  createdAt: Date;

  @Field(() => Date)
  updatedAt: Date;
}

@ObjectType()
export class GenerateEnglishQuestionsResultType {
  @Field(() => [EnglishPracticeQuestionType])
  questions: EnglishPracticeQuestionType[];

  @Field(() => EnglishInterviewPracticeType)
  interview: EnglishInterviewPracticeType;
}

@ObjectType()
export class EvaluateEnglishAnswerResultType {
  @Field(() => EnglishPracticeEvaluationType)
  evaluation: EnglishPracticeEvaluationType;

  @Field(() => EnglishInterviewPracticeType)
  interview: EnglishInterviewPracticeType;
}

@ObjectType()
export class EnglishInterviewHintType {
  @Field()
  hint: string;

  @Field()
  keyPoints: string;

  @Field()
  exampleAnswer: string;
}
