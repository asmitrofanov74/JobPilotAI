import { InputType, Field, Int } from '@nestjs/graphql';
import { IsOptional, IsString, IsEnum, IsInt, IsBoolean, MinLength } from 'class-validator';
import { QuestionTypeEnum } from './interview-questions.types';

@InputType()
export class CreateInterviewQuestionInput {
  @Field()
  @MinLength(1)
  question: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  answer?: string;

  @Field(() => QuestionTypeEnum)
  @IsEnum(QuestionTypeEnum)
  type: QuestionTypeEnum;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  category?: string;

  @Field(() => Int, { nullable: true })
  @IsOptional()
  @IsInt()
  difficulty?: number;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  source?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsBoolean()
  isFavorite?: boolean;
}

@InputType()
export class UpdateInterviewQuestionInput {
  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  question?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  answer?: string;

  @Field(() => QuestionTypeEnum, { nullable: true })
  @IsOptional()
  @IsEnum(QuestionTypeEnum)
  type?: QuestionTypeEnum;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  category?: string;

  @Field(() => Int, { nullable: true })
  @IsOptional()
  @IsInt()
  difficulty?: number;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  source?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsBoolean()
  isFavorite?: boolean;
}
