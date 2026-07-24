import { InputType, Field } from '@nestjs/graphql';
import { IsOptional, IsString, MinLength } from 'class-validator';

@InputType()
export class CreateCoverLetterInput {
  @Field()
  @MinLength(1)
  jobTitle: string;

  @Field()
  @MinLength(1)
  companyName: string;

  @Field()
  @MinLength(1)
  content: string;

  @Field({ nullable: true, defaultValue: 'professional' })
  @IsOptional()
  @IsString()
  tone?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  jobDescription?: string;

  @Field({ nullable: true })
  @IsOptional()
  isGenerated?: boolean;
}

@InputType()
export class UpdateCoverLetterInput {
  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  jobTitle?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  companyName?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  content?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  tone?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  jobDescription?: string;

  @Field({ nullable: true })
  @IsOptional()
  isGenerated?: boolean;
}
