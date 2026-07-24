# JobPilot AI — Product Requirements Document

## 1. Executive Summary

JobPilot AI is a production-grade SaaS platform that helps job seekers manage their job search end-to-end. It combines traditional applicant tracking with AI-powered tools for resume optimization, cover letter generation, interview preparation, bilingual conversation coaching (French/English), and market analytics.

**Target Users:** Any job seeker actively searching and preparing for employment — including software engineers, healthcare workers, tradespeople, office staff, and more. Supports both English and French (France and Quebec) language modes for bilingual Canadian job seekers.

## 2. Product Vision

Become the single source of truth for any job seeker's search — reducing time-to-offer by 40% through AI-assisted preparation, bilingual language coaching, and data-driven strategy.

## 3. Core Features

### 3.1 Authentication & User Management
- JWT-based auth with refresh tokens
- Email + password registration/login
- Google OAuth (future)
- Profile management (name, title, target role, experience level, target locations)
- Subscription tier management

### 3.2 Job Tracking
- **Job Postings:** Save jobs with URL, company, role, location, salary range, description
- **Application Pipeline:** Saved → Applied → Phone Screen → Technical → On-site → Offer → Accepted/Rejected
- **Status Tracking:** Drag-and-drop kanban board or list view
- **Interview Tracking:** Date, round, type (phone/technical/behavioral), notes, follow-up
- **Rejection Tracking:** Reason, feedback, date
- **Offer Tracking:** Salary, equity, benefits, deadline, comparison view

### 3.3 Analytics Dashboard
- **Funnel Analytics:** Saved → Applied → Screen → Interview → Offer conversion rates
- **Monthly Statistics:** Applications/week, interviews/week, offer rate
- **Company Analytics:** Response rates by company, time-to-response, interview rates
- **Skills Demand Analytics:** Most requested skills/technologies from saved jobs
- **Salary Analytics:** Salary ranges by role, experience, location (from job data)

### 3.4 Resume Manager
- Upload & store multiple resume versions (PDF, DOCX)
- Parse resume content (skills, experience, education)
- **Resume Optimization:** Compare resume against job description, suggest keywords and rewrites
- Version history and change tracking

### 3.5 AI Cover Letter Generator
- Generate tailored cover letters from:
  - Job description
  - User's resume
  - Company research context
- Multiple tone options (professional, passionate, concise)
- Edit and save generated letters
- Export as PDF

### 3.6 AI Interview Preparation
- **Technical Questions:** Generate role-specific coding/system design questions
- **Behavioral Questions:** Generate STAR-method questions from resume + job description
- **Mock Interview Simulator:** AI-powered interview simulation with real-time feedback
- **Question Bank:** Save and organize interview questions
- **English Interview Practice:** Industry-specific practice scenarios (Frontend, Full Stack, Team Lead, Behavioral, Custom Job)
- **AI Hints:** Get contextual hints during interview practice and conversations
- **Custom Job Descriptions:** Practice with scenarios tailored to specific job postings

### 3.7 Skill Gap Analysis
- Parse job description required skills
- Compare against user's resume/self-reported skills
- Generate personalized learning roadmap
- Recommend courses, books, projects

### 3.8 LinkedIn Job Import
- Manual job save with URL, title, company, description
- Future: Browser extension for one-click import

### 3.9 French Language Coach
- **Conversational Practice:** AI-powered French conversations for workplace scenarios (job interviews, recruiter calls, team meetings, daily standups, office chat)
- **Interview Coaching:** French interview practice with AI evaluation and scoring
- **Quebec French Support:** Authentic Quebec French variant with cultural context
- **France French Support:** Standard Metropolitan French variant
- **Custom Job Scenarios:** Tailored conversations based on specific job descriptions
- **Vocabulary Builder:** Track, review, and learn French workplace vocabulary
- **Cultural Tips:** Contextual advice for Canadian workplace culture
- **Speech Synthesis:** Text-to-speech for pronunciation practice (browser-based)
- **AI Hints:** Get contextual hints during conversations and interviews

### 3.10 English Interview Practice
- **Industry Scenarios:** Frontend, Full Stack, Team Lead, Behavioral
- **Custom Job Descriptions:** Practice interviews tailored to specific job postings
- **AI Evaluation:** Real-time scoring with feedback and example answers
- **AI Hints:** Get contextual hints during practice sessions

### 3.11 Market Analytics
- **Skills Demand:** Trend analysis of most requested skills over time
- **Technology Stack:** Most requested tech stacks by role
- **Salary Analytics:** Salary range analysis by role, experience, location
- **Demand Trends:** Monthly/quarterly hiring demand visualization

