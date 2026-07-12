import { Resolver, Query, Mutation, Args } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { FrenchCoachService } from './french-coach.service';
import { ConversationService } from './conversation.service';
import { VocabularyService } from './vocabulary.service';
import { CulturalTipsService } from './cultural-tips.service';
import { VocabularyTrackerService } from './vocabulary-tracker.service';
import {
  FrenchProfileType,
  FrenchSessionType,
  FrenchProgressType,
  FrenchConversationType,
  SendFrenchMessageResult,
  FrenchVocabularyWordType,
  FrenchVocabularyStatsType,
  FrenchCulturalTipType,
  FrenchVocabularyType,
  FrenchVocabularyTrackerStatsType,
  TodayVocabularyType,
  FrenchInterviewType,
  GenerateQuestionsResultType,
  EvaluateAnswerResultType,
  FrenchVariantComparisonType,
  PronunciationResultType,
  CareerSuggestionType,
} from './dto/french-coach.types';
import {
  StartFrenchSessionInput,
  FinishFrenchSessionInput,
  SendFrenchMessageInput,
  AddVocabularyWordInput,
  ReviewVocabularyWordInput,
  VocabularyFilterInput,
  AddTrackedVocabularyInput,
  GenerateInterviewQuestionsInput,
  EvaluateInterviewAnswerInput,
  UpdateFrenchProfileInput,
  EvaluatePronunciationInput,
  GenerateCareerInterviewInput,
  GenerateCareerConversationInput,
} from './dto/french-coach.input';
import { InterviewCoachService } from './interview-coach.service';
import { PronunciationService } from './pronunciation.service';
import { CareerFrenchCoachService } from './career-french-coach.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Resolver()
export class FrenchCoachResolver {
  constructor(
    private readonly frenchCoachService: FrenchCoachService,
    private readonly conversationService: ConversationService,
    private readonly vocabularyService: VocabularyService,
    private readonly culturalTipsService: CulturalTipsService,
    private readonly vocabularyTrackerService: VocabularyTrackerService,
    private readonly interviewCoachService: InterviewCoachService,
    private readonly pronunciationService: PronunciationService,
    private readonly careerFrenchCoachService: CareerFrenchCoachService,
  ) {}

  @Query(() => FrenchProfileType)
  @UseGuards(JwtAuthGuard)
  async frenchProfile(@CurrentUser() user: { id: string }) {
    return this.frenchCoachService.getProfile(user.id);
  }

  @Mutation(() => FrenchProfileType)
  @UseGuards(JwtAuthGuard)
  async updateFrenchProfile(
    @CurrentUser() user: { id: string },
    @Args('input') input: UpdateFrenchProfileInput,
  ) {
    return this.frenchCoachService.updateProfile(user.id, {
      frenchLevel: input.frenchLevel ?? undefined,
      frenchVariant: input.frenchVariant ?? undefined,
      targetMarket: input.targetMarket ?? undefined,
      targetRole: input.targetRole ?? undefined,
      targetIndustry: input.targetIndustry ?? undefined,
    });
  }

  @Query(() => FrenchProgressType)
  @UseGuards(JwtAuthGuard)
  async frenchProgress(@CurrentUser() user: { id: string }) {
    return this.frenchCoachService.getProgress(user.id);
  }

  @Query(() => [FrenchSessionType])
  @UseGuards(JwtAuthGuard)
  async frenchSessions(
    @CurrentUser() user: { id: string },
    @Args('type', { nullable: true }) type?: string,
  ) {
    return this.frenchCoachService.getSessions(user.id, type);
  }

  @Query(() => FrenchConversationType)
  @UseGuards(JwtAuthGuard)
  async frenchConversation(
    @CurrentUser() user: { id: string },
    @Args('id') id: string,
  ) {
    return this.conversationService.getConversation(id, user.id);
  }

  @Query(() => [FrenchConversationType])
  @UseGuards(JwtAuthGuard)
  async frenchConversations(@CurrentUser() user: { id: string }) {
    return this.conversationService.getConversations(user.id);
  }

  // --- Vocabulary Queries ---

  @Query(() => [FrenchVocabularyWordType])
  @UseGuards(JwtAuthGuard)
  async frenchVocabulary(
    @CurrentUser() user: { id: string },
    @Args('filter', { nullable: true }) filter?: VocabularyFilterInput,
  ) {
    return this.vocabularyService.getVocabulary(user.id, filter);
  }

