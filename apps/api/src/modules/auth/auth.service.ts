import { Injectable, UnauthorizedException, ConflictException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../../prisma/prisma.service';
import { RegisterInput, LoginInput } from './dto/auth.inputs';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
  ) {}

  async register(input: RegisterInput) {
    const existing = await this.prisma.user.findUnique({
      where: { email: input.email },
    });

    if (existing) {
      throw new ConflictException('Email already registered');
    }

    const passwordHash = await bcrypt.hash(input.password, 12);

    const user = await this.prisma.user.create({
      data: {
        email: input.email,
        passwordHash,
        firstName: input.firstName,
        lastName: input.lastName,
        subscription: {
          create: { tier: 'FREE' },
        },
      },
      include: { subscription: true },
    });

    this.logger.log(`User registered: ${user.email}`);

    return this.generateAuthPayload(user);
  }

  async login(input: LoginInput) {
    const user = await this.prisma.user.findUnique({
      where: { email: input.email },
      include: { subscription: true },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(input.password, user.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Account is deactivated');
    }

    return this.generateAuthPayload(user);
  }

  async refreshToken(refreshToken: string) {
    try {
      const payload = this.jwtService.verify(refreshToken, {
        secret: this.config.get<string>('JWT_REFRESH_SECRET') || 'fallback_refresh_secret',
      });

      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
        include: { subscription: true },
      });

      if (!user || !user.isActive) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      return this.generateAuthPayload(user);
    } catch {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }
  }

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { subscription: true },
    });
    if (!user) throw new UnauthorizedException('User not found');
    return this.mapUser(user);
  }

  private generateAuthPayload(user: any) {
    const payload = { sub: user.id, email: user.email };

    const jwtSecret = this.config.get<string>('JWT_SECRET') || 'fallback_secret';
    const jwtRefreshSecret = this.config.get<string>('JWT_REFRESH_SECRET') || 'fallback_refresh_secret';
    const jwtAccessExpiry = this.config.get<string>('JWT_ACCESS_EXPIRY', '15m');
    const jwtRefreshExpiry = this.config.get<string>('JWT_REFRESH_EXPIRY', '7d');

    const accessToken = this.jwtService.sign(payload, {
      secret: jwtSecret,
      expiresIn: jwtAccessExpiry as any,
    });
    const refreshToken = this.jwtService.sign(payload, {
      secret: jwtRefreshSecret,
      expiresIn: jwtRefreshExpiry as any,
    });

    return {
      accessToken,
      refreshToken,
      user: this.mapUser(user),
    };
  }

  private mapUser(user: any) {
    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      title: user.title,
      targetRole: user.targetRole,
      experienceLevel: user.experienceLevel,
      targetLocations: user.targetLocations,
      summary: user.summary,
      avatarUrl: user.avatarUrl,
      isActive: user.isActive,
      subscription: user.subscription
        ? {
            id: user.subscription.id,
            tier: user.subscription.tier,
            currentPeriodEnd: user.subscription.currentPeriodEnd,
            isActive:
              user.subscription.tier === 'PRO'
                ? user.subscription.currentPeriodEnd
                  ? new Date(user.subscription.currentPeriodEnd) > new Date()
                  : false
                : true,
          }
        : null,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }
}
