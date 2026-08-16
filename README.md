# JobPilot AI

AI-powered job-search coaching in a Flutter mobile app, backed by a NestJS
GraphQL API. Prepare for interviews, practice French and English with an AI
recruiter, polish your LinkedIn profile, and build job-specific vocabulary — all
on your phone.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Mobile | Flutter, Dart ^3.11, `graphql_flutter`, `provider`, `shared_preferences`, `flutter_tts`, `speech_to_text` |
| Backend | NestJS 11, TypeScript (strict), GraphQL, Prisma ORM |
| Database | PostgreSQL 16 |
| AI | OpenRouter (cloud) or Ollama (local) — provider-switchable via env var |
| Monorepo | Turborepo |

## Project Structure

```
JobPilotAI/
├── apps/
│   ├── api/                          # NestJS GraphQL API (port 4000)
│   │   ├── src/
│   │   │   ├── main.ts
│   │   │   ├── app.module.ts
│   │   │   ├── prisma/               # Prisma module & service
│   │   │   └── modules/
│   │   │       ├── ai/               # AI provider abstraction (Ollama / OpenRouter)
│   │   │       ├── auth/             # JWT auth (register, login, refresh)
│   │   │       ├── french-coach/     # French conversations, interviews, vocabulary
│   │   │       ├── interviews/       # English interview practice & evaluation
│   │   │       ├── linkedin-optimizer/ # LinkedIn profile optimization
│   │   │       ├── jobs/             # Job tracking CRUD
│   │   │       ├── resumes/          # Resume management
│   │   │       ├── cover-letters/    # AI cover letter generation
│   │   │       ├── subscription/     # Tier management
│   │   │       └── users/            # User profile management
│   │   └── prisma/
│   │       ├── schema.prisma
│   │       └── seed.ts
│   └── mobile/                        # Flutter Android app
│       ├── lib/
│       │   ├── main.dart             # App entry + AuthGate
│       │   ├── auth/                 # Auth state and token handling
│       │   ├── graphql/              # GraphQL client, token refresh, queries
│       │   ├── screens/              # Home + feature screens
│       │   └── french/, interview/, linkedin/, vocabulary/   # Feature layers
│       └── pubspec.yaml
├── PRD.md
└── docs/
```

## Quick Start

### 1. Start the backend

Prerequisites: Node.js 22+, Docker & Docker Compose (PostgreSQL), and either
[Ollama](https://ollama.com) or an OpenRouter API key.

```bash
docker compose -f infrastructure/docker/docker-compose.yml up -d
npm install

cd apps/api
cp ../../.env.example .env
# Edit .env — see AI Setup below

npx prisma generate
npx prisma migrate dev
npx prisma db seed
npm run start:dev
# API running at http://localhost:4000
```

### 2. Run the mobile app

Prerequisites: Flutter SDK 3.x (Dart ^3.11).

```bash
cd apps/mobile
flutter pub get
flutter run
```

The API URL is read from the `API_BASE_URL` dart-define and defaults to
`http://10.0.2.2:4000` (the Android emulator loopback to the host).

```bash
# Physical device via USB (port-forward to the host)
adb reverse tcp:4000 tcp:4000
flutter run --dart-define=API_BASE_URL=http://127.0.0.1:4000

# Custom endpoint
flutter run --dart-define=API_BASE_URL=https://api.example.com
```

### Demo Credentials

| Role | Email | Password |
|------|-------|----------|
| Demo User | demo@jobpilot.ai | demo1234 |

## AI Setup

The API supports two AI providers, switchable via the `AI_PROVIDER` environment
variable in `apps/api/.env`.

### Option A: Ollama (local)

```bash
ollama pull phi3:mini

# In apps/api/.env:
AI_PROVIDER=ollama
OLLAMA_BASE_URL=http://127.0.0.1:11434/v1
OLLAMA_MODEL=phi3:mini
```

### Option B: OpenRouter (cloud)

```bash
# In apps/api/.env:
AI_PROVIDER=openrouter
OPENROUTER_API_KEY=sk-or-v1-your-key-here
OPENROUTER_BASE_URL=https://openrouter.ai/api/v1
OPENROUTER_MODEL=openrouter/free
```

## Features

- **French Coach** — AI recruiter conversations for workplace scenarios, with
  text-to-speech and speech-to-text input, France and Quebec French variants,
  message evaluation, and contextual hints.
- **Interview Coach (English)** — industry scenarios (Frontend, Full Stack, Team
  Lead, Behavioral, Custom Job), selectable question count, per-answer scoring
  (grammar/confidence/technical), hints, and overall feedback.
- **LinkedIn Optimizer** — AI-generated headlines, about/summary, and experience
  entries with a history of past optimizations.
- **Vocabulary Builder** — learn job-specific French vocabulary.

## API

GraphQL endpoint at `http://localhost:4000/graphql`. All operations except
`login`, `register`, and `refreshToken` require JWT auth.

## Verification

```bash
# Backend
cd apps/api
npm run lint
npm run typecheck
```

```bash
# Mobile
cd apps/mobile
flutter analyze
flutter test
```

## License

Private project.