  @Query(() => FrenchVocabularyStatsType)
  @UseGuards(JwtAuthGuard)
  async frenchVocabularyStats(@CurrentUser() user: { id: string }) {
    return this.vocabularyService.getVocabularyStats(user.id);
  }

  // --- Vocabulary Mutations ---

  @Mutation(() => FrenchVocabularyWordType)
  @UseGuards(JwtAuthGuard)
  async addFrenchVocabularyWord(
    @CurrentUser() user: { id: string },
    @Args('input') input: AddVocabularyWordInput,
  ) {
    return this.vocabularyService.addWord(user.id, input.word, input.translation, input.quebecEquivalent, input.context, input.note);
  }

  @Mutation(() => FrenchVocabularyWordType)
  @UseGuards(JwtAuthGuard)
  async reviewFrenchVocabularyWord(
    @CurrentUser() user: { id: string },
    @Args('input') input: ReviewVocabularyWordInput,
  ) {
    return this.vocabularyService.reviewWord(user.id, input.wordId, input.score);
  }

  @Mutation(() => Boolean)
  @UseGuards(JwtAuthGuard)
  async deleteFrenchVocabularyWord(
    @CurrentUser() user: { id: string },
    @Args('wordId') wordId: string,
  ) {
    await this.vocabularyService.deleteWord(user.id, wordId);
    return true;
  }

  @Mutation(() => [FrenchVocabularyWordType])
  @UseGuards(JwtAuthGuard)
  async extractFrenchVocabulary(
    @CurrentUser() user: { id: string },
    @Args('conversationId') conversationId: string,
  ) {
    return this.vocabularyService.extractVocabulary(user.id, conversationId);
  }

  @Mutation(() => FrenchVocabularyWordType)
  @UseGuards(JwtAuthGuard)
  async generateQuebecEquivalent(
    @CurrentUser() user: { id: string },
    @Args('wordId') wordId: string,
  ) {
    return this.vocabularyService.generateQuebecEquivalent(user.id, wordId);
  }

  @Query(() => FrenchVariantComparisonType)
  @UseGuards(JwtAuthGuard)
  async compareFrenchVariants(
    @CurrentUser() user: { id: string },
    @Args('phrase') phrase: string,
  ) {
    return this.vocabularyService.compareVariants(user.id, phrase);
  }

  // --- Pronunciation ---

  @Mutation(() => PronunciationResultType)
  @UseGuards(JwtAuthGuard)
  async evaluateFrenchPronunciation(
    @CurrentUser() user: { id: string },
    @Args('input') input: EvaluatePronunciationInput,
  ) {
    return this.pronunciationService.evaluate(input.spokenText, input.expectedText ?? undefined);
  }

  // --- Career Integration ---

  @Mutation(() => GenerateQuestionsResultType)
  @UseGuards(JwtAuthGuard)
  async generateCareerInterviewQuestions(
    @CurrentUser() user: { id: string },
    @Args('input') input: GenerateCareerInterviewInput,
  ) {
    return this.careerFrenchCoachService.generateCareerInterviewQuestions(
      user.id,
      input.jobApplicationId ?? undefined,
      input.resumeId ?? undefined,
      input.targetRole ?? undefined,
      input.questionCount,
    );
  }

  @Mutation(() => SendFrenchMessageResult)
  @UseGuards(JwtAuthGuard)
  async generateCareerConversation(
    @CurrentUser() user: { id: string },
    @Args('input') input: GenerateCareerConversationInput,
  ) {
    return this.careerFrenchCoachService.generateCareerConversation(
      user.id,
      input.jobApplicationId ?? undefined,
      input.scenario ?? undefined,
    );
  }

  @Query(() => [CareerSuggestionType])
  @UseGuards(JwtAuthGuard)
  async careerFrenchSuggestions(@CurrentUser() user: { id: string }) {
    return this.careerFrenchCoachService.getCareerSuggestions(user.id);
  }

  // --- Cultural Tips ---

  @Query(() => FrenchCulturalTipType, { nullable: true })
  @UseGuards(JwtAuthGuard)
  async frenchCulturalTip(
    @CurrentUser() user: { id: string },
    @Args('topic', { nullable: true }) topic?: string,
  ) {
    return this.culturalTipsService.getTip(user.id, topic);
  }

  @Query(() => [FrenchCulturalTipType])
  @UseGuards(JwtAuthGuard)
  async frenchCulturalTipHistory(@CurrentUser() user: { id: string }) {
    return this.culturalTipsService.getTipHistory(user.id);
  }

