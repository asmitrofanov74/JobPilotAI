import { InputType, Field, Int } from '@nestjs/graphql';
import { IsOptional, IsString, IsEnum, IsInt, IsBoolean, IsDateString } from 'class-validator';
import { InterviewTypeEnum } from './interviews.types';

@InputType()
export class CreateInterviewInput {
  @Field(() => InterviewTypeEnum)
  @IsEnum(InterviewTypeEnum)
  type: InterviewTypeEnum;

  @Field(() => Int, { nullable: true, defaultValue: 1 })
  @IsOptional()
  @IsInt()
  round?: number;

  @Field({ nullable: true })
  @IsOptional()
  @IsDateString()
  scheduledAt?: string;

  @Field(() => Int, { nullable: true })
  @IsOptional()
  @IsInt()
  durationMinutes?: number;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  interviewers?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  location?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  notes?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  feedback?: string;

  @Field(() => Int, { nullable: true })
  @IsOptional()
  @IsInt()
  rating?: number;

  @Field({ nullable: true })
  @IsOptional()
  @IsBoolean()
  isCompleted?: boolean;

  @Field()
  jobApplicationId: string;
}

@InputType()
export class UpdateInterviewInput {
  @Field(() => InterviewTypeEnum, { nullable: true })
  @IsOptional()
  @IsEnum(InterviewTypeEnum)
  type?: InterviewTypeEnum;

  @Field(() => Int, { nullable: true })
  @IsOptional()
  @IsInt()
  round?: number;

  @Field({ nullable: true })
  @IsOptional()
  @IsDateString()
  scheduledAt?: string;

  @Field(() => Int, { nullable: true })
  @IsOptional()
  @IsInt()
  durationMinutes?: number;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  interviewers?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  location?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  notes?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  feedback?: string;

  @Field(() => Int, { nullable: true })
  @IsOptional()
  @IsInt()
  rating?: number;

  @Field({ nullable: true })
  @IsOptional()
  @IsBoolean()
  isCompleted?: boolean;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  jobApplicationId?: string;
}
