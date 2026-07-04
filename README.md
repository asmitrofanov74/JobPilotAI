# JobPilot AI

AI-powered job search platform for software engineers. Track applications, optimize resumes, generate cover letters, prepare for interviews, and analyze market trends.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 15, React 19, TypeScript, TailwindCSS, Shadcn UI, TanStack Query |
| Backend | NestJS 11, TypeScript, GraphQL (Apollo), Prisma ORM |
| Database | PostgreSQL 16 |
| AI | OpenAI SDK |
| Cache | Redis 7 |
| Container | Docker, Docker Compose |
| Cloud | AWS ECS Fargate, RDS Aurora, S3, Lambda |
| CI/CD | GitHub Actions |
| Testing | Jest, Playwright |

## Project Structure

```
JobPilotAI/
├── backend/                  # NestJS GraphQL API
│   ├── src/
│   │   ├── main.ts           # Entry point
│   │   ├── app.module.ts     # Root module
│   │   ├── common/           # Shared (guards, decorators, filters)
│   │   ├── config/           # App configuration
│   │   ├── prisma/           # Prisma module & service
│   │   └── modules/          # Feature modules
│   │       ├── auth/         # Authentication (JWT, register, login)
│   │       ├── users/        # User profile management
│   │       ├── jobs/         # Job tracking CRUD
│   │       ├── resumes/      # Resume upload & management
│   │       ├── cover-letters/ # AI cover letter generation
│   │       ├── interviews/   # Interview tracking & prep
│   │       ├── skills/       # Skill gap analysis
│   │       ├── analytics/    # Dashboard analytics
│   │       ├── ai/           # AI service integrations
│   │       ├── subscription/ # Tier management
│   │       └── market-analytics/ # Market data
│   ├── prisma/
│   │   ├── schema.prisma     # Database schema
│   │   └── seed.ts           # Seed data
│   └── Dockerfile
├── frontend/                 # Next.js App
│   ├── app/                  # App Router pages
│   ├── components/           # UI components
│   │   ├── ui/               # Shadcn UI primitives
│   │   ├── forms/            # Form components
│   │   ├── charts/           # Chart components
│   │   └── shared/           # Shared components
│   ├── lib/                  # Utilities, hooks, GraphQL
│   └── types/                # TypeScript types
├── graphql/                  # GraphQL schema documentation
├── docker-compose.yml
├── .env.example
└── PRD.md                    # Product Requirements Document
```

## Quick Start

### Prerequisites
- Docker & Docker Compose
- Node.js 22+ (for local development)

### Development

```bash
# Clone and start
git clone <repo-url> JobPilotAI
cd JobPilotAI

# Start all services
docker compose up -d --build

# Access
# Frontend: http://localhost:3000
# GraphQL Playground: http://localhost:4000/graphql
```

### Local Development (without Docker)

```bash
# Backend
cd backend
cp ../.env.example .env
npm install
npx prisma generate
npx prisma migrate dev
npx prisma db seed
npm run start:dev

# Frontend (separate terminal)
cd frontend
cp ../.env.example .env.local
npm install
npm run dev
```

### Demo Credentials

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@jobpilot.ai | admin123 |
| Demo User | demo@jobpilot.ai | demo1234 |

## API

The API is served via GraphQL at `/graphql`.

### Key Queries
```graphql
# Get current user
query { me { id email firstName lastName subscription { tier } } }

# List jobs with pagination
query {
  jobs(pagination: { page: 1, limit: 20 }) {
    edges { id companyName jobTitle status }
    meta { total totalPages }
  }
}

# Analytics
query {
  funnelAnalytics { saved applied phoneScreen technical onsite offer }
  monthlyStats(from: "2026-01-01", to: "2026-12-31") { month applications interviews }
}
```

### Key Mutations
```graphql
# Register
mutation { register(input: { email: "...", password: "...", firstName: "...", lastName: "..." }) { accessToken user { id } } }

# Login
mutation { login(input: { email: "admin@jobpilot.ai", password: "admin123" }) { accessToken refreshToken } }

# Create job
mutation { createJob(input: { companyName: "Shopify", jobTitle: "Senior Developer" }) { id status } }

# Generate cover letter (AI)
mutation { generateCoverLetter(input: { jobTitle: "Senior Developer", companyName: "Shopify", jobDescription: "..." }) { content } }
```

## Architecture Decisions

| Decision | Rationale |
|----------|-----------|
| **GraphQL over REST** | Flexible queries for dashboard analytics, reduces over-fetching |
| **Prisma over TypeORM** | Better DX, type safety, migration tooling |
| **Next.js App Router** | React Server Components, streaming, SEO |
| **ECS Fargate over Lambda** | Predictable performance for long-running AI requests |
| **TanStack Query** | Caching, retry, optimistic updates |
| **Shadcn UI** | Full control over styling, no CSS conflicts |

## Deployment

```bash
# Production build
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build
```

See `PRD.md` for complete infrastructure architecture and AWS deployment details.

## Testing

```bash
# Backend
cd backend && npm test

# Frontend
cd frontend && npm test

# E2E
cd frontend && npx playwright test
```

## License

MIT
