# JobPilot AI

AI-powered job search platform for software engineers. Track applications, optimize resumes, generate cover letters, prepare for interviews, analyze market trends, practice French — all with AI assistance. Runs locally with Ollama (no cloud API required).

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 15, React 19, TypeScript (strict mode), TailwindCSS, Shadcn UI |
| Backend | NestJS 11, TypeScript (strict mode), GraphQL (Apollo), Prisma ORM |
| Database | PostgreSQL 16 |
| AI | Ollama (local) or OpenRouter (cloud) — provider-switchable via env var |
| Cache | Redis 7 |
| Monorepo | Turborepo |
| Container | Docker, Docker Compose |
| Cloud | AWS ECS Fargate, RDS Aurora, S3, Lambda |
| CI/CD | GitHub Actions |
| Testing | Jest, Playwright |

## Project Structure

```
JobPilotAI/
├── apps/
│   ├── api/                          # NestJS GraphQL API (port 4000)
│   │   ├── src/
│   │   │   ├── main.ts
│   │   │   ├── app.module.ts
│   │   │   ├── common/               # Guards, decorators, interceptors, filters
│   │   │   ├── config/               # App configuration
│   │   │   ├── prisma/               # Prisma module & service
│   │   │   └── modules/
│   │   │       ├── ai/               # AI provider abstraction (Ollama / OpenRouter)
│   │   │       ├── analytics/        # Dashboard analytics
│   │   │       ├── auth/             # JWT auth (register, login, refresh)
│   │   │       ├── cover-letters/    # AI cover letter generation
│   │   │       ├── french-coach/     # French language coach
│   │   │       ├── interview-questions/ # AI interview question bank
│   │   │       ├── interviews/       # Interview tracking & prep
│   │   │       ├── jobs/             # Job tracking CRUD + import
│   │   │       ├── linkedin-optimizer/ # LinkedIn profile optimization
│   │   │       ├── market-analytics/ # Market data
│   │   │       ├── resumes/          # Resume upload, parsing, management
│   │   │       ├── scraper/          # Job board scraper
│   │   │       ├── skill-gap-reports/ # Skill gap analysis history
│   │   │       ├── skills/           # Skill gap analysis
│   │   │       ├── subscription/     # Tier management
│   │   │       └── users/            # User profile management
│   │   ├── prisma/
│   │   │   ├── schema.prisma
│   │   │   └── seed.ts
│   │   └── Dockerfile
│   └── web/                          # Next.js App Router frontend (port 3001)
│       ├── app/
│       │   ├── (auth)/               # Login, Register (shared AuthLayout)
│       │   └── dashboard/            # Authenticated pages
│       │       ├── analytics/
│       │       ├── cover-letters/
│       │       ├── french/           # French Coach (6 sub-pages)
│       │       │   ├── conversations/
│       │       │   ├── interview/
│       │       │   ├── vocabulary/
│       │       │   ├── cultural/
│       │       │   └── progress/
│       │       ├── interviews/
│       │       ├── jobs/
│       │       ├── linkedin/         # LinkedIn Optimizer (6 sub-pages)
│       │       ├── resumes/
│       │       ├── scraper/
│       │       ├── settings/
│       │       └── skills/
│       ├── components/
│       │   ├── ui/                   # Shared UI components (Shadcn)
│       │   ├── voice/                # Voice input + TTS playback
│       │   ├── forms/, charts/
│       │   ├── linkedin-optimizer/
│       │   └── shared/
│       └── lib/
│           ├── graphql/
│           │   ├── client.ts         # GraphQL client with JWT refresh
│           │   ├── types.ts          # Shared TypeScript interfaces for all GraphQL responses
│           │   └── index.ts          # 56+ GraphQL operations (queries + mutations)
│           ├── constants/            # Shared constants (french-scenarios.ts)
│           └── hooks/                # Custom hooks (use-auth, etc.)
├── infrastructure/
│   └── docker/
│       └── docker-compose.yml
├── packages/                         # Shared packages
├── .env.example
├── turbo.json
├── PRD.md
└── docs/system-design.md
```

## Quick Start

### Prerequisites

