import { Module } from '@nestjs/common';
import { PipelineService } from './pipeline.service';
import { PipelineResolver } from './pipeline.resolver';
import { PrismaModule } from '../../prisma/prisma.module';
import { JobsModule } from '../jobs/jobs.module';
import { AiModule } from '../ai/ai.module';
import { InterviewsModule } from '../interviews/interviews.module';
import { FrenchCoachModule } from '../french-coach/french-coach.module';

@Module({
  imports: [PrismaModule, JobsModule, AiModule, InterviewsModule, FrenchCoachModule],
  providers: [PipelineService, PipelineResolver],
})
export class PipelineModule {}