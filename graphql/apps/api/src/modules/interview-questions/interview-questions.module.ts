import { Module } from '@nestjs/common';
import { InterviewQuestionsService } from './interview-questions.service';
import { InterviewQuestionsResolver } from './interview-questions.resolver';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [InterviewQuestionsService, InterviewQuestionsResolver],
  exports: [InterviewQuestionsService],
})
export class InterviewQuestionsModule {}
