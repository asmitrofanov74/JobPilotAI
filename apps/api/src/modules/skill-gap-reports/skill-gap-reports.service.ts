import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateSkillGapReportInput } from './dto/skill-gap-reports.input';

@Injectable()
export class SkillGapReportsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(userId: string) {
    return this.prisma.skillGapReport.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string, userId: string) {
    return this.prisma.skillGapReport.findFirst({
      where: { id, userId },
    });
  }

  async create(userId: string, input: CreateSkillGapReportInput) {
    return this.prisma.skillGapReport.create({
      data: {
        jobDescription: input.jobDescription,
        jobTitle: input.jobTitle,
        companyName: input.companyName,
        requiredSkills: [],
        userSkills: [],
        missingSkills: [],
        matchScore: 0,
        recommendations: [],
        userId,
      },
    });
  }

  async remove(id: string, userId: string) {
    await this.prisma.skillGapReport.deleteMany({
      where: { id, userId },
    });
    return true;
  }
}
