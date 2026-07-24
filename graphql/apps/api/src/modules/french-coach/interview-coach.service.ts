import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
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

function buildCustomJobPrompt(jobDescription: string): string {
  return `Tu es un recruteur senior. Génère des questions d'entretien en français pour le poste décrit ci-dessous.

Description du poste:
${jobDescription}

Les questions doivent être pertinentes par rapport à ce poste spécifique. Couvre:
- Compétences techniques requises par le poste
- Expérience pertinente
- Compréhension du rôle et du secteur
- Soft skills pertinentes pour ce poste
- Situations de travail réelles liées au poste

Tu dois retourner UN OBJET JSON avec une clé "questions" contenant un tableau. Exemple exact:
{"questions":[{"id":"q1","question":"Question en français?","category":"technical"},{"id":"q2","question":"Autre question?","category":"experience"}]}

Retourne UNIQUEMENT le JSON, pas de texte avant ou après.`;
}

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

const HINT_PROMPT = `Tu es un coach d'entretien bienveillant. L'utilisateur est en train de passer un entretien en français et ne sait pas quoi répondre à une question. Tu dois lui donner un indice pour l'aider à formuler sa réponse.

Retourne UNIQUEMENT un objet JSON valide avec:
- hint (string): un indice court et encourageant en français pour orienter la réponse
- keyPoints (string): les points clés à mentionner dans la réponse, séparés par des puces
- exampleAnswer (string): un exemple de réponse en français que le candidat pourrait adapter

Exemple:
{
  "hint": "Pense à tes expériences concrètes avec les tests...",
  "keyPoints": "• Utilisation de Jest ou Cypress\\n• Taux de couverture visé\\n• Tests unitaires vs tests d'intégration",
  "exampleAnswer": "Dans mon précédent poste, j'ai mis en place une stratégie de tests avec Jest pour les composants React..."
}`;

export interface InterviewResult {
  id: string;
  scenario: string;
  jobDescription: string | null;
  questionCount: number;
  status: string;
  questions: GeneratedQuestion[];
  answers: InterviewAnswer[];
  evaluations: InterviewEvaluation[];
  overallScore: number | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface InterviewAnswer {
  questionId: string;
  answer: string;
}

export interface InterviewEvaluation {
  questionId: string;
  grammarScore: number;
  confidenceScore: number;
  technicalScore: number;
  feedback: string;
  improvedAnswer: string;
  corrections: Array<{ original: string; corrected: string; explanation: string }>;
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

export interface HintResult {
  hint: string;
  keyPoints: string;
  exampleAnswer: string;
}

@Injectable()
export class InterviewCoachService {
  private readonly logger = new Logger(InterviewCoachService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly provider: OpenRouterProvider,
    private readonly frenchCoachService: FrenchCoachService,
  ) {}

