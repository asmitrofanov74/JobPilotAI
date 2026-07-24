import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { FrenchCoachService } from './french-coach.service';

export interface TrackedVocabularyResult {
  id: string;
  word: string;
  translation: string;
  learned: boolean;
  difficult: boolean;
  reviewCount: number;
  lastReviewAt: Date | null;
  addedAt: Date;
}

export interface TodayVocabularyResult {
  date: string;
  words: TrackedVocabularyResult[];
  totalCount: number;
  learnedCount: number;
  difficultCount: number;
}

@Injectable()
export class VocabularyTrackerService {
  private readonly logger = new Logger(VocabularyTrackerService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly frenchCoachService: FrenchCoachService,
  ) {}

  async getAll(userId: string): Promise<TrackedVocabularyResult[]> {
    const profile = await this.frenchCoachService.getProfile(userId);
    return this.prisma.frenchVocabulary.findMany({
      where: { profileId: profile.id },
      orderBy: { addedAt: 'desc' },
    });
  }

  async addWord(
    userId: string,
    word: string,
    translation: string,
  ): Promise<TrackedVocabularyResult> {
    const profile = await this.frenchCoachService.getProfile(userId);

    const existing = await this.prisma.frenchVocabulary.findFirst({
      where: { profileId: profile.id, word: word.toLowerCase() },
    });

    if (existing) {
      return this.prisma.frenchVocabulary.update({
        where: { id: existing.id },
        data: { translation },
      });
    }

    return this.prisma.frenchVocabulary.create({
      data: { word: word.toLowerCase(), translation, profileId: profile.id },
    });
  }

  async markLearned(userId: string, id: string): Promise<TrackedVocabularyResult> {
    const profile = await this.frenchCoachService.getProfile(userId);
    const entry = await this.prisma.frenchVocabulary.findFirst({
      where: { id, profileId: profile.id },
    });
    if (!entry) throw new NotFoundException('Vocabulary entry not found');

    return this.prisma.frenchVocabulary.update({
      where: { id },
      data: { learned: true, reviewCount: { increment: 1 }, lastReviewAt: new Date() },
    });
  }

  async markDifficult(userId: string, id: string, difficult: boolean): Promise<TrackedVocabularyResult> {
    const profile = await this.frenchCoachService.getProfile(userId);
    const entry = await this.prisma.frenchVocabulary.findFirst({
      where: { id, profileId: profile.id },
    });
    if (!entry) throw new NotFoundException('Vocabulary entry not found');

    return this.prisma.frenchVocabulary.update({
      where: { id },
      data: { difficult, reviewCount: { increment: 1 }, lastReviewAt: new Date() },
    });
  }

  async deleteWord(userId: string, id: string): Promise<void> {
    const profile = await this.frenchCoachService.getProfile(userId);
    const entry = await this.prisma.frenchVocabulary.findFirst({
      where: { id, profileId: profile.id },
    });
    if (!entry) throw new NotFoundException('Vocabulary entry not found');
    await this.prisma.frenchVocabulary.delete({ where: { id } });
  }

  async getTodayVocabulary(userId: string): Promise<TodayVocabularyResult> {
    const profile = await this.frenchCoachService.getProfile(userId);

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const allWords = await this.prisma.frenchVocabulary.findMany({
      where: { profileId: profile.id },
    });

    const notLearned = allWords.filter((w) => !w.learned);
    const difficult = allWords.filter((w) => w.difficult && !w.learned);
    const reviewedToday = allWords.filter(
      (w) => w.lastReviewAt && w.lastReviewAt >= todayStart && w.lastReviewAt <= todayEnd,
    );

    const todayWords: typeof allWords = [];

    const todayDifficult = difficult.slice(0, 3);
    todayWords.push(...todayDifficult);

    const remainingSlots = Math.max(0, 5 - todayWords.length);
    const candidates = notLearned.filter(
      (w) => !todayWords.some((t) => t.id === w.id),
    );

    const randomSlice = candidates
      .sort(() => Math.random() - 0.5)
      .slice(0, remainingSlots);
    todayWords.push(...randomSlice);

    if (todayWords.length < 5) {
      const alreadyIncluded = new Set(todayWords.map((w) => w.id));
      const others = allWords
        .filter((w) => !alreadyIncluded.has(w.id))
        .sort(() => Math.random() - 0.5)
        .slice(0, 5 - todayWords.length);
      todayWords.push(...others);
    }

    return {
      date: todayStart.toISOString().split('T')[0],
      words: todayWords.map((w) => ({
        id: w.id,
        word: w.word,
        translation: w.translation,
        learned: w.learned,
        difficult: w.difficult,
        reviewCount: w.reviewCount,
        lastReviewAt: w.lastReviewAt,
        addedAt: w.addedAt,
      })),
      totalCount: allWords.length,
      learnedCount: allWords.filter((w) => w.learned).length,
      difficultCount: allWords.filter((w) => w.difficult).length,
    };
  }

  async getStats(userId: string) {
    const profile = await this.frenchCoachService.getProfile(userId);

    const total = await this.prisma.frenchVocabulary.count({
      where: { profileId: profile.id },
    });
    const learned = await this.prisma.frenchVocabulary.count({
      where: { profileId: profile.id, learned: true },
    });
    const difficult = await this.prisma.frenchVocabulary.count({
      where: { profileId: profile.id, difficult: true },
    });

    return { total, learned, difficult };
  }
}
