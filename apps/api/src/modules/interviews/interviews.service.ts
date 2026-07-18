import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateInterviewInput, UpdateInterviewInput } from './dto/interviews.input';

@Injectable()
export class InterviewsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(userId: string) {
    return this.prisma.interview.findMany({
      where: { jobApplication: { userId } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string, userId: string) {
    return this.prisma.interview.findFirst({
      where: { id, jobApplication: { userId } },
    });
  }

  async create(userId: string, input: CreateInterviewInput) {
    return this.prisma.interview.create({
      data: {
        type: input.type,
        round: input.round || 1,
        scheduledAt: input.scheduledAt ? new Date(input.scheduledAt) : undefined,
        durationMinutes: input.durationMinutes,
        interviewers: input.interviewers,
        location: input.location,
        notes: input.notes,
        feedback: input.feedback,
        rating: input.rating,
        isCompleted: input.isCompleted || false,
        jobApplicationId: input.jobApplicationId,
      },
    });
  }

  async update(id: string, userId: string, input: UpdateInterviewInput) {
    const data: Record<string, unknown> = {};
    if (input.type !== undefined) data.type = input.type;
    if (input.round !== undefined) data.round = input.round;
    if (input.scheduledAt !== undefined) data.scheduledAt = new Date(input.scheduledAt);
    if (input.durationMinutes !== undefined) data.durationMinutes = input.durationMinutes;
    if (input.interviewers !== undefined) data.interviewers = input.interviewers;
    if (input.location !== undefined) data.location = input.location;
    if (input.notes !== undefined) data.notes = input.notes;
    if (input.feedback !== undefined) data.feedback = input.feedback;
    if (input.rating !== undefined) data.rating = input.rating;
    if (input.isCompleted !== undefined) data.isCompleted = input.isCompleted;
    if (input.jobApplicationId !== undefined) data.jobApplicationId = input.jobApplicationId;

    return this.prisma.interview.updateMany({
      where: { id, jobApplication: { userId } },
      data,
    });
  }

  async remove(id: string, userId: string) {
    await this.prisma.interview.deleteMany({
      where: { id, jobApplication: { userId } },
    });
    return true;
  }
}