### 3.12 Internationalization (i18n)
- **Bilingual Support:** English (default) and French (via next-intl)
- **French Variants:** Metropolitan French (fr-FR) and Quebec French (fr-CA)
- **Per-Section Dictionaries:** 16 flat JSON dictionary files per locale under `messages/{locale}/`
  - Keys are English text itself; values are translations (identity mapping for EN)
  - Sections: analytics, auth, common, cover-letters, dashboard, french-coach, interview-coach, interviews, jobs, language, linkedin, nav, resumes, scraper, settings, skills
- **Locale Routing:** `middleware.ts` handles locale detection; `as-needed` prefix strategy
- **Language Switcher:** Client-side locale switching via `next-intl/navigation` with `startTransition`
- **Content Translation:** All user-facing UI text translated; AI-generated content in French or English depending on context

### 3.13 System Reliability
- **Hydration Safety:** Single provider tree (no duplicate providers); ToasterProvider rendered via `next/dynamic` with `ssr: false`
- **Theme Provider:** Always renders context wrapper; mount-guarded UI for client-only state (localStorage, matchMedia)
- **Zero TypeScript `any` Types:** Both API and frontend compile with strict mode, zero errors

## 4. User Roles & Permissions

| Role | Permissions |
|------|------------|
| **Anonymous** | Landing page, pricing, login/register |
| **Free User** | Up to 10 saved jobs, basic analytics, 3 AI cover letters/month, 1 resume, basic French coach |
| **Pro User** | Unlimited jobs, full analytics, unlimited AI generations, resume optimization, interview prep, skill gap analysis, full French/English language coaching, custom job scenarios |
| **Admin** | User management, system config, subscription management, content moderation |

## 5. Non-Functional Requirements

### 5.1 Performance
- API response time < 200ms (p95) for non-AI endpoints
- AI generation < 5 seconds (p95)
- Page load < 2 seconds (p75)
- Support 1000 concurrent users per instance

### 5.2 Security
- JWT tokens with 15min access / 7d refresh
- Rate limiting: 100 req/min per user
- API key for AI services
- Data encryption at rest (AES-256) and in transit (TLS 1.3)
- GDPR compliant data export/deletion

### 5.3 Availability
- 99.5% uptime SLA
- Automated backups (daily)
- Multi-AZ deployment (production)

### 5.4 Scalability
- Horizontal scaling via ECS Fargate
- Read replicas for analytics queries
- CDN for static assets
- Redis caching for hot data

## 6. Monetization
- Free tier: Limited features (acquisition)
- Pro tier: $9.99/month (core revenue)
- Annual discount: 20% off

## 7. Success Metrics
- MAU (Monthly Active Users)
- Job-to-Offer conversion rate improvement
- AI feature usage rate
- Subscription conversion rate
- NPS score

---

# System Architecture

## 1. High-Level Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    CloudFront / ALB                       │
└──────────┬──────────────────────────────────┬───────────┘
           │                                  │
    ┌──────▼───────┐                ┌─────────▼──────────┐
    │  Next.js App  │                │  NestJS GraphQL    │
    │  (Frontend)   │                │  API (Backend)     │
    │  ECS Fargate  │                │  ECS Fargate       │
    └──────┬───────┘                └──┬──────┬──────────┘
           │                            │      │
           │                     ┌──────▼──┐ ┌─▼──────────┐
           │                     │ Prisma  │ │ OpenAI SDK │
           │                     │ ORM     │ │ (AI Svcs)  │
           │                     └────┬────┘ └────────────┘
           │                          │
           │                    ┌─────▼──────┐
           │                    │ PostgreSQL │
           │                    │ (Aurora)    │
           │                    └────────────┘
           │
    ┌──────▼──────┐
    │  S3 Bucket  │
    │ (Resumes,   │
    │  Docs,      │
    │  Assets)    │
    └─────────────┘
```

## 2. Frontend Architecture (Next.js)

### Directory Structure
```
apps/web/
├── app/
│   ├── layout.tsx                # Root layout (no providers)
│   ├── (auth)/                   # Auth pages (login, register)
│   └── [locale]/                 # Locale-prefixed routes
│       ├── layout.tsx            # Providers: NextIntl, Theme, Query, Toaster
│       └── dashboard/
│           ├── page.tsx          # Dashboard overview
│           ├── jobs/             # Job tracking (kanban/list)
│           ├── analytics/        # Dashboard & analytics
│           ├── resumes/          # Resume management
│           ├── cover-letters/    # Cover letter generator
│           ├── interviews/       # Interview tracking & English practice
│           ├── interview-coach/  # AI interview coach (FR/EN)
│           ├── skills/           # Skill gap analysis
│           ├── settings/         # User profile & settings
│           ├── scraper/          # Job scraping
│           ├── linkedin/         # LinkedIn optimizer (5 sub-pages)
│           └── french/           # French language coach (6 sub-pages)
├── components/
│   ├── ui/               # Shadcn UI components
│   ├── voice/            # Voice input, playback, speech synthesis
│   └── providers/        # query-provider, toaster-provider
├── i18n/
│   ├── request.ts        # Merges 16 per-section flat JSON files
│   └── routing.ts        # Locales, navigation helpers
├── messages/
│   ├── en/               # 16 flat dictionaries (EN keys = EN values)
│   └── fr/               # 16 flat dictionaries (EN keys → FR values)
└── lib/
    ├── graphql/          # GraphQL queries, mutations, types
    ├── hooks/            # Custom hooks (use-auth)
    └── theme.tsx         # ThemeProvider (dark/light)
