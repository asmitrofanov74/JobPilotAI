# System Design Document — JobPilot AI

> Version 1.1 | July 2026

---

## Table of Contents

1. [High-Level Architecture](#1-high-level-architecture)
2. [C4 Model Diagrams](#2-c4-model-diagrams)
3. [Database Design](#3-database-design)
4. [GraphQL Architecture](#4-graphql-architecture)
5. [Event Flows](#5-event-flows)
6. [Authentication Flow](#6-authentication-flow)
7. [AWS Infrastructure](#7-aws-infrastructure)
8. [Scalability Considerations](#8-scalability-considerations)
9. [Security Considerations](#9-security-considerations)

---

## 1. High-Level Architecture

### 1.1 Architecture Style

JobPilot AI uses a **modular monolith** architecture deployed on AWS ECS Fargate with horizontal scaling capabilities. The system is designed to start as a monolith for rapid iteration and split into microservices when specific services (AI processing, analytics) require independent scaling.

```
┌─────────────────────────────────────────────────────────────────────┐
│                         CloudFront CDN                              │
├─────────────────────────────────────────────────────────────────────┤
│                    Application Load Balancer                        │
├─────────────────────────────────────────────────────────────────────┤
│                      ECS Fargate Cluster                           │
│  ┌─────────────────────┐  ┌─────────────────────────────────────┐  │
│  │   Next.js Frontend  │  │       NestJS Backend API            │  │
│  │  (apps/web)         │──│  (apps/api)                         │  │
│  │  SSR + RSC           │  │  GraphQL + REST                     │  │
│  └─────────────────────┘  └──────────┬──────────────────────────┘  │
│                                       │                             │
└───────────────────────────────────────┼─────────────────────────────┘
                                        │
                    ┌───────────────────┼───────────────────┐
                    │                   │                   │
               ┌────▼────┐       ┌──────▼──────┐     ┌─────▼─────┐
                │PostgreSQL│       │   Redis       │    │   S3      │
                │ (Docker) │       │   (Docker)    │    │ (Resumes  │
                │  16      │       │   7           │    │  Docs)    │
                └──────────┘       │ Sessions, Cache│    └───────────┘
                                   └───────┬────────┘
                                           │
                                      ┌────▼────┐
                                      │OpenRouter│
                                      │  AI Hub  │
                                      │GPT-4o/Gemini│
                                      │ Claude/DeepSeek│
                                      └─────────┘
```

### 1.2 Technology Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Frontend** | Next.js 15.5, React 19, TypeScript | SSR, RSC, SEO |
| **UI** | TailwindCSS, Shadcn UI, Radix UI | Styling, accessible components |
| **State/Data** | TanStack Query, Zustand, GraphQL | Server state, client state, API |
| **Charts** | Recharts | Analytics dashboards |
| **Backend** | NestJS 11, TypeScript | GraphQL + REST API |
| **API** | Apollo Server (GraphQL) | Flexible client queries |
| **ORM** | Prisma 6 (engine=none) | Type-safe database access (no binary deps) |
| **DB** | PostgreSQL 16 (Docker Compose) | Primary data store |
| **Cache** | Redis 7 (Docker Compose) | Sessions, rate limiting, cache |
| **AI** | OpenRouter Hub (GPT-4o, Claude, Gemini, DeepSeek) | Cover letters, interviews, skills, French coach |
| **Voice** | Web Speech API + MediaRecorder (browser) | Speech-to-text, audio recording, pronunciation scoring |
| **Storage** | Local filesystem / S3 (future) | Resume uploads, documents |
| **Auth** | JWT + Passport.js | Stateless authentication |
| **Infra** | Docker Compose (local), AWS ECS Fargate (planned) | Container orchestration |
| **CI/CD** | GitHub Actions | Build, test, deploy |
| **Monitoring** | Sentry, console | Errors, logs |

### 1.3 Communication Patterns

| Pattern | Protocol | Use Case |
|---------|----------|----------|
| **GraphQL** | HTTP/2 | Frontend ↔ Backend data queries |
| **REST** | HTTP/2 | File uploads, health checks |
| **Internal** | In-process | Modular monolith module communication |

---

## 2. C4 Model Diagrams

### 2.1 Context Diagram (C1)

```mermaid
C4Context
    title System Context Diagram - JobPilot AI

    Person(user, "Software Engineer", "Job seeker looking for tech roles")
    Person(recruiter, "Recruiter", "Hiring manager (future)")

    System(jobpilot, "JobPilot AI", "AI-powered job search platform")

    System_Ext(openrouter, "OpenRouter AI Hub", "GPT-4o, Claude, Gemini, DeepSeek")
    System_Ext(email, "SendGrid", "Email notifications")
    System_Ext(s3, "AWS S3", "File storage (future)")
    System_Ext(linkedin, "LinkedIn", "Job import (future)")

    Rel(user, jobpilot, "Uses", "HTTPS")
    Rel(jobpilot, openrouter, "AI calls", "HTTPS/REST")
    Rel(jobpilot, email, "Email", "SMTP/API")
    Rel(jobpilot, s3, "Store/Retrieve", "S3 API (future)")
```

### 2.2 Container Diagram (C2)

```mermaid
C4Container
    title Container Diagram - JobPilot AI

    Person(user, "Software Engineer", "Job seeker")

    Container_Boundary(jobpilot, "JobPilot AI Platform") {
        Container(web, "Next.js App", "React, TypeScript", "SSR frontend with dashboard, job tracking, AI features, French Coach UI")
        Container(api, "NestJS API", "TypeScript, GraphQL", "Business logic, auth, AI orchestration, 17 modules")
        ContainerDb(db, "PostgreSQL 16", "Docker Compose", "User data, jobs, interviews, resumes, French vocab")
        ContainerDb(cache, "Redis 7", "Docker Compose", "Sessions, rate limits, AI response cache")
    }

    System_Ext(openrouter, "OpenRouter AI Hub", "GPT-4o, Claude, Gemini, DeepSeek")

    Rel(user, web, "HTTPS", "Browser")
    Rel(web, api, "GraphQL", "Apollo Client")
    Rel(api, db, "Prisma ORM", "SQL")
    Rel(api, cache, "ioredis", "Redis protocol")
    Rel(api, openrouter, "OpenRouter SDK", "REST")
```

### 2.3 Component Diagram (C3)

```mermaid
C4Component
    title Component Diagram - NestJS Backend

    Container_Boundary(api, "NestJS API (17 modules)") {
        Component(auth, "Auth Module", "JWT, Passport", "Register, login, refresh tokens")
        Component(users, "Users Module", "CRUD", "Profile management")
        Component(jobs, "Jobs Module", "CRUD + Analytics", "Job application tracking")
        Component(interviews, "Interviews Module", "CRUD", "Interview scheduling & prep")
        Component(interviewQ, "Interview Questions Module", "CRUD", "Question bank, AI generation")
        Component(resumes, "Resumes Module", "Upload + Parse", "Resume management")
        Component(coverLetters, "Cover Letters Module", "AI generation", "Cover letter creation")
        Component(skillGap, "Skill Gap Reports Module", "AI analysis", "Skill gap analysis")
        Component(ai, "AI Module", "OpenRouter", "AI orchestration, prompts")
        Component(scraper, "Scraper Module", "ATS Providers", "Job scraping via Greenhouse/Lever/Workday APIs")
        Component(linkedin, "LinkedIn Optimizer", "AI analysis", "Profile optimization, skills gap, visibility")
        Component(french, "French Coach Module", "AI + Voice", "Pronunciation scoring, conversations, interview coach, vocabulary")
        Component(prisma, "Prisma Service", "ORM", "Database access layer")

        Rel(auth, users, "Creates/reads")
        Rel(jobs, prisma, "CRUD")
        Rel(interviews, prisma, "CRUD")
        Rel(resumes, prisma, "CRUD")
        Rel(ai, openrouter, "API calls")
        Rel(scraper, prisma, "Stores jobs")
        Rel(linkedin, prisma, "Reads user data")
        Rel(french, prisma, "CRUD conversations/vocab")
    }

    System_Ext(openrouter, "OpenRouter AI Hub")
    ContainerDb(db, "PostgreSQL")

    Rel(prisma, db, "SQL")
```

### 2.4 Sequence Diagram — French Coach Pronunciation Flow

```mermaid
sequenceDiagram
    actor User
    participant Web as Next.js Frontend
    participant API as NestJS API
    participant AI as OpenRouter AI Hub

    User->>Web: Click "Start Recording"
    Web->>Web: SpeechRecognition (Web Speech API) captures transcript
    Web-->>User: Display live transcript
    User->>Web: Click "Send & Score"
    Web->>Web: MediaRecorder captures audio blob
    Web->>API: GraphQL Mutation (evaluateFrenchPronunciation)
    API->>AI: Prompt with transcript + variant (france/quebec)
    AI-->>API: Scores (clarity, accuracy, fluency) + feedback
    API-->>Web: PronunciationResult response
    Web-->>User: Display scores with ScoreBar + improvement tips

    User->>Web: Request career-specific interview practice
    Web->>API: GraphQL Mutation (generateCareerInterviewQuestions)
    API->>DB: Fetch resume (skills, experience) + saved jobs
    API->>AI: Prompt with career context
    AI-->>API: Personalized questions
    API-->>Web: Career questions generated
    Web-->>User: Practice with role-specific French questions
```

### 2.5 Sequence Diagram — Job Application Flow

```mermaid
sequenceDiagram
    actor User
    participant Web as Next.js Frontend
    participant API as NestJS API
    participant DB as PostgreSQL
    participant AI as OpenRouter AI Hub

    User->>Web: Submit job application
    Web->>API: GraphQL Mutation (createJob)
    API->>DB: INSERT job_application
    DB-->>API: Job created
    API-->>Web: JobType response
    Web-->>User: Job added to list

    User->>Web: Request cover letter
    Web->>API: GraphQL Mutation (generateCoverLetter)
    API->>DB: Fetch job details
    API->>AI: GPT-4o via OpenRouter
    AI-->>API: Generated content
    API->>DB: INSERT cover_letter
    API-->>Web: CoverLetter response
    Web-->>User: Display generated letter

    User->>Web: Schedule interview
    Web->>API: GraphQL Mutation (createInterview)
    API->>DB: INSERT interview
    DB-->>API: Interview created
    API-->>Web: InterviewType response
    Web-->>User: Interview added to calendar
```

---

## 3. Database Design

### 3.1 Entity Relationship Diagram

```mermaid
erDiagram
    User ||--o{ JobApplication : has
    User ||--o{ Resume : has
    User ||--o{ CoverLetter : has
    User ||--o{ InterviewQuestion : has
    User ||--o{ SkillGapReport : has
    User ||--o{ FrenchConversation : has
    User ||--o{ FrenchInterview : has
    User ||--o{ VocabularyEntry : has
    User ||--o{ LinkedInOptimization : has

    JobApplication ||--o{ Interview : has
    JobApplication ||--o{ ApplicationEvent : has

    %% Each user can have many job applications, resumes, cover letters, etc.

    User {
        string id PK
        string email UK
        string passwordHash
        string firstName
        string lastName
        string title "nullable"
        string targetRole "nullable"
        string experienceLevel "nullable"
        string targetLocations "nullable"
        string summary "nullable"
        string avatarUrl "nullable"
        boolean isActive
        datetime createdAt
        datetime updatedAt
    }

    Subscription {
        string id PK
        enum tier "FREE | PRO"
        string stripeCustomerId "nullable"
        string stripeSubscriptionId "nullable"
        datetime currentPeriodStart "nullable"
        datetime currentPeriodEnd "nullable"
        datetime canceledAt "nullable"
        string userId FK UK
    }

    JobApplication {
        string id PK
        string companyName
        string companyWebsite "nullable"
        string companyLogo "nullable"
        string jobTitle
        string jobUrl "nullable"
        string jobDescription "nullable"
        string location "nullable"
        string salaryRange "nullable"
        int salaryMin "nullable"
        int salaryMax "nullable"
        string currency "default CAD"
        string employmentType "nullable"
        string workMode "nullable"
        enum status "JobStatus"
        enum source "ApplicationSource"
        string notes "nullable"
        datetime appliedAt "nullable"
        datetime rejectedAt "nullable"
        string rejectionReason "nullable"
        int offerSalary "nullable"
        string offerEquity "nullable"
        string offerBenefits "nullable"
        datetime offerDeadline "nullable"
        datetime offerAcceptedAt "nullable"
        int rating "nullable"
        string userId FK
        datetime createdAt
        datetime updatedAt
    }

    Interview {
        string id PK
        enum type "InterviewType"
        int round "default 1"
        datetime scheduledAt "nullable"
        int durationMinutes "nullable"
        string interviewers "nullable"
        string location "nullable"
        string notes "nullable"
        string feedback "nullable"
        int rating "nullable"
        boolean isCompleted "default false"
        string jobApplicationId FK
        datetime createdAt
        datetime updatedAt
    }

    ApplicationEvent {
        string id PK
        string eventType
        string description "nullable"
        json metadata "nullable"
        string jobApplicationId FK
        datetime createdAt
    }

    Resume {
        string id PK
        string title
        string fileUrl
        string fileKey
        int fileSize "nullable"
        string mimeType "nullable"
        boolean isPrimary "default false"
        string parsedSkills "nullable"
        string parsedExperience "nullable"
        string parsedEducation "nullable"
        string userId FK
        datetime createdAt
        datetime updatedAt
    }

    CoverLetter {
        string id PK
        string jobTitle
        string companyName
        string content
        string tone "default professional"
        string jobDescription "nullable"
        boolean isGenerated "default true"
        string userId FK
        datetime createdAt
        datetime updatedAt
    }

    InterviewQuestion {
        string id PK
        string question
        string answer "nullable"
        enum type "QuestionType"
        string category "nullable"
        int difficulty "nullable"
        string source "nullable"
        boolean isFavorite "default false"
        string userId FK
        datetime createdAt
        datetime updatedAt
    }

    SkillGapReport {
        string id PK
        string jobDescription
        string jobTitle
        string companyName
        json requiredSkills
        json userSkills
        json missingSkills
        float matchScore
        json recommendations "nullable"
        string userId FK
        datetime createdAt
    }

    MarketSkill {
        string id PK
        string skill
        int count
        string month
        string role "nullable"
        datetime createdAt
        datetime updatedAt
        @@unique [skill, month, role]
    }

    SalaryData {
        string id PK
        string role
        string location "nullable"
        string experienceLevel "nullable"
        int salaryMin
        int salaryMax
        int salaryAvg
        string currency "default CAD"
        string source "default job_posting"
        string month
        datetime createdAt
    }

    FrenchConversation {
        string id PK
        string scenario "nullable"
        string userMessage
        string aiResponse
        string correction "nullable"
        string vocabulary "nullable"
        enum variant "FRANCE | QUEBEC"
        string userId FK
        datetime createdAt
    }

    FrenchInterview {
        string id PK
        string question
        string userAnswer "nullable"
        string feedback "nullable"
        string score "nullable"
        enum variant "FRANCE | QUEBEC"
        string userId FK
        datetime createdAt
    }

    VocabularyEntry {
        string id PK
        string french
        string english
        string context "nullable"
        string example "nullable"
        int reviewCount "default 0"
        datetime nextReview "nullable"
        string userId FK
        datetime createdAt
        datetime updatedAt
    }

    LinkedInOptimization {
        string id PK
        enum type "PROFILE | SKILLS | VISIBILITY"
        json input
        json result
        string userId FK
        datetime createdAt
    }
```

### 3.2 Indexing Strategy

| Table | Index | Type | Purpose |
|-------|-------|------|---------|
| `users` | `email` | B-tree (unique) | Login lookup |
| `job_applications` | `(userId, status)` | Composite B-tree | Filter by status |
| `job_applications` | `(userId, companyName)` | Composite B-tree | Search by company |
| `job_applications` | `(userId, createdAt)` | Composite B-tree | Sort by date |
| `interviews` | `(jobApplicationId)` | B-tree | Find by job |
| `application_events` | `(jobApplicationId)` | B-tree | Find by job |
| `application_events` | `(createdAt)` | B-tree | Recent activity |
| `resumes` | `(userId)` | B-tree | User's resumes |
| `cover_letters` | `(userId)` | B-tree | User's cover letters |
| `interview_questions` | `(userId, type)` | Composite B-tree | Filter by type |
| `skill_gap_reports` | `(userId)` | B-tree | User's reports |
| `market_skills` | `(month)` | B-tree | Time-based queries |
| `market_skills` | `(skill)` | B-tree | Skill lookup |
| `market_skills` | `(skill, month, role)` | Composite unique | Upsert |
| `salary_data` | `(role, location)` | Composite B-tree | Salary lookup |
| `salary_data` | `(month)` | B-tree | Time-based queries |

### 3.3 Audit Fields

All user-owned entities include:
- `createdAt: DateTime @default(now())`
- `updatedAt: DateTime @updatedAt`

Application events use an event-sourcing pattern for immutable audit trail.

### 3.4 Multi-Tenant Considerations

Currently single-tenant per user (userId foreign key on all entities). Designed for future workspace/organization model:
- Add `organizationId` to all entities
- Add `Organization` and `OrganizationMember` models
- Migrate `userId` foreign keys to support both personal and org contexts

---

## 4. GraphQL Architecture

### 4.1 Schema Design

```
src/schema.gql  (auto-generated by NestJS code-first approach)
     │
     ├── Query (56 operations)
     │   ├── me: UserType
     │   ├── jobs(pagination, status, search): PaginatedJobs!
     │   ├── job(id): JobType
     │   ├── resumes: [ResumeType!]!
     │   ├── coverLetters: [CoverLetterType!]!
     │   ├── interviews(jobApplicationId): [InterviewType!]!
     │   ├── interviewQuestions(type, category): [InterviewQuestionType!]!
     │   ├── skillGapReports: [SkillGapReportType!]!
     │   ├── funnelAnalytics: FunnelAnalytics!
     │   ├── monthlyStats(from, to): [MonthlyStat!]!
     │   ├── frenchConversations(scenario): [FrenchConversationType!]!
     │   ├── frenchInterviewQuestions(variant): [FrenchInterviewType!]!
     │   ├── vocabulary(due): [VocabularyEntryType!]!
     │   ├── careerFrenchSuggestions(role): [CareerSuggestionType!]!
     │   ├── linkedinOptimizations(type): [LinkedinOptimizationType!]!
     │   └── ...
     │
     ├── Mutation
     │   ├── register(input): AuthPayload!
     │   ├── login(input): AuthPayload!
     │   ├── refreshToken(token): AuthPayload!
     │   ├── createJob(input): JobType!
     │   ├── updateJob(id, input): Boolean!
     │   ├── deleteJob(id): Boolean!
     │   ├── createResume(input): ResumeType!
     │   ├── deleteResume(id): Boolean!
     │   ├── setPrimaryResume(id): Boolean!
     │   ├── generateCoverLetter(input): CoverLetterType!
     │   ├── startFrenchConversation(scenario): FrenchConversationType!
     │   ├── sendFrenchMessage(input): FrenchConversationType!
     │   ├── evaluateFrenchPronunciation(input): PronunciationResult!
     │   ├── generateCareerInterviewQuestions(input): [FrenchInterviewType!]!
     │   ├── generateCareerConversation(input): FrenchConversationType!
     │   ├── analyzeProfile(input): LinkedinOptimizationType!
     │   ├── analyzeSkillsGap(input): LinkedinOptimizationType!
     │   └── ...
```

### 4.2 N+1 Prevention

```mermaid
graph LR
    Query -->|DataLoader| BatchLoadFn
    BatchLoadFn --> DB[(PostgreSQL)]
    DB --> BatchLoadFn
    BatchLoadFn -->|batched results| DataLoader
    DataLoader -->|cached per request| Query
```

- DataLoader pattern for batching related queries
- Prisma's built-in relation loading with `include`
- Field-level selection to avoid over-fetching

### 4.3 Error Handling

```graphql
type GraphQLError {
  message: String!
  extensions: {
    code: String!         # UNAUTHENTICATED, BAD_USER_INPUT, FORBIDDEN, INTERNAL_ERROR
    originalError: {
      message: [String!]  # Validation errors
      error: String
      statusCode: Int
    }
  }
}
```

---

## 5. Event Flows

### 5.1 Application Status Change Flow

```mermaid
sequenceDiagram
    participant User
    participant Web as Frontend
    participant API as NestJS API
    participant DB as PostgreSQL
    participant Email as SendGrid
    participant Cache as Redis

    User->>Web: Update job status to OFFER
    Web->>API: GraphQL Mutation (updateJob)
    API->>DB: UPDATE status
    API->>DB: INSERT application_event
    API->>Cache: Invalidate analytics cache
    API->>Email: Send notification (if enabled)
    API-->>Web: Success
    Web-->>User: Status updated
```

### 5.2 AI Cover Letter / French Coach Generation Flow

```mermaid
sequenceDiagram
    participant User
    participant Web as Frontend
    participant API as NestJS API
    participant DB as PostgreSQL
    participant AI as OpenRouter AI Hub
    participant Cache as Redis

    User->>Web: Request AI generation
    Web->>API: GraphQL Mutation
    API->>DB: Fetch context (job, profile, resume)
    API->>Cache: Check for cached result
    alt Cache hit
        Cache-->>API: Cached content
    else Cache miss
        API->>AI: Prompt with context (GPT-4o/Claude/Gemini)
        AI-->>API: Generated content
        API->>Cache: Store result (TTL: 24h)
    end
    API->>DB: Save result
    API-->>Web: Response
    Web-->>User: Display editable content
```

### 5.3 Analytics Aggregation Flow

```mermaid
sequenceDiagram
    participant User
    participant Web as Frontend
    participant API as NestJS API
    participant DB as PostgreSQL
    participant Cache as Redis

    User->>Web: View dashboard
    Web->>API: GraphQL queries (funnelAnalytics, monthlyStats)
    API->>Cache: Check cache
    alt Cache hit
        Cache-->>API: Cached aggregations
    else Cache miss
        API->>DB: GROUP BY queries
        DB-->>API: Aggregated data
        API->>Cache: Store (TTL: 5min)
    end
    API-->>Web: Analytics response
    Web->>Web: Render Recharts
    Web-->>User: Dashboard displayed
```

---

## 6. Authentication Flow

### 6.1 JWT-Based Auth Flow

```mermaid
sequenceDiagram
    participant User
    participant Web as Next.js
    participant API as NestJS API
    participant DB as PostgreSQL

    User->>Web: Enter email + password
    Web->>API: GraphQL Mutation (login)
    API->>DB: Find user by email
    API->>API: bcrypt.compare(password, hash)
    alt Invalid
        API-->>Web: UnauthorizedException
        Web-->>User: "Invalid credentials"
    else Valid
        API->>API: Generate accessToken (15m) + refreshToken (7d)
        API-->>Web: AuthPayload { accessToken, refreshToken, user }
        Web->>Web: Store in Zustand (localStorage)
        Web-->>User: Redirect to /dashboard
    end
```

### 6.2 Token Refresh Flow

```mermaid
sequenceDiagram
    participant Web as Next.js Frontend
    participant API as NestJS API

    Note over Web: API call returns 401
    Web->>Web: Extract refreshToken from storage
    Web->>API: GraphQL Mutation (refreshToken)
    alt Refresh token valid
        API->>API: Verify + generate new pair
        API-->>Web: New accessToken + refreshToken
        Web->>Web: Update stored tokens
        Web->>API: Retry original request with new token
    else Expired
        API-->>Web: UnauthorizedException
        Web->>Web: Clear auth store
        Web->>Web: Redirect to /login
    end
```

### 6.3 JWT Payload Structure

```typescript
interface AccessTokenPayload {
  sub: string;       // user.id
  email: string;     // user.email
  iat: number;       // issued at
  exp: number;       // expires (15min)
}

interface RefreshTokenPayload {
  sub: string;       // user.id
  email: string;     // user.email
  iat: number;
  exp: number;       // expires (7 days)
  tokenVersion: number;  // for revocation
}
```

### 6.4 Security Measures

| Measure | Implementation |
|---------|---------------|
| Password hashing | bcrypt, 12 rounds |
| Token expiry | Access: 15min, Refresh: 7 days |
| HTTP-only cookies | Optional for refresh token |
| Rate limiting | Per-user, per-IP on auth endpoints |
| Account lockout | After 5 failed attempts (future) |
| Refresh rotation | New refresh token on each use |
| Token revocation | `tokenVersion` field on User model |

---

## 7. AWS Infrastructure

> **Note:** AWS deployment is planned for production. Currently the application runs locally via Docker Compose (postgres:16, redis:7).

### 7.1 Architecture Diagram

```mermaid
graph TB
    subgraph "AWS Global"
        CF[CloudFront CDN]
        Route53[DNS Route53]
        WAF[AWS WAF]
    end

    subgraph "AWS VPC"
        subgraph "Public Subnets"
            ALB[ALB - Application Load Balancer]
            NAT[NAT Gateway]
        end

        subgraph "Private App Subnets"
            ECS_Web[ECS Fargate - Next.js]
            ECS_API[ECS Fargate - NestJS]
        end

        subgraph "Private Data Subnets"
            RDS[(Aurora PostgreSQL)]
            Redis[(ElastiCache Redis)]
        end
    end

    S3[(S3 - Documents)]
    ECR[ECR - Container Registry]
    CW[CloudWatch - Logs/Metrics]
    SES[SES - Email]

    Route53 --> CF
    CF --> WAF
    WAF --> ALB
    ALB --> ECS_Web
    ALB --> ECS_API
    ECS_API --> RDS
    ECS_API --> Redis
    ECS_API --> S3
    ECS_API --> SES
    ECS_Web --> ECS_API
    ECS_Web --> S3
    ECS_API --> ECR
    ECS_Web --> ECR
    ECS_API --> CW
    ECS_Web --> CW
```

### 7.2 Infrastructure as Code (Terraform)

| Resource | Config | Purpose |
|----------|--------|---------|
| VPC | `10.0.0.0/16` | Isolated network |
| Public subnets | 2 AZs × `/24` | ALB, NAT |
| Private app subnets | 2 AZs × `/24` | ECS tasks |
| Private data subnets | 2 AZs × `/24` | RDS, Redis |
| ECS cluster | Fargate (serverless) | Container orchestration |
| ECS services | `web`, `api` | Frontend + backend |
| Task definitions | CPU/Memory config | Scaling units |
| ALB | Internet-facing | Traffic routing |
| RDS Aurora | Serverless v2 | PostgreSQL 16 |
| ElastiCache | Redis 7 (serverless) | Caching |
| S3 | 2 buckets | Uploads + logs |
| CloudFront | CDN | Static assets, caching |
| WAF | Rate limiting, IP filtering | Security |
| Route53 | DNS | Domain management |
| ECR | 2 repositories | Container images |
| CloudWatch | Log groups + dashboards | Monitoring |
| SES | Email sending | Notifications |

### 7.3 ECS Task Sizing

| Service | CPU | Memory | Min | Max | Scaling Metric |
|---------|-----|--------|-----|-----|----------------|
| Web (Next.js) | 1 vCPU | 2 GB | 2 | 6 | Request count / ALB |
| API (NestJS) | 2 vCPU | 4 GB | 2 | 8 | CPU + Memory |
| Background (future) | 1 vCPU | 2 GB | 1 | 3 | Queue depth |

### 7.4 CI/CD Pipeline

```mermaid
graph LR
    A[Push to main] --> B[GitHub Actions]
    B --> C[Lint & Test]
    C --> D[Build Images]
    D --> E[Push to ECR]
    E --> F[ECS Rolling Deploy]
    F --> G[Health Check]
    G --> H[Slack Notification]
```

---

## 8. Scalability Considerations

### 8.1 Horizontal Scaling

| Component | Strategy | Notes |
|-----------|----------|-------|
| **Frontend** | ECS Service auto-scaling | Stateless, scales on request count |
| **Backend** | ECS Service auto-scaling | Stateless, scales on CPU/memory |
| **Database** | Aurora Serverless v2 | Auto-scales ACU (0.5–128) |
| **Redis** | ElastiCache Serverless | Auto-scales based on usage |
| **CDN** | CloudFront | Global edge caching |

### 8.2 Performance Optimizations

| Optimization | Implementation |
|-------------|---------------|
| **Response caching** | GraphQL response caching via Redis (TTL: 5s-5min) |
| **CDN caching** | Static assets (immutable, 1 year) |
| **DB query optimization** | Prisma raw queries for analytics, composite indexes |
| **N+1 prevention** | DataLoader pattern for related entities |
| **Connection pooling** | Prisma with PgBouncer-compatible settings |
| **AI response caching** | Cache generated content by hash of input |
| **Lazy loading** | Frontend code splitting by route |
| **Image optimization** | Next.js Image component with CloudFront |

### 8.3 Database Scaling

```mermaid
graph TB
    subgraph "Current"
        A[Single Aurora instance]
        A -->|Reads + Writes| B[(Primary)]
    end

    subgraph "Phase 2"
        C[Aurora with Read Replica]
        C -->|Writes| D[(Primary)]
        C -->|Reads| E[(Replica)]
    end

    subgraph "Phase 3"
        F[Aurora Multi-AZ]
        F -->|Writes| G[(Primary AZ-A)]
        F -->|Reads| H[(Replica AZ-B)]
        F -->|Reads| I[(Replica AZ-C)]
    end
```

### 8.4 AI Feature Scaling

The OpenRouter AI Hub is the primary external dependency. To handle latency and cost:

1. **Caching**: Generated content cached in Redis by input hash (TTL: 24h)
2. **Queuing**: Background job processing for batch AI operations
3. **Rate limiting**: Per-user rate limits on AI endpoints
4. **Streaming**: SSE for long-running generations (interviews)
5. **Fallback**: Pre-computed templates when API is unavailable

---

## 9. Security Considerations

### 9.1 Threat Model

| Threat | Impact | Mitigation |
|--------|--------|------------|
| **SQL Injection** | Data breach | Prisma ORM (parameterized queries) |
| **XSS** | Account takeover | Helmet headers, React JSX escaping, CSP |
| **CSRF** | Unauthorized actions | SameSite cookies, CSRF tokens |
| **JWT theft** | Account takeover | Short expiry (15min), refresh rotation |
| **Brute force** | Credential compromise | Rate limiting, account lockout |
| **IDOR** | Unauthorized data access | User-scoped queries (userId filter) |
| **SSTI** | RCE | No server-side templates |
| **Dependency** | Supply chain | Dependabot, `npm audit`, SCA |
| **DoS** | Service disruption | Rate limiting, WAF, auto-scaling |
| **AI prompt injection** | AI misuse | Input sanitization, output filtering |

### 9.2 Security Headers

| Header | Value | Purpose |
|--------|-------|---------|
| `Content-Security-Policy` | `default-src 'self'` | XSS prevention |
| `X-Frame-Options` | `DENY` | Clickjacking |
| `X-Content-Type-Options` | `nosniff` | MIME sniffing |
| `Strict-Transport-Security` | `max-age=31536000; includeSubDomains` | HTTPS enforcement |
| `Referrer-Policy` | `strict-origin-when-cross-origin` | Referrer leakage |
| `Permissions-Policy` | `camera=(), microphone=(self)` | Feature restriction (mic allowed for voice) |

### 9.3 Data Privacy

| Data Type | Classification | Handling |
|-----------|---------------|----------|
| Email | PII | Encrypted at rest (AES-256), masked in logs |
| Password | Secret | bcrypt hashed, never logged |
| Resume content | PII | S3 server-side encryption, signed URLs |
| Job descriptions | User data | Scoped to user, deleted on account removal |
| AI generated content | User data | Stored per user, TTL-based cache |
| Analytics | Aggregated | Anonymized, no PII in metrics |

### 9.4 Compliance Roadmap

| Requirement | Status | Notes |
|------------|--------|-------|
| GDPR | Planned | Data export, right to deletion |
| SOC 2 | Future | Audit logging, access controls |
| PIPEDA | Planned | Canadian privacy compliance |
| WCAG 2.1 AA | MVP | Accessibility-first design |

---

## Appendix A: Key Design Decisions

| Decision | Option Chosen | Alternatives | Rationale |
|----------|--------------|--------------|-----------|
| API paradigm | GraphQL | REST, tRPC | Flexible queries, single endpoint, introspection |
| ORM | Prisma | TypeORM, Drizzle, Knex | Type safety, migration DX, ecosystem |
| Frontend framework | Next.js | Remix, SPA | SSR, RSC, SEO, file-based routing |
| CSS approach | Tailwind | CSS modules, styled-components | Utility-first, design system, bundle size |
| Auth | JWT | Sessions, OAuth | Stateless, API-friendly, simple deployment |
| AI provider | OpenRouter Hub | Direct OpenAI, Anthropic, Google | Single API key, model fallback, cost tracking |
| Voice input | Web Speech API + MediaRecorder | Azure Speech, Deepgram | No third-party dependency, free, offline-capable |
| Prisma engine | engine=none (no binary) | Full engine | Windows EPERM workaround, lighter Docker images |
| Deployment | Docker Compose (local), ECS Fargate (planned) | Lambda, EKS, Render | Predictable perf, no cluster management |
| Infra-as-Code | Terraform | Pulumi, CDK | Cloud-agnostic, mature ecosystem |
| Monorepo | Turborepo | Nx, Lerna | Simple, fast, Vercel integration |

## Appendix B: Local Development Notes

| Issue | Workaround |
|-------|-----------|
| **Port 3000 conflict** | Docker Desktop holds port 3000; frontend uses `next dev -p 3001` |
| **Prisma engine** | Generated with `--no-engine` due to Windows EPERM rename issues |
| **External HTTPS** | Windows `node:fetch` unreliable; all external calls go through OpenRouter HTTP |
| **Scraper blockers** | Indeed/LinkedIn/ZipRecruiter block headless requests; ATS API providers (Greenhouse, Lever, Workday) preferred |
| **Background process** | Use `Start-Process -WindowStyle Hidden` (not `Start-Job`) for persistent Windows servers |

## Appendix C: Monitoring & Observability

| Metric | Tool | Alert Threshold |
|--------|------|----------------|
| API p95 latency | CloudWatch | > 500ms |
| Error rate | Sentry | > 1% |
| CPU utilization | CloudWatch | > 80% for 5min |
| Memory utilization | CloudWatch | > 85% for 5min |
| AI API latency | Custom metric | > 10s |
| Database connections | CloudWatch | > 80% of max |
| Failed logins (per user) | Custom metric | > 5 in 15min |
| 5xx errors | CloudWatch + Sentry | Any |
