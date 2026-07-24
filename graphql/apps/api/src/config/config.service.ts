import { Injectable } from '@nestjs/common';
import { ConfigModuleOptions } from '@nestjs/config';

@Injectable()
export class AppConfig {
  get nodeEnv(): string {
    return process.env.NODE_ENV || 'development';
  }

  get isDev(): boolean {
    return this.nodeEnv === 'development';
  }

  get isProd(): boolean {
    return this.nodeEnv === 'production';
  }

  get port(): number {
    return parseInt(process.env.PORT || '4000', 10);
  }

  get databaseUrl(): string {
    return process.env.DATABASE_URL || 'postgresql://jobpilot:jobpilot_secret@localhost:5432/jobpilot';
  }

  get redisUrl(): string {
    return process.env.REDIS_URL || 'redis://localhost:6379';
  }

  get jwtSecret(): string {
    return process.env.JWT_SECRET || 'dev_jwt_secret';
  }

  get jwtRefreshSecret(): string {
    return process.env.JWT_REFRESH_SECRET || 'dev_refresh_secret';
  }

  get jwtAccessExpiry(): string {
    return process.env.JWT_ACCESS_EXPIRY || '15m';
  }

  get jwtRefreshExpiry(): string {
    return process.env.JWT_REFRESH_EXPIRY || '7d';
  }

  get corsOrigin(): string {
    return process.env.CORS_ORIGIN || 'http://localhost:3000';
  }

  get openRouterApiKey(): string {
    return process.env.OPENROUTER_API_KEY || '';
  }

  get openRouterBaseUrl(): string {
    return process.env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1';
  }

  get openRouterModel(): string {
    return process.env.OPENROUTER_MODEL || 'openrouter/free';
  }

  get aiProvider(): string {
    return process.env.AI_PROVIDER || 'openrouter';
  }

  get awsRegion(): string {
    return process.env.AWS_REGION || 'ca-central-1';
  }

  get s3Bucket(): string {
    return process.env.S3_BUCKET || 'jobpilot-uploads';
  }
}

export const configModuleOptions: ConfigModuleOptions = {
  isGlobal: true,
  envFilePath: ['.env', '.env.local'],
};
