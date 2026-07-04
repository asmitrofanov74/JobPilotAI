import { Resolver, Mutation, Args } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { AiService } from './ai.service';
import { GeneratedCoverLetter, SkillGapResult, GeneratedQuestions } from './dto/ai.types';
import { GenerateCoverLetterInput, SkillGapInput, InterviewQuestionsInput } from './dto/ai.input';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Resolver()
export class AiResolver {
  constructor(private readonly aiService: AiService) {}

  @Mutation(() => GeneratedCoverLetter)
  @UseGuards(JwtAuthGuard)
  async generateCoverLetter(
    @CurrentUser() user: { id: string },
    @Args('input') input: GenerateCoverLetterInput,
  ) {
    return this.aiService.generateCoverLetter(user.id, input);
  }

  @Mutation(() => SkillGapResult)
  @UseGuards(JwtAuthGuard)
  async analyzeSkillGap(
    @CurrentUser() user: { id: string },
    @Args('input') input: SkillGapInput,
  ) {
    return this.aiService.analyzeSkillGap(user.id, input);
  }

  @Mutation(() => GeneratedQuestions)
  @UseGuards(JwtAuthGuard)
  async generateInterviewQuestions(
    @CurrentUser() user: { id: string },
    @Args('input') input: InterviewQuestionsInput,
  ) {
    return this.aiService.generateInterviewQuestions(user.id, input);
  }
}
