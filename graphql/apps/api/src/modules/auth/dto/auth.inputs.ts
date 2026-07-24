import { InputType, Field } from '@nestjs/graphql';
import { IsEmail, IsNotEmpty, MinLength, MaxLength } from 'class-validator';

@InputType()
export class RegisterInput {
  @Field()
  @IsEmail()
  email!: string;

  @Field()
  @IsNotEmpty()
  @MinLength(8)
  @MaxLength(100)
  password!: string;

  @Field()
  @IsNotEmpty()
  @MinLength(1)
  @MaxLength(50)
  firstName!: string;

  @Field()
  @IsNotEmpty()
  @MinLength(1)
  @MaxLength(50)
  lastName!: string;
}

@InputType()
export class LoginInput {
  @Field()
  @IsEmail()
  email!: string;

  @Field()
  @IsNotEmpty()
  password!: string;
}
