import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { UpdateProfileInput } from './dto/user.inputs';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async updateProfile(userId: string, input: UpdateProfileInput) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: {
        ...(input.firstName !== undefined && { firstName: input.firstName }),
        ...(input.lastName !== undefined && { lastName: input.lastName }),
        ...(input.title !== undefined && { title: input.title }),
        ...(input.targetRole !== undefined && { targetRole: input.targetRole }),
        ...(input.experienceLevel !== undefined && { experienceLevel: input.experienceLevel }),
        ...(input.targetLocations !== undefined && { targetLocations: input.targetLocations }),
        ...(input.summary !== undefined && { summary: input.summary }),
      },
      include: { subscription: true },
    });

    return {
      id: updated.id,
      email: updated.email,
      firstName: updated.firstName,
      lastName: updated.lastName,
      title: updated.title,
      targetRole: updated.targetRole,
      experienceLevel: updated.experienceLevel,
      targetLocations: updated.targetLocations,
      summary: updated.summary,
      avatarUrl: updated.avatarUrl,
      isActive: updated.isActive,
      subscription: updated.subscription ? {
        id: updated.subscription.id,
        tier: updated.subscription.tier,
        currentPeriodEnd: updated.subscription.currentPeriodEnd,
        isActive: true,
      } : null,
      createdAt: updated.createdAt,
      updatedAt: updated.updatedAt,
    };
  }
}
