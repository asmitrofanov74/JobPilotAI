import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { JobsService } from '../jobs/jobs.service';
import { AiService } from '../ai/ai.service';
import { InterviewsService } from '../interviews/interviews.service';
import { EnglishInterviewPracticeService } from '../interviews/english-interview-practice.service';
import { CareerFrenchCoachService } from '../french-coach/career-french-coach.service';
import { JobStatus, ApplicationSource } from '../jobs/dto/jobs.types';
import { InterviewTypeEnum } from '../interviews/dto/interviews.types';
import { RunApplicationPipelineInput, PracticeLanguage } from './dto/pipeline.input';

@Injectable()
export class PipelineService {
  private readonly logger = new Logger(PipelineService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jobsService: JobsService,
    private readonly aiService: AiService,
    private readonly interviewsService: InterviewsService,
    private readonly englishPracticeService: EnglishInterviewPracticeService,
    private readonly careerFrenchCoachService: CareerFrenchCoachService,
  ) {}

  async runApplicationPipeline(userId: string, input: RunApplicationPipelineInput) {
    if (!input.jobId && !input.scrapedJob) {
      throw new BadRequestException('Provide either jobId or a vacancy');
    }

    // 1. Resolve or create the job application
    let job;
    let created = false;
    if (input.jobId) {
      job = await this.jobsService.findOne(input.jobId, userId);
      if (!job) throw new NotFoundException('Job application not found');
    } else {
      const vacancy = input.scrapedJob!;
      const existing = vacancy.sourceUrl
        ? await this.prisma.jobApplication.findFirst({
            where: { userId, sourceUrl: vacancy.sourceUrl },
            select: { id: true },
          })
        : null;
      if (existing) {
        job = await this.jobsService.findOne(existing.id, userId);
      } else {
        job = await this.jobsService.create(userId, {
          ...vacancy,
          status: JobStatus.SAVED,
          source: vacancy.source ?? ApplicationSource.SCRAPED,
        });
        created = true;
      }
    }

    if (!job) throw new NotFoundException('Job application not found');

    const jobDescription =
      job.jobDescription || `${job.jobTitle} at ${job.companyName}`;

    // 2. Generate and persist a cover letter for the job
    const { coverLetter } = await this.aiService.generateCoverLetter(userId, {
      jobTitle: job.jobTitle,
      companyName: job.companyName,
      jobDescription,
      tone: input.tone || 'professional',
    });

    // 3. Analyze the skill gap and persist the report
    let skillGap = null;
    if (input.includeSkillGap !== false) {
      const userSkills = input.userSkills?.trim()
        ? input.userSkills.trim()
        : await this.defaultUserSkills(userId);
      const result = await this.aiService.analyzeSkillGap(userId, {
        jobTitle: job.jobTitle,
        companyName: job.companyName,
        jobDescription,
        userSkills,
      });
      skillGap = result.report;
    }

    // 4. Mark the job as applied
    await this.jobsService.update(job.id, userId, { status: JobStatus.APPLIED });

    // 5. Schedule the interview
    const interview = await this.interviewsService.create(userId, {
      jobApplicationId: job.id,
      type: input.interviewType || InterviewTypeEnum.PHONE,
      scheduledAt: input.scheduledAt,
      round: 1,
    });

    // 6. Generate a ready-to-practice interview session for this job
    const questionCount = input.questionCount ?? 5;
    let practice = null;
    try {
      if (input.practiceLanguage === PracticeLanguage.FRENCH) {
        const result = await this.careerFrenchCoachService.generateCareerInterviewQuestions(
          userId,
          job.id,
          undefined,
          job.jobTitle,
          questionCount,
        );
        practice = {
          id: result.interview.id,
          language: PracticeLanguage.FRENCH,
          scenario: result.interview.scenario,
          questionCount: result.interview.questionCount,
        };
      } else {
        const result = await this.englishPracticeService.generateQuestions(
          userId,
          'custom_job',
          questionCount,
          jobDescription,
        );
        practice = {
          id: result.interview.id,
          language: PracticeLanguage.ENGLISH,
          scenario: result.interview.scenario,
          questionCount: result.interview.questionCount,
        };
      }
    } catch (e) {
      this.logger.warn(`Practice generation failed: ${(e as Error).message}`);
    }

    this.logger.log(
      `Pipeline completed: job=${job.id}${created ? ' (created)' : ''} coverLetter=${coverLetter.id} interview=${interview.id} practice=${practice?.id ?? 'none'}`,
    );

    return {
      job,
      coverLetter,
      skillGapReport: skillGap,
      interview,
      practice,
    };
  }

  private async defaultUserSkills(userId: string): Promise<string> {
    const resume = await this.prisma.resume.findFirst({
      where: { userId },
      orderBy: [{ isPrimary: 'desc' }, { createdAt: 'desc' }],
      select: { parsedSkills: true },
    });
    if (resume?.parsedSkills) return resume.parsedSkills;
    const profile = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { experienceLevel: true, targetRole: true },
    });
    const parts = [profile?.targetRole, profile?.experienceLevel].filter(Boolean);
    return parts.length ? parts.join(', ') : 'General professional skills';
  }
}