import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { OpenRouterProvider } from '../ai/providers/openrouter.provider';
import { FrenchCoachService } from './french-coach.service';
import { SendFrenchMessageInput } from './dto/french-coach.input';

function normalizeScenario(scenario: string): string {
  return scenario.toLowerCase().replace(/\s+/g, '_');
}

const INTERVIEWER_TAIL = `
Tu es le recruteur qui mène cet entretien d'embauche de bout en bout. Ton rôle n'est pas de répondre à ta place mais de diriger la conversation comme un vrai recruteur :
- Accueille le candidat et pose une question à la fois.
- Réagis naturellement à ce que le candidat dit : rebondis sur ses réponses, montre de l'intérêt, demande des précisions.
- Pose des questions de suivi ("Pouvez-vous m'en dire plus ?", "Comment avez-vous géré cela ?").
- Ne pose JAMAIS deux questions d'un coup.
- Après 5-8 questions complètes, propose naturellement de passer aux questions du candidat, puis remercie-le et mets fin à l'entretien.
- Ne réponds jamais à la place du candidat. Reste en français.
- N'utilise JAMAIS de placeholders comme [Votre Nom], [Nom de la Société] ou [Entreprise]. Utilise un nom fictif réaliste ou évite tout nom.`;

function getScenarioPrompt(scenario: string, variant: string, jobDescription?: string | null): string {
  const isQuebec = variant === 'quebec';
  const key = normalizeScenario(scenario);

  if (key === 'custom_job' && jobDescription) {
    const custom = `Tu es un recruteur ${isQuebec ? 'québécois' : 'français'} professionnel. Tu interviewes un candidat pour le poste suivant :

DESCRIPTION DU POSTE :
${jobDescription}

IMPORTANT : Pose UNE question d'entretien à la fois, directement liée à ce poste et à ses exigences.` + INTERVIEWER_TAIL;
    return isQuebec ? custom.replace('Reste en français.', 'Reste en français québécois authentique.') : custom;
  }

  const FRANCE_PROMPTS: Record<string, string> = {
    job_interview: `Tu es un recruteur français poli et professionnel qui mène un entretien d'embauche.` + INTERVIEWER_TAIL,
    recruiter_call: `Tu es un recruteur français poli qui appelle un candidat pour un premier échange. Décris brièvement le poste (développeur web senior) puis pose une question à la fois.` + INTERVIEWER_TAIL,
    team_meeting: "Tu es un collègue français poli en réunion. Sois naturel, discute des sujets de travail et relance poliment la conversation.",
    daily_standup: "Tu es un collègue français poli en standup quotidien. Demande à chacun son avancement et réagis naturellement.",
    office_conversation: "Tu es un collègue français poli au bureau. Sois chaleureux mais professionnel, parle de la journée, de projets, du café.",
  };

  const QUEBEC_PROMPTS: Record<string, string> = {
    job_interview: `Tu es un recruteur québécois poli et professionnel qui mène un entretien d'embauche.` + INTERVIEWER_TAIL.replace('Reste en français.', 'Reste en français québécois authentique.'),
    recruiter_call: `Tu es un recruteur québécois poli qui appelle un candidat pour un premier échange. Décris brièvement le poste (développeur web senior) puis pose une question à la fois.` + INTERVIEWER_TAIL.replace('Reste en français.', 'Reste en français québécois authentique.'),
    team_meeting: "Tu es un collègue québécois poli en réunion. Sois naturel, discute des sujets de travail et relance poliment la conversation en français québécois standard.",
    daily_standup: "Tu es un collègue québécois poli en standup quotidien. Demande à chacun son avancement et réagis naturellement en français québécois standard.",
    office_conversation: "Tu es un collègue québécois poli au bureau. Sois chaleureux mais professionnel, parle de la journée, de projets, du café, en français québécois standard.",
  };

  const prompts = isQuebec ? QUEBEC_PROMPTS : FRANCE_PROMPTS;
  return prompts[key] ?? prompts.job_interview;
}

const EVALUATION_PROMPT = (variant: string) => {
  const isQuebec = variant === 'quebec';
  return `Tu es un professeur de français expert. Analyse le message de l'étudiant et retourne UNIQUEMENT un objet JSON valide avec ces champs :
- grammarScore (nombre 0-100)
- vocabularyScore (nombre 0-100)
- fluencyScore (nombre 0-100)
- corrections (tableau d'objets avec : original, corrected, explanation)
- improvedVersion (texte complet amélioré)
${isQuebec ? '- quebecAlternative (texte en français québécois ou null si non applicable)' : '- franceAlternative (texte en français de France équivalent, ou null si non applicable)'}

Exemple de format :
{
  "grammarScore": 75,
  "vocabularyScore": 80,
  "fluencyScore": 70,
  "corrections": [
    { "original": "j'ai allé", "corrected": "je suis allé", "explanation": "Le verbe aller utilise l'auxiliaire 'être' au passé composé" }
  ],
  "improvedVersion": "Bonjour, je suis développeur depuis cinq ans.",${isQuebec ? '\n  "quebecAlternative": "Allo, chu développeur depuis cinq ans."' : '\n  "franceAlternative": "Bonjour, je suis développeur depuis cinq ans."'}
}`;
};