  // --- Vocabulary Tracker ---

  @Query(() => [FrenchVocabularyType])
  @UseGuards(JwtAuthGuard)
  async frenchTrackedVocabulary(@CurrentUser() user: { id: string }) {
    return this.vocabularyTrackerService.getAll(user.id);
  }

  @Query(() => TodayVocabularyType)
  @UseGuards(JwtAuthGuard)
  async frenchTodayVocabulary(@CurrentUser() user: { id: string }) {
    return this.vocabularyTrackerService.getTodayVocabulary(user.id);
  }

  @Query(() => FrenchVocabularyTrackerStatsType)
  @UseGuards(JwtAuthGuard)
  async frenchVocabularyTrackerStats(@CurrentUser() user: { id: string }) {
    return this.vocabularyTrackerService.getStats(user.id);
  }

  @Mutation(() => FrenchVocabularyType)
  @UseGuards(JwtAuthGuard)
  async addTrackedVocabulary(
    @CurrentUser() user: { id: string },
    @Args('input') input: AddTrackedVocabularyInput,
  ) {
    return this.vocabularyTrackerService.addWord(user.id, input.word, input.translation);
  }

  @Mutation(() => FrenchVocabularyType)
  @UseGuards(JwtAuthGuard)
  async markVocabularyLearned(
    @CurrentUser() user: { id: string },
    @Args('id') id: string,
  ) {
    return this.vocabularyTrackerService.markLearned(user.id, id);
  }

  @Mutation(() => FrenchVocabularyType)
  @UseGuards(JwtAuthGuard)
  async markVocabularyDifficult(
    @CurrentUser() user: { id: string },
    @Args('id') id: string,
    @Args('difficult') difficult: boolean,
  ) {
    return this.vocabularyTrackerService.markDifficult(user.id, id, difficult);
  }

  @Mutation(() => Boolean)
  @UseGuards(JwtAuthGuard)
  async deleteTrackedVocabulary(
    @CurrentUser() user: { id: string },
    @Args('id') id: string,
  ) {
    await this.vocabularyTrackerService.deleteWord(user.id, id);
    return true;
  }

  // --- Interview Coach ---

  @Query(() => [FrenchInterviewType])
  @UseGuards(JwtAuthGuard)
  async frenchInterviews(@CurrentUser() user: { id: string }) {
    return this.interviewCoachService.getInterviews(user.id);
  }

  @Query(() => FrenchInterviewType)
  @UseGuards(JwtAuthGuard)
  async frenchInterview(
    @CurrentUser() user: { id: string },
    @Args('id') id: string,
  ) {
    return this.interviewCoachService.getInterview(id, user.id);
  }

  @Mutation(() => GenerateQuestionsResultType)
  @UseGuards(JwtAuthGuard)
  async generateFrenchInterviewQuestions(
    @CurrentUser() user: { id: string },
    @Args('input') input: GenerateInterviewQuestionsInput,
  ) {
    return this.interviewCoachService.generateQuestions(user.id, input.scenario, input.questionCount);
  }

  @Mutation(() => EvaluateAnswerResultType)
  @UseGuards(JwtAuthGuard)
  async evaluateFrenchInterviewAnswer(
    @CurrentUser() user: { id: string },
    @Args('input') input: EvaluateInterviewAnswerInput,
  ) {
    return this.interviewCoachService.evaluateAnswer(user.id, input.interviewId, input.questionId, input.answer);
  }

  // --- Session Mutations ---

  @Mutation(() => FrenchSessionType)
  @UseGuards(JwtAuthGuard)
  async startFrenchSession(
    @CurrentUser() user: { id: string },
    @Args('input') input: StartFrenchSessionInput,
  ) {
    return this.frenchCoachService.startSession(user.id, input.type, input.inputData);
  }

  @Mutation(() => FrenchSessionType)
  @UseGuards(JwtAuthGuard)
  async finishFrenchSession(
    @CurrentUser() user: { id: string },
    @Args('id') id: string,
    @Args('input') input: FinishFrenchSessionInput,
  ) {
    return this.frenchCoachService.finishSession(id, user.id, input.outputData);
  }

  @Mutation(() => SendFrenchMessageResult)
  @UseGuards(JwtAuthGuard)
  async sendFrenchMessage(
    @CurrentUser() user: { id: string },
    @Args('input') input: SendFrenchMessageInput,
  ) {
    return this.conversationService.sendMessage(user.id, input);
  }
}
