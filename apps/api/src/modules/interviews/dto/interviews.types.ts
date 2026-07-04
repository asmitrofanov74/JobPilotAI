import { ObjectType, Field, Int, registerEnumType } from '@nestjs/graphql';

export enum InterviewTypeEnum {
  PHONE = 'PHONE',
  TECHNICAL = 'TECHNICAL',
  BEHAVIORAL = 'BEHAVIORAL',
  SYSTEM_DESIGN = 'SYSTEM_DESIGN',
  CODING = 'CODING',
  ONSITE = 'ONSITE',
  PANEL = 'PANEL',
  TAKE_HOME = 'TAKE_HOME',
}

registerEnumType(InterviewTypeEnum, { name: 'InterviewTypeEnum' });

@ObjectType()
export class InterviewType {
  @Field()
  id: string;

  @Field(() => InterviewTypeEnum)
  type: InterviewTypeEnum;

  @Field(() => Int)
  round: number;

  @Field(() => Date, { nullable: true })
  scheduledAt?: Date;

  @Field(() => Int, { nullable: true })
  durationMinutes?: number;

  @Field({ nullable: true })
  interviewers?: string;

  @Field({ nullable: true })
  location?: string;

  @Field({ nullable: true })
  notes?: string;

  @Field({ nullable: true })
  feedback?: string;

  @Field(() => Int, { nullable: true })
  rating?: number;

  @Field()
  isCompleted: boolean;

  @Field()
  jobApplicationId: string;

  @Field(() => Date)
  createdAt: Date;

  @Field(() => Date)
  updatedAt: Date;
}
