import { InputType, Field, Int } from '@nestjs/graphql';
import { MinLength, IsOptional } from 'class-validator';
import GraphQLJSON from 'graphql-type-json';
import { ConversationScenario, InterviewScenario, FrenchVariant } from './french-coach.types';

@InputType()
export class StartFrenchSessionInput {
  @Field()
  @MinLength(1)
  type: string;

  @Field(() => GraphQLJSON, { nullable: true })
  @IsOptional()
  inputData?: any;
}

@InputType()
export class FinishFrenchSessionInput {
  @Field(() => GraphQLJSON)
  outputData: any;
}

@InputType()
export class SendFrenchMessageInput {
  @Field({ nullable: true })
  @IsOptional()
  conversationId?: string;

  @Field()
  @MinLength(1)
  message: string;

  @Field(() => ConversationScenario, { nullable: true })
  @IsOptional()
  scenario?: ConversationScenario;
}

@InputType()
export class AddVocabularyWordInput {
  @Field()
  @MinLength(1)
  word: string;

  @Field()
  @MinLength(1)
  translation: string;

  @Field({ nullable: true })
  @IsOptional()
  quebecEquivalent?: string;

  @Field({ nullable: true })
  @IsOptional()
  context?: string;

  @Field({ nullable: true })
  @IsOptional()
  note?: string;
}

@InputType()
export class ReviewVocabularyWordInput {
  @Field()
  @MinLength(1)
  wordId: string;

  @Field(() => Int)
  score: number;
}

@InputType()
export class VocabularyFilterInput {
  @Field({ nullable: true })
  @IsOptional()
  mastered?: boolean;

  @Field({ nullable: true })
  @IsOptional()
  difficulty?: string;
}

@InputType()
export class AddTrackedVocabularyInput {
  @Field()
  @MinLength(1)
  word: string;

  @Field()
  @MinLength(1)
  translation: string;
}

@InputType()
export class GenerateInterviewQuestionsInput {
  @Field(() => InterviewScenario)
  scenario: InterviewScenario;

  @Field(() => Int, { defaultValue: 5 })
  questionCount: number;
}

@InputType()
export class EvaluateInterviewAnswerInput {
  @Field()
  @MinLength(1)
  interviewId: string;

  @Field()
  @MinLength(1)
  questionId: string;

  @Field()
  @MinLength(1)
  answer: string;
}

@InputType()
export class GenerateCareerInterviewInput {
  @Field({ nullable: true })
  @IsOptional()
  jobApplicationId?: string;

  @Field({ nullable: true })
  @IsOptional()
  resumeId?: string;

  @Field({ nullable: true })
  @IsOptional()
  targetRole?: string;

  @Field(() => Int, { defaultValue: 5 })
  questionCount: number;
}

@InputType()
export class GenerateCareerConversationInput {
  @Field({ nullable: true })
  @IsOptional()
  jobApplicationId?: string;

  @Field({ nullable: true })
  @IsOptional()
  scenario?: string;
}

@InputType()
export class EvaluatePronunciationInput {
  @Field()
  @MinLength(1)
  spokenText: string;

  @Field({ nullable: true })
  @IsOptional()
  expectedText?: string;
}

@InputType()
export class UpdateFrenchProfileInput {
  @Field({ nullable: true })
  @IsOptional()
  @MinLength(1)
  frenchLevel?: string;

  @Field(() => FrenchVariant, { nullable: true })
  @IsOptional()
  frenchVariant?: string;

  @Field({ nullable: true })
  @IsOptional()
  targetMarket?: string;

  @Field({ nullable: true })
  @IsOptional()
  targetRole?: string;

  @Field({ nullable: true })
  @IsOptional()
  targetIndustry?: string;
}
