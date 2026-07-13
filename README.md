# JobPilot AI

AI-powered job search platform for software engineers. Track applications, optimize resumes, generate cover letters, prepare for interviews, analyze market trends, practice French — all with AI assistance.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 15, React 19, TypeScript, TailwindCSS, Shadcn UI, TanStack Query |
| Backend | NestJS 11, TypeScript, GraphQL (Apollo), Prisma ORM |
| Database | PostgreSQL 16 |
| AI | OpenRouter (OpenAI-compatible, multi-model) |
| Cache | Redis 7 |
| Container | Docker, Docker Compose |
| Cloud | AWS ECS Fargate, RDS Aurora, S3, Lambda |
| CI/CD | GitHub Actions |
| Testing | Jest (80 API tests), Next.js build (28 pages) |

## Project Structure

```
JobPilotAI/
├── apps/
│   ├── api/                      # NestJS GraphQL API (port 4000)
│   │   ├── src/
│   │   │   ├── main.ts
│   │   │   ├── app.module.ts
│   │   │   ├── common/           # Guards, decorators, interceptors, filters
│   │   │   ├── config/           # App configuration
│   │   │   ├── prisma/           # Prisma module & service
│   │   │   └── modules/
│   │   │       ├── ai/           # AI provider abstraction (OpenRouter)
│   │   │       ├── analytics/    # Dashboard analytics
│   │   │       ├── auth/         # JWT auth (register, login, refresh)
│   │   │       ├── cover-letters/# AI cover letter generation
│   │   │       ├── french-coach/ # French language coach (conversations, vocab, pronunciation, career)
│   │   │       ├── interview-questions/ # AI interview question bank
│   │   │       ├── interviews/   # Interview tracking & prep
│   │   │       ├── jobs/         # Job tracking CRUD + import
│   │   │       ├── linkedin-optimizer/ # LinkedIn profile optimization
│   │   │       ├── market-analytics/ # Market data
│   │   │       ├── resumes/      # Resume upload, parsing, management
│   │   │       ├── scraper/      # Job board scraper (LinkedIn, Indeed, etc.)
│   │   │       ├── skill-gap-reports/ # Skill gap analysis history
│   │   │       ├── skills/       # Skill gap analysis
│   │   │       ├── subscription/ # Tier management
│   │   │       └── users/        # User profile management
│   │   ├── prisma/
│   │   │   ├── schema.prisma
│   │   │   └── seed.ts
│   │   └── Dockerfile
│   └── web/                      # Next.js App Router frontend (port 3001)
│       ├── app/                  # App Router pages
│       │   ├── (auth)/           # Login, Register (shared AuthLayout)
│       │   └── dashboard/        # Authenticated pages
│       │       ├── analytics/
│       │       ├── cover-letters/
│       │       ├── french/       # French Coach (6 sub-pages)
│       │       ├── interviews/
│       │       ├── jobs/
│       │       ├── linkedin/     # LinkedIn Optimizer (6 sub-pages)
│       │       ├── resumes/
│       │       ├── scraper/
│       │       ├── settings/
│       │       └── skills/
│       ├── components/
│       │   ├── ui/               # Shared UI components
│       │   │   ├── auth-layout.tsx
│       │   │   ├── badge.tsx, button.tsx, card.tsx
│       │   │   ├── input.tsx, textarea.tsx, select.tsx, password-input.tsx
│       │   │   ├── page-header.tsx, loading-state.tsx, empty-state.tsx
│       │   │   ├── progress-bar.tsx, score-bar.tsx, stat-card.tsx
│       │   │   ├── spinner.tsx, theme-toggle.tsx
│       │   ├── voice/            # Voice input component (SpeechRecognition + MediaRecorder)
│       │   ├── forms/, charts/, linkedin-optimizer/
│       │   └── shared/
│       └── lib/
│           ├── graphql/          # 56 GraphQL operations (index.ts + client.ts)
│           ├── constants/        # Shared constants (french-scenarios.ts)
│           └── hooks/            # Custom hooks (use-auth, etc.)
├── docker-compose.yml
├── .env.example
├── PRD.md
└── docs/system-design.md
```

## Quick Start

### Prerequisites
- Docker & Docker Compose
- Node.js 22+ (for local development)

### Development (with Docker)

```bash
git clone <repo-url> JobPilotAI
cd JobPilotAI

# Start all services
docker compose up -d --build

# Access
# Frontend: http://localhost:3001
# GraphQL Playground: http://localhost:4000/graphql
```

