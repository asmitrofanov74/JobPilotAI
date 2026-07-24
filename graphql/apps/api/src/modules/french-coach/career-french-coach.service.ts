import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { OpenRouterProvider } from '../ai/providers/openrouter.provider';
import { FrenchCoachService } from './french-coach.service';
import { ConversationService } from './conversation.service';
import { ResumesService } from '../resumes/resumes.service';
import { JobsService } from '../jobs/jobs.service';
import { InterviewCoachService } from './interview-coach.service';

@Injectable()
export class CareerFrenchCoachService {
  private readonly logger = new Logger(CareerFrenchCoachService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly provider: OpenRouterProvider,
    private readonly frenchCoachService: FrenchCoachService,
    private readonly resumesService: ResumesService,
    private readonly jobsService: JobsService,
    private readonly conversationService: ConversationService,
    private readonly interviewCoachService: InterviewCoachService,
  ) {}

  async generateCareerInterviewQuestions(
    userId: string,
    jobApplicationId?: string,
    resumeId?: string,
    targetRole?: string,
    questionCount: number = 5,
  ) {
    const profile = await this.frenchCoachService.getProfile(userId);

    const role = targetRole || profile.targetRole || 'developpeur';
    const job = jobApplicationId ? await this.jobsService.findOne(jobApplicationId, userId) : null;
    const resume = resumeId ? await this.resumesService.findOne(resumeId, userId) : null;
    const primaryResume = resume || (await this.findPrimaryResume(userId));

    const resumeContext = this.buildResumeContext(primaryResume);
    const jobContext = this.buildJobContext(job);

    const variantInstruction = profile.frenchVariant === 'quebec'
      ? ' IMPORTANT : Les questions doivent être en français québécois authentique avec des expressions naturelles du Québec.'
      : '';

    const prompt = `Tu es un recruteur senior spécialisé dans le recrutement de profils "${role}". Génère des questions d'entretien en français pour ce poste.

Contexte du candidat:
${resumeContext || '- Pas de CV disponible'}

Contexte du poste:
${jobContext || '- Pas de description de poste spécifique'}

Les questions doivent être personnalisées en fonction du profil du candidat et des exigences du poste.
Couvre des sujets techniques, d'expérience, de résolution de problèmes et de compétences générales.

Retourne UNIQUEMENT un tableau JSON valide d'objets avec:
- id (string, ex: "q1")
- question (string, la question en français)
- category (string: "technical", "experience", "problem_solving", "soft_skills")` + variantInstruction;

    const { content } = await this.provider.chat({
            messages: [
        { role: 'system', content: prompt },
        { role: 'user', content: `Génère ${questionCount} questions d'entretien personnalisées en français pour un poste de ${role}.` },
      ],
      temperature: 0.7,
      max_tokens: 1500,
      response_format: { type: 'json_object' },
    });

    const parsed = JSON.parse(content);
    const questions = (Array.isArray(parsed) ? parsed : parsed.questions ?? []).slice(0, questionCount);

    const interview = await this.prisma.frenchInterview.create({
      data: {
        scenario: `career:${role}${job ? ` @ ${job.companyName}` : ''}`,
        questionCount: questions.length,
        status: 'in_progress',
        questions: questions as unknown as Prisma.InputJsonValue,
        profileId: profile.id,
      },
    });

    return { questions, interview: this.interviewCoachService['mapInterview'](interview) };
  }

  async generateCareerConversation(
    userId: string,
    jobApplicationId?: string,
    scenario?: string,
  ) {
    const profile = await this.frenchCoachService.getProfile(userId);
    let job: { companyName: string; jobTitle: string; jobDescription: string | null; location: string | null; salaryRange: string | null } | null = null;

    if (jobApplicationId) {
      job = await this.jobsService.findOne(jobApplicationId, userId);
      if (!job) throw new NotFoundException('Job application not found');
    }

    const company = job?.companyName || 'une entreprise';
    const title = job?.jobTitle || scenario || 'un poste';
    const description = job?.jobDescription || '';
    const scenarioKey = `career:${title} @ ${company}`;

    const variantInstruction = profile.frenchVariant === 'quebec'
      ? ' Utilise des expressions québécoises authentiques.'
      : '';

    const systemPrompt = `Tu es un recruteur professionnel de l'entreprise "${company}" qui recrute pour le poste de "${title}". Tu mènes un entretien d'embauche en français avec un candidat.
      
Détails du poste:
${description ? `Description: ${description}` : 'Pas de description spécifique disponible'}

Pose des questions pertinentes sur l'expérience du candidat, ses compétences et son parcours en lien avec ce poste spécifique chez ${company}.
Commence par te présenter et expliquer le contexte de l'entretien.
Toutes tes réponses doivent être en français.${variantInstruction}`;

    const conversation = await this.prisma.frenchConversation.create({
      data: { scenario: scenarioKey, profileId: profile.id },
    });

    const { content } = await this.provider.chat({
            messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `Je suis candidat pour le poste de ${title} chez ${company}. Commençons l'entretien.` },
      ],
      temperature: 0.7,
      max_tokens: 500,
    });

    const aiMessage = await this.prisma.frenchMessage.create({
      data: { role: 'assistant', content, conversationId: conversation.id },
    });

    return {
      conversationId: conversation.id,
      response: {
        id: aiMessage.id,
        role: aiMessage.role,
        content: aiMessage.content,
        createdAt: aiMessage.createdAt,
        evaluation: null,
      },
    };
  }

  async getCareerSuggestions(userId: string) {
    const jobs = await this.prisma.jobApplication.findMany({
      where: { userId },
      select: { id: true, companyName: true, jobTitle: true, jobDescription: true, status: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    return jobs.map((j) => ({
      jobApplicationId: j.id,
      companyName: j.companyName,
      jobTitle: j.jobTitle,
      hasDescription: !!j.jobDescription,
      status: j.status,
    }));
  }

  private async findPrimaryResume(userId: string) {
    const resumes = await this.prisma.resume.findMany({
      where: { userId },
      orderBy: [{ isPrimary: 'desc' }, { createdAt: 'desc' }],
      take: 1,
    });
    return resumes[0] || null;
  }

  private buildResumeContext(resume: { parsedSkills: string | null; parsedExperience: string | null; parsedEducation: string | null } | null): string {
    if (!resume) return '';
    const parts: string[] = [];
    if (resume.parsedSkills) parts.push(`Compétences: ${resume.parsedSkills}`);
    if (resume.parsedExperience) parts.push(`Expérience: ${resume.parsedExperience}`);
    if (resume.parsedEducation) parts.push(`Formation: ${resume.parsedEducation}`);
    return parts.join('\n');
  }

  private buildJobContext(job: { companyName: string; jobTitle: string; jobDescription: string | null; location: string | null; salaryRange: string | null } | null): string {
    if (!job) return '';
    const parts: string[] = [];
    parts.push(`Entreprise: ${job.companyName}`);
    parts.push(`Titre: ${job.jobTitle}`);
    if (job.jobDescription) parts.push(`Description: ${job.jobDescription}`);
    if (job.location) parts.push(`Localisation: ${job.location}`);
    if (job.salaryRange) parts.push(`Salaire: ${job.salaryRange}`);
    return parts.join('\n');
  }
}
