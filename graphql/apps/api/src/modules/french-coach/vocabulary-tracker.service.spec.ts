import { Test, type TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { VocabularyTrackerService } from './vocabulary-tracker.service';
import { FrenchCoachService } from './french-coach.service';
import { PrismaService } from '../../prisma/prisma.service';

describe('VocabularyTrackerService', () => {
  let service: VocabularyTrackerService;
  let prisma: any;
  let frenchCoachService: jest.Mocked<FrenchCoachService>;

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

  const mockEntry = {
    id: 'vocab-1',
    word: 'bonjour',
    translation: 'hello',
    learned: false,
    difficult: false,
    reviewCount: 0,
    lastReviewAt: null,
    addedAt: new Date('2024-01-01'),
    profileId: 'profile-1',
  };

  const mockLearnedEntry = { ...mockEntry, id: 'vocab-2', learned: true, reviewCount: 3 };
  const mockDifficultEntry = { ...mockEntry, id: 'vocab-3', difficult: true, word: 'difficile', translation: 'difficult' };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        VocabularyTrackerService,
        {
          provide: PrismaService,
          useValue: {
            frenchVocabulary: {
              findMany: jest.fn(),
              findFirst: jest.fn(),
              create: jest.fn(),
              update: jest.fn(),
              delete: jest.fn(),
              count: jest.fn(),
            },
          },
        },
        {
          provide: FrenchCoachService,
          useValue: {
            getProfile: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<VocabularyTrackerService>(VocabularyTrackerService);
    prisma = module.get(PrismaService);
    frenchCoachService = module.get(FrenchCoachService);
  });

  describe('getAll', () => {
    it('should return all tracked vocabulary', async () => {
      frenchCoachService.getProfile.mockResolvedValue(mockProfile);
      (prisma.frenchVocabulary.findMany as jest.Mock).mockResolvedValue([mockEntry, mockLearnedEntry]);

      const result = await service.getAll('user-1');

      expect(prisma.frenchVocabulary.findMany).toHaveBeenCalledWith({
        where: { profileId: 'profile-1' },
        orderBy: { addedAt: 'desc' },
      });
      expect(result).toHaveLength(2);
    });
  });

  describe('addWord', () => {
    it('should create a new entry', async () => {
      frenchCoachService.getProfile.mockResolvedValue(mockProfile);
      (prisma.frenchVocabulary.findFirst as jest.Mock).mockResolvedValue(null);
      (prisma.frenchVocabulary.create as jest.Mock).mockResolvedValue(mockEntry);

      const result = await service.addWord('user-1', 'Bonjour', 'hello');

      expect(prisma.frenchVocabulary.create).toHaveBeenCalledWith({
        data: { word: 'bonjour', translation: 'hello', profileId: 'profile-1' },
      });
      expect(result.word).toBe('bonjour');
    });

    it('should update existing word instead of duplicate', async () => {
      frenchCoachService.getProfile.mockResolvedValue(mockProfile);
      (prisma.frenchVocabulary.findFirst as jest.Mock).mockResolvedValue(mockEntry);
      (prisma.frenchVocabulary.update as jest.Mock).mockResolvedValue({ ...mockEntry, translation: 'hi' });

      const result = await service.addWord('user-1', 'bonjour', 'hi');

      expect(prisma.frenchVocabulary.create).not.toHaveBeenCalled();
      expect(result.translation).toBe('hi');
    });
  });

  describe('markLearned', () => {
    it('should mark word as learned and increment review count', async () => {
      frenchCoachService.getProfile.mockResolvedValue(mockProfile);
      (prisma.frenchVocabulary.findFirst as jest.Mock).mockResolvedValue(mockEntry);
      (prisma.frenchVocabulary.update as jest.Mock).mockResolvedValue({
        ...mockEntry, learned: true, reviewCount: 1, lastReviewAt: new Date(),
      });

      const result = await service.markLearned('user-1', 'vocab-1');

      expect(prisma.frenchVocabulary.update).toHaveBeenCalledWith({
        where: { id: 'vocab-1' },
        data: { learned: true, reviewCount: { increment: 1 }, lastReviewAt: expect.any(Date) },
      });
      expect(result.learned).toBe(true);
    });

    it('should throw NotFoundException if entry does not exist', async () => {
      frenchCoachService.getProfile.mockResolvedValue(mockProfile);
      (prisma.frenchVocabulary.findFirst as jest.Mock).mockResolvedValue(null);

      await expect(service.markLearned('user-1', 'invalid')).rejects.toThrow(NotFoundException);
    });
  });

  describe('markDifficult', () => {
    it('should mark word as difficult', async () => {
      frenchCoachService.getProfile.mockResolvedValue(mockProfile);
      (prisma.frenchVocabulary.findFirst as jest.Mock).mockResolvedValue(mockEntry);
      (prisma.frenchVocabulary.update as jest.Mock).mockResolvedValue({
        ...mockEntry, difficult: true, reviewCount: 1,
      });

      const result = await service.markDifficult('user-1', 'vocab-1', true);

      expect(result.difficult).toBe(true);
    });

    it('should unmark word as difficult when set to false', async () => {
      frenchCoachService.getProfile.mockResolvedValue(mockProfile);
      (prisma.frenchVocabulary.findFirst as jest.Mock).mockResolvedValue(mockDifficultEntry);
      (prisma.frenchVocabulary.update as jest.Mock).mockResolvedValue({
        ...mockDifficultEntry, difficult: false, reviewCount: 2,
      });

      const result = await service.markDifficult('user-1', 'vocab-3', false);

      expect(result.difficult).toBe(false);
    });

    it('should throw NotFoundException if entry does not exist', async () => {
      frenchCoachService.getProfile.mockResolvedValue(mockProfile);
      (prisma.frenchVocabulary.findFirst as jest.Mock).mockResolvedValue(null);

      await expect(service.markDifficult('user-1', 'invalid', true)).rejects.toThrow(NotFoundException);
    });
  });

  describe('deleteWord', () => {
    it('should delete existing entry', async () => {
      frenchCoachService.getProfile.mockResolvedValue(mockProfile);
      (prisma.frenchVocabulary.findFirst as jest.Mock).mockResolvedValue(mockEntry);

      await service.deleteWord('user-1', 'vocab-1');

      expect(prisma.frenchVocabulary.delete).toHaveBeenCalledWith({ where: { id: 'vocab-1' } });
    });

    it('should throw NotFoundException if entry does not exist', async () => {
      frenchCoachService.getProfile.mockResolvedValue(mockProfile);
      (prisma.frenchVocabulary.findFirst as jest.Mock).mockResolvedValue(null);

      await expect(service.deleteWord('user-1', 'invalid')).rejects.toThrow(NotFoundException);
    });
  });

  describe('getTodayVocabulary', () => {
    it('should generate today words prioritizing difficult unlearned words', async () => {
      frenchCoachService.getProfile.mockResolvedValue(mockProfile);
      const words = [
        { ...mockDifficultEntry },
        { ...mockEntry, id: 'w2', word: 'merci', translation: 'thank you' },
        { ...mockEntry, id: 'w3', word: 'au revoir', translation: 'goodbye' },
        { ...mockEntry, id: 'w4', word: 's\'il vous plaît', translation: 'please' },
        { ...mockEntry, id: 'w5', word: 'pardon', translation: 'sorry' },
        { ...mockEntry, id: 'w6', word: 'oui', translation: 'yes' },
      ];
      (prisma.frenchVocabulary.findMany as jest.Mock).mockResolvedValue(words);

      const result = await service.getTodayVocabulary('user-1');

      expect(result.words.length).toBeGreaterThanOrEqual(5);
      expect(result.totalCount).toBe(6);
      expect(result.date).toBeDefined();
    });

    it('should handle empty vocabulary', async () => {
      frenchCoachService.getProfile.mockResolvedValue(mockProfile);
      (prisma.frenchVocabulary.findMany as jest.Mock).mockResolvedValue([]);

      const result = await service.getTodayVocabulary('user-1');

      expect(result.words).toEqual([]);
      expect(result.totalCount).toBe(0);
      expect(result.learnedCount).toBe(0);
    });
  });

  describe('getStats', () => {
    it('should return vocabulary statistics', async () => {
      frenchCoachService.getProfile.mockResolvedValue(mockProfile);
      (prisma.frenchVocabulary.count as jest.Mock).mockResolvedValueOnce(10);
      (prisma.frenchVocabulary.count as jest.Mock).mockResolvedValueOnce(4);
      (prisma.frenchVocabulary.count as jest.Mock).mockResolvedValueOnce(2);

      const result = await service.getStats('user-1');

      expect(result).toEqual({ total: 10, learned: 4, difficult: 2 });
    });
  });
});
