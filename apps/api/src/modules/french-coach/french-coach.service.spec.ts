import { Test, type TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { FrenchCoachService } from './french-coach.service';
import { PrismaService } from '../../prisma/prisma.service';

describe('FrenchCoachService', () => {
  let service: FrenchCoachService;
  let prisma: jest.Mocked<PrismaService>;

  const mockProfile = {
    id: 'profile-1',
    userId: 'user-1',
    frenchLevel: null,
    frenchVariant: 'france',
    targetMarket: null,
    targetRole: null,
    targetIndustry: null,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  };

  const mockSession = {
    id: 'session-1',
    type: 'cv_review',
    status: 'in_progress',
    inputData: { resume: 'test' },
    outputData: null,
    profileId: 'profile-1',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  };

  const mockCompletedSession = {
    ...mockSession,
    id: 'session-2',
    type: 'cover_letter',
    status: 'completed',
    outputData: { content: 'test' },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FrenchCoachService,
        {
          provide: PrismaService,
          useValue: {
            frenchProfile: {
              findUnique: jest.fn(),
              create: jest.fn(),
            },
            frenchSession: {
              findMany: jest.fn(),
              findFirst: jest.fn(),
              create: jest.fn(),
              update: jest.fn(),
            },
            frenchMessage: {
              findMany: jest.fn(),
            },
            frenchVocabularyWord: {
              count: jest.fn(),
            },
            frenchConversation: {
              findMany: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    service = module.get<FrenchCoachService>(FrenchCoachService);
    prisma = module.get(PrismaService);
  });

  describe('getProfile', () => {
    it('should return existing profile', async () => {
      (prisma.frenchProfile.findUnique as jest.Mock).mockResolvedValue(mockProfile);

      const result = await service.getProfile('user-1');

      expect(prisma.frenchProfile.findUnique).toHaveBeenCalledWith({ where: { userId: 'user-1' } });
      expect(prisma.frenchProfile.create).not.toHaveBeenCalled();
      expect(result).toEqual(mockProfile);
    });

    it('should create profile if not found', async () => {
      (prisma.frenchProfile.findUnique as jest.Mock).mockResolvedValue(null);
      (prisma.frenchProfile.create as jest.Mock).mockResolvedValue(mockProfile);

      const result = await service.getProfile('user-1');

      expect(prisma.frenchProfile.findUnique).toHaveBeenCalledWith({ where: { userId: 'user-1' } });
      expect(prisma.frenchProfile.create).toHaveBeenCalledWith({ data: { userId: 'user-1' } });
      expect(result).toEqual(mockProfile);
    });
  });

  describe('startSession', () => {
    it('should create a new session with in_progress status', async () => {
      (prisma.frenchProfile.findUnique as jest.Mock).mockResolvedValue(mockProfile);
      (prisma.frenchSession.create as jest.Mock).mockResolvedValue(mockSession);

      const result = await service.startSession('user-1', 'cv_review', { resume: 'test' });

      expect(prisma.frenchSession.create).toHaveBeenCalledWith({
        data: {
          type: 'cv_review',
          status: 'in_progress',
          inputData: { resume: 'test' },
          profileId: 'profile-1',
        },
      });
      expect(result).toEqual(mockSession);
    });

    it('should create profile and session if profile does not exist', async () => {
      (prisma.frenchProfile.findUnique as jest.Mock).mockResolvedValue(null);
      (prisma.frenchProfile.create as jest.Mock).mockResolvedValue(mockProfile);
      (prisma.frenchSession.create as jest.Mock).mockResolvedValue(mockSession);

      const result = await service.startSession('user-1', 'cv_review');

      expect(prisma.frenchProfile.create).toHaveBeenCalledWith({ data: { userId: 'user-1' } });
      expect(prisma.frenchSession.create).toHaveBeenCalledWith({
        data: {
          type: 'cv_review',
          status: 'in_progress',
          inputData: {},
          profileId: 'profile-1',
        },
      });
      expect(result).toEqual(mockSession);
    });
  });

  describe('finishSession', () => {
    it('should update session status to completed', async () => {
      (prisma.frenchProfile.findUnique as jest.Mock).mockResolvedValue(mockProfile);
      (prisma.frenchSession.findFirst as jest.Mock).mockResolvedValue(mockSession);
      (prisma.frenchSession.update as jest.Mock).mockResolvedValue(mockCompletedSession);

      const result = await service.finishSession('session-1', 'user-1', { content: 'test' });

      expect(prisma.frenchSession.update).toHaveBeenCalledWith({
        where: { id: 'session-1' },
        data: { status: 'completed', outputData: { content: 'test' } },
      });
      expect(result).toEqual(mockCompletedSession);
    });

    it('should throw NotFoundException if session does not exist', async () => {
      (prisma.frenchProfile.findUnique as jest.Mock).mockResolvedValue(mockProfile);
      (prisma.frenchSession.findFirst as jest.Mock).mockResolvedValue(null);

      await expect(
        service.finishSession('nonexistent', 'user-1', {}),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException if session belongs to another user', async () => {
      const otherProfile = { ...mockProfile, id: 'other-profile', userId: 'other-user' };
      (prisma.frenchProfile.findUnique as jest.Mock).mockResolvedValue(mockProfile);
      (prisma.frenchSession.findFirst as jest.Mock).mockResolvedValue(null);

      await expect(
        service.finishSession('session-other', 'user-1', {}),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('getSessions', () => {
    it('should return all sessions for user', async () => {
      (prisma.frenchProfile.findUnique as jest.Mock).mockResolvedValue(mockProfile);
      (prisma.frenchSession.findMany as jest.Mock).mockResolvedValue([mockSession, mockCompletedSession]);

      const result = await service.getSessions('user-1');

      expect(prisma.frenchSession.findMany).toHaveBeenCalledWith({
        where: { profileId: 'profile-1' },
        orderBy: { createdAt: 'desc' },
      });
      expect(result).toHaveLength(2);
    });

    it('should filter sessions by type', async () => {
      (prisma.frenchProfile.findUnique as jest.Mock).mockResolvedValue(mockProfile);
      (prisma.frenchSession.findMany as jest.Mock).mockResolvedValue([mockSession]);

      const result = await service.getSessions('user-1', 'cv_review');

      expect(prisma.frenchSession.findMany).toHaveBeenCalledWith({
        where: { profileId: 'profile-1', type: 'cv_review' },
        orderBy: { createdAt: 'desc' },
      });
      expect(result).toHaveLength(1);
    });
  });

  describe('getProgress', () => {
    it('should return progress stats', async () => {
      (prisma.frenchProfile.findUnique as jest.Mock).mockResolvedValue(mockProfile);
      (prisma.frenchSession.findMany as jest.Mock).mockResolvedValue([mockSession, mockCompletedSession]);
      (prisma.frenchMessage.findMany as jest.Mock).mockResolvedValue([]);
      (prisma.frenchVocabularyWord.count as jest.Mock).mockResolvedValue(0);
      (prisma.frenchConversation.findMany as jest.Mock).mockResolvedValue([]);

      const result = await service.getProgress('user-1');

      expect(result.totalSessions).toBe(2);
      expect(result.completedSessions).toBe(1);
      expect(result.sessionsByType).toEqual({ cv_review: 1, cover_letter: 1 });
      expect(result.averageScore).toBeNull();
      expect(result.vocabularyCount).toBe(0);
      expect(result.masteredWords).toBe(0);
      expect(result.streakDays).toBe(0);
      expect(result.weaknesses).toEqual([]);
    });

    it('should return zero stats for new user', async () => {
      (prisma.frenchProfile.findUnique as jest.Mock).mockResolvedValue(mockProfile);
      (prisma.frenchSession.findMany as jest.Mock).mockResolvedValue([]);
      (prisma.frenchMessage.findMany as jest.Mock).mockResolvedValue([]);
      (prisma.frenchVocabularyWord.count as jest.Mock).mockResolvedValue(0);
      (prisma.frenchConversation.findMany as jest.Mock).mockResolvedValue([]);

      const result = await service.getProgress('user-1');

      expect(result.totalSessions).toBe(0);
      expect(result.completedSessions).toBe(0);
      expect(result.sessionsByType).toEqual({});
      expect(result.averageScore).toBeNull();
      expect(result.vocabularyCount).toBe(0);
    });
  });
});
