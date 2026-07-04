import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateCoverLetterInput, UpdateCoverLetterInput } from './dto/cover-letters.input';

@Injectable()
export class CoverLettersService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(userId: string) {
    return this.prisma.coverLetter.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string, userId: string) {
    return this.prisma.coverLetter.findFirst({
      where: { id, userId },
    });
  }

  async create(userId: string, input: CreateCoverLetterInput) {
    return this.prisma.coverLetter.create({
      data: {
        jobTitle: input.jobTitle,
        companyName: input.companyName,
        content: input.content,
        tone: input.tone || 'professional',
        jobDescription: input.jobDescription,
        isGenerated: input.isGenerated ?? true,
        userId,
      },
    });
  }

  async update(id: string, userId: string, input: UpdateCoverLetterInput) {
    const data: any = {};
    if (input.jobTitle !== undefined) data.jobTitle = input.jobTitle;
    if (input.companyName !== undefined) data.companyName = input.companyName;
    if (input.content !== undefined) data.content = input.content;
    if (input.tone !== undefined) data.tone = input.tone;
    if (input.jobDescription !== undefined) data.jobDescription = input.jobDescription;
    if (input.isGenerated !== undefined) data.isGenerated = input.isGenerated;

    return this.prisma.coverLetter.updateMany({
      where: { id, userId },
      data,
    });
  }

  async remove(id: string, userId: string) {
    await this.prisma.coverLetter.deleteMany({
      where: { id, userId },
    });
    return true;
  }
}
