import { Module } from '@nestjs/common';
import { LinkedinOptimizerService } from './linkedin-optimizer.service';
import { LinkedinOptimizerResolver } from './linkedin-optimizer.resolver';
import { PrismaModule } from '../../prisma/prisma.module';
import { AiModule } from '../ai/ai.module';

@Module({
  imports: [PrismaModule, AiModule],
  providers: [LinkedinOptimizerService, LinkedinOptimizerResolver],
  exports: [LinkedinOptimizerService],
})
export class LinkedinOptimizerModule {}