- Node.js 22+
- Docker & Docker Compose (for PostgreSQL + Redis)
- [Ollama](https://ollama.com) (for local AI — recommended) **or** an OpenRouter API key

### 1. Start infrastructure (PostgreSQL + Redis)

```bash
docker compose -f infrastructure/docker/docker-compose.yml up -d
```

### 2. Install dependencies and set up the backend

```bash
# Install all workspace dependencies
npm install

# Configure environment
cd apps/api
cp ../../.env.example .env
# Edit .env — see AI Setup below

# Set up database
npx prisma generate
npx prisma migrate dev
npx prisma db seed

# Start API
npm run start:dev
# API running at http://localhost:4000
```

### 3. Start the frontend (separate terminal)

```bash
cd apps/web
npx next dev -p 3001
# Frontend running at http://localhost:3001
```

### Demo Credentials

| Role | Email | Password |
|------|-------|----------|
| Demo User | demo@jobpilot.ai | demo1234 |

## AI Setup

The project supports two AI providers, switchable via the `AI_PROVIDER` environment variable in `apps/api/.env`.

### Option A: Ollama (local, recommended)

No API key required. Runs entirely on your machine.

```bash
# Install Ollama — https://ollama.com/download
# Pull a model
ollama pull phi3:mini

# In apps/api/.env:
AI_PROVIDER=ollama
OLLAMA_BASE_URL=http://127.0.0.1:11434/v1
OLLAMA_MODEL=phi3:mini
```

Other models that work well: `llama3.1`, `mistral`, `qwen2.5:7b`.

### Option B: OpenRouter (cloud)

```bash
# In apps/api/.env:
AI_PROVIDER=openrouter
OPENROUTER_API_KEY=sk-or-v1-your-key-here
OPENROUTER_BASE_URL=https://openrouter.ai/api/v1
OPENROUTER_MODEL=openrouter/free
```

**Switching models:** Set `OPENROUTER_MODEL` to `openai/gpt-4o`, `anthropic/claude-3.5-sonnet`, etc.

### Adding a new provider

Create a class implementing `AIProvider` in `apps/api/src/modules/ai/providers/`, set `AI_PROVIDER` env var, and register in `ai.module.ts`.

## Features

### Core

- **Job Tracking** — Save jobs, track pipeline (Saved → Applied → Screen → Interview → Offer), import via scraper
- **Resume Manager** — Upload (PDF/DOCX), parse skills/experience/education, set primary
- **AI Cover Letters** — Generate tailored cover letters from job description + resume
- **Interview Prep** — AI-generated technical/behavioral questions, save favorites
- **Skill Gap Analysis** — Compare skills against job descriptions, get recommendations
- **Analytics Dashboard** — Funnel analytics, monthly trends, application stats
- **LinkedIn Optimizer** — Profile analysis, headline generation, about section, experience optimization, resume comparison, visibility scoring
- **Job Scraper** — Multi-provider scraping (LinkedIn, Indeed, ZipRecruiter, Workopolis, Greenhouse, Lever, Workday)

### French Coach

- **Conversations** — 5 built-in scenarios (Job Interview, Recruiter Call, Team Meeting, etc.) with AI-powered responses
- **Custom Job Descriptions** — Paste a real job posting to generate interview questions tailored to a specific role
- **Voice Input** — Speech-to-text via browser Web Speech API + audio recording via MediaRecorder
- **Text-to-Speech** — Built-in French TTS with auto-detection of `fr-FR` (France) vs `fr-CA` (Quebec) from profile variant
- **Pronunciation Scoring** — AI-powered evaluation (overall, clarity, accuracy, fluency) with improvement suggestions
- **Vocabulary Tracking** — Track words, mark learned/difficult, spaced repetition review
- **Cultural Tips** — France & Quebec French cultural tips
- **Interview Coach** — Role-play interviews (Frontend Developer, Full Stack, Team Lead) with optional custom job description
- **Career Integration** — Generate personalized French interview questions from resume + saved jobs
- **Progress Tracking** — Score history, per-scenario stats, session history

## API

GraphQL endpoint at `http://localhost:4000/graphql`. All mutations/queries (except `login`, `register`, `refreshToken`) require JWT auth via `@UseGuards(JwtAuthGuard)`.

### Key Queries

```graphql
query { me { id email firstName lastName subscription { tier } } }
query { jobs(pagination: { page: 1, limit: 20 }) { edges { id companyName jobTitle status } meta { total totalPages } } }
query { funnelAnalytics { saved applied phoneScreen technical onsite offer } }
query { frenchProfile { id frenchLevel frenchVariant targetRole targetIndustry } }
query { frenchConversations { id scenario createdAt } }
query { frenchProgress { averageScore totalSessions streakDays } }
```

### Key Mutations

```graphql
mutation { login(input: { email: "demo@jobpilot.ai", password: "demo1234" }) { accessToken refreshToken } }
mutation { createJob(input: { companyName: "Shopify", jobTitle: "Senior Developer" }) { id status } }
mutation { generateCoverLetter(input: { jobTitle: "Senior Developer", companyName: "Shopify", jobDescription: "..." }) { content } }
mutation { generateInterviewQuestions(input: { scenario: JOB_INTERVIEW, jobDescription: "..." }) { id questions { id text category } } }
mutation { evaluateFrenchPronunciation(input: { spokenText: "Bonjour", expectedText: "Bonjour" }) { overallScore clarityScore accuracyScore fluencyScore feedback } }
mutation { scrapeJobs(input: { keywords: "software engineer", location: "Toronto" }) { total imported jobs { companyName jobTitle } } }
```

## Testing

```bash
# API tests
cd apps/api && npm test

# Frontend unit tests
cd apps/web && npm test

# Frontend E2E tests
cd apps/web && npm run test:e2e

# Type checking (both apps should produce zero errors)
cd apps/api && npx tsc --noEmit
cd apps/web && npx tsc --noEmit

# Lint
npm run lint
```

## Architecture Decisions

| Decision | Rationale |
|----------|-----------|
| **GraphQL over REST** | Flexible queries for dashboard analytics, reduces over-fetching |
| **Prisma over TypeORM** | Better DX, type safety, migration tooling |
| **Next.js App Router** | React Server Components, streaming, SEO |
| **Ollama as default AI** | Runs locally, no API key needed, no network dependency |
| **AI Provider abstraction** | Swap between Ollama/OpenRouter/custom via single env var |
| **TanStack Query** | Caching, retry, optimistic updates |
| **Shadcn UI** | Full control over styling, no CSS conflicts |
| **Turborepo monorepo** | Shared configs, parallel builds, single repo |
| **TypeScript strict mode** | Both API and frontend compile with zero `any` types |

## Deployment

```bash
# Production build
docker compose -f infrastructure/docker/docker-compose.yml -f infrastructure/docker/docker-compose.prod.yml up -d --build
```

See `PRD.md` and `docs/system-design.md` for infrastructure architecture and AWS deployment details.

## License

MIT
