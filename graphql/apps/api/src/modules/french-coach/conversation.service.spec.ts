import { Test, type TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { ConversationService } from './conversation.service';
import { FrenchCoachService } from './french-coach.service';
import { PrismaService } from '../../prisma/prisma.service';
import { OpenRouterProvider } from '../ai/providers/openrouter.provider';
import { ConversationScenario } from './dto/french-coach.types';

describe('ConversationService', () => {
  let service: ConversationService;
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

  const mockConversation = {
    id: 'conv-1',
    scenario: 'job_interview',
    profileId: 'profile-1',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  };

  const mockUserMessage = {
    id: 'msg-1',
    role: 'user',
    content: 'Bonjour',
    conversationId: 'conv-1',
    createdAt: new Date('2024-01-01'),
  };

  const mockAssistantMessage = {
    id: 'msg-2',
    role: 'assistant',
    content: 'Bonjour et bienvenue ! Parlez-moi de votre expérience.',
    conversationId: 'conv-1',
    createdAt: new Date('2024-01-01'),
  };

  const mockEvaluation = {
    id: 'eval-1',
    grammarScore: 85,
    vocabularyScore: 90,
    fluencyScore: 80,
    corrections: [
      {
        original: 'j\'ai allé',
        corrected: 'je suis allé',
        explanation: 'Le verbe aller utilise l\'auxiliaire "être" au passé composé',
      },
    ],
    improvedVersion: 'Bonjour, je suis ravi de participer à cet entretien.',
    quebecAlternative: 'Allo, ben content d\'être icitte pour l\'entrevue.',
    messageId: 'msg-1',
    createdAt: new Date('2024-01-01'),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ConversationService,
        {
          provide: PrismaService,
          useValue: {
            frenchConversation: {
              findFirst: jest.fn(),
              findMany: jest.fn(),
              create: jest.fn(),
            },
            frenchMessage: {
              create: jest.fn(),
              findMany: jest.fn(),
            },
            frenchEvaluation: {
              create: jest.fn(),
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

    service = module.get<ConversationService>(ConversationService);
    prisma = module.get(PrismaService);
    frenchCoachService = module.get(FrenchCoachService);
    provider = module.get(OpenRouterProvider);
  });

  describe('sendMessage', () => {
    it('should create a new conversation, return AI response and evaluation', async () => {
      frenchCoachService.getProfile.mockResolvedValue(mockProfile);
      (prisma.frenchConversation.create as jest.Mock).mockResolvedValue(mockConversation);
      (prisma.frenchMessage.create as jest.Mock).mockResolvedValueOnce(mockUserMessage);
      (prisma.frenchMessage.findMany as jest.Mock).mockResolvedValue([]);
      (prisma.frenchMessage.create as jest.Mock).mockResolvedValueOnce(mockAssistantMessage);
      (prisma.frenchEvaluation.create as jest.Mock).mockResolvedValue(mockEvaluation);
      provider.chat
        .mockResolvedValueOnce({ content: mockAssistantMessage.content, model: 'openrouter/free' })
        .mockResolvedValueOnce({ content: JSON.stringify(mockEvaluation), model: 'openrouter/free' });

      const result = await service.sendMessage('user-1', {
        message: 'Bonjour',
        scenario: ConversationScenario.JOB_INTERVIEW,
      });

      expect(prisma.frenchConversation.create).toHaveBeenCalledWith({
        data: { scenario: 'job_interview', profileId: 'profile-1' },
      });
      expect(prisma.frenchMessage.create).toHaveBeenCalledTimes(2);
      expect(prisma.frenchEvaluation.create).toHaveBeenCalledWith({
        data: {
          grammarScore: 85,
          vocabularyScore: 90,
          fluencyScore: 80,
          corrections: mockEvaluation.corrections,
          improvedVersion: mockEvaluation.improvedVersion,
          quebecAlternative: mockEvaluation.quebecAlternative,
          messageId: 'msg-1',
        },
      });
      expect(result.conversationId).toBe('conv-1');
      expect(result.response.id).toBe('msg-2');
      expect(result.response.content).toBe(mockAssistantMessage.content);
      expect(result.response.evaluation).toBeDefined();
      expect(result.response.evaluation!.grammarScore).toBe(85);
      expect(result.response.evaluation!.vocabularyScore).toBe(90);
      expect(result.response.evaluation!.fluencyScore).toBe(80);
      expect(result.response.evaluation!.corrections).toEqual(mockEvaluation.corrections);
      expect(result.response.evaluation!.improvedVersion).toBe(mockEvaluation.improvedVersion);
      expect(result.response.evaluation!.quebecAlternative).toBe(mockEvaluation.quebecAlternative);
    });

    it('should still return response when evaluation fails gracefully', async () => {
      frenchCoachService.getProfile.mockResolvedValue(mockProfile);
      (prisma.frenchConversation.create as jest.Mock).mockResolvedValue(mockConversation);
      (prisma.frenchMessage.create as jest.Mock).mockResolvedValueOnce(mockUserMessage);
      (prisma.frenchMessage.findMany as jest.Mock).mockResolvedValue([]);
      (prisma.frenchMessage.create as jest.Mock).mockResolvedValueOnce(mockAssistantMessage);
      provider.chat
        .mockResolvedValueOnce({ content: mockAssistantMessage.content, model: 'openrouter/free' })
        .mockRejectedValueOnce(new Error('AI evaluation failed'));

      const result = await service.sendMessage('user-1', {
        message: 'Bonjour',
        scenario: ConversationScenario.JOB_INTERVIEW,
      });

      expect(result.conversationId).toBe('conv-1');
      expect(result.response.evaluation).toBeNull();
    });

    it('should send evaluation prompt with json_object format', async () => {
      frenchCoachService.getProfile.mockResolvedValue(mockProfile);
      (prisma.frenchConversation.create as jest.Mock).mockResolvedValue(mockConversation);
      (prisma.frenchMessage.create as jest.Mock).mockResolvedValueOnce(mockUserMessage);
      (prisma.frenchMessage.findMany as jest.Mock).mockResolvedValue([]);
      (prisma.frenchMessage.create as jest.Mock).mockResolvedValueOnce(mockAssistantMessage);
      (prisma.frenchEvaluation.create as jest.Mock).mockResolvedValue(mockEvaluation);
      provider.chat
        .mockResolvedValueOnce({ content: mockAssistantMessage.content, model: 'openrouter/free' })
        .mockResolvedValueOnce({ content: JSON.stringify(mockEvaluation), model: 'openrouter/free' });

      await service.sendMessage('user-1', {
        message: 'Bonjour',
        scenario: ConversationScenario.JOB_INTERVIEW,
      });

      // First call: conversation, second call: evaluation
      expect(provider.chat).toHaveBeenCalledTimes(2);
      const evalCall = provider.chat.mock.calls[1][0];
      expect(evalCall.model).toBe('openrouter/free');
      expect(evalCall.temperature).toBe(0.3);
      expect(evalCall.max_tokens).toBe(500);
      expect(evalCall.response_format).toEqual({ type: 'json_object' });
      expect(evalCall.messages[0].role).toBe('system');
      expect(evalCall.messages[0].content).toContain('professeur de français');
      expect(evalCall.messages[1]).toEqual({ role: 'user', content: "Message de l'étudiant : Bonjour" });
    });

    it('should continue existing conversation when conversationId is provided', async () => {
      frenchCoachService.getProfile.mockResolvedValue(mockProfile);
      (prisma.frenchConversation.findFirst as jest.Mock).mockResolvedValue(mockConversation);
      (prisma.frenchMessage.create as jest.Mock).mockResolvedValueOnce(mockUserMessage);
      (prisma.frenchMessage.findMany as jest.Mock).mockResolvedValue([mockUserMessage, mockAssistantMessage]);
      (prisma.frenchMessage.create as jest.Mock).mockResolvedValueOnce({
        ...mockAssistantMessage,
        id: 'msg-3',
        content: 'Très bien ! Quelles sont vos compétences principales ?',
      });
      (prisma.frenchEvaluation.create as jest.Mock).mockResolvedValue(mockEvaluation);
      provider.chat
        .mockResolvedValueOnce({ content: 'Très bien ! Quelles sont vos compétences principales ?', model: 'openrouter/free' })
        .mockResolvedValueOnce({ content: JSON.stringify(mockEvaluation), model: 'openrouter/free' });

      const result = await service.sendMessage('user-1', {
        conversationId: 'conv-1',
        message: 'Je suis développeur',
      });

      expect(prisma.frenchConversation.create).not.toHaveBeenCalled();
      expect(prisma.frenchMessage.create).toHaveBeenCalledTimes(2);
      expect(result.conversationId).toBe('conv-1');
      expect(result.response.content).toBe('Très bien ! Quelles sont vos compétences principales ?');
      expect(result.response.evaluation).toBeDefined();
    });

    it('should throw BadRequestException when scenario is missing for new conversation', async () => {
      frenchCoachService.getProfile.mockResolvedValue(mockProfile);

      await expect(
        service.sendMessage('user-1', { message: 'Bonjour' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException when conversationId does not exist', async () => {
      frenchCoachService.getProfile.mockResolvedValue(mockProfile);
      (prisma.frenchConversation.findFirst as jest.Mock).mockResolvedValue(null);

      await expect(
        service.sendMessage('user-1', {
          conversationId: 'invalid',
          message: 'Bonjour',
          scenario: ConversationScenario.JOB_INTERVIEW,
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException when conversation belongs to another user', async () => {
      frenchCoachService.getProfile.mockResolvedValue(mockProfile);
      (prisma.frenchConversation.findFirst as jest.Mock).mockResolvedValue(null);

      await expect(
        service.sendMessage('user-1', { conversationId: 'conv-other', message: 'Bonjour' }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('getConversation', () => {
    it('should return conversation with messages and evaluations', async () => {
      frenchCoachService.getProfile.mockResolvedValue(mockProfile);
      const convWithMessages = {
        ...mockConversation,
        messages: [
          { ...mockUserMessage, evaluation: { ...mockEvaluation } },
          { ...mockAssistantMessage, evaluation: null },
        ],
      };
      (prisma.frenchConversation.findFirst as jest.Mock).mockResolvedValue(convWithMessages);

      const result = await service.getConversation('conv-1', 'user-1');

      expect(prisma.frenchConversation.findFirst).toHaveBeenCalledWith({
        where: { id: 'conv-1', profileId: 'profile-1' },
        include: {
          messages: {
            orderBy: { createdAt: 'asc' },
            include: { evaluation: true },
          },
        },
      });
      expect(result).toEqual(convWithMessages);
    });

    it('should throw NotFoundException when conversation does not exist', async () => {
      frenchCoachService.getProfile.mockResolvedValue(mockProfile);
      (prisma.frenchConversation.findFirst as jest.Mock).mockResolvedValue(null);

      await expect(
        service.getConversation('invalid', 'user-1'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('getConversations', () => {
    it('should return all conversations with evaluations', async () => {
      frenchCoachService.getProfile.mockResolvedValue(mockProfile);
      (prisma.frenchConversation.findMany as jest.Mock).mockResolvedValue([
        { ...mockConversation, messages: [{ ...mockUserMessage, evaluation: { ...mockEvaluation } }] },
      ]);

      const result = await service.getConversations('user-1');

      expect(prisma.frenchConversation.findMany).toHaveBeenCalledWith({
        where: { profileId: 'profile-1' },
        include: {
          messages: {
            orderBy: { createdAt: 'asc' },
            include: { evaluation: true },
          },
        },
        orderBy: { updatedAt: 'desc' },
      });
      expect(result).toHaveLength(1);
    });
  });
});
