// Enums
export enum JobStatus {
  SAVED = 'SAVED',
  APPLIED = 'APPLIED',
  PHONE_SCREEN = 'PHONE_SCREEN',
  TECHNICAL = 'TECHNICAL',
  ONSITE = 'ONSITE',
  OFFER = 'OFFER',
  REJECTED = 'REJECTED',
  WITHDRAWN = 'WITHDRAWN',
  ACCEPTED = 'ACCEPTED',
}

export enum InterviewType {
  PHONE = 'PHONE',
  TECHNICAL = 'TECHNICAL',
  BEHAVIORAL = 'BEHAVIORAL',
  SYSTEM_DESIGN = 'SYSTEM_DESIGN',
  CODING = 'CODING',
  ONSITE = 'ONSITE',
  PANEL = 'PANEL',
  TAKE_HOME = 'TAKE_HOME',
}

export enum SubscriptionTier {
  FREE = 'FREE',
  PRO = 'PRO',
}

export enum ApplicationSource {
  MANUAL = 'MANUAL',
  LINKEDIN = 'LINKEDIN',
  INDEED = 'INDEED',
  GLASSDOOR = 'GLASSDOOR',
  COMPANY_SITE = 'COMPANY_SITE',
  REFERRAL = 'REFERRAL',
  OTHER = 'OTHER',
  ZIPRECRUITER = 'ZIPRECRUITER',
  WORKOPOLIS = 'WORKOPOLIS',
  GREENHOUSE = 'GREENHOUSE',
  LEVER = 'LEVER',
  WORKDAY = 'WORKDAY',
}

// Interfaces
export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  title?: string | null;
  targetRole?: string | null;
  experienceLevel?: string | null;
  targetLocations?: string | null;
  summary?: string | null;
  avatarUrl?: string | null;
  isActive: boolean;
  subscription?: Subscription | null;
  createdAt: string;
  updatedAt: string;
}

export interface Subscription {
  id: string;
  tier: SubscriptionTier;
  currentPeriodEnd?: string | null;
  isActive: boolean;
}

export interface JobApplication {
  id: string;
  companyName: string;
  jobTitle: string;
  jobDescription?: string | null;
  jobUrl?: string | null;
  status: JobStatus;
  source?: ApplicationSource | null;
  salaryRange?: string | null;
  location?: string | null;
  notes?: string | null;
  userId: string;
  createdAt: string;
  updatedAt: string;
  interviews?: Interview[];
}

export interface Interview {
  id: string;
  type: InterviewType;
  scheduledAt?: string | null;
  isCompleted: boolean;
  notes?: string | null;
  feedback?: string | null;
  rating?: number | null;
}

export interface Resume {
  id: string;
  title: string;
  fileUrl: string;
  isPrimary: boolean;
  createdAt: string;
}

export interface CoverLetter {
  id: string;
  jobTitle: string;
  companyName: string;
  content: string;
  tone: string;
  createdAt: string;
}

export interface PaginatedResponse<T> {
  edges: T[];
  meta: {
    total: number;
    totalPages: number;
    page: number;
    limit: number;
  };
}

export interface FunnelAnalytics {
  saved: number;
  applied: number;
  phoneScreen: number;
  technical: number;
  onsite: number;
  offer: number;
  rejected: number;
  accepted: number;
}

export interface MonthlyStat {
  month: string;
  applications: number;
  interviews: number;
}
