export interface GqlJobInterview {
  id: string;
  type: string;
  scheduledAt?: string;
  isCompleted?: boolean;
}

export interface GqlJob {
  id: string;
  companyName: string;
  jobTitle: string;
  jobDescription?: string;
  jobUrl?: string;
  status: string;
  source?: string;
  salaryRange?: string;
  location?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  interviews?: GqlJobInterview[];
}

export interface GqlPaginationMeta {
  total: number;
  totalPages: number;
  page: number;
  limit: number;
}

export interface GqlPaginatedJobs {
  edges: GqlJob[];
  meta: GqlPaginationMeta;
}

export interface GqlResume {
  id: string;
  title: string;
  fileUrl?: string;
  fileKey?: string;
  fileSize?: number;
  mimeType?: string;
  isPrimary: boolean;
  parsedSkills?: string[];
  parsedExperience?: string;
  parsedEducation?: string;
  createdAt: string;
  updatedAt: string;
}

export interface GqlCoverLetter {
  id: string;
  jobTitle?: string;
  companyName?: string;
  content?: string;
  tone?: string;
  jobDescription?: string;
  isGenerated?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface GqlInterview {
  id: string;
  type: string;
  round?: number;
  scheduledAt?: string;
  durationMinutes?: number;
  interviewers?: string[];
  location?: string;
  notes?: string;
  feedback?: string;
  rating?: number;
  isCompleted?: boolean;
  jobApplicationId?: string;
  createdAt: string;
}

export interface GqlSkillGapReport {
  id: string;
  jobDescription?: string;
  jobTitle: string;
  companyName?: string;
  requiredSkills?: string[];
  userSkills?: string[];
  missingSkills?: string[];
  matchScore?: number;
  recommendations?: string[];
  createdAt: string;
}

export interface GqlSkillGapResult {
  report: GqlSkillGapReport;
  requiredSkills?: string[];
  missingSkills?: string[];
  matchScore?: number;
  recommendations?: string[];
}

export interface GqlFunnelAnalytics {
  saved: number;
  applied: number;
  phoneScreen: number;
  technical: number;
  onsite: number;
  offer: number;
  rejected: number;
  accepted: number;
}

export interface GqlMonthlyStat {
  month: string;
  applications: number;
  interviews: number;
}

export interface GqlScrapedJob {
  companyName: string;
  jobTitle: string;
  jobDescription?: string;
  jobUrl?: string;
  location?: string;
  salaryRange?: string;
  source?: string;
  sourceUrl?: string;
  sourceId?: string;
  employmentType?: string;
  workMode?: string;
  postedDate?: string;
}

export interface GqlScrapeStats {
  linkedin?: number;
  indeed?: number;
  workopolis?: number;
  ziprecruiter?: number;
  greenhouse?: number;
  lever?: number;
  workday?: number;
  [key: string]: number | undefined;
}

export interface GqlScrapeResult {
  total: number;
  imported?: number;
  jobs: GqlScrapedJob[];
  stats?: GqlScrapeStats;
}

export interface GqlImportResult {
  imported: number;
  skipped: number;
}

export interface GqlLinkedinOptimization {
  id: string;
  type: string;
  inputData?: Record<string, unknown>;
  outputData?: Record<string, unknown>;
  createdAt: string;
}

export interface GqlLinkedinResult {
  optimization: GqlLinkedinOptimization;
  output: Record<string, any>;
}

export interface GqlFrenchCorrection {
  original: string;
  corrected: string;
  explanation: string;
}

export interface GqlFrenchEvaluation {
  id?: string;
  grammarScore?: number;
  vocabularyScore?: number;
  fluencyScore?: number;
  corrections?: GqlFrenchCorrection[];
  improvedVersion?: string;
  quebecAlternative?: string;
}

export interface GqlFrenchMessage {
  id: string;
  role: string;
  content: string;
  evaluation?: GqlFrenchEvaluation;
  createdAt: string;
}

export interface GqlFrenchConversation {
  id: string;
  scenario: string;
  jobDescription?: string;
  messages?: GqlFrenchMessage[];
  createdAt: string;
  updatedAt: string;
}

export interface GqlFrenchVocabWord {
  id: string;
  word: string;
  translation: string;
  context?: string;
  note?: string;
  difficulty?: string;
  timesReviewed?: number;
  timesCorrect?: number;
  nextReviewAt?: string;
  mastered?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface GqlFrenchVocabStats {
  total: number;
  mastered: number;
  dueForReview: number;
  difficultyBreakdown?: Record<string, number>;
}

export interface GqlFrenchTodayWord {
  id: string;
  word: string;
  translation: string;
  learned?: boolean;
  difficult?: boolean;
  reviewCount?: number;
  lastReviewAt?: string;
}

export interface GqlFrenchTodayVocab {
  date: string;
  words: GqlFrenchTodayWord[];
  totalCount: number;
  learnedCount: number;
  difficultCount: number;
}

export interface GqlFrenchSession {
  id: string;
  type: string;
  status?: string;
  inputData?: Record<string, unknown>;
  outputData?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface GqlFrenchProgress {
  totalSessions: number;
  completedSessions: number;
  sessionsByType?: Record<string, number>;
  averageScore?: number;
  grammarAvg?: number;
  vocabularyAvg?: number;
  fluencyAvg?: number;
  scoreHistory?: Array<{
    date: string;
    grammarScore: number;
    vocabularyScore: number;
    fluencyScore: number;
  }>;
  vocabularyCount?: number;
  masteredWords?: number;
  streakDays?: number;
  weaknesses?: string[];
}

export interface GqlFrenchCulturalTip {
  id: string;
  topic: string;
  tip: string;
  translation?: string;
  category?: string;
  region?: string;
  createdAt: string;
}

export interface GqlFrenchProfile {
  id: string;
  frenchLevel?: string;
  frenchVariant?: string;
  targetMarket?: string;
  targetRole?: string;
  targetIndustry?: string;
  createdAt: string;
  updatedAt: string;
}

export interface GqlInterviewQuestion {
  id: string;
  question: string;
  category: string;
}

export interface GqlInterviewAnswer {
  questionId: string;
  answer: string;
}

export interface GqlInterviewEvaluation {
  questionId: string;
  grammarScore?: number;
  confidenceScore?: number;
  technicalScore?: number;
  feedback?: string;
  improvedAnswer?: string;
  corrections?: GqlFrenchCorrection[];
}

export interface GqlFrenchInterview {
  id: string;
  scenario: string;
  questionCount: number;
  status: string;
  questions?: GqlInterviewQuestion[];
  answers?: GqlInterviewAnswer[];
  evaluations?: GqlInterviewEvaluation[];
  overallScore?: number;
  jobDescription?: string;
  createdAt: string;
  updatedAt: string;
}

export interface GqlGenerateInterviewResult {
  questions: GqlInterviewQuestion[];
  interview: GqlFrenchInterview;
}

export interface GqlEvaluateInterviewResult {
  evaluation: GqlInterviewEvaluation;
  interview: GqlFrenchInterview;
}

export interface GqlInterviewHint {
  hint: string;
  keyPoints: string;
  exampleAnswer: string;
}

export interface GqlPronunciationFeedback {
  overallScore: number;
  clarityScore: number;
  accuracyScore: number;
  fluencyScore: number;
  feedback: string;
  improvements: Array<{ text: string; suggestion: string }>;
}

export interface GqlSendMessageResult {
  conversationId: string;
  response: GqlFrenchMessage;
}

export interface GqlGenerateCoverLetterResult {
  coverLetter: GqlCoverLetter;
  content?: string;
}
