import { Resolver, Query, Mutation, Args } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { InterviewQuestionsService } from './interview-questions.service';
import { InterviewQuestionType } from './dto/interview-questions.types';
import { CreateInterviewQuestionInput, UpdateInterviewQuestionInput } from './dto/interview-questions.input';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Resolver(() => InterviewQuestionType)
export class InterviewQuestionsResolver {
  constructor(private readonly interviewQuestionsService: InterviewQuestionsService) {}

  @Query(() => [InterviewQuestionType])
  @UseGuards(JwtAuthGuard)
  async interviewQuestionsByUser(@CurrentUser() user: { id: string }) {
    return this.interviewQuestionsService.findByUser(user.id);
  }

  @Query(() => InterviewQuestionType, { nullable: true })
  @UseGuards(JwtAuthGuard)
  async interviewQuestion(
    @CurrentUser() user: { id: string },
    @Args('id') id: string,
  ) {
    return this.interviewQuestionsService.findOne(id, user.id);
  }

  @Mutation(() => InterviewQuestionType)
  @UseGuards(JwtAuthGuard)
  async createInterviewQuestion(
    @CurrentUser() user: { id: string },
    @Args('input') input: CreateInterviewQuestionInput,
  ) {
    return this.interviewQuestionsService.create(user.id, input);
  }

  @Mutation(() => Boolean)
  @UseGuards(JwtAuthGuard)
  async updateInterviewQuestion(
    @CurrentUser() user: { id: string },
    @Args('id') id: string,
    @Args('input') input: UpdateInterviewQuestionInput,
  ) {
    await this.interviewQuestionsService.update(id, user.id, input);
    return true;
  }

  @Mutation(() => Boolean)
  @UseGuards(JwtAuthGuard)
  async deleteInterviewQuestion(
    @CurrentUser() user: { id: string },
    @Args('id') id: string,
  ) {
    return this.interviewQuestionsService.remove(id, user.id);
  }

  @Mutation(() => InterviewQuestionType, { nullable: true })
  @UseGuards(JwtAuthGuard)
  async toggleFavoriteQuestion(
    @CurrentUser() user: { id: string },
    @Args('id') id: string,
  ) {
    return this.interviewQuestionsService.toggleFavorite(id, user.id);
  }
}
