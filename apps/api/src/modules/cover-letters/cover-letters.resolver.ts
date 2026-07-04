import { Resolver, Query, Mutation, Args } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { CoverLettersService } from './cover-letters.service';
import { CoverLetterType } from './dto/cover-letters.types';
import { CreateCoverLetterInput, UpdateCoverLetterInput } from './dto/cover-letters.input';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Resolver(() => CoverLetterType)
export class CoverLettersResolver {
  constructor(private readonly coverLettersService: CoverLettersService) {}

  @Query(() => [CoverLetterType])
  @UseGuards(JwtAuthGuard)
  async coverLetters(@CurrentUser() user: { id: string }) {
    return this.coverLettersService.findAll(user.id);
  }

  @Query(() => CoverLetterType, { nullable: true })
  @UseGuards(JwtAuthGuard)
  async coverLetter(
    @CurrentUser() user: { id: string },
    @Args('id') id: string,
  ) {
    return this.coverLettersService.findOne(id, user.id);
  }

  @Mutation(() => CoverLetterType)
  @UseGuards(JwtAuthGuard)
  async createCoverLetter(
    @CurrentUser() user: { id: string },
    @Args('input') input: CreateCoverLetterInput,
  ) {
    return this.coverLettersService.create(user.id, input);
  }

  @Mutation(() => Boolean)
  @UseGuards(JwtAuthGuard)
  async updateCoverLetter(
    @CurrentUser() user: { id: string },
    @Args('id') id: string,
    @Args('input') input: UpdateCoverLetterInput,
  ) {
    await this.coverLettersService.update(id, user.id, input);
    return true;
  }

  @Mutation(() => Boolean)
  @UseGuards(JwtAuthGuard)
  async deleteCoverLetter(
    @CurrentUser() user: { id: string },
    @Args('id') id: string,
  ) {
    return this.coverLettersService.remove(id, user.id);
  }
}
