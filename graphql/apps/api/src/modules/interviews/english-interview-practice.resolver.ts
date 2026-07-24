import { Resolver, Query, Mutation, Args } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { EnglishInterviewPracticeService } from './english-interview-practice.service';
import {
  EnglishInterviewPracticeType,
  GenerateEnglishQuestionsResultType,
  EvaluateEnglishAnswerResultType,
  EnglishInterviewHintType,
} from './dto/interviews.types';
import {
  GenerateEnglishInterviewInput,
  EvaluateEnglishAnswerInput,
  GenerateEnglishHintInput,
} from './dto/interviews.input';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@UseGuards(JwtAuthGuard)
@Resolver()
export class EnglishInterviewPracticeResolver {
  constructor(
    private readonly practiceService: EnglishInterviewPracticeService,
  ) {}

  @Query(() => [EnglishInterviewPracticeType])
  async englishInterviews(@CurrentUser() user: { id: string }) {
    return this.practiceService.getInterviews(user.id);
  }

  @Query(() => EnglishInterviewPracticeType)
  async englishInterview(
    @CurrentUser() user: { id: string },
    @Args('id') id: string,
  ) {
    return this.practiceService.getInterview(id, user.id);
  }

  @Mutation(() => GenerateEnglishQuestionsResultType)
  async generateEnglishInterviewQuestions(
    @CurrentUser() user: { id: string },
    @Args('input') input: GenerateEnglishInterviewInput,
  ) {
    return this.practiceService.generateQuestions(user.id, input.scenario, input.questionCount, input.jobDescription);
  }

  @Mutation(() => EvaluateEnglishAnswerResultType)
  async evaluateEnglishInterviewAnswer(
    @CurrentUser() user: { id: string },
    @Args('input') input: EvaluateEnglishAnswerInput,
  ) {
    return this.practiceService.evaluateAnswer(user.id, input.interviewId, input.questionId, input.answer);
  }

  @Mutation(() => EnglishInterviewHintType)
  async generateEnglishInterviewHint(
    @CurrentUser() user: { id: string },
    @Args('input') input: GenerateEnglishHintInput,
  ) {
    return this.practiceService.generateHint(user.id, input.interviewId, input.questionId);
  }
}
