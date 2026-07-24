import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateInterviewQuestionInput, UpdateInterviewQuestionInput } from './dto/interview-questions.input';

@Injectable()
export class InterviewQuestionsService {
  constructor(private readonly prisma: PrismaService) {}

  async findByUser(userId: string) {
    return this.prisma.interviewQuestion.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string, userId: string) {
    return this.prisma.interviewQuestion.findFirst({
      where: { id, userId },
    });
  }

  async create(userId: string, input: CreateInterviewQuestionInput) {
    return this.prisma.interviewQuestion.create({
      data: {
        question: input.question,
        answer: input.answer,
        type: input.type,
        category: input.category,
        difficulty: input.difficulty,
        source: input.source,
        isFavorite: input.isFavorite || false,
        userId,
      },
    });
  }

  async update(id: string, userId: string, input: UpdateInterviewQuestionInput) {
    const data: Prisma.InterviewQuestionUpdateInput = {};
    if (input.question !== undefined) data.question = input.question;
    if (input.answer !== undefined) data.answer = input.answer;
    if (input.type !== undefined) data.type = input.type;
    if (input.category !== undefined) data.category = input.category;
    if (input.difficulty !== undefined) data.difficulty = input.difficulty;
    if (input.source !== undefined) data.source = input.source;
    if (input.isFavorite !== undefined) data.isFavorite = input.isFavorite;

    return this.prisma.interviewQuestion.updateMany({
      where: { id, userId },
      data,
    });
  }

  async remove(id: string, userId: string) {
    await this.prisma.interviewQuestion.deleteMany({
      where: { id, userId },
    });
    return true;
  }

  async toggleFavorite(id: string, userId: string) {
    const question = await this.prisma.interviewQuestion.findFirst({
      where: { id, userId },
    });

    if (!question) return null;

    return this.prisma.interviewQuestion.update({
      where: { id },
      data: { isFavorite: !question.isFavorite },
    });
  }
}
