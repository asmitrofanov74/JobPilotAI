import { ObjectType, Field, Float } from '@nestjs/graphql';
import GraphQLJSON from 'graphql-type-json';

@ObjectType()
export class SkillGapReportType {
  @Field()
  id: string;

  @Field()
  jobDescription: string;

  @Field()
  jobTitle: string;

  @Field()
  companyName: string;

  @Field(() => GraphQLJSON)
  requiredSkills: Array<{ skill: string; importance: string }>;

  @Field(() => GraphQLJSON)
  userSkills: string[];

  @Field(() => GraphQLJSON)
  missingSkills: Array<{ skill: string; importance: string; recommendation: string }>;

  @Field(() => Float)
  matchScore: number;

  @Field(() => GraphQLJSON, { nullable: true })
  recommendations?: string[];

  @Field()
  userId: string;

  @Field(() => Date)
  createdAt: Date;
}
