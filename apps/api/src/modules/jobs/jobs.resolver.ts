import { Resolver, Query, Mutation, Args, Int } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { JobsService } from './jobs.service';
import { JobType, PaginatedJobs, FunnelAnalytics, MonthlyStat } from './dto/jobs.types';
import { CreateJobInput, UpdateJobInput, PaginationInput } from './dto/jobs.input';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JobStatus } from './dto/jobs.types';

@Resolver(() => JobType)
export class JobsResolver {
  constructor(private readonly jobsService: JobsService) {}

  @Query(() => PaginatedJobs)
  @UseGuards(JwtAuthGuard)
  async jobs(
    @CurrentUser() user: { id: string },
    @Args('pagination', { type: () => PaginationInput, nullable: true }) pagination: PaginationInput = {},
    @Args('status', { type: () => JobStatus, nullable: true }) status?: JobStatus,
    @Args('search', { nullable: true }) search?: string,
  ) {
    return this.jobsService.findAll(user.id, pagination, status, search);
  }

  @Query(() => JobType, { nullable: true })
  @UseGuards(JwtAuthGuard)
  async job(
    @CurrentUser() user: { id: string },
    @Args('id') id: string,
  ) {
    return this.jobsService.findOne(id, user.id);
  }

  @Mutation(() => JobType)
  @UseGuards(JwtAuthGuard)
  async createJob(
    @CurrentUser() user: { id: string },
    @Args('input') input: CreateJobInput,
  ) {
    return this.jobsService.create(user.id, input);
  }

  @Mutation(() => Boolean)
  @UseGuards(JwtAuthGuard)
  async updateJob(
    @CurrentUser() user: { id: string },
    @Args('id') id: string,
    @Args('input') input: UpdateJobInput,
  ) {
    await this.jobsService.update(id, user.id, input);
    return true;
  }

  @Mutation(() => Boolean)
  @UseGuards(JwtAuthGuard)
  async deleteJob(
    @CurrentUser() user: { id: string },
    @Args('id') id: string,
  ) {
    return this.jobsService.remove(id, user.id);
  }

  @Query(() => FunnelAnalytics)
  @UseGuards(JwtAuthGuard)
  async funnelAnalytics(@CurrentUser() user: { id: string }) {
    return this.jobsService.getFunnelAnalytics(user.id);
  }

  @Query(() => [MonthlyStat])
  @UseGuards(JwtAuthGuard)
  async monthlyStats(
    @CurrentUser() user: { id: string },
    @Args('from', { type: () => Date }) from: Date,
    @Args('to', { type: () => Date }) to: Date,
  ) {
    return this.jobsService.getMonthlyStats(user.id, from, to);
  }
}
