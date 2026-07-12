import { Module } from '@nestjs/common';
import { AiService } from './ai.service';
import { AiResolver } from './ai.resolver';
import { AiController } from './ai.controller';
import { OpenRouterProvider } from './providers/openrouter.provider';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [AiController],
  providers: [AiService, AiResolver, OpenRouterProvider],
  exports: [AiService, OpenRouterProvider],
})
export class AiModule {}
