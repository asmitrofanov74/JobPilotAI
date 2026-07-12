import { Module } from '@nestjs/common';
import { FrenchCoachService } from './french-coach.service';
import { FrenchCoachResolver } from './french-coach.resolver';
import { ConversationService } from './conversation.service';
import { VocabularyService } from './vocabulary.service';
import { CulturalTipsService } from './cultural-tips.service';
import { VocabularyTrackerService } from './vocabulary-tracker.service';
import { InterviewCoachService } from './interview-coach.service';
import { PrismaModule } from '../../prisma/prisma.module';
import { AiModule } from '../ai/ai.module';

@Module({
  imports: [PrismaModule, AiModule],
  providers: [
    FrenchCoachService,
    FrenchCoachResolver,
    ConversationService,
    VocabularyService,
    CulturalTipsService,
    VocabularyTrackerService,
    InterviewCoachService,
  ],
  exports: [FrenchCoachService],
})
export class FrenchCoachModule {}
