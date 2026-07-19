import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { OpenRouterProvider } from '../ai/providers/openrouter.provider';
import { FrenchCoachService } from './french-coach.service';

const VOCABULARY_EXTRACT_PROMPT = `Tu es un professeur de français expert. Analyse les messages français ci-dessous et identifie les mots ou expressions intéressants qu'un apprenant devrait étudier.

Retourne UNIQUEMENT un tableau JSON valide d'objets avec ces champs :
- word (string, le mot ou l'expression en français)
- translation (string, traduction en anglais)
- quebecEquivalent (string, équivalent en français québécois si différent, sinon null)
- context (string, la phrase originale où le mot apparaît)

Exemple :
[
  { "word": "néanmoins", "translation": "nevertheless", "quebecEquivalent": null, "context": "Je pense néanmoins que c'est une bonne idée." },
  { "word": "ordinateur", "translation": "computer", "quebecEquivalent": "ordinnateur (prononcé)", "context": "J'utilise mon ordinateur pour travailler." },
  { "word": "chaussures", "translation": "shoes", "quebecEquivalent": "souliers", "context": "J'ai acheté des chaussures hier." }
]

Retourne au maximum 8 mots. Si aucun mot intéressant n'est trouvé, retourne un tableau vide [].`;

export interface VocabularyWordResult {
  id: string;
  word: string;
  translation: string;
  context: string | null;
  note: string | null;
  difficulty: string;
  timesReviewed: number;
  timesCorrect: number;
  nextReviewAt: Date;
  mastered: boolean;
  createdAt: Date;
  updatedAt: Date;
}

@Injectable()
export class VocabularyService {
  private readonly logger = new Logger(VocabularyService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly provider: OpenRouterProvider,
    private readonly frenchCoachService: FrenchCoachService,
  ) {}

  async getVocabulary(
    userId: string,
    filter?: { mastered?: boolean; difficulty?: string },
  ): Promise<VocabularyWordResult[]> {
    const profile = await this.frenchCoachService.getProfile(userId);
    const where: Prisma.FrenchVocabularyWordWhereInput = { profileId: profile.id };
    if (filter?.mastered !== undefined) where.mastered = filter.mastered;
    if (filter?.difficulty) where.difficulty = filter.difficulty;

    return this.prisma.frenchVocabularyWord.findMany({
      where,
      orderBy: { nextReviewAt: 'asc' },
    });
  }

  async addWord(
    userId: string,
    word: string,
    translation: string,
    quebecEquivalent?: string,
    context?: string,
    note?: string,
  ): Promise<VocabularyWordResult> {
    const profile = await this.frenchCoachService.getProfile(userId);

    const existing = await this.prisma.frenchVocabularyWord.findFirst({
      where: { profileId: profile.id, word: word.toLowerCase() },
    });

    if (existing) {
      return this.prisma.frenchVocabularyWord.update({
        where: { id: existing.id },
        data: {
          translation,
          quebecEquivalent: quebecEquivalent != null ? quebecEquivalent : existing.quebecEquivalent,
          context: context ?? existing.context,
          note: note ?? existing.note,
        },
      });
    }

    return this.prisma.frenchVocabularyWord.create({
      data: {
        word: word.toLowerCase(),
        translation,
        quebecEquivalent: quebecEquivalent ?? null,
        context,
        note,
        profileId: profile.id,
      },
    });
  }

  async reviewWord(
    userId: string,
    wordId: string,
    score: number,
  ): Promise<VocabularyWordResult> {
    const profile = await this.frenchCoachService.getProfile(userId);
    const word = await this.prisma.frenchVocabularyWord.findFirst({
      where: { id: wordId, profileId: profile.id },
    });

    if (!word) {
      throw new NotFoundException('Vocabulary word not found');
    }

    const timesReviewed = word.timesReviewed + 1;
    const timesCorrect = word.timesCorrect + (score >= 3 ? 1 : 0);

    const mastered = timesReviewed >= 5 && timesCorrect / timesReviewed >= 0.8;

    const intervalHours = Math.min(
      Math.pow(2, score) * (word.difficulty === 'hard' ? 12 : 24),
      720,
    );
    const nextReviewAt = new Date(Date.now() + intervalHours * 3600000);

    let difficulty = word.difficulty;
    if (score <= 2) difficulty = 'hard';
    else if (score >= 4 && difficulty === 'hard') difficulty = 'medium';
    else if (score >= 4 && difficulty === 'medium') difficulty = 'easy';

    return this.prisma.frenchVocabularyWord.update({
      where: { id: wordId },
      data: { timesReviewed, timesCorrect, mastered, nextReviewAt, difficulty },
    });
  }

  async deleteWord(userId: string, wordId: string): Promise<void> {
    const profile = await this.frenchCoachService.getProfile(userId);
    const word = await this.prisma.frenchVocabularyWord.findFirst({
      where: { id: wordId, profileId: profile.id },
    });

    if (!word) {
      throw new NotFoundException('Vocabulary word not found');
    }

    await this.prisma.frenchVocabularyWord.delete({ where: { id: wordId } });
  }

