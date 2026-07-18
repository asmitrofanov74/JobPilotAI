import { Module } from '@nestjs/common';
import { InterviewsService } from './interviews.service';
import { InterviewsResolver } from './interviews.resolver';
import { EnglishInterviewPracticeService } from './english-interview-practice.service';
import { EnglishInterviewPracticeResolver } from './english-interview-practice.resolver';
import { PrismaModule } from '../../prisma/prisma.module';
import { AiModule } from '../ai/ai.module';

@Module({
  imports: [PrismaModule, AiModule],
  providers: [InterviewsService, InterviewsResolver, EnglishInterviewPracticeService, EnglishInterviewPracticeResolver],
  exports: [InterviewsService],
})
export class InterviewsModule {}
