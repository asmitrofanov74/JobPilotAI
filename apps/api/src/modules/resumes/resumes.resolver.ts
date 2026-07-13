import { Resolver, Query, Mutation, Args } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { ResumesService } from './resumes.service';
import { ResumeType } from './dto/resumes.types';
import { CreateResumeInput, UpdateResumeInput } from './dto/resumes.input';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@UseGuards(JwtAuthGuard)
@Resolver(() => ResumeType)
export class ResumesResolver {
  constructor(private readonly resumesService: ResumesService) {}

  @Query(() => [ResumeType])

  async resumes(@CurrentUser() user: { id: string }) {
    return this.resumesService.findAll(user.id);
  }

  @Query(() => ResumeType, { nullable: true })

  async resume(
    @CurrentUser() user: { id: string },
    @Args('id') id: string,
  ) {
    return this.resumesService.findOne(id, user.id);
  }

  @Mutation(() => ResumeType)

  async createResume(
    @CurrentUser() user: { id: string },
    @Args('input') input: CreateResumeInput,
  ) {
    return this.resumesService.create(user.id, input);
  }

  @Mutation(() => Boolean)

  async updateResume(
    @CurrentUser() user: { id: string },
    @Args('id') id: string,
    @Args('input') input: UpdateResumeInput,
  ) {
    await this.resumesService.update(id, user.id, input);
    return true;
  }

  @Mutation(() => Boolean)

  async deleteResume(
    @CurrentUser() user: { id: string },
    @Args('id') id: string,
  ) {
    return this.resumesService.remove(id, user.id);
  }

  @Mutation(() => ResumeType)

  async setPrimaryResume(
    @CurrentUser() user: { id: string },
    @Args('id') id: string,
  ) {
    return this.resumesService.setPrimary(id, user.id);
  }
}
