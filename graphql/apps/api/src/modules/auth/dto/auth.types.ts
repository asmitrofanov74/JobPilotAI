import { ObjectType, Field, Int } from '@nestjs/graphql';

@ObjectType()
export class SubscriptionType {
  @Field()
  id!: string;

  @Field()
  tier!: string;

  @Field(() => Date, { nullable: true })
  currentPeriodEnd?: Date | null;

  @Field()
  isActive!: boolean;
}

@ObjectType()
export class UserType {
  @Field()
  id!: string;

  @Field()
  email!: string;

  @Field()
  firstName!: string;

  @Field()
  lastName!: string;

  @Field(() => String, { nullable: true })
  title?: string | null;

  @Field(() => String, { nullable: true })
  targetRole?: string | null;

  @Field(() => String, { nullable: true })
  experienceLevel?: string | null;

  @Field(() => String, { nullable: true })
  targetLocations?: string | null;

  @Field(() => String, { nullable: true })
  summary?: string | null;

  @Field(() => String, { nullable: true })
  avatarUrl?: string | null;

  @Field()
  isActive!: boolean;

  @Field(() => SubscriptionType, { nullable: true })
  subscription?: SubscriptionType | null;

  @Field(() => Date)
  createdAt!: Date;

  @Field(() => Date)
  updatedAt!: Date;
}

@ObjectType()
export class AuthPayload {
  @Field()
  accessToken!: string;

  @Field()
  refreshToken!: string;

  @Field(() => UserType)
  user!: UserType;
}
