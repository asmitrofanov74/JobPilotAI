import { Module } from '@nestjs/common';
import { SkillGapReportsService } from './skill-gap-reports.service';
import { SkillGapReportsResolver } from './skill-gap-reports.resolver';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [SkillGapReportsService, SkillGapReportsResolver],
  exports: [SkillGapReportsService],
})
export class SkillGapReportsModule {}
