import { Test, type TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { InterviewCoachService } from './interview-coach.service';
import { FrenchCoachService } from './french-coach.service';
import { PrismaService } from '../../prisma/prisma.service';
import { OpenRouterProvider } from '../ai/providers/openrouter.provider';

describe('InterviewCoachService', () => {
  let service: InterviewCoachService;
  let prisma: any;
  let provider: any;
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

  const mockInterview = {
    id: 'interview-1',
    scenario: 'frontend_developer',
    questionCount: 3,
    status: 'in_progress',
    questions: [
      { id: 'q1', question: 'Expliquez le concept de closure en JavaScript.', category: 'technical' },
      { id: 'q2', question: 'Comment gérez-vous les performances React ?', category: 'technical' },
      { id: 'q3', question: 'Décrivez votre expérience avec les tests frontend.', category: 'experience' },
    ],
    answers: [],
    evaluations: [],
    overallScore: null,
    profileId: 'profile-1',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InterviewCoachService,
        {
          provide: PrismaService,
          useValue: {
            frenchInterview: {
              findMany: jest.fn(),
              findFirst: jest.fn(),
              create: jest.fn(),
              update: jest.fn(),
            },
          },
        },
        {
          provide: FrenchCoachService,
          useValue: {
            getProfile: jest.fn().mockResolvedValue(mockProfile),
          },
        },
        {
          provide: OpenRouterProvider,
          useValue: {
            chat: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<InterviewCoachService>(InterviewCoachService);
    prisma = module.get(PrismaService);
    provider = module.get(OpenRouterProvider);
    frenchCoachService = module.get(FrenchCoachService);
  });

  describe('generateQuestions', () => {
    it('should generate questions and create interview', async () => {
      const generatedQuestions = [
        { id: 'q1', question: 'Question 1', category: 'technical' },
        { id: 'q2', question: 'Question 2', category: 'technical' },
      ];

      provider.chat.mockResolvedValue({
        content: JSON.stringify({ questions: generatedQuestions }),
      });

      prisma.frenchInterview.create.mockResolvedValue(mockInterview);

      const result = await service.generateQuestions('user-1', 'frontend_developer', 3);

      expect(result.questions).toHaveLength(2);
      expect(result.interview.id).toBe('interview-1');
      expect(result.interview.scenario).toBe('frontend_developer');
      expect(provider.chat).toHaveBeenCalledWith(
        expect.objectContaining({
          model: 'openrouter/free',
          messages: expect.arrayContaining([
            expect.objectContaining({ role: 'system' }),
            expect.objectContaining({ role: 'user' }),
          ]),
          response_format: { type: 'json_object' },
        }),
      );
    });

    it('should fall back to default scenario for unknown scenario', async () => {
      provider.chat.mockResolvedValue({
        content: JSON.stringify({ questions: [] }),
      });
      prisma.frenchInterview.create.mockResolvedValue(mockInterview);

      const result = await service.generateQuestions('user-1', 'unknown_scenario', 3);

      expect(result.questions).toBeDefined();
    });

    it('should throw if profile not found', async () => {
      frenchCoachService.getProfile.mockRejectedValue(new NotFoundException('Profile not found'));

      await expect(
        service.generateQuestions('nonexistent', 'frontend_developer', 3),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('evaluateAnswer', () => {
    it('should evaluate answer and update interview', async () => {
      const interviewWithOneAnswer = {
        ...mockInterview,
        answers: [{ questionId: 'q1', answer: 'Une réponse' }],
        evaluations: [{ questionId: 'q1', grammarScore: 80, confidenceScore: 75, technicalScore: 85 }],
        overallScore: 80,
      };

      prisma.frenchInterview.findFirst.mockResolvedValue(mockInterview);

      provider.chat.mockResolvedValue({
        content: JSON.stringify({
          grammarScore: 75,
          confidenceScore: 80,
          technicalScore: 70,
          feedback: 'Bon effort !',
          improvedAnswer: 'Version améliorée.',
          corrections: [{ original: 'j\'ai allé', corrected: 'je suis allé', explanation: 'Verbe aller' }],
        }),
      });

      prisma.frenchInterview.update.mockResolvedValue(interviewWithOneAnswer);

      const result = await service.evaluateAnswer('user-1', 'interview-1', 'q1', 'Ma réponse en français.');

      expect(result.evaluation.grammarScore).toBe(75);
      expect(result.evaluation.confidenceScore).toBe(80);
      expect(result.evaluation.technicalScore).toBe(70);
      expect(result.evaluation.feedback).toBe('Bon effort !');
      expect(result.evaluation.corrections).toHaveLength(1);
      expect(result.interview.id).toBe('interview-1');
    });

    it('should mark interview as completed when all questions answered', async () => {
      const answeredInterview = {
        ...mockInterview,
        answers: [
          { questionId: 'q1', answer: 'Ans 1' },
          { questionId: 'q2', answer: 'Ans 2' },
        ],
        evaluations: [
          { questionId: 'q1', grammarScore: 80, confidenceScore: 75, technicalScore: 85 },
        ],
        overallScore: 80,
      };

      prisma.frenchInterview.findFirst.mockResolvedValue(mockInterview);
      provider.chat.mockResolvedValue({
        content: JSON.stringify({
          grammarScore: 70,
          confidenceScore: 70,
          technicalScore: 70,
          feedback: 'Bien',
          improvedAnswer: 'Amélioré',
          corrections: [],
        }),
      });

      prisma.frenchInterview.update.mockResolvedValue({
        ...answeredInterview,
        status: 'completed',
      });

      const result = await service.evaluateAnswer('user-1', 'interview-1', 'q1', 'Answer');

      expect(result.interview.status).toBe('completed');
    });

    it('should throw if interview not found', async () => {
      prisma.frenchInterview.findFirst.mockResolvedValue(null);

      await expect(
        service.evaluateAnswer('user-1', 'nonexistent', 'q1', 'Answer'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw if question not found in interview', async () => {
      prisma.frenchInterview.findFirst.mockResolvedValue(mockInterview);

      await expect(
        service.evaluateAnswer('user-1', 'interview-1', 'nonexistent_q', 'Answer'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('getInterviews', () => {
    it('should return all interviews for user', async () => {
      prisma.frenchInterview.findMany.mockResolvedValue([mockInterview]);

      const result = await service.getInterviews('user-1');

      expect(result).toHaveLength(1);
      expect(result[0].scenario).toBe('frontend_developer');
    });

    it('should return empty array when no interviews', async () => {
      prisma.frenchInterview.findMany.mockResolvedValue([]);

      const result = await service.getInterviews('user-1');

      expect(result).toHaveLength(0);
    });
  });

  describe('getInterview', () => {
    it('should return single interview', async () => {
      prisma.frenchInterview.findFirst.mockResolvedValue(mockInterview);

      const result = await service.getInterview('interview-1', 'user-1');

      expect(result.id).toBe('interview-1');
      expect(result.scenario).toBe('frontend_developer');
    });

    it('should throw if interview not found', async () => {
      prisma.frenchInterview.findFirst.mockResolvedValue(null);

      await expect(
        service.getInterview('nonexistent', 'user-1'),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