### Local Development (without Docker)

```bash
# Backend
cd apps/api
cp ../../.env.example .env
npm install
npx prisma generate
npx prisma migrate dev
npx prisma db seed
npm run start:dev

# Frontend (separate terminal)
cd apps/web
npm install
npx next dev -p 3001
```

## AI Setup (OpenRouter)

This project uses [OpenRouter](https://openrouter.ai/) for AI features. OpenRouter provides free and paid AI models through a single OpenAI-compatible API.

1. Go to [openrouter.ai/keys](https://openrouter.ai/keys) and sign up
2. Create a free API key
3. Add to `.env`:

```bash
OPENROUTER_API_KEY=sk-or-v1-your-key-here
OPENROUTER_BASE_URL=https://openrouter.ai/api/v1
OPENROUTER_MODEL=openrouter/free
```

**Switching models:** Set `OPENROUTER_MODEL` to `openai/gpt-4o`, `anthropic/claude-3.5-sonnet`, etc.

**Provider abstraction:** Create a new class implementing `AIProvider` in `apps/api/src/modules/ai/providers/`, set `AI_PROVIDER` env var, register in `ai.module.ts`.

### Demo Credentials

| Role | Email | Password |
|------|-------|----------|
| Demo User | demo@jobpilot.ai | demo1234 |

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
- **Conversations** — 5 scenarios (Job Interview, Recruiter Call, Team Meeting, etc.) with AI-powered responses
- **Voice Mode** — Speech-to-text + recording via browser Web Speech API + `MediaRecorder`
- **Pronunciation Scoring** — AI-powered evaluation (overall, clarity, accuracy, fluency) with improvement suggestions
- **Vocabulary Tracking** — Track words, mark learned/difficult, spaced repetition review
- **Cultural Tips** — France & Quebec French cultural tips
- **Interview Coach** — Role-play interviews (Frontend Developer, Full Stack, Team Lead)
- **Career Integration** — Generate personalized French interview questions from resume + saved jobs
- **Progress Tracking** — Score history, per-scenario stats, session history

## API

GraphQL endpoint at `/graphql` (port 4000). All mutations/queries (except `login`, `register`, `refreshToken`) require JWT auth via `@UseGuards(JwtAuthGuard)`.

### Key Queries
```graphql
query { me { id email firstName lastName subscription { tier } } }
query { jobs(pagination: { page: 1, limit: 20 }) { edges { id companyName jobTitle status } meta { total totalPages } } }
query { funnelAnalytics { saved applied phoneScreen technical onsite offer } }
query { frenchProfile { frenchLevel frenchVariant targetRole } }
query { frenchConversations { id scenario createdAt } }
```

### Key Mutations
```graphql
mutation { login(input: { email: "demo@jobpilot.ai", password: "demo1234" }) { accessToken refreshToken } }
mutation { createJob(input: { companyName: "Shopify", jobTitle: "Senior Developer" }) { id status } }
mutation { generateCoverLetter(input: { jobTitle: "Senior Developer", companyName: "Shopify", jobDescription: "..." }) { content } }
mutation { evaluateFrenchPronunciation(input: { spokenText: "Bonjour", expectedText: "Bonjour" }) { overallScore clarityScore accuracyScore fluencyScore feedback } }
mutation { scrapeJobs(input: { keywords: "software engineer", location: "Toronto" }) { total imported jobs { companyName jobTitle } } }
```

## Testing

```bash
# API (80 tests, 8 suites)
cd apps/api && npm test

# Frontend build check
cd apps/web && npx next build

# Frontend tests
cd apps/web && npm test

# Lint
npm run lint
```

## Architecture Decisions

| Decision | Rationale |
|----------|-----------|
| **GraphQL over REST** | Flexible queries for dashboard analytics, reduces over-fetching |
| **Prisma over TypeORM** | Better DX, type safety, migration tooling (engine=none on Windows) |
| **Next.js App Router** | React Server Components, streaming, SEO |
| **ECS Fargate over Lambda** | Predictable performance for long-running AI requests |
| **TanStack Query** | Caching, retry, optimistic updates |
| **Shadcn UI** | Full control over styling, no CSS conflicts |
| **OpenRouter over direct OpenAI** | Multi-model flexibility, free tier available |
| **Turborepo monorepo** | Shared configs, parallel builds, single repo |

## Deployment

```bash
# Production build
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build
```

See `PRD.md` and `docs/system-design.md` for infrastructure architecture and AWS deployment details.

## License

MIT
