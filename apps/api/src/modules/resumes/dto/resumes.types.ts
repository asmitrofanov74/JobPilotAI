import { ObjectType, Field, Int } from '@nestjs/graphql';

@ObjectType()
export class ResumeType {
  @Field()
  id: string;

  @Field()
  title: string;

  @Field()
  fileUrl: string;

  @Field()
  fileKey: string;

  @Field(() => Int, { nullable: true })
  fileSize?: number;

  @Field({ nullable: true })
  mimeType?: string;

  @Field()
  isPrimary: boolean;

  @Field({ nullable: true })
  parsedSkills?: string;

  @Field({ nullable: true })
  parsedExperience?: string;

  @Field({ nullable: true })
  parsedEducation?: string;

  @Field()
  userId: string;

  @Field(() => Date)
  createdAt: Date;

  @Field(() => Date)
  updatedAt: Date;
}
