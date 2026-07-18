import { Injectable, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { OpenRouterProvider } from '../ai/providers/openrouter.provider';
import {
  AnalyzeProfileInput,
  GenerateHeadlineInput,
  GenerateAboutInput,
  OptimizeExperienceInput,
  CompareResumeInput,
  AnalyzeVisibilityInput,
} from './dto/linkedin-optimizer.input';

const SYSTEM_PROFILE_ANALYSIS = `You are a LinkedIn profile analyst. Analyze the provided profile information and return a JSON object with: overallScore (0-100), strengths (array of strings), weaknesses (array of strings), recommendations (array of {priority: string, action: string, impact: string}), sectionScores (object with headline, about, experience, skills, recommendations as 0-100 scores), and keywordAnalysis (object with topKeywords array, missingKeywords array, keywordDensity number).`;

const SYSTEM_HEADLINE = `You are a LinkedIn headline expert. Create compelling, keyword-rich professional headlines that attract recruiters and hiring managers. Return a JSON object with: headlines (array of 5 headline objects each with {text, rationale, targetKeywords}), bestHeadline (string), and seoTips (array of strings).`;

const SYSTEM_ABOUT = `You are a LinkedIn profile writer specializing in About sections. Write compelling professional stories that showcase expertise, achievements, and value proposition. Return a JSON object with: aboutSections (array of 3 about section objects each with {content, style, targetAudience}), bestSection (string), and writingTips (array of strings).`;

const SYSTEM_EXPERIENCE = `You are a LinkedIn experience optimizer. Rewrite work experience descriptions using strong action verbs, quantified achievements, and impact-focused language optimized for recruiter search. Return a JSON object with: optimizedEntries (array of {company, role, originalDescription, optimizedDescription, keyChanges array}), and overallTips (array of strings).`;

const SYSTEM_RESUME_COMPARISON = `You are a career document consistency analyst. Compare a resume with LinkedIn profile data to identify discrepancies, gaps, and opportunities for alignment. Return a JSON object with: consistencyScore (0-100), discrepancies (array of {field, resumeValue, linkedinValue, severity, recommendation}), gaps (array of {area, description, recommendation}), strengths (array of strings), and prioritizedActions (array of {action, impact, effort}).`;

const SYSTEM_VISIBILITY = `You are a LinkedIn SEO and recruiter visibility expert. Analyze profile elements for discoverability in recruiter searches and return a JSON object with: visibilityScore (0-100), keywordCoverage (object with present, missing, density), searchRank (string estimate), recruiterAppeal (object with score, strengths, improvements), competitorComparison (array of {aspect, yourProfile, industryStandard, gap}), and actionPlan (array of {priority, action, expectedImpact, timeframe}).`;

@Injectable()
export class LinkedinOptimizerService {
  private readonly logger = new Logger(LinkedinOptimizerService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly provider: OpenRouterProvider,
  ) {}

  async analyzeProfile(userId: string, input: AnalyzeProfileInput) {
    const { content: raw } = await this.provider.chat({
      model: 'openrouter/free',
      messages: [
        { role: 'system', content: SYSTEM_PROFILE_ANALYSIS },
        {
          role: 'user',
          content: `Profile URL: ${input.profileUrl || 'N/A'}\nHeadline: ${input.headline || 'N/A'}\nAbout: ${input.about || 'N/A'}\nCurrent Role: ${input.currentRole || 'N/A'}\nCurrent Company: ${input.currentCompany || 'N/A'}\nIndustry: ${input.industry || 'N/A'}\nLocation: ${input.location || 'N/A'}\nExperience Level: ${input.experienceLevel || 'N/A'}\nSkills: ${(input.skills || []).join(', ') || 'N/A'}`,
        },
      ],
      temperature: 0.5,
      max_tokens: 2000,
      response_format: { type: 'json_object' },
    });

    const parsed = JSON.parse(raw);

    const optimization = await this.prisma.linkedinOptimization.create({
      data: {
        type: 'profile_analysis',
        inputData: input as unknown as Prisma.InputJsonValue,
        outputData: parsed,
        userId,
      },
    });

    return { optimization, output: parsed };
  }

  async generateHeadlines(userId: string, input: GenerateHeadlineInput) {
    const { content: raw } = await this.provider.chat({
      model: 'openrouter/free',
      messages: [
        { role: 'system', content: SYSTEM_HEADLINE },
        {
          role: 'user',
          content: `Target Role: ${input.targetRole}\nCurrent Role: ${input.currentRole}\nSkills: ${input.skills.join(', ')}\nIndustry: ${input.industry}\nExperience Level: ${input.experienceLevel || 'N/A'}\nCurrent Headline: ${input.currentHeadline || 'N/A'}\nTone: ${input.tone || 'professional'}`,
        },
      ],
      temperature: 0.7,
      max_tokens: 1500,
      response_format: { type: 'json_object' },
    });

    const parsed = JSON.parse(raw);

    const optimization = await this.prisma.linkedinOptimization.create({
      data: {
        type: 'headline',
        inputData: input as unknown as Prisma.InputJsonValue,
        outputData: parsed,
        userId,
      },
    });

    return { optimization, output: parsed };
  }

  async generateAbout(userId: string, input: GenerateAboutInput) {
    const { content: raw } = await this.provider.chat({
      model: 'openrouter/free',
      messages: [
        { role: 'system', content: SYSTEM_ABOUT },
        {
          role: 'user',
          content: `Target Role: ${input.targetRole}\nIndustry: ${input.industry}\nKey Achievements: ${input.keyAchievements.join(', ')}\nSkills: ${input.skills.join(', ')}\nCurrent About: ${input.currentAbout || 'N/A'}\nExperience Years: ${input.experienceYears || 'N/A'}\nTone: ${input.tone || 'professional'}`,
        },
      ],
      temperature: 0.7,
      max_tokens: 2000,
      response_format: { type: 'json_object' },
    });

    const parsed = JSON.parse(raw);

    const optimization = await this.prisma.linkedinOptimization.create({
      data: {
        type: 'about',
        inputData: input as unknown as Prisma.InputJsonValue,
        outputData: parsed,
        userId,
      },
    });

    return { optimization, output: parsed };
  }

  async optimizeExperience(userId: string, input: OptimizeExperienceInput) {
    const entriesText = input.entries
      .map(
        (e, i) =>
          `Entry ${i + 1}:\nCompany: ${e.company}\nRole: ${e.role}\nDuration: ${e.duration || 'N/A'}\nDescription: ${e.description}\nAchievements: ${(e.achievements || []).join(', ')}`,
      )
      .join('\n\n');

    const { content: raw } = await this.provider.chat({
      model: 'openrouter/free',
      messages: [
        { role: 'system', content: SYSTEM_EXPERIENCE },
        {
          role: 'user',
          content: `Industry: ${input.industry || 'N/A'}\nTone: ${input.tone || 'professional'}\n\nExperience Entries:\n${entriesText}`,
        },
      ],
      temperature: 0.6,
      max_tokens: 2500,
      response_format: { type: 'json_object' },
    });

    const parsed = JSON.parse(raw);

    const optimization = await this.prisma.linkedinOptimization.create({
      data: {
        type: 'experience_optimizer',
        inputData: input as unknown as Prisma.InputJsonValue,
        outputData: parsed,
        userId,
      },
    });

    return { optimization, output: parsed };
  }

  async compareResume(userId: string, input: CompareResumeInput) {
    const resume = await this.prisma.resume.findFirst({
      where: { id: input.resumeId, userId },
    });

    if (!resume) {
      throw new Error('Resume not found');
    }

    const { content: raw } = await this.provider.chat({
      model: 'openrouter/free',
      messages: [
        { role: 'system', content: SYSTEM_RESUME_COMPARISON },
        {
          role: 'user',
          content: `Resume Title: ${resume.title}\nResume Skills: ${resume.parsedSkills || 'N/A'}\nResume Experience: ${resume.parsedExperience || 'N/A'}\nResume Education: ${resume.parsedEducation || 'N/A'}\n\nLinkedIn Data:\nSkills: ${(input.linkedinSkills || []).join(', ')}\nHeadline: ${input.linkedinHeadline || 'N/A'}\nAbout: ${input.linkedinAbout || 'N/A'}\nExperience: ${(input.linkedinExperience || []).join(' | ')}`,
        },
      ],
      temperature: 0.5,
      max_tokens: 2000,
      response_format: { type: 'json_object' },
    });

    const parsed = JSON.parse(raw);

    const optimization = await this.prisma.linkedinOptimization.create({
      data: {
        type: 'resume_comparison',
        inputData: { ...input, resumeTitle: resume.title } as unknown as Prisma.InputJsonValue,
        outputData: parsed,
        userId,
      },
    });

    return { optimization, output: parsed };
  }

  async analyzeVisibility(userId: string, input: AnalyzeVisibilityInput) {
    const { content: raw } = await this.provider.chat({
      model: 'openrouter/free',
      messages: [
        { role: 'system', content: SYSTEM_VISIBILITY },
        {
          role: 'user',
          content: `Headline: ${input.headline}\nAbout: ${input.about}\nSkills: ${input.skills.join(', ')}\nTarget Roles: ${input.targetRoles.join(', ')}\nTarget Locations: ${(input.targetLocations || []).join(', ') || 'N/A'}\nIndustry: ${input.industry || 'N/A'}\nExperience Level: ${input.experienceLevel || 'N/A'}`,
        },
      ],
      temperature: 0.5,
      max_tokens: 2000,
      response_format: { type: 'json_object' },
    });

    const parsed = JSON.parse(raw);

    const optimization = await this.prisma.linkedinOptimization.create({
      data: {
        type: 'visibility_analysis',
        inputData: input as unknown as Prisma.InputJsonValue,
        outputData: parsed,
        userId,
      },
    });

    return { optimization, output: parsed };
  }

  async findAllByType(userId: string, type?: string) {
    const where: Prisma.LinkedinOptimizationWhereInput = { userId };
    if (type) where.type = type;
    return this.prisma.linkedinOptimization.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string, userId: string) {
    return this.prisma.linkedinOptimization.findFirst({
      where: { id, userId },
    });
  }

  async remove(id: string, userId: string) {
    await this.prisma.linkedinOptimization.deleteMany({
      where: { id, userId },
    });
    return true;
  }
}
