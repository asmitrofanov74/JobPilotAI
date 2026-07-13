import { Resolver, Query, Mutation, Args, Int } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { JobsService } from './jobs.service';
import { JobType, PaginatedJobs, FunnelAnalytics, MonthlyStat, BulkImportResult } from './dto/jobs.types';
import { CreateJobInput, UpdateJobInput, PaginationInput } from './dto/jobs.input';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JobStatus } from './dto/jobs.types';

@UseGuards(JwtAuthGuard)
@Resolver(() => JobType)
export class JobsResolver {
  constructor(private readonly jobsService: JobsService) {}

  @Query(() => PaginatedJobs)

  async jobs(
    @CurrentUser() user: { id: string },
    @Args('pagination', { type: () => PaginationInput, nullable: true }) pagination: PaginationInput = {},
    @Args('status', { type: () => JobStatus, nullable: true }) status?: JobStatus,
    @Args('search', { nullable: true }) search?: string,
  ) {
    return this.jobsService.findAll(user.id, pagination, status, search);
  }

  @Query(() => JobType, { nullable: true })

  async job(
    @CurrentUser() user: { id: string },
    @Args('id') id: string,
  ) {
    return this.jobsService.findOne(id, user.id);
  }

  @Mutation(() => JobType)

  async createJob(
    @CurrentUser() user: { id: string },
    @Args('input') input: CreateJobInput,
  ) {
    return this.jobsService.create(user.id, input);
  }

  @Mutation(() => Boolean)

  async updateJob(
    @CurrentUser() user: { id: string },
    @Args('id') id: string,
    @Args('input') input: UpdateJobInput,
  ) {
    await this.jobsService.update(id, user.id, input);
    return true;
  }

  @Mutation(() => Boolean)

  async deleteJob(
    @CurrentUser() user: { id: string },
    @Args('id') id: string,
  ) {
    return this.jobsService.remove(id, user.id);
  }

  @Mutation(() => Int)

  async deleteAllJobs(
    @CurrentUser() user: { id: string },
  ) {
    return this.jobsService.removeAll(user.id);
  }

  @Mutation(() => BulkImportResult)

  async importJobs(
    @CurrentUser() user: { id: string },
    @Args('jobs', { type: () => [CreateJobInput] }) jobs: CreateJobInput[],
  ) {
    return this.jobsService.bulkImport(user.id, jobs);
  }

  @Query(() => FunnelAnalytics)

  async funnelAnalytics(@CurrentUser() user: { id: string }) {
    return this.jobsService.getFunnelAnalytics(user.id);
  }

  @Query(() => [MonthlyStat])

  async monthlyStats(
    @CurrentUser() user: { id: string },
    @Args('from', { type: () => Date }) from: Date,
    @Args('to', { type: () => Date }) to: Date,
  ) {
    return this.jobsService.getMonthlyStats(user.id, from, to);
  }
}
