import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { OpenRouterProvider } from '../ai/providers/openrouter.provider';
import { FrenchCoachService } from './french-coach.service';

const CULTURAL_TIP_PROMPT = `Tu es un expert en culture française et québécoise pour le milieu professionnel. Génère un conseil culturel utile pour un apprenant de français qui cherche à travailler dans un environnement francophone.

Retourne UNIQUEMENT un objet JSON valide avec ces champs :
- topic (string, le sujet du conseil, ex: "Les pauses café", "Le vouvoiement", "Les réunions")
- tip (string, le conseil culturel en français, 2-3 phrases)
- translation (string, traduction anglaise du conseil)
- category (string, une de ces catégories : "workplace_etiquette", "communication", "business_culture", "social", "regions")
- region (string, "France" ou "Quebec" ou "Both")

Exemple :
{
  "topic": "Le tutoiement au travail",
  "tip": "Au Québec, le tutoiement est quasi universel en milieu de travail, même avec ton supérieur. En France, utilise toujours 'vous' jusqu'à ce qu'on t'invite à tutoyer.",
  "translation": "In Quebec, using 'tu' is almost universal in the workplace, even with your supervisor. In France, always use 'vous' until invited to use 'tu'.",
  "category": "communication",
  "region": "Both"
}

Sois varié dans tes sujets — ne répète pas les mêmes conseils.`;

const TOPIC_PROMPT = (topic: string) =>
  `Tu es un expert en culture française et québécoise pour le milieu professionnel. 
Génère un conseil culturel sur le sujet spécifique suivant : "${topic}"

Retourne UNIQUEMENT un objet JSON valide avec ces champs :
- topic (string, le sujet)
- tip (string, le conseil culturel en français, 2-3 phrases)
- translation (string, traduction anglaise du conseil)
- category (string, une de ces catégories : "workplace_etiquette", "communication", "business_culture", "social", "regions")
- region (string, "France" ou "Quebec" ou "Both")`;

export interface CulturalTip {
  id: string;
  topic: string;
  tip: string;
  translation: string;
  category: string;
  region: string;
  createdAt: Date;
}

@Injectable()
export class CulturalTipsService {
  private readonly logger = new Logger(CulturalTipsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly provider: OpenRouterProvider,
    private readonly frenchCoachService: FrenchCoachService,
  ) {}

  async getTip(userId: string, topic?: string): Promise<CulturalTip | null> {
    const profile = await this.frenchCoachService.getProfile(userId);

    const variantHint = profile.frenchVariant === 'quebec'
      ? `\n\nIMPORTANT : L'utilisateur apprend le français pour le Québec. Priorise les conseils sur la culture québécoise (region: "Quebec") ou compare le Québec et la France (region: "Both").`
      : `\n\nIMPORTANT : L'utilisateur apprend le français pour la France. Priorise les conseils sur la culture française (region: "France") ou compare la France et le Québec (region: "Both").`;
    const prompt = (topic ? TOPIC_PROMPT(topic) : CULTURAL_TIP_PROMPT) + variantHint;

    try {
      const { content } = await this.provider.chat({
                messages: [
          { role: 'system', content: prompt },
          {
            role: 'user',
            content: topic
              ? `Donne-moi un conseil culturel sur "${topic}"`
              : 'Donne-moi un conseil culturel aléatoire pour le milieu professionnel francophone.',
          },
        ],
        temperature: 0.7,
        max_tokens: 500,
        response_format: { type: 'json_object' },
      });

      const parsed = JSON.parse(content);

      const session = await this.prisma.frenchSession.create({
        data: {
          type: 'cultural',
          status: 'completed',
          inputData: { topic: topic ?? null },
          outputData: {
            topic: parsed.topic,
            tip: parsed.tip,
            translation: parsed.translation,
            category: parsed.category,
            region: parsed.region,
          },
          profileId: profile.id,
        },
      });

      return {
        id: session.id,
        topic: parsed.topic,
        tip: parsed.tip,
        translation: parsed.translation,
        category: parsed.category,
        region: parsed.region,
        createdAt: session.createdAt,
      };
    } catch (err) {
      this.logger.warn(`Failed to generate cultural tip: ${(err as Error).message}`);
      return null;
    }
  }

  async getTipHistory(userId: string): Promise<CulturalTip[]> {
    const profile = await this.frenchCoachService.getProfile(userId);

    const sessions = await this.prisma.frenchSession.findMany({
      where: { profileId: profile.id, type: 'cultural', status: 'completed' },
      orderBy: { createdAt: 'desc' },
    });

    return sessions.map((s) => {
      const data = (s.outputData ?? {}) as Record<string, unknown>;
      return {
        id: s.id,
        topic: typeof data.topic === 'string' ? data.topic : 'Cultural Tip',
        tip: typeof data.tip === 'string' ? data.tip : '',
        translation: typeof data.translation === 'string' ? data.translation : '',
        category: typeof data.category === 'string' ? data.category : 'general',
        region: typeof data.region === 'string' ? data.region : 'Both',
        createdAt: s.createdAt,
      };
    });
  }
}