  async extractVocabulary(
    userId: string,
    conversationId: string,
  ): Promise<VocabularyWordResult[]> {
    const profile = await this.frenchCoachService.getProfile(userId);

    const conversation = await this.prisma.frenchConversation.findFirst({
      where: { id: conversationId, profileId: profile.id },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }

    const messageText = conversation.messages
      .map((m) => `[${m.role}]: ${m.content}`)
      .join('\n');

    try {
      const { content } = await this.provider.chat({
                messages: [
          { role: 'system', content: VOCABULARY_EXTRACT_PROMPT },
          { role: 'user', content: `Messages de la conversation :\n${messageText}` },
        ],
        temperature: 0.3,
        max_tokens: 1000,
        response_format: { type: 'json_object' },
      });

      const parsed = JSON.parse(content);
      const words: Array<{ word: string; translation: string; quebecEquivalent?: string; context: string }> =
        Array.isArray(parsed) ? parsed : parsed.words ?? [];

      const created: VocabularyWordResult[] = [];
      for (const w of words) {
        const existing = await this.prisma.frenchVocabularyWord.findFirst({
          where: { profileId: profile.id, word: w.word.toLowerCase() },
        });

        if (!existing) {
          const saved = await this.prisma.frenchVocabularyWord.create({
            data: {
              word: w.word.toLowerCase(),
              translation: w.translation,
              quebecEquivalent: w.quebecEquivalent ?? null,
              context: w.context,
              profileId: profile.id,
            },
          });
          created.push(saved);
        }
      }

      return created;
    } catch (err) {
      this.logger.warn(`Failed to extract vocabulary: ${(err as Error).message}`);
      return [];
    }
  }

  async generateQuebecEquivalent(userId: string, wordId: string): Promise<VocabularyWordResult> {
    const profile = await this.frenchCoachService.getProfile(userId);
    const word = await this.prisma.frenchVocabularyWord.findFirst({
      where: { id: wordId, profileId: profile.id },
    });

    if (!word) throw new NotFoundException('Vocabulary word not found');

    try {
      const { content } = await this.provider.chat({
                messages: [
          {
            role: 'system',
            content: `Tu es un expert en français québécois. Donne l'équivalent québécois du mot ou de l'expression fourni.
Retourne UNIQUEMENT un objet JSON valide avec : { "quebecEquivalent": "..." }.
Si le mot est identique en France et au Québec, retourne { "quebecEquivalent": null }.`,
          },
          { role: 'user', content: `Mot : "${word.word}" (${word.translation})` },
        ],
        temperature: 0.3,
        max_tokens: 200,
        response_format: { type: 'json_object' },
      });

      const parsed = JSON.parse(content);
      if (parsed.quebecEquivalent) {
        return this.prisma.frenchVocabularyWord.update({
          where: { id: wordId },
          data: { quebecEquivalent: parsed.quebecEquivalent },
        });
      }
    } catch (err) {
      this.logger.warn(`Failed to generate Quebec equivalent: ${(err as Error).message}`);
    }

    return word;
  }

  async compareVariants(userId: string, phrase: string): Promise<{ france: string; quebec: string }> {
    const { content } = await this.provider.chat({
            messages: [
        {
          role: 'system',
          content: `Tu es un expert en linguistique française. Compare le français de France et le français québécois.
Retourne UNIQUEMENT un objet JSON valide avec :
- france (string, la phrase en français de France)
- quebec (string, la même phrase en français québécois authentique)
Si la phrase est identique dans les deux variantes, retourne quand même les deux avec la même valeur.`,
        },
        { role: 'user', content: `Phrase : "${phrase}"` },
      ],
      temperature: 0.3,
      max_tokens: 300,
      response_format: { type: 'json_object' },
    });

    const parsed = JSON.parse(content);
    return {
      france: parsed.france ?? phrase,
      quebec: parsed.quebec ?? phrase,
    };
  }

  async getVocabularyStats(userId: string) {
    const profile = await this.frenchCoachService.getProfile(userId);

    const total = await this.prisma.frenchVocabularyWord.count({
      where: { profileId: profile.id },
    });

    const mastered = await this.prisma.frenchVocabularyWord.count({
      where: { profileId: profile.id, mastered: true },
    });

    const dueForReview = await this.prisma.frenchVocabularyWord.count({
      where: { profileId: profile.id, nextReviewAt: { lte: new Date() }, mastered: false },
    });

    const byDifficulty = await this.prisma.frenchVocabularyWord.groupBy({
      by: ['difficulty'],
      where: { profileId: profile.id },
      _count: true,
    });

    const difficultyBreakdown: Record<string, number> = {};
    for (const entry of byDifficulty) {
      difficultyBreakdown[entry.difficulty] = entry._count;
    }

    return { total, mastered, dueForReview, difficultyBreakdown };
  }
}
