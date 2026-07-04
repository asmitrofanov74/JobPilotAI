import { InputType, Field } from '@nestjs/graphql';
import { MinLength } from 'class-validator';

@InputType()
export class CreateSkillGapReportInput {
  @Field()
  @MinLength(1)
  jobDescription: string;

  @Field()
  @MinLength(1)
  jobTitle: string;

  @Field()
  @MinLength(1)
  companyName: string;
}
