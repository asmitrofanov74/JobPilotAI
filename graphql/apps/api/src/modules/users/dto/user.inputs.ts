import { InputType, Field } from '@nestjs/graphql';
import { MaxLength } from 'class-validator';

@InputType()
export class UpdateProfileInput {
  @Field({ nullable: true })
  @MaxLength(50)
  firstName?: string;

  @Field({ nullable: true })
  @MaxLength(50)
  lastName?: string;

  @Field({ nullable: true })
  @MaxLength(100)
  title?: string;

  @Field({ nullable: true })
  @MaxLength(100)
  targetRole?: string;

  @Field({ nullable: true })
  @MaxLength(50)
  experienceLevel?: string;

  @Field({ nullable: true })
  @MaxLength(200)
  targetLocations?: string;

  @Field({ nullable: true })
  @MaxLength(1000)
  summary?: string;
}
