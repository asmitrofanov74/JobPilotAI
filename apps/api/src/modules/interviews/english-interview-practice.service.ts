import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { OpenRouterProvider } from '../ai/providers/openrouter.provider';

const SCENARIO_PROMPTS: Record<string, string> = {
  frontend_developer: `You are a senior technical recruiter conducting an interview for a Frontend Developer position. Generate interview questions in English.

The questions should cover:
- Frontend frameworks (React, Vue, Angular)
- CSS and responsive design
- Web performance and accessibility
- Frontend architecture and patterns
- Testing and code quality

Return ONLY a valid JSON array of objects with:
- id (string, e.g. "q1")
- question (string, the interview question in English)
- category (string: "technical", "experience", "problem_solving", "soft_skills")`,

  full_stack_developer: `You are a senior technical recruiter conducting an interview for a Full Stack Developer position. Generate interview questions in English.

The questions should cover:
- Backend architecture and APIs
- Databases and data modeling
- Frontend and user experience
- DevOps and deployment
- Software architecture and design patterns
- Testing and code quality

Return ONLY a valid JSON array of objects with:
- id (string, e.g. "q1")
- question (string, the interview question in English)
- category (string: "technical", "experience", "problem_solving", "soft_skills")`,

  team_lead: `You are a senior technical recruiter conducting an interview for a Team Lead / Technical Lead position. Generate interview questions in English.

The questions should cover:
- Team management and leadership
- Planning and prioritization
- Code review and quality
- Mentoring and team development
- Stakeholder communication
- Conflict resolution and decision making

Return ONLY a valid JSON array of objects with:
- id (string, e.g. "q1")
- question (string, the interview question in English)
- category (string: "technical", "experience", "problem_solving", "soft_skills")`,

  behavioral: `You are a senior HR interviewer conducting a behavioral interview. Generate behavioral interview questions in English using the STAR method.

The questions should cover:
- Teamwork and collaboration
- Problem-solving under pressure
- Leadership and initiative
- Handling failure and learning from mistakes
- Time management and prioritization
- Conflict resolution

Return ONLY a valid JSON array of objects with:
- id (string, e.g. "q1")
- question (string, the behavioral interview question in English)
- category (string: "technical", "experience", "problem_solving", "soft_skills")`,
};

function buildCustomJobPrompt(jobDescription: string): string {
  return `You are a senior technical recruiter. Generate interview questions in English for the position described below.

Job Description:
${jobDescription}

The questions should be relevant to this specific position. Cover:
- Technical skills required for the role
- Relevant experience
- Understanding of the role and industry
- Soft skills relevant to this position
- Real work situations related to the role

You must return a JSON object with a "questions" key containing an array. Exact format:
{"questions":[{"id":"q1","question":"Interview question in English?","category":"technical"},{"id":"q2","question":"Another question?","category":"experience"}]}

Return ONLY the JSON, no text before or after.`;
}

const EVALUATE_PROMPT = `You are an expert technical recruiter evaluating interview answers in English.

Evaluate the candidate's answer and return ONLY a valid JSON object with:
- grammarScore (number 0-100): quality of English grammar
- confidenceScore (number 0-100): perceived confidence in the answer
- technicalScore (number 0-100): accuracy and quality of technical content
- feedback (string): constructive feedback in English (2-3 sentences)
- improvedAnswer (string): improved version of the answer in English
- corrections (array of objects with: original, corrected, explanation)

Example:
{
  "grammarScore": 75,
  "confidenceScore": 80,
  "technicalScore": 70,
  "feedback": "Good effort! Your answer shows understanding of the topic...",
  "improvedAnswer": "Improved version of the answer...",
  "corrections": [
    { "original": "I has experience", "corrected": "I have experience", "explanation": "Subject-verb agreement: 'I' takes 'have'" }
  ]
}`;

const HINT_PROMPT = `You are a helpful interview coach. The user is in an English interview and doesn't know how to answer a question. You need to give them a hint to help them formulate their answer.

Return ONLY a valid JSON object with:
- hint (string): a short, encouraging hint in English to guide the answer
- keyPoints (string): key points to mention in the answer, separated by bullet points
- exampleAnswer (string): an example answer in English that the candidate could adapt

Example:
{
  "hint": "Think about your experience with testing frameworks...",
  "keyPoints": "• Experience with Jest or Cypress\\n• Coverage targets\\n• Unit tests vs integration tests",
  "exampleAnswer": "In my previous role, I implemented a testing strategy with Jest for React components..."
}`;