function cleanResponse(raw: string): string {
  let text = raw;
  // Remove prompt template leaks
  text = text.replace(/<\|[^|]*\|>/g, '');
  // Remove system prompt leaks
  const leakPatterns = ['IMPORTANT:', 'Tu es un expert', 'Tu es un collègue', 'Tu es un recruteur', 'Tu es un membre', 'Voici la description', 'Ne replies jamais'];
  for (const pattern of leakPatterns) {
    const idx = text.indexOf(pattern);
    if (idx > 0) text = text.substring(0, idx).trim();
  }
  // Remove markdown and quote artifacts
  text = text.replace(/\*\*/g, '').replace(/^["']|["']$/g, '');
  return text.trim();
}

@Injectable()
export class ConversationService {
  private readonly logger = new Logger(ConversationService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly provider: OpenRouterProvider,
    private readonly frenchCoachService: FrenchCoachService,
  ) {}

  async startConversation(userId: string, scenario: string, jobDescription?: string | null) {
    const profile = await this.frenchCoachService.getProfile(userId);

    if (!scenario) {
      throw new BadRequestException('scenario is required');
    }

    const conversation = await this.prisma.frenchConversation.create({
      data: {
        scenario: normalizeScenario(scenario),
        profileId: profile.id,
        jobDescription: jobDescription ?? null,
      },
    });

    const systemPrompt = getScenarioPrompt(conversation.scenario, profile.frenchVariant ?? 'france', conversation.jobDescription);
    const openingPrompt = systemPrompt + '\n\nOuvre l\'entretien maintenant : salue le candidat et pose ta première question en une ou deux phrases. N\'utilise JAMAIS de crochets ou de placeholders comme [Votre Nom] ou [Nom de la Société] : écris un nom fictif ou évite le nom.';

    const { content: rawContent } = await this.provider.chat({
      messages: [{ role: 'system', content: openingPrompt }],
      temperature: 0.7,
      max_tokens: 150,
    });

    const content = cleanResponse(rawContent);

    const assistantMessage = await this.prisma.frenchMessage.create({
      data: { role: 'assistant', content, conversationId: conversation.id },
    });

    return {
      conversationId: conversation.id,
      response: {
        id: assistantMessage.id,
        role: assistantMessage.role,
        content: assistantMessage.content,
        createdAt: assistantMessage.createdAt,
        evaluation: null,
      },
    };
  }

  async sendMessage(userId: string, input: SendFrenchMessageInput) {
    const profile = await this.frenchCoachService.getProfile(userId);

    let conversation: { id: string; scenario: string; jobDescription: string | null; profileId: string; createdAt: Date; updatedAt: Date };

    if (input.conversationId) {
      const existing = await this.prisma.frenchConversation.findFirst({
        where: { id: input.conversationId, profileId: profile.id },
      });

      if (!existing) {
        throw new NotFoundException('Conversation not found');
      }

      conversation = existing;
    } else {
      if (!input.scenario) {
        throw new BadRequestException('scenario is required for new conversations');
      }

      conversation = await this.prisma.frenchConversation.create({
        data: {
          scenario: normalizeScenario(input.scenario),
          profileId: profile.id,
          jobDescription: input.jobDescription ?? null,
        },
      });
    }

    const userMessage = await this.prisma.frenchMessage.create({
      data: { role: 'user', content: input.message, conversationId: conversation.id },
    });

    const history = await this.prisma.frenchMessage.findMany({
      where: { conversationId: conversation.id },
      orderBy: { createdAt: 'asc' },
    });

    const systemPrompt = getScenarioPrompt(conversation.scenario, profile.frenchVariant ?? 'france', conversation.jobDescription);

    const aiMessages: { role: 'system' | 'user' | 'assistant'; content: string }[] = [
      { role: 'system', content: systemPrompt },
      ...history.map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content })),
    ];

    const { content: rawContent } = await this.provider.chat({
      messages: aiMessages,
      temperature: 0.5,
      max_tokens: 200,
    });

    const content = cleanResponse(rawContent);

    const assistantMessage = await this.prisma.frenchMessage.create({
      data: { role: 'assistant', content, conversationId: conversation.id },
    });

    const result = {
      conversationId: conversation.id,
      response: {
        id: assistantMessage.id,
        role: assistantMessage.role,
        content: assistantMessage.content,
        createdAt: assistantMessage.createdAt,
        evaluation: null as {
          id: string;
          grammarScore: number;
          vocabularyScore: number;
          fluencyScore: number;
          corrections: Array<{ original: string; corrected: string; explanation: string }>;
          improvedVersion: string;
          quebecAlternative: string | null;
          createdAt: Date;
        } | null,
      },
    };

    // Evaluate in background — don't block the response
    this.provider.chat({
            messages: [
        { role: 'system', content: EVALUATION_PROMPT(profile.frenchVariant ?? 'france') },
        { role: 'user', content: `Message de l'étudiant : ${input.message}` },
      ],
      temperature: 0.3,
      max_tokens: 500,
      response_format: { type: 'json_object' },
    }).then(async ({ content: evalRaw }) => {
      const parsed = JSON.parse(evalRaw);
      const saved = await this.prisma.frenchEvaluation.create({
        data: {
          grammarScore: parsed.grammarScore,
          vocabularyScore: parsed.vocabularyScore,
          fluencyScore: parsed.fluencyScore,
          corrections: parsed.corrections ?? [],
          improvedVersion: parsed.improvedVersion ?? input.message,
          quebecAlternative: parsed.quebecAlternative ?? null,
          messageId: userMessage.id,
        },
      });
      result.response.evaluation = {
        id: saved.id,
        grammarScore: saved.grammarScore,
        vocabularyScore: saved.vocabularyScore,
        fluencyScore: saved.fluencyScore,
        corrections: (saved.corrections as Array<{ original: string; corrected: string; explanation: string }>) ?? [],
        improvedVersion: saved.improvedVersion,
        quebecAlternative: saved.quebecAlternative,
        createdAt: saved.createdAt,
      };
    }).catch((err) => {
      this.logger.warn(`Failed to evaluate message: ${(err as Error).message}`);
    });

    return result;
  }

  async getConversation(id: string, userId: string) {
    const profile = await this.frenchCoachService.getProfile(userId);

    const conversation = await this.prisma.frenchConversation.findFirst({
      where: { id, profileId: profile.id },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' },
          include: { evaluation: true },
        },
      },
    });

    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }

    return conversation;
  }

  async deleteConversation(id: string, userId: string) {
    const profile = await this.frenchCoachService.getProfile(userId);
    const conversation = await this.prisma.frenchConversation.findFirst({
      where: { id, profileId: profile.id },
    });

    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }

    await this.prisma.frenchConversation.delete({ where: { id } });
  }

  async getConversations(userId: string) {
    const profile = await this.frenchCoachService.getProfile(userId);
    const conversations = await this.prisma.frenchConversation.findMany({
      where: { profileId: profile.id },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' },
          include: { evaluation: true },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });

    return conversations;
  }

  async generateHint(userId: string, conversationId: string): Promise<{ hint: string; keyPoints: string; suggestedResponse: string }> {
    const profile = await this.frenchCoachService.getProfile(userId);

    const conversation = await this.prisma.frenchConversation.findFirst({
      where: { id: conversationId, profileId: profile.id },
      include: {
        messages: { orderBy: { createdAt: 'asc' } },
      },
    });

    if (!conversation) throw new NotFoundException('Conversation not found');

    const recentMessages = conversation.messages.slice(-6);
    const conversationHistory = recentMessages.map((m) => `${m.role === 'user' ? 'Candidat' : 'Interlocuteur'}: ${m.content}`).join('\n');

    const isQuebec = profile.frenchVariant === 'quebec';
    const hintPrompt = isQuebec
      ? `Tu es un coach de conversation bienveillant. L'utilisateur est en train de discuter en français québécois dans une conversation de type "${conversation.scenario}". Il ne sait pas quoi dire ensuite. Donne-lui un indice court et utile.

Retourne UNIQUEMENT un objet JSON valide avec:
- hint (string): un indice en 1 phrase courte et encourageant en français québécois
- keyPoints (string): 2-3 points clés à mentionner, séparés par des puces
- suggestedResponse (string): une réponse suggérée courte (1-2 phrases max) en français québécois`
      : `Tu es un coach de conversation bienveillant. L'utilisateur est en train de discuter en français dans une conversation de type "${conversation.scenario}". Il ne sait pas quoi dire ensuite. Donne-lui un indice court et utile.

Retourne UNIQUEMENT un objet JSON valide avec:
- hint (string): un indice en 1 phrase courte et encourageant en français
- keyPoints (string): 2-3 points clés à mentionner, séparés par des puces
- suggestedResponse (string): une réponse suggérée courte (1-2 phrases max) en français`;

    const { content } = await this.provider.chat({
            messages: [
        { role: 'system', content: hintPrompt },
        { role: 'user', content: `Scénario: ${conversation.scenario}\n${conversation.jobDescription ? `Description du poste: ${conversation.jobDescription}\n` : ''}Historique récent:\n${conversationHistory}\n\nL'utilisateur ne sait pas quoi dire. Donne-lui un indice.` },
      ],
      temperature: 0.5,
      max_tokens: 400,
      response_format: { type: 'json_object' },
    });

    const parsed = JSON.parse(content) as Record<string, unknown>;
    return {
      hint: typeof parsed.hint === 'string' ? parsed.hint : '',
      keyPoints: typeof parsed.keyPoints === 'string' ? parsed.keyPoints : '',
      suggestedResponse: typeof parsed.suggestedResponse === 'string' ? parsed.suggestedResponse : '',
    };
  }
}
