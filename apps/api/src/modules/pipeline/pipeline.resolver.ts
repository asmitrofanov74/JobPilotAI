import { Resolver, Mutation, Args } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { PipelineService } from './pipeline.service';
import { PipelineResultType } from './dto/pipeline.types';
import { RunApplicationPipelineInput } from './dto/pipeline.input';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@UseGuards(JwtAuthGuard)
@Resolver()
export class PipelineResolver {
  constructor(private readonly pipelineService: PipelineService) {}

  @Mutation(() => PipelineResultType)
  async runApplicationPipeline(
    @CurrentUser() user: { id: string },
    @Args('input') input: RunApplicationPipelineInput,
  ) {
    return this.pipelineService.runApplicationPipeline(user.id, input);
  }
}