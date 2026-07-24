import { Injectable, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { AIProvider } from './providers/ai-provider.interface';
import { OpenRouterProvider } from './providers/openrouter.provider';
import { GenerateCoverLetterInput, SkillGapInput, InterviewQuestionsInput } from './dto/ai.input';
import { QuestionTypeEnum } from '../interview-questions/dto/interview-questions.types';

const SYSTEM_COVER_LETTER = `You are an expert cover letter writer. Create a professional, compelling cover letter based on the given job details and tone preference. Return only the cover letter content as plain text.`;

const SYSTEM_SKILL_GAP = `You are a career analyst. Analyze the gap between the user's skills and the job requirements. Return a JSON object with: requiredSkills (array of {skill, importance}), missingSkills (array of {skill, importance, recommendation}), matchScore (0-100), recommendations (array of strings).`;

const SYSTEM_QUESTIONS = `You are an interview coach. Generate relevant interview questions based on the job description and role. Return a JSON array of {question, type, category, difficulty} objects.`;

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly provider: OpenRouterProvider,
  ) {}

  private ensureProvider(): AIProvider {
    return this.provider;
  }

  async generateCoverLetter(userId: string, input: GenerateCoverLetterInput) {
    const provider = this.ensureProvider();

    const { content } = await provider.chat({
      model: 'openrouter/free',
      messages: [
        { role: 'system', content: SYSTEM_COVER_LETTER },
        {
          role: 'user',
          content: `Job Title: ${input.jobTitle}\nCompany: ${input.companyName}\nJob Description: ${input.jobDescription}\nTone: ${input.tone || 'professional'}`,
        },
      ],
      temperature: 0.7,
      max_tokens: 1000,
    });

    const coverLetter = await this.prisma.coverLetter.create({
      data: {
        jobTitle: input.jobTitle,
        companyName: input.companyName,
        content,
        tone: input.tone || 'professional',
        jobDescription: input.jobDescription,
        isGenerated: true,
        userId,
      },
    });

    return { coverLetter, content };
  }

  async analyzeSkillGap(userId: string, input: SkillGapInput) {
    const provider = this.ensureProvider();

    const { content: raw } = await provider.chat({
      model: 'openrouter/free',
      messages: [
        { role: 'system', content: SYSTEM_SKILL_GAP },
        {
          role: 'user',
          content: `Job Title: ${input.jobTitle}\nCompany: ${input.companyName}\nJob Description: ${input.jobDescription}\nUser Skills: ${input.userSkills}`,
        },
      ],
      temperature: 0.5,
      max_tokens: 1500,
      response_format: { type: 'json_object' },
    });

    const parsed = JSON.parse(raw);

    const report = await this.prisma.skillGapReport.create({
      data: {
        jobDescription: input.jobDescription,
        jobTitle: input.jobTitle,
        companyName: input.companyName,
        requiredSkills: parsed.requiredSkills || [],
        userSkills: input.userSkills.split(',').map((s: string) => s.trim()),
        missingSkills: parsed.missingSkills || [],
        matchScore: parsed.matchScore || 0,
        recommendations: parsed.recommendations || [],
        userId,
      },
    });

    return {
      report,
      requiredSkills: parsed.requiredSkills || [],
      missingSkills: parsed.missingSkills || [],
      matchScore: parsed.matchScore || 0,
      recommendations: parsed.recommendations || [],
    };
  }

  async generateInterviewQuestions(userId: string, input: InterviewQuestionsInput) {
    const provider = this.ensureProvider();

    const typeInstruction = input.questionType
      ? ` Question type: ${input.questionType}.`
      : '';

    const { content: raw } = await provider.chat({
      model: 'openrouter/free',
      messages: [
        { role: 'system', content: SYSTEM_QUESTIONS },
        {
          role: 'user',
          content: `Role: ${input.role}\nJob Description: ${input.jobDescription}.${typeInstruction}`,
        },
      ],
      temperature: 0.7,
      max_tokens: 2000,
      response_format: { type: 'json_object' },
    });

    const parsed = JSON.parse(raw);
    const questionsData = Array.isArray(parsed) ? parsed : parsed.questions || [];

    const questions = await Promise.all(
      questionsData.map((q: { question: string; type?: string; category?: string; difficulty?: string }) =>
        this.prisma.interviewQuestion.create({
          data: {
            question: q.question,
            type: (q.type || input.questionType || QuestionTypeEnum.TECHNICAL) as QuestionTypeEnum,
            category: q.category || null,
            difficulty: q.difficulty ? Number(q.difficulty) : null,
            source: 'ai',
            isFavorite: false,
            userId,
          },
        }),
      ),
    );

    return { questions };
  }
}
