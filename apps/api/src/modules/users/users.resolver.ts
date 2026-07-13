import { Args, Mutation, Resolver } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UsersService } from './users.service';
import { UserType } from '../auth/dto/auth.types';
import { UpdateProfileInput } from './dto/user.inputs';

@UseGuards(JwtAuthGuard)
@Resolver(() => UserType)
export class UsersResolver {
  constructor(private readonly usersService: UsersService) {}

  @Mutation(() => UserType)

  async updateProfile(
    @CurrentUser() user: any,
    @Args('input') input: UpdateProfileInput,
  ): Promise<UserType> {
    return this.usersService.updateProfile(user.id, input);
  }
}
