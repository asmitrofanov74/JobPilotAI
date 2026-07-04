import { Resolver, Query, Mutation, Args } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { SkillGapReportsService } from './skill-gap-reports.service';
import { SkillGapReportType } from './dto/skill-gap-reports.types';
import { CreateSkillGapReportInput } from './dto/skill-gap-reports.input';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Resolver(() => SkillGapReportType)
export class SkillGapReportsResolver {
  constructor(private readonly skillGapReportsService: SkillGapReportsService) {}

  @Query(() => [SkillGapReportType])
  @UseGuards(JwtAuthGuard)
  async skillGapReports(@CurrentUser() user: { id: string }) {
    return this.skillGapReportsService.findAll(user.id);
  }

  @Query(() => SkillGapReportType, { nullable: true })
  @UseGuards(JwtAuthGuard)
  async skillGapReport(
    @CurrentUser() user: { id: string },
    @Args('id') id: string,
  ) {
    return this.skillGapReportsService.findOne(id, user.id);
  }

  @Mutation(() => SkillGapReportType)
  @UseGuards(JwtAuthGuard)
  async createSkillGapReport(
    @CurrentUser() user: { id: string },
    @Args('input') input: CreateSkillGapReportInput,
  ) {
    return this.skillGapReportsService.create(user.id, input);
  }

  @Mutation(() => Boolean)
  @UseGuards(JwtAuthGuard)
  async deleteSkillGapReport(
    @CurrentUser() user: { id: string },
    @Args('id') id: string,
  ) {
    return this.skillGapReportsService.remove(id, user.id);
  }
}
