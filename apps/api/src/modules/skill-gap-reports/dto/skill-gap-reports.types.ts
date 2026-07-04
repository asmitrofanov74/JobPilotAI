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
  requiredSkills: any;

  @Field(() => GraphQLJSON)
  userSkills: any;

  @Field(() => GraphQLJSON)
  missingSkills: any;

  @Field(() => Float)
  matchScore: number;

  @Field(() => GraphQLJSON, { nullable: true })
  recommendations?: any;

  @Field()
  userId: string;

  @Field(() => Date)
  createdAt: Date;
}