  async generateQuestions(userId: string, scenario: string, count: number = 5, jobDescription?: string): Promise<{ questions: GeneratedQuestion[]; interview: InterviewResult }> {
    const profile = await this.frenchCoachService.getProfile(userId);

    let basePrompt: string;
    if (scenario === 'custom_job' && jobDescription) {
      basePrompt = buildCustomJobPrompt(jobDescription);
    } else {
      basePrompt = SCENARIO_PROMPTS[scenario] ?? SCENARIO_PROMPTS.frontend_developer;
    }

    const variantInstruction = profile.frenchVariant === 'quebec'
      ? ` IMPORTANT : Les questions doivent être en français québécois authentique. Utilise des expressions et formulations naturelles du Québec.`
      : '';
    const prompt = basePrompt + variantInstruction;

    const { content } = await this.provider.chat({
            messages: [
        { role: 'system', content: prompt },
        { role: 'user', content: `Génère ${count} questions d'entretien en français pour ce poste.` },
      ],
      temperature: 0.7,
      max_tokens: 1500,
      response_format: { type: 'json_object' },
    });

    const parsed: unknown = JSON.parse(content);
    let rawQuestions: unknown[];
    if (Array.isArray(parsed)) {
      rawQuestions = parsed;
    } else if (parsed && typeof parsed === 'object' && 'questions' in parsed && Array.isArray((parsed as Record<string, unknown>).questions)) {
      rawQuestions = (parsed as Record<string, unknown>).questions as unknown[];
    } else if (parsed && typeof parsed === 'object') {
      const values = Object.values(parsed as Record<string, unknown>).filter(Array.isArray);
      rawQuestions = values.length > 0 ? (values[0] as unknown[]) : [parsed];
    } else {
      rawQuestions = [];
    }
    const questions: GeneratedQuestion[] = rawQuestions.slice(0, count).map((q: unknown, i: number) => {
      const obj = q && typeof q === 'object' ? (q as Record<string, unknown>) : {};
      return {
        id: (typeof obj.id === 'string' ? obj.id : null) || `q${i + 1}`,
        question: (typeof obj.question === 'string' ? obj.question : null) || String(q),
        category: (typeof obj.category === 'string' ? obj.category : null) || 'experience',
      };
    });

    const interview = await this.prisma.frenchInterview.create({
      data: {
        scenario,
        jobDescription: jobDescription ?? null,
        questionCount: questions.length,
        status: 'in_progress',
        questions: questions as unknown as Prisma.InputJsonValue,
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

    const questions = interview.questions as unknown as GeneratedQuestion[];
    const question = questions.find((q) => q.id === questionId);
    if (!question) throw new NotFoundException('Question not found in this interview');

    const variantEvalPrompt = profile.frenchVariant === 'quebec'
      ? EVALUATE_PROMPT + `\n\nIMPORTANT : Évalue en tenant compte du français québécois. Les expressions québécoises sont acceptables. Inclus la version France-France dans improvedAnswer si pertinent.`
      : EVALUATE_PROMPT;
    const evalPrompt = `Question d'entretien: "${question.question}"\n\nRéponse du candidat: "${answer}"\n\nÉvalue cette réponse.`;

    const { content } = await this.provider.chat({
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

    const answers: InterviewAnswer[] = [...((interview.answers as unknown as InterviewAnswer[]) ?? []), { questionId, answer }];
    const evaluations: InterviewEvaluation[] = [...((interview.evaluations as unknown as InterviewEvaluation[]) ?? []), { questionId, ...evaluation }];

    const allScores = evaluations.map((e) => (e.grammarScore + e.confidenceScore + e.technicalScore) / 3);
    const overallScore = Math.round(allScores.reduce((a: number, b: number) => a + b, 0) / allScores.length);

    const answeredCount = answers.length;
    const status = answeredCount >= (interview.questionCount ?? 0) ? 'completed' : 'in_progress';

    const updated = await this.prisma.frenchInterview.update({
      where: { id: interviewId },
      data: { answers: answers as unknown as Prisma.InputJsonValue, evaluations: evaluations as unknown as Prisma.InputJsonValue, overallScore, status },
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

  async generateHint(userId: string, interviewId: string, questionId: string): Promise<HintResult> {
    const profile = await this.frenchCoachService.getProfile(userId);
    const interview = await this.prisma.frenchInterview.findFirst({
      where: { id: interviewId, profileId: profile.id },
    });
    if (!interview) throw new NotFoundException('Interview not found');

    const questions = interview.questions as unknown as GeneratedQuestion[];
    const question = questions.find((q) => q.id === questionId);
    if (!question) throw new NotFoundException('Question not found in this interview');

    const variantInstruction = profile.frenchVariant === 'quebec'
      ? `\n\nIMPORTANT : Donne l'indice en français québécois. Les expressions québécoises sont encouragées.`
      : '';
    const prompt = HINT_PROMPT + variantInstruction;

    const { content } = await this.provider.chat({
            messages: [
        { role: 'system', content: prompt },
        { role: 'user', content: `Question d'entretien: "${question.question}"\n\nCatégorie: ${question.category}\n\nL'utilisateur ne sait pas quoi répondre. Donne-lui un indice.` },
      ],
      temperature: 0.5,
      max_tokens: 800,
      response_format: { type: 'json_object' },
    });

    const parsed = JSON.parse(content) as Record<string, unknown>;
    return {
      hint: typeof parsed.hint === 'string' ? parsed.hint : '',
      keyPoints: typeof parsed.keyPoints === 'string' ? parsed.keyPoints : '',
      exampleAnswer: typeof parsed.exampleAnswer === 'string' ? parsed.exampleAnswer : '',
    };
  }

  private mapInterview(i: {
    id: string;
    scenario: string;
    jobDescription: string | null;
    questionCount: number;
    status: string;
    questions: Prisma.JsonValue;
    answers: Prisma.JsonValue;
    evaluations: Prisma.JsonValue;
    overallScore: number | null;
    createdAt: Date;
    updatedAt: Date;
  }): InterviewResult {
    return {
      id: i.id,
      scenario: i.scenario,
      jobDescription: i.jobDescription ?? null,
      questionCount: i.questionCount,
      status: i.status,
      questions: (i.questions as unknown as GeneratedQuestion[]) ?? [],
      answers: (i.answers as unknown as InterviewAnswer[]) ?? [],
      evaluations: (i.evaluations as unknown as InterviewEvaluation[]) ?? [],
      overallScore: i.overallScore,
      createdAt: i.createdAt,
      updatedAt: i.updatedAt,
    };
  }
}
