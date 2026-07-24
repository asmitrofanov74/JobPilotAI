import { ObjectType, Field } from '@nestjs/graphql';
import GraphQLJSON from 'graphql-type-json';

@ObjectType()
export class LinkedinOptimizationType {
  @Field()
  id: string;

  @Field()
  type: string;

  @Field(() => GraphQLJSON)
  inputData: Record<string, unknown>;

  @Field(() => GraphQLJSON)
  outputData: Record<string, unknown>;

  @Field()
  userId: string;

  @Field(() => Date)
  createdAt: Date;
}

@ObjectType()
export class LinkedinOptimizationResult {
  @Field(() => LinkedinOptimizationType)
  optimization: LinkedinOptimizationType;

  @Field(() => GraphQLJSON)
  output: Record<string, unknown>;
}
