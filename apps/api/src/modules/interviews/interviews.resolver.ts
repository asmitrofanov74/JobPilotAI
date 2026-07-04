import { Resolver, Query, Mutation, Args } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { InterviewsService } from './interviews.service';
import { InterviewType } from './dto/interviews.types';
import { CreateInterviewInput, UpdateInterviewInput } from './dto/interviews.input';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Resolver(() => InterviewType)
export class InterviewsResolver {
  constructor(private readonly interviewsService: InterviewsService) {}

  @Query(() => [InterviewType])
  @UseGuards(JwtAuthGuard)
  async interviews(@CurrentUser() user: { id: string }) {
    return this.interviewsService.findAll(user.id);
  }

  @Query(() => InterviewType, { nullable: true })
  @UseGuards(JwtAuthGuard)
  async interview(
    @CurrentUser() user: { id: string },
    @Args('id') id: string,
  ) {
    return this.interviewsService.findOne(id, user.id);
  }

  @Mutation(() => InterviewType)
  @UseGuards(JwtAuthGuard)
  async createInterview(
    @CurrentUser() user: { id: string },
    @Args('input') input: CreateInterviewInput,
  ) {
    return this.interviewsService.create(user.id, input);
  }

  @Mutation(() => Boolean)
  @UseGuards(JwtAuthGuard)
  async updateInterview(
    @CurrentUser() user: { id: string },
    @Args('id') id: string,
    @Args('input') input: UpdateInterviewInput,
  ) {
    await this.interviewsService.update(id, user.id, input);
    return true;
  }

  @Mutation(() => Boolean)
  @UseGuards(JwtAuthGuard)
  async deleteInterview(
    @CurrentUser() user: { id: string },
    @Args('id') id: string,
  ) {
    return this.interviewsService.remove(id, user.id);
  }
}
