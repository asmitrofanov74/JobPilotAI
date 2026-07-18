import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { Prisma, PrismaClient } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class FrenchCoachService {
  private readonly logger = new Logger(FrenchCoachService.name);

  constructor(private readonly prisma: PrismaService) {}

  async getProfile(userId: string) {
    let profile = await this.prisma.frenchProfile.findUnique({ where: { userId } });

    if (!profile) {
      profile = await this.prisma.frenchProfile.create({ data: { userId } });
      this.logger.log(`Created French profile for user ${userId}`);
    }

    return profile;
  }

  async updateProfile(userId: string, data: { frenchLevel?: string; frenchVariant?: string; targetMarket?: string; targetRole?: string; targetIndustry?: string }) {
    const profile = await this.getProfile(userId);
    return this.prisma.frenchProfile.update({
      where: { id: profile.id },
      data,
    });
  }

  async getSessions(userId: string, type?: string) {
    const profile = await this.getProfile(userId);
    const where: Prisma.FrenchSessionWhereInput = { profileId: profile.id };
    if (type) where.type = type;

    return this.prisma.frenchSession.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
  }

  async getProgress(userId: string) {
    const profile = await this.getProfile(userId);
    const sessions = await this.prisma.frenchSession.findMany({
      where: { profileId: profile.id },
    });

    const totalSessions = sessions.length;
    const completedSessions = sessions.filter((s) => s.status === 'completed').length;
    const sessionsByType: Record<string, number> = {};

    for (const session of sessions) {
      sessionsByType[session.type] = (sessionsByType[session.type] || 0) + 1;
    }

    const messages = await this.prisma.frenchMessage.findMany({
      where: {
        conversation: { profileId: profile.id },
        evaluation: { isNot: null },
      },
      include: { evaluation: true },
    });

    let averageScore: number | null = null;
    let grammarAvg: number | null = null;
    let vocabularyAvg: number | null = null;
    let fluencyAvg: number | null = null;
    const scoreHistory: Array<{ date: string; grammarScore: number; vocabularyScore: number; fluencyScore: number }> = [];

    if (messages.length > 0) {
      const evalMessages = messages.filter((m) => m.evaluation);
      if (evalMessages.length > 0) {
        const totalGrammar = evalMessages.reduce((sum, m) => sum + m.evaluation!.grammarScore, 0);
        const totalVocabulary = evalMessages.reduce((sum, m) => sum + m.evaluation!.vocabularyScore, 0);
        const totalFluency = evalMessages.reduce((sum, m) => sum + m.evaluation!.fluencyScore, 0);

        grammarAvg = Math.round(totalGrammar / evalMessages.length);
        vocabularyAvg = Math.round(totalVocabulary / evalMessages.length);
        fluencyAvg = Math.round(totalFluency / evalMessages.length);
        averageScore = Math.round((grammarAvg + vocabularyAvg + fluencyAvg) / 3);

        const scoresByDay: Record<string, { grammar: number[]; vocabulary: number[]; fluency: number[] }> = {};
        for (const m of evalMessages) {
          const date = m.createdAt.toISOString().split('T')[0];
          if (!scoresByDay[date]) scoresByDay[date] = { grammar: [], vocabulary: [], fluency: [] };
          scoresByDay[date].grammar.push(m.evaluation!.grammarScore);
          scoresByDay[date].vocabulary.push(m.evaluation!.vocabularyScore);
          scoresByDay[date].fluency.push(m.evaluation!.fluencyScore);
        }

        for (const [date, scores] of Object.entries(scoresByDay).sort()) {
          scoreHistory.push({
            date,
            grammarScore: Math.round(scores.grammar.reduce((a, b) => a + b, 0) / scores.grammar.length),
            vocabularyScore: Math.round(scores.vocabulary.reduce((a, b) => a + b, 0) / scores.vocabulary.length),
            fluencyScore: Math.round(scores.fluency.reduce((a, b) => a + b, 0) / scores.fluency.length),
          });
        }
      }
    }

    const vocabularyCount = await this.prisma.frenchVocabularyWord.count({
      where: { profileId: profile.id },
    });

    const masteredWords = await this.prisma.frenchVocabularyWord.count({
      where: { profileId: profile.id, mastered: true },
    });

    const conversations = await this.prisma.frenchConversation.findMany({
      where: { profileId: profile.id },
    });

    const conversationDays = new Set(
      conversations.map((c) => c.createdAt.toISOString().split('T')[0]),
    ).size;

    const earliestActivity = sessions.length > 0
      ? sessions.reduce((earliest, s) => s.createdAt < earliest ? s.createdAt : earliest, sessions[0].createdAt)
      : new Date();

    const daysSinceStart = Math.max(1, Math.ceil((Date.now() - earliestActivity.getTime()) / 86400000));
    const streakDays = Math.min(conversationDays, daysSinceStart);

    const weakest = [];
    if (grammarAvg !== null && vocabularyAvg !== null && fluencyAvg !== null) {
      const min = Math.min(grammarAvg, vocabularyAvg, fluencyAvg);
      if (grammarAvg === min) weakest.push('grammar');
      if (vocabularyAvg === min) weakest.push('vocabulary');
      if (fluencyAvg === min) weakest.push('fluency');
    }

    return {
      totalSessions,
      completedSessions,
      sessionsByType,
      averageScore,
      grammarAvg,
      vocabularyAvg,
      fluencyAvg,
      scoreHistory,
      vocabularyCount,
      masteredWords,
      streakDays,
      weaknesses: weakest,
    };
  }

  async startSession(userId: string, type: string, inputData?: Record<string, unknown>) {
    const profile = await this.getProfile(userId);

    return this.prisma.frenchSession.create({
      data: {
        type,
        status: 'in_progress',
        inputData: (inputData ?? {}) as Prisma.InputJsonValue,
        profileId: profile.id,
      },
    });
  }

  async finishSession(id: string, userId: string, outputData: Record<string, unknown>) {
    const profile = await this.getProfile(userId);
    const session = await this.prisma.frenchSession.findFirst({
      where: { id, profileId: profile.id },
    });

    if (!session) {
      throw new NotFoundException('French session not found');
    }

    return this.prisma.frenchSession.update({
      where: { id },
        data: { status: 'completed', outputData: outputData as Prisma.InputJsonValue },
    });
  }
}
