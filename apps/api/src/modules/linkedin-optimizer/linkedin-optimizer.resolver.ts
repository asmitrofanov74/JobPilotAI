import { Resolver, Query, Mutation, Args } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { LinkedinOptimizerService } from './linkedin-optimizer.service';
import { LinkedinOptimizationType, LinkedinOptimizationResult } from './dto/linkedin-optimizer.types';
import {
  AnalyzeProfileInput,
  GenerateHeadlineInput,
  GenerateAboutInput,
  OptimizeExperienceInput,
  CompareResumeInput,
  AnalyzeVisibilityInput,
} from './dto/linkedin-optimizer.input';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Resolver(() => LinkedinOptimizationType)
export class LinkedinOptimizerResolver {
  constructor(private readonly linkedinOptimizerService: LinkedinOptimizerService) {}

  @Query(() => [LinkedinOptimizationType])
  @UseGuards(JwtAuthGuard)
  async linkedinOptimizations(
    @CurrentUser() user: { id: string },
    @Args('type', { nullable: true }) type?: string,
  ) {
    return this.linkedinOptimizerService.findAllByType(user.id, type);
  }

  @Query(() => LinkedinOptimizationType, { nullable: true })
  @UseGuards(JwtAuthGuard)
  async linkedinOptimization(
    @CurrentUser() user: { id: string },
    @Args('id') id: string,
  ) {
    return this.linkedinOptimizerService.findOne(id, user.id);
  }

  @Mutation(() => LinkedinOptimizationResult)
  @UseGuards(JwtAuthGuard)
  async analyzeLinkedinProfile(
    @CurrentUser() user: { id: string },
    @Args('input') input: AnalyzeProfileInput,
  ) {
    return this.linkedinOptimizerService.analyzeProfile(user.id, input);
  }

  @Mutation(() => LinkedinOptimizationResult)
  @UseGuards(JwtAuthGuard)
  async generateLinkedinHeadlines(
    @CurrentUser() user: { id: string },
    @Args('input') input: GenerateHeadlineInput,
  ) {
    return this.linkedinOptimizerService.generateHeadlines(user.id, input);
  }

  @Mutation(() => LinkedinOptimizationResult)
  @UseGuards(JwtAuthGuard)
  async generateLinkedinAbout(
    @CurrentUser() user: { id: string },
    @Args('input') input: GenerateAboutInput,
  ) {
    return this.linkedinOptimizerService.generateAbout(user.id, input);
  }

  @Mutation(() => LinkedinOptimizationResult)
  @UseGuards(JwtAuthGuard)
  async optimizeLinkedinExperience(
    @CurrentUser() user: { id: string },
    @Args('input') input: OptimizeExperienceInput,
  ) {
    return this.linkedinOptimizerService.optimizeExperience(user.id, input);
  }

  @Mutation(() => LinkedinOptimizationResult)
  @UseGuards(JwtAuthGuard)
  async compareResumeWithLinkedin(
    @CurrentUser() user: { id: string },
    @Args('input') input: CompareResumeInput,
  ) {
    return this.linkedinOptimizerService.compareResume(user.id, input);
  }

  @Mutation(() => LinkedinOptimizationResult)
  @UseGuards(JwtAuthGuard)
  async analyzeLinkedinVisibility(
    @CurrentUser() user: { id: string },
    @Args('input') input: AnalyzeVisibilityInput,
  ) {
    return this.linkedinOptimizerService.analyzeVisibility(user.id, input);
  }

  @Mutation(() => Boolean)
  @UseGuards(JwtAuthGuard)
  async deleteLinkedinOptimization(
    @CurrentUser() user: { id: string },
    @Args('id') id: string,
  ) {
    return this.linkedinOptimizerService.remove(id, user.id);
  }
}
