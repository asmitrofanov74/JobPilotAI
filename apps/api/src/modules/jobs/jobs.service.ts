import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateJobInput, UpdateJobInput, PaginationInput } from './dto/jobs.input';
import { JobStatus } from './dto/jobs.types';

@Injectable()
export class JobsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(
    userId: string,
    pagination: PaginationInput,
    status?: JobStatus,
    search?: string,
  ) {
    const page = pagination.page || 1;
    const limit = pagination.limit || 20;
    const skip = (page - 1) * limit;
    const sortBy = pagination.sortBy || 'createdAt';
    const sortOrder = pagination.sortOrder || 'desc';

    const where: any = { userId };

    if (status) {
      where.status = status;
    }

    if (search) {
      where.OR = [
        { companyName: { contains: search, mode: 'insensitive' } },
        { jobTitle: { contains: search, mode: 'insensitive' } },
      ];
    }

    const allowedSortFields = ['companyName', 'jobTitle', 'status', 'createdAt', 'updatedAt'];
    const orderField = allowedSortFields.includes(sortBy) ? sortBy : 'createdAt';

    const [edges, total] = await Promise.all([
      this.prisma.jobApplication.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [orderField]: sortOrder },
        include: {
          interviews: {
            select: { id: true, type: true, scheduledAt: true, isCompleted: true },
          },
        },
      }),
      this.prisma.jobApplication.count({ where }),
    ]);

    return {
      edges,
      meta: {
        total,
        totalPages: Math.ceil(total / limit),
        page,
        limit,
      },
    };
  }

  async findOne(id: string, userId: string) {
    return this.prisma.jobApplication.findFirst({
      where: { id, userId },
      include: {
        interviews: {
          select: { id: true, type: true, scheduledAt: true, isCompleted: true },
        },
      },
    });
  }

  async create(userId: string, input: CreateJobInput) {
    return this.prisma.jobApplication.create({
      data: {
        companyName: input.companyName,
        jobTitle: input.jobTitle,
        jobDescription: input.jobDescription,
        jobUrl: input.jobUrl,
        status: (input.status as any) || 'SAVED',
        source: input.source as any,
        sourceUrl: input.sourceUrl,
        sourceId: input.sourceId,
        scrapedAt: input.sourceId ? new Date() : undefined,
        salaryRange: input.salaryRange,
        location: input.location,
        notes: input.notes,
        userId,
      },
    });
  }

  async update(id: string, userId: string, input: UpdateJobInput) {
    const data: any = {};
    if (input.companyName !== undefined) data.companyName = input.companyName;
    if (input.jobTitle !== undefined) data.jobTitle = input.jobTitle;
    if (input.jobDescription !== undefined) data.jobDescription = input.jobDescription;
    if (input.jobUrl !== undefined) data.jobUrl = input.jobUrl;
    if (input.status !== undefined) data.status = input.status;
    if (input.source !== undefined) data.source = input.source;
    if (input.salaryRange !== undefined) data.salaryRange = input.salaryRange;
    if (input.location !== undefined) data.location = input.location;
    if (input.notes !== undefined) data.notes = input.notes;

    return this.prisma.jobApplication.updateMany({
      where: { id, userId },
      data,
    });
  }

  async remove(id: string, userId: string) {
    await this.prisma.jobApplication.deleteMany({
      where: { id, userId },
    });
    return true;
  }

  async removeAll(userId: string) {
    const result = await this.prisma.jobApplication.deleteMany({
      where: { userId },
    });
    return result.count;
  }

  async bulkImport(userId: string, jobs: CreateJobInput[]) {
    let imported = 0;
    let skipped = 0;

    for (const job of jobs) {
      if (job.sourceUrl) {
        const existing = await this.prisma.jobApplication.findFirst({
          where: { userId, sourceUrl: job.sourceUrl },
          select: { id: true },
        });
        if (existing) {
          skipped++;
          continue;
        }
      }

      try {
        await this.create(userId, job);
        imported++;
      } catch {
        skipped++;
      }
    }

    return { imported, skipped };
  }

  async getFunnelAnalytics(userId: string) {
    const counts = await this.prisma.jobApplication.groupBy({
      by: ['status'],
      where: { userId },
      _count: true,
    });

    const result: Record<string, number> = {};
    for (const c of counts) {
      result[c.status] = c._count;
    }

    return {
      saved: result.SAVED || 0,
      applied: result.APPLIED || 0,
      phoneScreen: result.PHONE_SCREEN || 0,
      technical: result.TECHNICAL || 0,
      onsite: result.ONSITE || 0,
      offer: result.OFFER || 0,
      rejected: result.REJECTED || 0,
      accepted: result.ACCEPTED || 0,
    };
  }

  async getMonthlyStats(userId: string, from: Date, to: Date) {
    const jobs = await this.prisma.jobApplication.findMany({
      where: {
        userId,
        createdAt: { gte: from, lte: to },
      },
      select: { createdAt: true, status: true },
      orderBy: { createdAt: 'asc' },
    });

    const monthlyMap = new Map<string, { applications: number; interviews: number }>();

    for (const job of jobs) {
      const month = job.createdAt.toISOString().slice(0, 7);
      const entry = monthlyMap.get(month) || { applications: 0, interviews: 0 };
      entry.applications++;
      if ([JobStatus.PHONE_SCREEN, JobStatus.TECHNICAL, JobStatus.ONSITE].includes(job.status as JobStatus)) {
        entry.interviews++;
      }
      monthlyMap.set(month, entry);
    }

    return Array.from(monthlyMap.entries()).map(([month, stats]) => ({
      month,
      applications: stats.applications,
      interviews: stats.interviews,
    }));
  }
}
