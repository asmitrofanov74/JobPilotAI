import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as Sentry from '@sentry/node';
import { SentryGlobalFilter } from '@sentry/nestjs/setup';
import * as compression from 'compression';
import helmet from 'helmet';
import { AppModule } from './app.module';

async function bootstrap() {
  const logger = new Logger('Bootstrap');

  const dsn = process.env.SENTRY_DSN || '';
  if (dsn) {
    Sentry.init({
      dsn,
      environment: process.env.NODE_ENV || 'development',
      tracesSampleRate: parseFloat(process.env.SENTRY_TRACES_SAMPLE_RATE || '0.1'),
    });
    logger.log('Sentry initialized');
  }

  const app = await NestFactory.create(AppModule);

  const configService = app.get(ConfigService);

  if (dsn) {
    app.useGlobalFilters(new SentryGlobalFilter());
  }

  app.setGlobalPrefix('api', { exclude: ['graphql'] });

  app.use(helmet({ contentSecurityPolicy: false }));
  app.use(compression());

  const allowedOrigins = (configService.get<string>('CORS_ORIGIN', 'http://localhost:3000,http://localhost:3001') || '').split(',').map((s: string) => s.trim());

  app.enableCors({
    origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const port = configService.get<number>('PORT', 4000);
  await app.listen(port);
  logger.log(`JobPilot AI API running on port ${port}`);
}

bootstrap();
