import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import OpenAI from 'openai';
import { GenerateCoverLetterInput, SkillGapInput, InterviewQuestionsInput } from './dto/ai.input';

const SYSTEM_COVER_LETTER = `You are an expert cover letter writer. Create a professional, compelling cover letter based on the given job details and tone preference. Return only the cover letter content as plain text.`;

const SYSTEM_SKILL_GAP = `You are a career analyst. Analyze the gap between the user's skills and the job requirements. Return a JSON object with: requiredSkills (array of {skill, importance}), missingSkills (array of {skill, importance, recommendation}), matchScore (0-100), recommendations (array of strings).`;

const SYSTEM_QUESTIONS = `You are an interview coach. Generate relevant interview questions based on the job description and role. Return a JSON array of {question, type, category, difficulty} objects.`;

@Injectable()
export class AiService {
  private openai: OpenAI | null = null;

  constructor(private readonly prisma: PrismaService) {
    if (process.env.OPENAI_API_KEY) {
      this.openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    }
  }

  private ensureOpenAI() {
    if (!this.openai) {
      throw new Error('OpenAI API key not configured. Set OPENAI_API_KEY environment variable.');
    }
    return this.openai;
  }

  async generateCoverLetter(userId: string, input: GenerateCoverLetterInput) {
    const openai = this.ensureOpenAI();

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
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

    const content = completion.choices[0]?.message?.content || '';

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
    const openai = this.ensureOpenAI();

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
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

    const raw = completion.choices[0]?.message?.content || '{}';
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
    const openai = this.ensureOpenAI();

    const typeInstruction = input.questionType
      ? ` Question type: ${input.questionType}.`
      : '';

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
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

    const raw = completion.choices[0]?.message?.content || '{}';
    const parsed = JSON.parse(raw);
    const questionsData = Array.isArray(parsed) ? parsed : parsed.questions || [];

    const questions = await Promise.all(
      questionsData.map((q: any) =>
        this.prisma.interviewQuestion.create({
          data: {
            question: q.question,
            type: (q.type || input.questionType || 'TECHNICAL') as any,
            category: q.category || null,
            difficulty: q.difficulty || null,
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
