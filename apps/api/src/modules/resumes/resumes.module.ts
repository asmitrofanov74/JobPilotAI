import { Module } from '@nestjs/common';
import { ResumesService } from './resumes.service';
import { ResumesResolver } from './resumes.resolver';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [ResumesService, ResumesResolver],
  exports: [ResumesService],
})
export class ResumesModule {}