```

### State Management
- **TanStack Query:** Server state (API data)
- **React Context/State:** UI state (theme, sidebar, modals)
- **Zustand (optional):** Complex client state

### Key Libraries
- `@tanstack/react-query` — Server state & caching
- `graphql-request` — GraphQL client
- `next-intl` — Internationalization (EN/FR bilingual)
- `sonner` — Toast notifications
- `recharts` — Charts
- `react-dropzone` — File upload
- `lucide-react` — Icons

## 3. Backend Architecture (NestJS + GraphQL)

### Directory Structure
```
apps/api/
├── src/
│   ├── main.ts
│   ├── app.module.ts
│   ├── modules/
│   │   ├── auth/
│   │   ├── users/
│   │   ├── jobs/
│   │   ├── resumes/
│   │   ├── cover-letters/
│   │   ├── interviews/
│   │   ├── skills/
│   │   ├── analytics/
│   │   ├── ai/                    # AI orchestration (Ollama provider)
│   │   ├── french-coach/          # French conversations, interviews, vocabulary, cultural
│   │   ├── english-interview/     # English interview practice
│   │   ├── linkedin/              # LinkedIn profile optimizer
│   │   ├── scraper/               # Job scraping via ATS providers
│   │   └── subscription/
│   ├── prisma/
│   │   ├── prisma.module.ts
│   │   └── prisma.service.ts
│   └── config/
│       ├── config.module.ts
│       └── config.service.ts
├── prisma/
│   ├── schema.prisma              # 21 models
│   └── seed.ts
└── test/
```

### Design Patterns
- **Repository Pattern:** Prisma service abstracts DB access
- **CQRS:** Separate read/write models for analytics
- **Event-Driven:** Domain events for async workflows (e.g., resume uploaded → trigger AI analysis)
- **Dependency Injection:** NestJS built-in DI for all services
- **Feature Modules:** Each domain has its own module

## 4. Database Schema (PostgreSQL via Prisma)

### Entity Relationship Summary (21 Models)
```
User (1) ──── (N) JobApplication
User (1) ──── (N) Resume
User (1) ──── (N) CoverLetter
User (1) ──── (N) InterviewQuestion
User (1) ──── (N) SkillGapReport
User (1) ──── (N) LinkedinOptimization
User (1) ──── (N) EnglishInterviewPractice
User (1) ──── (1) FrenchProfile
User (1) ──── (1) Subscription

FrenchProfile (1) ──── (N) FrenchConversation
FrenchProfile (1) ──── (N) FrenchVocabularyWord
FrenchProfile (1) ──── (N) FrenchVocabulary
FrenchProfile (1) ──── (N) FrenchInterview

FrenchConversation (1) ──── (N) FrenchMessage
FrenchMessage (1) ──── (1) FrenchEvaluation

JobApplication (1) ──── (N) Interview
JobApplication (1) ──── (N) ApplicationEvent
```

(See `database/schema.prisma` for complete schema)

## 5. GraphQL Schema

### Root Types
```graphql
type Query {
  # Jobs
  jobs(filter: JobFilter, pagination: PaginationInput): JobConnection!
  job(id: ID!): Job
  jobStats: JobStats!

  # Analytics
  funnelAnalytics: FunnelAnalytics!
  monthlyStats(from: DateTime!, to: DateTime!): [MonthlyStat!]!
  companyAnalytics: [CompanyAnalytics!]!
  skillsDemand: [SkillDemand!]!

  # Resumes
  resumes: [Resume!]!
  resume(id: ID!): Resume

  # Cover Letters
  coverLetters: [CoverLetter!]!

  # Interview Prep
  interviewQuestions(jobId: ID): [InterviewQuestion!]!
  generateInterviewQuestions(jobId: ID!, type: QuestionType!): [InterviewQuestion!]!

  # Skill Gap
  skillGapAnalysis(jobId: ID!): SkillGapAnalysis!

  # Market Analytics
  marketSkillsDemand: [SkillDemand!]!
  salaryAnalytics(role: String, location: String): SalaryAnalytics!
  demandTrends: [DemandTrend!]!

  # User
  me: User!
}