export interface EnglishPracticeResult {
  id: string;
  scenario: string;
  jobDescription: string | null;
  questionCount: number;
  status: string;
  questions: PracticeQuestion[];
  answers: PracticeAnswer[];
  evaluations: PracticeEvaluation[];
  overallScore: number | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface PracticeQuestion {
  id: string;
  question: string;
  category: string;
}

export interface PracticeAnswer {
  questionId: string;
  answer: string;
}

export interface PracticeEvaluation {
  questionId: string;
  grammarScore: number;
  confidenceScore: number;
  technicalScore: number;
  feedback: string;
  improvedAnswer: string;
  corrections: Array<{ original: string; corrected: string; explanation: string }>;
}

export interface EvaluationResult {
  grammarScore: number;
  confidenceScore: number;
  technicalScore: number;
  feedback: string;
  improvedAnswer: string;
  corrections: Array<{ original: string; corrected: string; explanation: string }>;
}

export interface HintResult {
  hint: string;
  keyPoints: string;
  exampleAnswer: string;
}

@Injectable()
export class EnglishInterviewPracticeService {
  private readonly logger = new Logger(EnglishInterviewPracticeService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly provider: OpenRouterProvider,
  ) {}

  async generateQuestions(userId: string, scenario: string, count: number = 5, jobDescription?: string): Promise<{ questions: PracticeQuestion[]; interview: EnglishPracticeResult }> {
    let basePrompt: string;
    if (scenario === 'custom_job' && jobDescription) {
      basePrompt = buildCustomJobPrompt(jobDescription);
    } else {
      basePrompt = SCENARIO_PROMPTS[scenario] ?? SCENARIO_PROMPTS.frontend_developer;
    }

    const { content } = await this.provider.chat({
      model: 'openrouter/free',
      messages: [
        { role: 'system', content: basePrompt },
        { role: 'user', content: `Generate ${count} interview questions in English for this position.` },
      ],
      temperature: 0.7,
      max_tokens: 1500,
      response_format: { type: 'json_object' },
    });

    const parsed: unknown = JSON.parse(content);
    let rawQuestions: unknown[];
    if (Array.isArray(parsed)) {
      rawQuestions = parsed;
    } else if (parsed && typeof parsed === 'object' && 'questions' in parsed && Array.isArray((parsed as Record<string, unknown>).questions)) {
      rawQuestions = (parsed as Record<string, unknown>).questions as unknown[];
    } else if (parsed && typeof parsed === 'object') {
      const values = Object.values(parsed as Record<string, unknown>).filter(Array.isArray);
      rawQuestions = values.length > 0 ? (values[0] as unknown[]) : [parsed];
    } else {
      rawQuestions = [];
    }
    const questions: PracticeQuestion[] = rawQuestions.slice(0, count).map((q: unknown, i: number) => {
      const obj = q && typeof q === 'object' ? (q as Record<string, unknown>) : {};
      return {
        id: (typeof obj.id === 'string' ? obj.id : null) || `q${i + 1}`,
        question: (typeof obj.question === 'string' ? obj.question : null) || String(q),
        category: (typeof obj.category === 'string' ? obj.category : null) || 'experience',
      };
    });

    const interview = await this.prisma.englishInterviewPractice.create({
      data: {
        scenario,
        jobDescription: jobDescription ?? null,
        questionCount: questions.length,
        status: 'in_progress',
        questions: questions as unknown as Prisma.InputJsonValue,
        userId,
      },
    });

    return { questions, interview: this.mapInterview(interview) };
  }

