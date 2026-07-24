import { Test, type TestingModule } from '@nestjs/testing';
import { CulturalTipsService } from './cultural-tips.service';
import { FrenchCoachService } from './french-coach.service';
import { PrismaService } from '../../prisma/prisma.service';
import { OpenRouterProvider } from '../ai/providers/openrouter.provider';

describe('CulturalTipsService', () => {
  let service: CulturalTipsService;
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

  const mockSession = {
    id: 'session-1',
    type: 'cultural',
    status: 'completed',
    inputData: { topic: null },
    outputData: {
      topic: 'Le tutoiement au travail',
      tip: 'Au Québec, le tutoiement est quasi universel.',
      translation: 'In Quebec, using tu is almost universal.',
      category: 'communication',
      region: 'Quebec',
    },
    profileId: 'profile-1',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  };

  const mockAiResponse = {
    topic: 'Le tutoiement au travail',
    tip: 'Au Québec, le tutoiement est quasi universel.',
    translation: 'In Quebec, using tu is almost universal.',
    category: 'communication',
    region: 'Quebec',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CulturalTipsService,
        {
          provide: PrismaService,
          useValue: {
            frenchSession: {
              create: jest.fn(),
              findMany: jest.fn(),
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

    service = module.get<CulturalTipsService>(CulturalTipsService);
    prisma = module.get(PrismaService);
    frenchCoachService = module.get(FrenchCoachService);
    provider = module.get(OpenRouterProvider);
  });

  describe('getTip', () => {
    it('should generate a cultural tip and return it', async () => {
      frenchCoachService.getProfile.mockResolvedValue(mockProfile);
      provider.chat.mockResolvedValue({
        content: JSON.stringify(mockAiResponse),
        model: 'openrouter/free',
      });
      (prisma.frenchSession.create as jest.Mock).mockResolvedValue(mockSession);

      const result = await service.getTip('user-1');

      expect(provider.chat).toHaveBeenCalledWith(
        expect.objectContaining({
          model: 'openrouter/free',
          temperature: 0.7,
          response_format: { type: 'json_object' },
        }),
      );
      expect(prisma.frenchSession.create).toHaveBeenCalledWith({
        data: {
          type: 'cultural',
          status: 'completed',
          inputData: { topic: null },
          outputData: mockAiResponse,
          profileId: 'profile-1',
        },
      });
      expect(result).toEqual({
        id: 'session-1',
        topic: 'Le tutoiement au travail',
        tip: 'Au Québec, le tutoiement est quasi universel.',
        translation: 'In Quebec, using tu is almost universal.',
        category: 'communication',
        region: 'Quebec',
        createdAt: mockSession.createdAt,
      });
    });

    it('should pass topic to AI when provided', async () => {
      frenchCoachService.getProfile.mockResolvedValue(mockProfile);
      provider.chat.mockResolvedValue({
        content: JSON.stringify(mockAiResponse),
        model: 'openrouter/free',
      });
      (prisma.frenchSession.create as jest.Mock).mockResolvedValue(mockSession);

      await service.getTip('user-1', 'Les pauses café');

      const chatCall = provider.chat.mock.calls[0][0];
      expect(chatCall.messages[0].content).toContain('Les pauses café');
    });

    it('should return null when AI call fails', async () => {
      frenchCoachService.getProfile.mockResolvedValue(mockProfile);
      provider.chat.mockRejectedValue(new Error('AI failed'));

      const result = await service.getTip('user-1');

      expect(prisma.frenchSession.create).not.toHaveBeenCalled();
      expect(result).toBeNull();
    });
  });

  describe('getTipHistory', () => {
    it('should return all completed cultural sessions', async () => {
      frenchCoachService.getProfile.mockResolvedValue(mockProfile);
      (prisma.frenchSession.findMany as jest.Mock).mockResolvedValue([mockSession]);

      const result = await service.getTipHistory('user-1');

      expect(prisma.frenchSession.findMany).toHaveBeenCalledWith({
        where: { profileId: 'profile-1', type: 'cultural', status: 'completed' },
        orderBy: { createdAt: 'desc' },
      });
      expect(result).toHaveLength(1);
      expect(result[0].topic).toBe('Le tutoiement au travail');
      expect(result[0].tip).toBe('Au Québec, le tutoiement est quasi universel.');
    });

    it('should return empty array when no tips exist', async () => {
      frenchCoachService.getProfile.mockResolvedValue(mockProfile);
      (prisma.frenchSession.findMany as jest.Mock).mockResolvedValue([]);

      const result = await service.getTipHistory('user-1');

      expect(result).toEqual([]);
    });
  });
});
