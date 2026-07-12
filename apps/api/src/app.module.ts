import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { ThrottlerModule } from '@nestjs/throttler';

import { Request, Response } from 'express';
import { join } from 'path';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { JobsModule } from './modules/jobs/jobs.module';
import { ResumesModule } from './modules/resumes/resumes.module';
import { CoverLettersModule } from './modules/cover-letters/cover-letters.module';
import { InterviewsModule } from './modules/interviews/interviews.module';
import { InterviewQuestionsModule } from './modules/interview-questions/interview-questions.module';
import { SkillGapReportsModule } from './modules/skill-gap-reports/skill-gap-reports.module';
import { AiModule } from './modules/ai/ai.module';
import { ScraperModule } from './modules/scraper/scraper.module';
import { LinkedinOptimizerModule } from './modules/linkedin-optimizer/linkedin-optimizer.module';
import { FrenchCoachModule } from './modules/french-coach/french-coach.module';
import { APP_GUARD } from '@nestjs/core';
import { GqlThrottlerGuard } from './common/guards/gql-throttler.guard';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', '.env.local'],
    }),
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      autoSchemaFile: join(process.cwd(), 'src/schema.gql'),
      sortSchema: true,
      playground: process.env.NODE_ENV !== 'production',
      context: ({ req, res }: { req: Request; res: Response }) => ({ req, res }),
    }),
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 10 }]),
    PrismaModule,
    AuthModule,
    UsersModule,
    JobsModule,
    ResumesModule,
    CoverLettersModule,
    InterviewsModule,
    InterviewQuestionsModule,
    SkillGapReportsModule,
    AiModule,
    ScraperModule,
    LinkedinOptimizerModule,
    FrenchCoachModule,
  ],
  providers: [
    { provide: APP_GUARD, useClass: GqlThrottlerGuard },
  ],
})
export class AppModule {}
