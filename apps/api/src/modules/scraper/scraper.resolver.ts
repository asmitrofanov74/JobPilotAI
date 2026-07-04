import { Resolver, Mutation, Args } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { ScraperService, ScrapedJob as ScrapedJobInterface } from './scraper.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JobsService } from '../jobs/jobs.service';
import { ObjectType, Field, InputType, Int } from '@nestjs/graphql';
import { IsString, IsOptional, MinLength } from 'class-validator';

@InputType()
export class ScrapeJobsInput {
  @Field()
  @MinLength(1)
  keywords: string;

  @Field()
  @MinLength(1)
  location: string;

  @Field({ nullable: true, defaultValue: false })
  @IsOptional()
  importAll?: boolean;
}

@ObjectType()
export class ScrapedJobType {
  @Field()
  companyName: string;

  @Field()
  jobTitle: string;

  @Field({ nullable: true })
  jobDescription?: string;

  @Field({ nullable: true })
  jobUrl?: string;

  @Field({ nullable: true })
  location?: string;

  @Field({ nullable: true })
  salaryRange?: string;

  @Field()
  source: string;

  @Field({ nullable: true })
  employmentType?: string;

  @Field({ nullable: true })
  workMode?: string;
}

@ObjectType()
export class ScrapeResult {
  @Field(() => Int)
  total: number;

  @Field(() => Int)
  imported: number;

  @Field(() => [ScrapedJobType])
  jobs: ScrapedJobType[];
}

@Resolver(() => ScrapedJobType)
export class ScraperResolver {
  constructor(
    private readonly scraperService: ScraperService,
    private readonly jobsService: JobsService,
  ) {}

  @Mutation(() => ScrapeResult)
  @UseGuards(JwtAuthGuard)
  async scrapeJobs(
    @CurrentUser() user: { id: string },
    @Args('input') input: ScrapeJobsInput,
  ) {
    const scraped = await this.scraperService.scrapeAll(input.keywords, input.location);

    let imported = 0;
    if (input.importAll) {
      for (const job of scraped) {
        try {
          await this.jobsService.create(user.id, {
            companyName: job.companyName,
            jobTitle: job.jobTitle,
            jobDescription: job.jobDescription,
            jobUrl: job.jobUrl,
            location: job.location,
            salaryRange: job.salaryRange ?? undefined,
            source: job.source as any,
            sourceUrl: job.sourceUrl,
            sourceId: job.sourceId,
            status: 'SAVED' as any,
          });
          imported++;
        } catch (err) {
          continue;
        }
      }
    }

    return {
      total: scraped.length,
      imported,
      jobs: scraped.map((j) => ({
        companyName: j.companyName,
        jobTitle: j.jobTitle,
        jobDescription: j.jobDescription,
        jobUrl: j.jobUrl,
        location: j.location,
        salaryRange: j.salaryRange ?? undefined,
        source: j.source,
        employmentType: j.employmentType ?? undefined,
        workMode: j.workMode ?? undefined,
      })),
    };
  }
}
