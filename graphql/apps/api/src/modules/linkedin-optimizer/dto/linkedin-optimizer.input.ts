import { InputType, Field } from '@nestjs/graphql';
import { MinLength, IsOptional } from 'class-validator';

@InputType()
export class AnalyzeProfileInput {
  @Field({ nullable: true })
  @IsOptional()
  profileUrl?: string;

  @Field({ nullable: true })
  @IsOptional()
  headline?: string;

  @Field({ nullable: true })
  @IsOptional()
  about?: string;

  @Field({ nullable: true })
  @IsOptional()
  currentRole?: string;

  @Field({ nullable: true })
  @IsOptional()
  currentCompany?: string;

  @Field({ nullable: true })
  @IsOptional()
  industry?: string;

  @Field({ nullable: true })
  @IsOptional()
  location?: string;

  @Field({ nullable: true })
  @IsOptional()
  experienceLevel?: string;

  @Field(() => [String], { nullable: true })
  @IsOptional()
  skills?: string[];
}

@InputType()
export class GenerateHeadlineInput {
  @Field()
  @MinLength(1)
  targetRole: string;

  @Field()
  @MinLength(1)
  currentRole: string;

  @Field(() => [String])
  skills: string[];

  @Field()
  @MinLength(1)
  industry: string;

  @Field({ nullable: true })
  @IsOptional()
  experienceLevel?: string;

  @Field({ nullable: true })
  @IsOptional()
  currentHeadline?: string;

  @Field({ nullable: true })
  @IsOptional()
  tone?: string;
}

@InputType()
export class GenerateAboutInput {
  @Field()
  @MinLength(1)
  targetRole: string;

  @Field()
  @MinLength(1)
  industry: string;

  @Field(() => [String])
  keyAchievements: string[];

  @Field(() => [String])
  skills: string[];

  @Field({ nullable: true })
  @IsOptional()
  currentAbout?: string;

  @Field({ nullable: true })
  @IsOptional()
  experienceYears?: number;

  @Field({ nullable: true })
  @IsOptional()
  tone?: string;
}

@InputType()
class ExperienceEntry {
  @Field()
  @MinLength(1)
  company: string;

  @Field()
  @MinLength(1)
  role: string;

  @Field()
  @MinLength(1)
  description: string;

  @Field({ nullable: true })
  @IsOptional()
  duration?: string;

  @Field(() => [String], { nullable: true })
  @IsOptional()
  achievements?: string[];
}

@InputType()
export class OptimizeExperienceInput {
  @Field(() => [ExperienceEntry])
  entries: ExperienceEntry[];

  @Field({ nullable: true })
  @IsOptional()
  industry?: string;

  @Field({ nullable: true })
  @IsOptional()
  tone?: string;
}

@InputType()
export class CompareResumeInput {
  @Field()
  @MinLength(1)
  resumeId: string;

  @Field(() => [String], { nullable: true })
  @IsOptional()
  linkedinSkills?: string[];

  @Field({ nullable: true })
  @IsOptional()
  linkedinHeadline?: string;

  @Field({ nullable: true })
  @IsOptional()
  linkedinAbout?: string;

  @Field(() => [String], { nullable: true })
  @IsOptional()
  linkedinExperience?: string[];
}

@InputType()
export class AnalyzeVisibilityInput {
  @Field()
  @MinLength(1)
  headline: string;

  @Field()
  @MinLength(1)
  about: string;

  @Field(() => [String])
  skills: string[];

  @Field(() => [String])
  targetRoles: string[];

  @Field(() => [String], { nullable: true })
  @IsOptional()
  targetLocations?: string[];

  @Field({ nullable: true })
  @IsOptional()
  industry?: string;

  @Field({ nullable: true })
  @IsOptional()
  experienceLevel?: string;
}
