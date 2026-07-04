import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RegisterInput, LoginInput } from './dto/auth.inputs';
import { AuthPayload, UserType } from './dto/auth.types';

@Resolver(() => AuthPayload)
export class AuthResolver {
  constructor(private readonly authService: AuthService) {}

  @Mutation(() => AuthPayload)
  async register(@Args('input') input: RegisterInput): Promise<AuthPayload> {
    return this.authService.register(input);
  }

  @Mutation(() => AuthPayload)
  async login(@Args('input') input: LoginInput): Promise<AuthPayload> {
    return this.authService.login(input);
  }

  @Mutation(() => AuthPayload)
  async refreshToken(
    @Args('token') token: string,
  ): Promise<AuthPayload> {
    return this.authService.refreshToken(token);
  }

  @Query(() => UserType)
  @UseGuards(JwtAuthGuard)
  async me(@CurrentUser() user: { id: string }): Promise<UserType> {
    return this.authService.getProfile(user.id);
  }
}
