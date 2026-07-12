import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { OpenRouterProvider } from '../ai/providers/openrouter.provider';
import { FrenchCoachService } from './french-coach.service';

const SCENARIO_PROMPTS: Record<string, string> = {
  frontend_developer: `Tu es un recruteur senior spécialisé en développement frontend. Génère des questions d'entretien en français pour un poste de développeur frontend.

Les questions doivent couvrir:
- Frameworks frontend (React, Vue, Angular)
- CSS et responsive design
- Performance web et accessibilité
- Architecture frontend et patterns
- Tests et qualité de code

Retourne UNIQUEMENT un tableau JSON valide d'objets avec:
- id (string, ex: "q1")
- question (string, la question en français)
- category (string: "technical", "experience", "problem_solving", "soft_skills")`,

  full_stack_developer: `Tu es un recruteur senior spécialisé en développement full stack. Génère des questions d'entretien en français pour un poste de développeur full stack.

Les questions doivent couvrir:
- Architecture backend et API
- Bases de données et modélisation
- Frontend et expérience utilisateur
- DevOps et déploiement
- Architecture logicielle et design patterns
- Tests et qualité de code

Retourne UNIQUEMENT un tableau JSON valide d'objets avec:
- id (string, ex: "q1")
- question (string, la question en français)
- category (string: "technical", "experience", "problem_solving", "soft_skills")`,

  team_lead: `Tu es un recruteur senior spécialisé en management technique. Génère des questions d'entretien en français pour un poste de team lead / chef d'équipe technique.

Les questions doivent couvrir:
- Gestion d'équipe et leadership
- Planification et priorisation
- Code review et qualité
- Mentorat et développement d'équipe
- Communication avec les parties prenantes
- Gestion de conflits et prise de décisions

Retourne UNIQUEMENT un tableau JSON valide d'objets avec:
- id (string, ex: "q1")
- question (string, la question en français)
- category (string: "technical", "experience", "problem_solving", "soft_skills")`,
};

const EVALUATE_PROMPT = `Tu es un recruteur technique expert qui évalue des réponses à des questions d'entretien en français.

Évalue la réponse du candidat et retourne UNIQUEMENT un objet JSON valide avec:
- grammarScore (nombre 0-100): qualité grammaticale du français
- confidenceScore (nombre 0-100): confiance perçue dans la réponse
- technicalScore (nombre 0-100): précision et qualité techniques de la réponse
- feedback (string): retour constructif en français (2-3 phrases)
- improvedAnswer (string): version améliorée de la réponse en français
- corrections (tableau d'objets avec: original, corrected, explanation)

Exemple:
{
  "grammarScore": 75,
  "confidenceScore": 80,
  "technicalScore": 70,
  "feedback": "Bon effort ! Ta réponse montre une bonne compréhension...",
  "improvedAnswer": "Version améliorée de la réponse...",
  "corrections": [
    { "original": "j'ai allé", "corrected": "je suis allé", "explanation": "Le verbe aller utilise l'auxiliaire être" }
  ]
}`;

export interface InterviewResult {
  id: string;
  scenario: string;
  questionCount: number;
  status: string;
  questions: any;
  answers: any;
  evaluations: any;
  overallScore: number | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface GeneratedQuestion {
  id: string;
  question: string;
  category: string;
}

export interface EvaluationResult {
  grammarScore: number;
  confidenceScore: number;
  technicalScore: number;
  feedback: string;
  improvedAnswer: string;
  corrections: Array<{ original: string; corrected: string; explanation: string }>;
}

@Injectable()
export class InterviewCoachService {
  private readonly logger = new Logger(InterviewCoachService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly provider: OpenRouterProvider,
    private readonly frenchCoachService: FrenchCoachService,
  ) {}

