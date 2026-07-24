import { InputType, Field, Int } from '@nestjs/graphql';
import { IsOptional, IsString, MinLength, IsBoolean, IsInt } from 'class-validator';

@InputType()
export class CreateResumeInput {
  @Field()
  @MinLength(1)
  title: string;

  @Field()
  @MinLength(1)
  fileUrl: string;

  @Field()
  @MinLength(1)
  fileKey: string;

  @Field(() => Int, { nullable: true })
  @IsOptional()
  @IsInt()
  fileSize?: number;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  mimeType?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsBoolean()
  isPrimary?: boolean;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  parsedSkills?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  parsedExperience?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  parsedEducation?: string;
}

@InputType()
export class UpdateResumeInput {
  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  title?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  fileUrl?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  fileKey?: string;

  @Field(() => Int, { nullable: true })
  @IsOptional()
  @IsInt()
  fileSize?: number;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  mimeType?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsBoolean()
  isPrimary?: boolean;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  parsedSkills?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  parsedExperience?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  parsedEducation?: string;
}
