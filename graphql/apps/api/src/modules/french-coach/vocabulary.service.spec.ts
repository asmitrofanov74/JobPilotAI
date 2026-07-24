import { Test, type TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { VocabularyService } from './vocabulary.service';
import { FrenchCoachService } from './french-coach.service';
import { PrismaService } from '../../prisma/prisma.service';
import { OpenRouterProvider } from '../ai/providers/openrouter.provider';

describe('VocabularyService', () => {
  let service: VocabularyService;
  let prisma: any;
  let frenchCoachService: jest.Mocked<FrenchCoachService>;
  let provider: jest.Mocked<OpenRouterProvider>;

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

  const mockWord = {
    id: 'word-1',
    word: 'néanmoins',
    translation: 'nevertheless',
    quebecEquivalent: null,
    context: 'Je pense néanmoins que c\'est une bonne idée.',
    note: null,
    difficulty: 'medium',
    timesReviewed: 0,
    timesCorrect: 0,
    nextReviewAt: new Date('2024-01-01'),
    mastered: false,
    profileId: 'profile-1',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  };

  const mockConversation = {
    id: 'conv-1',
    scenario: 'job_interview',
    profileId: 'profile-1',
    messages: [
      { id: 'msg-1', role: 'user', content: 'Bonjour, je suis développeur.', createdAt: new Date('2024-01-01') },
    ],
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        VocabularyService,
        {
          provide: PrismaService,
          useValue: {
            frenchVocabularyWord: {
              findMany: jest.fn(),
              findFirst: jest.fn(),
              create: jest.fn(),
              update: jest.fn(),
              delete: jest.fn(),
              count: jest.fn(),
              groupBy: jest.fn(),
            },
            frenchConversation: {
              findFirst: jest.fn(),
            },
          },
        },
        {
          provide: OpenRouterProvider,
          useValue: {
            chat: jest.fn(),
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

    service = module.get<VocabularyService>(VocabularyService);
    prisma = module.get(PrismaService);
    frenchCoachService = module.get(FrenchCoachService);
    provider = module.get(OpenRouterProvider);
  });

  describe('getVocabulary', () => {
    it('should return all words for user', async () => {
      frenchCoachService.getProfile.mockResolvedValue(mockProfile);
      (prisma.frenchVocabularyWord.findMany as jest.Mock).mockResolvedValue([mockWord]);

      const result = await service.getVocabulary('user-1');

      expect(prisma.frenchVocabularyWord.findMany).toHaveBeenCalledWith({
        where: { profileId: 'profile-1' },
        orderBy: { nextReviewAt: 'asc' },
      });
      expect(result).toEqual([mockWord]);
    });

    it('should filter by mastered status', async () => {
      frenchCoachService.getProfile.mockResolvedValue(mockProfile);
      (prisma.frenchVocabularyWord.findMany as jest.Mock).mockResolvedValue([]);

      await service.getVocabulary('user-1', { mastered: true });

      expect(prisma.frenchVocabularyWord.findMany).toHaveBeenCalledWith({
        where: { profileId: 'profile-1', mastered: true },
        orderBy: { nextReviewAt: 'asc' },
      });
    });

    it('should filter by difficulty', async () => {
      frenchCoachService.getProfile.mockResolvedValue(mockProfile);
      (prisma.frenchVocabularyWord.findMany as jest.Mock).mockResolvedValue([]);

      await service.getVocabulary('user-1', { difficulty: 'hard' });

      expect(prisma.frenchVocabularyWord.findMany).toHaveBeenCalledWith({
        where: { profileId: 'profile-1', difficulty: 'hard' },
        orderBy: { nextReviewAt: 'asc' },
      });
    });
  });

  describe('addWord', () => {
    it('should create a new word', async () => {
      frenchCoachService.getProfile.mockResolvedValue(mockProfile);
      (prisma.frenchVocabularyWord.findFirst as jest.Mock).mockResolvedValue(null);
      (prisma.frenchVocabularyWord.create as jest.Mock).mockResolvedValue(mockWord);

      const result = await service.addWord('user-1', 'Néanmoins', 'nevertheless', undefined, 'Context sentence');

      expect(prisma.frenchVocabularyWord.create).toHaveBeenCalledWith({
        data: {
          word: 'néanmoins',
          translation: 'nevertheless',
          quebecEquivalent: null,
          context: 'Context sentence',
          note: undefined,
          profileId: 'profile-1',
        },
      });
      expect(result).toEqual(mockWord);
    });

    it('should update existing word instead of creating duplicate', async () => {
      frenchCoachService.getProfile.mockResolvedValue(mockProfile);
      (prisma.frenchVocabularyWord.findFirst as jest.Mock).mockResolvedValue(mockWord);
      (prisma.frenchVocabularyWord.update as jest.Mock).mockResolvedValue({
        ...mockWord,
        translation: 'nevertheless updated',
      });

      const result = await service.addWord('user-1', 'néanmoins', 'nevertheless updated');

      expect(prisma.frenchVocabularyWord.create).not.toHaveBeenCalled();
      expect(prisma.frenchVocabularyWord.update).toHaveBeenCalledWith({
        where: { id: 'word-1' },
        data: { translation: 'nevertheless updated', quebecEquivalent: mockWord.quebecEquivalent, context: mockWord.context, note: mockWord.note },
      });
      expect(result.translation).toBe('nevertheless updated');
    });
  });

  describe('reviewWord', () => {
    it('should update word state after review with high score', async () => {
      frenchCoachService.getProfile.mockResolvedValue(mockProfile);
      (prisma.frenchVocabularyWord.findFirst as jest.Mock).mockResolvedValue({
        ...mockWord,
        timesReviewed: 4,
        timesCorrect: 3,
      });
      (prisma.frenchVocabularyWord.update as jest.Mock).mockResolvedValue({
        ...mockWord,
        timesReviewed: 5,
        timesCorrect: 4,
        mastered: true,
        difficulty: 'easy',
      });

      const result = await service.reviewWord('user-1', 'word-1', 4);

      expect(result.mastered).toBe(true);
      expect(result.difficulty).toBe('easy');
    });

    it('should mark word as hard on low score', async () => {
      frenchCoachService.getProfile.mockResolvedValue(mockProfile);
      (prisma.frenchVocabularyWord.findFirst as jest.Mock).mockResolvedValue(mockWord);
      (prisma.frenchVocabularyWord.update as jest.Mock).mockResolvedValue({
        ...mockWord,
        timesReviewed: 1,
        timesCorrect: 0,
        difficulty: 'hard',
      });

      const result = await service.reviewWord('user-1', 'word-1', 1);

      expect(result.difficulty).toBe('hard');
    });

    it('should throw NotFoundException if word does not exist', async () => {
      frenchCoachService.getProfile.mockResolvedValue(mockProfile);
      (prisma.frenchVocabularyWord.findFirst as jest.Mock).mockResolvedValue(null);

      await expect(service.reviewWord('user-1', 'invalid', 3)).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException if word belongs to another user', async () => {
      frenchCoachService.getProfile.mockResolvedValue(mockProfile);
      (prisma.frenchVocabularyWord.findFirst as jest.Mock).mockResolvedValue(null);

      await expect(service.reviewWord('user-1', 'word-other', 3)).rejects.toThrow(NotFoundException);
    });
  });

  describe('deleteWord', () => {
    it('should delete existing word', async () => {
      frenchCoachService.getProfile.mockResolvedValue(mockProfile);
      (prisma.frenchVocabularyWord.findFirst as jest.Mock).mockResolvedValue(mockWord);

      await service.deleteWord('user-1', 'word-1');

      expect(prisma.frenchVocabularyWord.delete).toHaveBeenCalledWith({ where: { id: 'word-1' } });
    });

    it('should throw NotFoundException if word does not exist', async () => {
      frenchCoachService.getProfile.mockResolvedValue(mockProfile);
      (prisma.frenchVocabularyWord.findFirst as jest.Mock).mockResolvedValue(null);

      await expect(service.deleteWord('user-1', 'invalid')).rejects.toThrow(NotFoundException);
    });
  });

  describe('extractVocabulary', () => {
    it('should extract words from conversation and create new vocabulary entries', async () => {
      frenchCoachService.getProfile.mockResolvedValue(mockProfile);
      (prisma.frenchConversation.findFirst as jest.Mock).mockResolvedValue(mockConversation);
      (prisma.frenchVocabularyWord.findFirst as jest.Mock).mockResolvedValue(null);
      (prisma.frenchVocabularyWord.create as jest.Mock).mockResolvedValue(mockWord);

      provider.chat.mockResolvedValue({
        content: JSON.stringify([
          { word: 'néanmoins', translation: 'nevertheless', context: 'Context' },
        ]),
        model: 'openrouter/free',
      });

      const result = await service.extractVocabulary('user-1', 'conv-1');

      expect(provider.chat).toHaveBeenCalledWith(
        expect.objectContaining({
          model: 'openrouter/free',
          temperature: 0.3,
          response_format: { type: 'json_object' },
        }),
      );
      expect(result).toHaveLength(1);
      expect(result[0].word).toBe('néanmoins');
    });

    it('should skip words that already exist', async () => {
      frenchCoachService.getProfile.mockResolvedValue(mockProfile);
      (prisma.frenchConversation.findFirst as jest.Mock).mockResolvedValue(mockConversation);
      (prisma.frenchVocabularyWord.findFirst as jest.Mock).mockResolvedValue(mockWord);

      provider.chat.mockResolvedValue({
        content: JSON.stringify([
          { word: 'néanmoins', translation: 'nevertheless', context: 'Context' },
        ]),
        model: 'openrouter/free',
      });

      const result = await service.extractVocabulary('user-1', 'conv-1');

      expect(prisma.frenchVocabularyWord.create).not.toHaveBeenCalled();
      expect(result).toHaveLength(0);
    });

    it('should return empty array when AI extraction fails', async () => {
      frenchCoachService.getProfile.mockResolvedValue(mockProfile);
      (prisma.frenchConversation.findFirst as jest.Mock).mockResolvedValue(mockConversation);
      (prisma.frenchVocabularyWord.findFirst as jest.Mock).mockResolvedValue(null);
      provider.chat.mockRejectedValue(new Error('AI failed'));

      const result = await service.extractVocabulary('user-1', 'conv-1');

      expect(result).toEqual([]);
    });

    it('should throw NotFoundException if conversation does not exist', async () => {
      frenchCoachService.getProfile.mockResolvedValue(mockProfile);
      (prisma.frenchConversation.findFirst as jest.Mock).mockResolvedValue(null);

      await expect(service.extractVocabulary('user-1', 'invalid')).rejects.toThrow(NotFoundException);
    });
  });

  describe('getVocabularyStats', () => {
    it('should return vocabulary statistics', async () => {
      frenchCoachService.getProfile.mockResolvedValue(mockProfile);
      (prisma.frenchVocabularyWord.count as jest.Mock).mockResolvedValueOnce(10);
      (prisma.frenchVocabularyWord.count as jest.Mock).mockResolvedValueOnce(3);
      (prisma.frenchVocabularyWord.count as jest.Mock).mockResolvedValueOnce(5);
      (prisma.frenchVocabularyWord.groupBy as jest.Mock).mockResolvedValue([
        { difficulty: 'easy', _count: 2 },
        { difficulty: 'medium', _count: 5 },
        { difficulty: 'hard', _count: 3 },
      ]);

      const result = await service.getVocabularyStats('user-1');

      expect(result).toEqual({
        total: 10,
        mastered: 3,
        dueForReview: 5,
        difficultyBreakdown: { easy: 2, medium: 5, hard: 3 },
      });
    });
  });
});
