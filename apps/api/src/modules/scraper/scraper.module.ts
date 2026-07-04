import { Module } from '@nestjs/common';
import { ScraperService } from './scraper.service';
import { ScraperResolver } from './scraper.resolver';
import { JobsModule } from '../jobs/jobs.module';

@Module({
  imports: [JobsModule],
  providers: [ScraperService, ScraperResolver],
  exports: [ScraperService],
})
export class ScraperModule {}
