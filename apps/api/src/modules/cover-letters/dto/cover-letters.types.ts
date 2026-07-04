import { ObjectType, Field } from '@nestjs/graphql';

@ObjectType()
export class CoverLetterType {
  @Field()
  id: string;

  @Field()
  jobTitle: string;

  @Field()
  companyName: string;

  @Field()
  content: string;

  @Field()
  tone: string;

  @Field({ nullable: true })
  jobDescription?: string;

  @Field()
  isGenerated: boolean;

  @Field()
  userId: string;

  @Field(() => Date)
  createdAt: Date;

  @Field(() => Date)
  updatedAt: Date;
}
