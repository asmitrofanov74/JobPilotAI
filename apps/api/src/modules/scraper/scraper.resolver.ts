import { Resolver, Mutation, Query, Args } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { ScraperService, ScrapedJob as ScrapedJobInterface, PostedWithin, ProviderStats } from './scraper.service';
import { CompanyScraperService } from './services/company-scraper.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JobsService } from '../jobs/jobs.service';
import { ObjectType, Field, InputType, Int, registerEnumType } from '@nestjs/graphql';
import { IsString, IsOptional, MinLength, IsBoolean, IsUrl } from 'class-validator';
import { ProviderHealthService } from './services/provider-health.service';

registerEnumType(PostedWithin, { name: 'PostedWithin' });

@InputType()
export class JobSourceInput {
  @Field({ nullable: true, defaultValue: true })
  @IsOptional()
  @IsBoolean()
  linkedin?: boolean;

  @Field({ nullable: true, defaultValue: true })
  @IsOptional()
  @IsBoolean()
  indeed?: boolean;

  @Field({ nullable: true, defaultValue: true })
  @IsOptional()
  @IsBoolean()
  workopolis?: boolean;

  @Field({ nullable: true, defaultValue: true })
  @IsOptional()
  @IsBoolean()
  ziprecruiter?: boolean;

  @Field({ nullable: true, defaultValue: true })
  @IsOptional()
  @IsBoolean()
  greenhouse?: boolean;

  @Field({ nullable: true, defaultValue: true })
  @IsOptional()
  @IsBoolean()
  lever?: boolean;

  @Field({ nullable: true, defaultValue: true })
  @IsOptional()
  @IsBoolean()
  workday?: boolean;
}

@InputType()
export class ScrapeCompanyInput {
  @Field()
  @IsUrl({ require_protocol: true })
  careerUrl: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  query?: string;
}

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

  @Field(() => PostedWithin, { nullable: true })
  @IsOptional()
  postedWithin?: PostedWithin;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  source?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  jobType?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsBoolean()
  remote?: boolean;

  @Field(() => Int, { nullable: true })
  @IsOptional()
  salaryMin?: number;

  @Field(() => Int, { nullable: true })
  @IsOptional()
  salaryMax?: number;

  @Field(() => JobSourceInput, { nullable: true })
  @IsOptional()
  sources?: JobSourceInput;
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

  @Field({ nullable: true })
  postedDate?: string;
}

@ObjectType()
export class ProviderStatsType {
  @Field(() => Int)
  linkedin: number;

  @Field(() => Int)
  indeed: number;

  @Field(() => Int)
  workopolis: number;

  @Field(() => Int)
  ziprecruiter: number;

  @Field(() => Int)
  greenhouse: number;

  @Field(() => Int)
  lever: number;

  @Field(() => Int)
  workday: number;
}

@ObjectType()
export class ScrapeResult {
  @Field(() => Int)
  total: number;

  @Field(() => Int)
  imported: number;

  @Field(() => [ScrapedJobType])
  jobs: ScrapedJobType[];

  @Field(() => ProviderStatsType, { nullable: true })
  stats?: ProviderStatsType;
}

@ObjectType()
export class ProviderHealthType {
  @Field()
  provider: string;

  @Field()
  healthy: boolean;

  @Field(() => Date)
  lastRun: Date;

  @Field({ nullable: true })
  lastError?: string;
}

@UseGuards(JwtAuthGuard)
@Resolver(() => ScrapedJobType)
export class ScraperResolver {
  constructor(
    private readonly scraperService: ScraperService,
    private readonly companyScraperService: CompanyScraperService,
    private readonly jobsService: JobsService,
    private readonly healthService: ProviderHealthService,
  ) {}

  @Mutation(() => ScrapeResult)

  async scrapeJobs(
    @CurrentUser() user: { id: string },
    @Args('input') input: ScrapeJobsInput,
  ) {
    const { jobs: scraped, stats } = await this.scraperService.scrapeAll(
      input.keywords, input.location, input.postedWithin, input.source,
      input.jobType, input.remote, input.salaryMin, input.salaryMax,
      input.sources as any,
    );

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
        postedDate: j.postedDate ?? undefined,
      })),
      stats: {
        linkedin: stats['LINKEDIN'] || 0,
        indeed: stats['INDEED'] || 0,
        workopolis: stats['WORKOPOLIS'] || 0,
        ziprecruiter: stats['ZIPRECRUITER'] || 0,
        greenhouse: stats['GREENHOUSE'] || 0,
        lever: stats['LEVER'] || 0,
        workday: stats['WORKDAY'] || 0,
      },
    };
  }

  @Mutation(() => [ScrapedJobType])

  async scrapeCompany(
    @Args('input') input: ScrapeCompanyInput,
  ) {
    const jobs = await this.companyScraperService.detectAndScrape(input.careerUrl, input.query);
    return jobs.map((j) => ({
      companyName: j.company,
      jobTitle: j.title,
      jobDescription: j.description || undefined,
      jobUrl: j.sourceUrl,
      location: j.location || undefined,
      source: j.source,
      postedDate: j.postedAt?.toISOString() || undefined,
    }));
  }

  @Query(() => [ProviderHealthType])

  async scraperStatus() {
    return this.healthService.getAll();
  }
}