  async generateQuestions(userId: string, scenario: string, count: number = 5): Promise<{ questions: GeneratedQuestion[]; interview: InterviewResult }> {
    const profile = await this.frenchCoachService.getProfile(userId);
    const basePrompt = SCENARIO_PROMPTS[scenario] ?? SCENARIO_PROMPTS.frontend_developer;
    const variantInstruction = profile.frenchVariant === 'quebec'
      ? ` IMPORTANT : Les questions doivent être en français québécois authentique. Utilise des expressions et formulations naturelles du Québec.`
      : '';
    const prompt = basePrompt + variantInstruction;

    const { content } = await this.provider.chat({
      model: 'openrouter/free',
      messages: [
        { role: 'system', content: prompt },
        { role: 'user', content: `Génère ${count} questions d'entretien en français pour ce poste.` },
      ],
      temperature: 0.7,
      max_tokens: 1500,
      response_format: { type: 'json_object' },
    });

    const parsed = JSON.parse(content);
    const questions: GeneratedQuestion[] = (Array.isArray(parsed) ? parsed : parsed.questions ?? []).slice(0, count);

    const interview = await this.prisma.frenchInterview.create({
      data: {
        scenario,
        questionCount: questions.length,
        status: 'in_progress',
        questions: questions as any,
        profileId: profile.id,
      },
    });

    return { questions, interview: this.mapInterview(interview) };
  }

  async evaluateAnswer(
    userId: string,
    interviewId: string,
    questionId: string,
    answer: string,
  ): Promise<{ evaluation: EvaluationResult; interview: InterviewResult }> {
    const profile = await this.frenchCoachService.getProfile(userId);
    const interview = await this.prisma.frenchInterview.findFirst({
      where: { id: interviewId, profileId: profile.id },
    });

    if (!interview) throw new NotFoundException('Interview not found');

    const questions = interview.questions as any[];
    const question = questions.find((q: any) => q.id === questionId);
    if (!question) throw new NotFoundException('Question not found in this interview');

    const variantEvalPrompt = profile.frenchVariant === 'quebec'
      ? EVALUATE_PROMPT + `\n\nIMPORTANT : Évalue en tenant compte du français québécois. Les expressions québécoises sont acceptables. Inclus la version France-France dans improvedAnswer si pertinent.`
      : EVALUATE_PROMPT;
    const evalPrompt = `Question d'entretien: "${question.question}"\n\nRéponse du candidat: "${answer}"\n\nÉvalue cette réponse.`;

    const { content } = await this.provider.chat({
      model: 'openrouter/free',
      messages: [
        { role: 'system', content: variantEvalPrompt },
        { role: 'user', content: evalPrompt },
      ],
      temperature: 0.3,
      max_tokens: 1000,
      response_format: { type: 'json_object' },
    });

    const parsed = JSON.parse(content);
    const evaluation: EvaluationResult = {
      grammarScore: parsed.grammarScore ?? 0,
      confidenceScore: parsed.confidenceScore ?? 0,
      technicalScore: parsed.technicalScore ?? 0,
      feedback: parsed.feedback ?? '',
      improvedAnswer: parsed.improvedAnswer ?? answer,
      corrections: parsed.corrections ?? [],
    };

    const answers = [...((interview.answers as any[]) ?? []), { questionId, answer }];
    const evaluations = [...((interview.evaluations as any[]) ?? []), { questionId, ...evaluation }];

    const allScores = evaluations.map((e: any) => (e.grammarScore + e.confidenceScore + e.technicalScore) / 3);
    const overallScore = Math.round(allScores.reduce((a: number, b: number) => a + b, 0) / allScores.length);

    const answeredCount = answers.length;
    const status = answeredCount >= (interview.questionCount ?? 0) ? 'completed' : 'in_progress';

    const updated = await this.prisma.frenchInterview.update({
      where: { id: interviewId },
      data: { answers: answers as any, evaluations: evaluations as any, overallScore, status },
    });

    return { evaluation, interview: this.mapInterview(updated) };
  }

  async getInterviews(userId: string): Promise<InterviewResult[]> {
    const profile = await this.frenchCoachService.getProfile(userId);
    const interviews = await this.prisma.frenchInterview.findMany({
      where: { profileId: profile.id },
      orderBy: { updatedAt: 'desc' },
    });
    return interviews.map((i) => this.mapInterview(i));
  }

  async getInterview(id: string, userId: string): Promise<InterviewResult> {
    const profile = await this.frenchCoachService.getProfile(userId);
    const interview = await this.prisma.frenchInterview.findFirst({
      where: { id, profileId: profile.id },
    });
    if (!interview) throw new NotFoundException('Interview not found');
    return this.mapInterview(interview);
  }

  private mapInterview(i: any): InterviewResult {
    return {
      id: i.id,
      scenario: i.scenario,
      questionCount: i.questionCount,
      status: i.status,
      questions: i.questions,
      answers: i.answers,
      evaluations: i.evaluations,
      overallScore: i.overallScore,
      createdAt: i.createdAt,
      updatedAt: i.updatedAt,
    };
  }
}
