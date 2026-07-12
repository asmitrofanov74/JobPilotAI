import { ObjectType, Field, Int, registerEnumType } from '@nestjs/graphql';
import GraphQLJSON from 'graphql-type-json';

export enum FrenchVariant {
  FRANCE = 'france',
  QUEBEC = 'quebec',
}

registerEnumType(FrenchVariant, {
  name: 'FrenchVariant',
});

export enum InterviewScenario {
  FRONTEND_DEVELOPER = 'frontend_developer',
  FULL_STACK_DEVELOPER = 'full_stack_developer',
  TEAM_LEAD = 'team_lead',
}

registerEnumType(InterviewScenario, {
  name: 'InterviewScenario',
});

export enum ConversationScenario {
  JOB_INTERVIEW = 'job_interview',
  RECRUITER_CALL = 'recruiter_call',
  TEAM_MEETING = 'team_meeting',
  DAILY_STANDUP = 'daily_standup',
  OFFICE_CONVERSATION = 'office_conversation',
}

registerEnumType(ConversationScenario, {
  name: 'ConversationScenario',
});

@ObjectType()
export class FrenchProfileType {
  @Field()
  id: string;

  @Field({ nullable: true })
  frenchLevel?: string;

  @Field(() => FrenchVariant)
  frenchVariant: string;

  @Field({ nullable: true })
  targetMarket?: string;

  @Field({ nullable: true })
  targetRole?: string;

  @Field({ nullable: true })
  targetIndustry?: string;

  @Field(() => Date)
  createdAt: Date;

  @Field(() => Date)
  updatedAt: Date;
}

@ObjectType()
export class FrenchSessionType {
  @Field()
  id: string;

  @Field()
  type: string;

  @Field()
  status: string;

  @Field(() => GraphQLJSON, { nullable: true })
  inputData?: any;

  @Field(() => GraphQLJSON, { nullable: true })
  outputData?: any;

  @Field()
  profileId: string;

  @Field(() => Date)
  createdAt: Date;

  @Field(() => Date)
  updatedAt: Date;
}

@ObjectType()
export class ScorePointType {
  @Field()
  date: string;

  @Field(() => Int)
  grammarScore: number;

  @Field(() => Int)
  vocabularyScore: number;

  @Field(() => Int)
  fluencyScore: number;
}

@ObjectType()
export class FrenchProgressType {
  @Field(() => Int)
  totalSessions: number;

  @Field(() => Int)
  completedSessions: number;

  @Field(() => GraphQLJSON)
  sessionsByType: any;

  @Field(() => Int, { nullable: true })
  averageScore?: number;

  @Field(() => Int, { nullable: true })
  grammarAvg?: number;

  @Field(() => Int, { nullable: true })
  vocabularyAvg?: number;

  @Field(() => Int, { nullable: true })
  fluencyAvg?: number;

  @Field(() => [ScorePointType])
  scoreHistory: ScorePointType[];

  @Field(() => Int)
  vocabularyCount: number;

  @Field(() => Int)
  masteredWords: number;

  @Field(() => Int)
  streakDays: number;

  @Field(() => [String])
  weaknesses: string[];
}

@ObjectType()
export class FrenchEvaluationType {
  @Field()
  id: string;

  @Field(() => Int)
  grammarScore: number;

  @Field(() => Int)
  vocabularyScore: number;

  @Field(() => Int)
  fluencyScore: number;

  @Field(() => GraphQLJSON)
  corrections: any;

  @Field()
  improvedVersion: string;

  @Field({ nullable: true })
  quebecAlternative?: string;

  @Field(() => Date)
  createdAt: Date;
}

@ObjectType()
export class FrenchMessageType {
  @Field()
  id: string;

  @Field()
  role: string;

  @Field()
  content: string;

  @Field(() => FrenchEvaluationType, { nullable: true })
  evaluation?: FrenchEvaluationType;

  @Field(() => Date)
  createdAt: Date;
}

@ObjectType()
export class FrenchConversationType {
  @Field()
  id: string;

  @Field(() => ConversationScenario)
  scenario: string;

  @Field()
  profileId: string;

  @Field(() => [FrenchMessageType])
  messages: FrenchMessageType[];

  @Field(() => Date)
  createdAt: Date;

  @Field(() => Date)
  updatedAt: Date;
}

@ObjectType()
export class FrenchVocabularyWordType {
  @Field()
  id: string;

  @Field()
  word: string;

  @Field()
  translation: string;

  @Field({ nullable: true })
  quebecEquivalent?: string;

