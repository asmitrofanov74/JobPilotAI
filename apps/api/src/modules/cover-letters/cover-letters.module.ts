import { Module } from '@nestjs/common';
import { CoverLettersService } from './cover-letters.service';
import { CoverLettersResolver } from './cover-letters.resolver';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [CoverLettersService, CoverLettersResolver],
  exports: [CoverLettersService],
})
export class CoverLettersModule {}