type Mutation {
  # Auth
  register(input: RegisterInput!): AuthPayload!
  login(input: LoginInput!): AuthPayload!
  refreshToken(token: String!): AuthPayload!

  # Jobs
  createJob(input: CreateJobInput!): JobApplication!
  updateJob(id: ID!, input: UpdateJobInput!): JobApplication!
  deleteJob(id: ID!): Boolean!
  updateJobStatus(id: ID!, status: JobStatus!): JobApplication!

  # Resumes
  uploadResume(file: Upload!, title: String!): Resume!
  deleteResume(id: ID!): Boolean!

  # Cover Letters
  generateCoverLetter(input: CoverLetterInput!): CoverLetter!
  saveCoverLetter(id: ID!, content: String!): CoverLetter!
  deleteCoverLetter(id: ID!): Boolean!

  # Interviews
  addInterview(jobId: ID!, input: CreateInterviewInput!): Interview!
  updateInterview(id: ID!, input: UpdateInterviewInput!): Interview!

  # Profile
  updateProfile(input: UpdateProfileInput!): User!
}
```

## 6. Infrastructure Architecture

### Development (Local)
```
Docker Compose:
├── postgres:16-alpine
├── backend (NestJS, hot-reload)
├── frontend (Next.js, hot-reload)
└── redis:7-alpine (caching)
```

### Production (AWS)
```
CloudFront ──► ALB ──► ECS Fargate (Next.js)
                 ├──► ECS Fargate (NestJS)
                 └──► ECS Fargate (GraphQL)

RDS Aurora PostgreSQL (Multi-AZ)
ElastiCache Redis (Primary + Replica)
S3 (Resumes, Assets, Backups)
Lambda (AI async processing, thumbnails)
Route53 (DNS)
```

## 7. Development Roadmap

### Phase 1: Foundation (Weeks 1-2)
- [x] PRD & Architecture docs
- [x] Monorepo setup (Turborepo)
- [x] Docker Compose setup (Postgres, Redis, WMS)
- [x] Prisma schema + migrations
- [x] GraphQL schema + codegen
- [x] Auth module (register/login/JWT)
- [x] Next.js project setup with Tailwind + Shadcn
- [x] Basic CI/CD pipeline
- [x] Ollama AI integration (qwen2.5:7b, phi3:mini)

### Phase 2: Core Features (Weeks 3-4)
- [x] Job tracking CRUD
- [x] Application pipeline (kanban)
- [x] Resume upload & storage
- [x] AI cover letter generation
- [x] Basic analytics dashboard

### Phase 3: AI Features (Weeks 5-6)
- [x] Resume optimization against JD
- [x] Interview question generation
- [x] Skill gap analysis
- [x] Advanced analytics
- [x] French language coach (conversations, interviews, vocabulary, cultural tips)
- [x] English interview practice (5 scenarios, custom job descriptions)
- [x] AI hints for conversations and interviews
- [x] Custom job description scenarios

### Phase 4: Polish (Weeks 7-8)
- [x] Market analytics
- [x] Subscription management
- [x] Advanced filtering/search
- [x] Export functionality
- [x] Speech synthesis for French pronunciation
- [x] Quebec French variant support
- [ ] Performance optimization
- [ ] Playwright tests
- [ ] Production deployment

## 8. Tradeoffs & Decisions

| Decision | Rationale | Tradeoff |
|----------|-----------|----------|
| **GraphQL over REST** | Flexible queries for dashboard analytics, reduces over-fetching | Caching complexity, learning curve |
| **Prisma over TypeORM** | Better DX, type safety, migration tooling | Lock-in to Prisma-supported DBs |
| **Next.js App Router** | React Server Components, streaming, SEO | More complex routing than Pages Router |
| **ECS Fargate over Lambda** | Predictable performance for long-running AI requests | Higher baseline cost |
| **Ollama (local LLM)** | Free, private AI inference — qwen2.5:7b primary, phi3:mini fallback | Requires local hardware, slower than cloud APIs |
| **next-intl (flat dictionaries)** | English text as keys — zero `any` types, per-section loading, easy FR translation | Keys must avoid dots; tightly coupled to English wording |
| **Single provider tree** | Root layout has no providers; all in `[locale]/layout.tsx` — prevents ForwardRef hydration errors | Providers re-mount on locale change |
| **Toaster via dynamic import** | `ssr: false` prevents sonner's setState-during-render conflict | Extra client bundle on mount |
| **TanStack Query** | Caching, retry, optimistic updates for great UX | Bundle size |
| **Shadcn UI** | Full control over styling, no CSS conflicts | No pre-built themes |
| **Zero `any` types** | Strict TypeScript across API + frontend, safer refactoring | More verbose type annotations |