  async evaluateAnswer(
    userId: string,
    interviewId: string,
    questionId: string,
    answer: string,
  ): Promise<{ evaluation: EvaluationResult; interview: EnglishPracticeResult }> {
    const interview = await this.prisma.englishInterviewPractice.findFirst({
      where: { id: interviewId, userId },
    });

    if (!interview) throw new NotFoundException('Interview not found');

    const questions = interview.questions as unknown as PracticeQuestion[];
    const question = questions.find((q) => q.id === questionId);
    if (!question) throw new NotFoundException('Question not found in this interview');

    const evalPrompt = `Interview question: "${question.question}"\n\nCandidate answer: "${answer}"\n\nEvaluate this answer.`;

    const { content } = await this.provider.chat({
      model: 'openrouter/free',
      messages: [
        { role: 'system', content: EVALUATE_PROMPT },
        { role: 'user', content: evalPrompt },
      ],
      temperature: 0.3,
      max_tokens: 1000,
      response_format: { type: 'json_object' },
    });

    const parsed = JSON.parse(content) as Record<string, unknown>;
    const evaluation: EvaluationResult = {
      grammarScore: typeof parsed.grammarScore === 'number' ? parsed.grammarScore : 0,
      confidenceScore: typeof parsed.confidenceScore === 'number' ? parsed.confidenceScore : 0,
      technicalScore: typeof parsed.technicalScore === 'number' ? parsed.technicalScore : 0,
      feedback: typeof parsed.feedback === 'string' ? parsed.feedback : '',
      improvedAnswer: typeof parsed.improvedAnswer === 'string' ? parsed.improvedAnswer : answer,
      corrections: Array.isArray(parsed.corrections) ? (parsed.corrections as EvaluationResult['corrections']) : [],
    };

    const answers: PracticeAnswer[] = [...((interview.answers as unknown as PracticeAnswer[]) ?? []), { questionId, answer }];
    const evaluations: PracticeEvaluation[] = [...((interview.evaluations as unknown as PracticeEvaluation[]) ?? []), { questionId, ...evaluation }];

    const allScores = evaluations.map((e) => (e.grammarScore + e.confidenceScore + e.technicalScore) / 3);
    const overallScore = Math.round(allScores.reduce((a: number, b: number) => a + b, 0) / allScores.length);

    const answeredCount = answers.length;
    const status = answeredCount >= (interview.questionCount ?? 0) ? 'completed' : 'in_progress';

    const updated = await this.prisma.englishInterviewPractice.update({
      where: { id: interviewId },
      data: { answers: answers as unknown as Prisma.InputJsonValue, evaluations: evaluations as unknown as Prisma.InputJsonValue, overallScore, status },
    });

    return { evaluation, interview: this.mapInterview(updated) };
  }

  async generateHint(userId: string, interviewId: string, questionId: string): Promise<HintResult> {
    const interview = await this.prisma.englishInterviewPractice.findFirst({
      where: { id: interviewId, userId },
    });
    if (!interview) throw new NotFoundException('Interview not found');

    const questions = interview.questions as unknown as PracticeQuestion[];
    const question = questions.find((q) => q.id === questionId);
    if (!question) throw new NotFoundException('Question not found in this interview');

    const { content } = await this.provider.chat({
      model: 'openrouter/free',
      messages: [
        { role: 'system', content: HINT_PROMPT },
        { role: 'user', content: `Interview question: "${question.question}"\n\nCategory: ${question.category}\n\nThe user doesn't know how to answer. Give them a hint.` },
      ],
      temperature: 0.5,
      max_tokens: 800,
      response_format: { type: 'json_object' },
    });

    const parsed = JSON.parse(content) as Record<string, unknown>;
    return {
      hint: typeof parsed.hint === 'string' ? parsed.hint : '',
      keyPoints: typeof parsed.keyPoints === 'string' ? parsed.keyPoints : '',
      exampleAnswer: typeof parsed.exampleAnswer === 'string' ? parsed.exampleAnswer : '',
    };
  }

  async getInterviews(userId: string): Promise<EnglishPracticeResult[]> {
    const interviews = await this.prisma.englishInterviewPractice.findMany({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
    });
    return interviews.map((i) => this.mapInterview(i));
  }

  async getInterview(id: string, userId: string): Promise<EnglishPracticeResult> {
    const interview = await this.prisma.englishInterviewPractice.findFirst({
      where: { id, userId },
    });
    if (!interview) throw new NotFoundException('Interview not found');
    return this.mapInterview(interview);
  }

  private mapInterview(i: {
    id: string;
    scenario: string;
    jobDescription: string | null;
    questionCount: number;
    status: string;
    questions: Prisma.JsonValue;
    answers: Prisma.JsonValue;
    evaluations: Prisma.JsonValue;
    overallScore: number | null;
    createdAt: Date;
    updatedAt: Date;
  }): EnglishPracticeResult {
    return {
      id: i.id,
      scenario: i.scenario,
      jobDescription: i.jobDescription ?? null,
      questionCount: i.questionCount,
      status: i.status,
      questions: (i.questions as unknown as PracticeQuestion[]) ?? [],
      answers: (i.answers as unknown as PracticeAnswer[]) ?? [],
      evaluations: (i.evaluations as unknown as PracticeEvaluation[]) ?? [],
      overallScore: i.overallScore,
      createdAt: i.createdAt,
      updatedAt: i.updatedAt,
    };
  }
}
