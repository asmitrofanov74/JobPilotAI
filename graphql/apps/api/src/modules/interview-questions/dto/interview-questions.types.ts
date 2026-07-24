import { ObjectType, Field, Int, registerEnumType } from '@nestjs/graphql';

export enum QuestionTypeEnum {
  TECHNICAL = 'TECHNICAL',
  BEHAVIORAL = 'BEHAVIORAL',
  SYSTEM_DESIGN = 'SYSTEM_DESIGN',
  CODING = 'CODING',
}

registerEnumType(QuestionTypeEnum, { name: 'QuestionTypeEnum' });

@ObjectType()
export class InterviewQuestionType {
  @Field()
  id: string;

  @Field()
  question: string;

  @Field({ nullable: true })
  answer?: string;

  @Field(() => QuestionTypeEnum)
  type: QuestionTypeEnum;

  @Field({ nullable: true })
  category?: string;

  @Field(() => Int, { nullable: true })
  difficulty?: number;

  @Field({ nullable: true })
  source?: string;

  @Field()
  isFavorite: boolean;

  @Field()
  userId: string;

  @Field(() => Date)
  createdAt: Date;

  @Field(() => Date)
  updatedAt: Date;
}