  @Field({ nullable: true })
  context?: string;

  @Field({ nullable: true })
  note?: string;

  @Field()
  difficulty: string;

  @Field(() => Int)
  timesReviewed: number;

  @Field(() => Int)
  timesCorrect: number;

  @Field(() => Date)
  nextReviewAt: Date;

  @Field()
  mastered: boolean;

  @Field(() => Date)
  createdAt: Date;

  @Field(() => Date)
  updatedAt: Date;
}

@ObjectType()
export class FrenchVocabularyStatsType {
  @Field(() => Int)
  total: number;

  @Field(() => Int)
  mastered: number;

  @Field(() => Int)
  dueForReview: number;

  @Field(() => GraphQLJSON)
  difficultyBreakdown: any;
}

@ObjectType()
export class FrenchCulturalTipType {
  @Field()
  id: string;

  @Field()
  topic: string;

  @Field()
  tip: string;

  @Field()
  translation: string;

  @Field()
  category: string;

  @Field()
  region: string;

  @Field(() => Date)
  createdAt: Date;
}

@ObjectType()
export class FrenchVocabularyType {
  @Field()
  id: string;

  @Field()
  word: string;

  @Field()
  translation: string;

  @Field()
  learned: boolean;

  @Field()
  difficult: boolean;

  @Field(() => Int)
  reviewCount: number;

  @Field(() => Date, { nullable: true })
  lastReviewAt?: Date;

  @Field(() => Date)
  addedAt: Date;
}

@ObjectType()
export class FrenchVocabularyTrackerStatsType {
  @Field(() => Int)
  total: number;

  @Field(() => Int)
  learned: number;

  @Field(() => Int)
  difficult: number;
}

@ObjectType()
export class TodayVocabularyType {
  @Field()
  date: string;

  @Field(() => [FrenchVocabularyType])
  words: FrenchVocabularyType[];

  @Field(() => Int)
  totalCount: number;

  @Field(() => Int)
  learnedCount: number;

  @Field(() => Int)
  difficultCount: number;
}

@ObjectType()
export class GeneratedQuestionType {
  @Field()
  id: string;

  @Field()
  question: string;

  @Field()
  category: string;
}

@ObjectType()
export class InterviewAnswerType {
  @Field()
  questionId: string;

  @Field()
  answer: string;
}

@ObjectType()
export class InterviewEvaluationType {
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
  corrections: any;
}

@ObjectType()
export class FrenchInterviewType {
  @Field()
  id: string;

  @Field()
  scenario: string;

  @Field(() => Int)
  questionCount: number;

  @Field()
  status: string;

  @Field(() => GraphQLJSON)
  questions: any;

  @Field(() => GraphQLJSON)
  answers: any;

  @Field(() => GraphQLJSON)
  evaluations: any;

  @Field(() => Int, { nullable: true })
  overallScore?: number;

  @Field(() => Date)
  createdAt: Date;

  @Field(() => Date)
  updatedAt: Date;
}

@ObjectType()
export class GenerateQuestionsResultType {
  @Field(() => [GeneratedQuestionType])
  questions: GeneratedQuestionType[];

  @Field(() => FrenchInterviewType)
  interview: FrenchInterviewType;
}

@ObjectType()
export class EvaluateAnswerResultType {
  @Field(() => InterviewEvaluationType)
  evaluation: InterviewEvaluationType;

  @Field(() => FrenchInterviewType)
  interview: FrenchInterviewType;
}

@ObjectType()
export class CareerSuggestionType {
  @Field()
  jobApplicationId: string;

  @Field()
  companyName: string;

  @Field()
  jobTitle: string;

  @Field()
  hasDescription: boolean;

  @Field()
  status: string;
}

@ObjectType()
export class PronunciationImprovementType {
  @Field()
  text: string;

  @Field()
  suggestion: string;
}

@ObjectType()
export class PronunciationResultType {
  @Field(() => Int)
  overallScore: number;

  @Field(() => Int)
  clarityScore: number;

  @Field(() => Int)
  accuracyScore: number;

  @Field(() => Int)
  fluencyScore: number;

  @Field()
  feedback: string;

  @Field(() => [PronunciationImprovementType])
  improvements: PronunciationImprovementType[];
}

@ObjectType()
export class FrenchVariantComparisonType {
  @Field()
  france: string;

  @Field()
  quebec: string;
}

@ObjectType()
export class SendFrenchMessageResult {
  @Field()
  conversationId: string;

  @Field(() => FrenchMessageType)
  response: FrenchMessageType;
}
