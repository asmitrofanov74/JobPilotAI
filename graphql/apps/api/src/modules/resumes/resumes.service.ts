import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateResumeInput, UpdateResumeInput } from './dto/resumes.input';

@Injectable()
export class ResumesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(userId: string) {
    return this.prisma.resume.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string, userId: string) {
    return this.prisma.resume.findFirst({
      where: { id, userId },
    });
  }

  async create(userId: string, input: CreateResumeInput) {
    if (input.isPrimary) {
      await this.prisma.resume.updateMany({
        where: { userId, isPrimary: true },
        data: { isPrimary: false },
      });
    }

    return this.prisma.resume.create({
      data: {
        title: input.title,
        fileUrl: input.fileUrl,
        fileKey: input.fileKey,
        fileSize: input.fileSize,
        mimeType: input.mimeType,
        isPrimary: input.isPrimary || false,
        parsedSkills: input.parsedSkills,
        parsedExperience: input.parsedExperience,
        parsedEducation: input.parsedEducation,
        userId,
      },
    });
  }

  async update(id: string, userId: string, input: UpdateResumeInput) {
    if (input.isPrimary) {
      await this.prisma.resume.updateMany({
        where: { userId, isPrimary: true, id: { not: id } },
        data: { isPrimary: false },
      });
    }

    const data: Prisma.ResumeUpdateInput = {};
    if (input.title !== undefined) data.title = input.title;
    if (input.fileUrl !== undefined) data.fileUrl = input.fileUrl;
    if (input.fileKey !== undefined) data.fileKey = input.fileKey;
    if (input.fileSize !== undefined) data.fileSize = input.fileSize;
    if (input.mimeType !== undefined) data.mimeType = input.mimeType;
    if (input.isPrimary !== undefined) data.isPrimary = input.isPrimary;
    if (input.parsedSkills !== undefined) data.parsedSkills = input.parsedSkills;
    if (input.parsedExperience !== undefined) data.parsedExperience = input.parsedExperience;
    if (input.parsedEducation !== undefined) data.parsedEducation = input.parsedEducation;

    return this.prisma.resume.updateMany({
      where: { id, userId },
      data,
    });
  }

  async remove(id: string, userId: string) {
    await this.prisma.resume.deleteMany({
      where: { id, userId },
    });
    return true;
  }

  async setPrimary(id: string, userId: string) {
    await this.prisma.resume.updateMany({
      where: { userId, isPrimary: true },
      data: { isPrimary: false },
    });

    return this.prisma.resume.update({
      where: { id },
      data: { isPrimary: true },
    });
  }
}
