# JobPilot AI — Mobile App PRD

## 1. Executive Summary

JobPilot AI Mobile is a Flutter application that helps job seekers prepare for
their job search with AI-powered coaching. It delivers four core tools on a
phone: a French recruiter coach, an English interview coach, a LinkedIn profile
optimizer, and a job-interview vocabulary builder. The app talks to the JobPilot
NestJS/GraphQL backend (`apps/api`) over a single authenticated GraphQL client.

## 2. Product Vision

Give any job seeker an always-in-your-pocket AI preparation suite that improves
interview readiness and profile quality, measured by fewer missed interviews and
better first impressions with recruiters.

## 3. Target Users

- Job seekers actively interviewing, in English and/or French.
- Bilingual candidates in Canada (France and Quebec French variants).
- Candidates wanting to strengthen their LinkedIn profile before applying.

## 4. Core Features

### 4.1 Authentication
- Email + password login with JWT access/refresh tokens.
- Tokens persisted via `shared_preferences`; silent refresh on expiry.
- Session restore on app launch (`AuthGate` decides login vs home).

### 4.2 French Coach
- AI recruiter conversations for workplace scenarios (job interview, recruiter
  call, team meeting, daily standup, office chat, custom job).
- France and Quebec French variants (authentic Quebec expressions/register).
- Text-to-speech playback and speech-to-text input (`flutter_tts` /
  `speech_to_text`).
- Message-level AI evaluation (grammar, confidence, technical) with feedback and
  corrected answers.
- Contextual AI hints when the user is stuck.

### 4.3 Interview Coach (English)
- Industry scenarios: Frontend Developer, Full Stack Developer, Team Lead,
  Behavioral, and Custom Job Description.
- User-selectable question count; the API always returns exactly the requested
  number of questions.
- Per-answer evaluation: grammar, confidence, and technical scores plus feedback
  and an improved answer.
- Contextual AI hints during practice.
- Interview completion computed from distinct answered questions; overall score
  averaged across evaluations.

### 4.4 LinkedIn Optimizer
- Generate AI headlines for a target role.
- Generate an about/summary and experience entries from profile inputs
  (current role, skills, industry, key achievements).
- History of past optimizations with status.

### 4.5 Vocabulary Builder
- Browse and learn job-specific French vocabulary.

## 5. User Roles

| Role | Capabilities |
|------|--------------|
| **Guest** | Login screen only; no access to features. |
| **Registered user** | All four features, powered by the backend subscription tier. |

Feature access is enforced server-side per user; the mobile client does not
implement its own access control.

## 6. Non-Functional Requirements

### 6.1 Performance
- AI generations run server-side; the client uses a 300s request timeout to
  tolerate slow local-LLM responses.
- UI must remain responsive during AI requests (async/await, no main-thread
  blocking).

### 6.2 Reliability
- Automatic token refresh on 401s; failed requests surface clear errors.
- API errors are normalized into user-facing messages, never raw stacks.

### 6.3 Security
- No secrets in the app bundle; the API base URL is injected at build time via
  `--dart-define=API_BASE_URL`.
- Tokens stored locally only; all traffic over HTTPS in production.

### 6.4 Compatibility
- Android-first (this repository currently ships the Android target).

## 7. Tech Stack

- **Framework:** Flutter (Dart ^3.11)
- **API client:** `graphql_flutter` / `graphql` (single no-cache client, 300s
  timeout, token refresh interceptor)
- **State management:** `provider` (ChangeNotifier)
- **Local storage:** `shared_preferences`
- **Voice:** `flutter_tts`, `speech_to_text`
- **Backend:** NestJS + Prisma + PostgreSQL GraphQL API (`apps/api`), AI via
  OpenRouter/Ollama (qwen2.5:7b primary, phi3:mini fallback)

## 8. App Structure

```
lib/
  auth/          # authentication state and token handling
  graphql/       # GraphQL client, token refresh, query helpers
  screens/       # feature screens (home, French coach, interview coach, ...)
  french/        # French coach + conversation data/repositories
  interview/     # interview coach data/repositories
  linkedin/      # LinkedIn optimizer data/repositories
  vocabulary/    # vocabulary builder data/repositories
```

## 9. Success Metrics

- Interview practice sessions completed per user per week.
- LinkedIn optimization generations per user per month.
- Crash-free sessions (Android vitals).
- Login-to-feature usage conversion.
- App Store/Play Store rating.

## 10. Development Roadmap

### Phase 1: Foundation (Done)
- [x] Flutter scaffold, auth flow (login, token refresh, session restore)
- [x] GraphQL client layer with timeout + token refresh
- [x] Home screen with feature navigation

### Phase 2: Coaching (Done)
- [x] French Coach (conversations, interviews, evaluation, hints, TTS/STT,
      France + Quebec variants, custom job scenarios)
- [x] Interview Coach (5 scenarios, custom job, evaluation, hints, reliable
      question counts)
- [x] Vocabulary Builder

### Phase 3: LinkedIn Optimizer (Done)
- [x] Headlines, summary, experience generation
- [x] History of optimizations

### Phase 4: Hardening (Planned)
- [ ] Automated widget/integration tests on device
- [ ] Offline-friendly caching for history screens
- [ ] iOS build target
- [ ] Production backend endpoint configuration

## 11. Tradeoffs & Decisions

| Decision | Rationale | Tradeoff |
|----------|-----------|----------|
| **GraphQL over REST** | Single endpoint, typed queries, matches backend | Caching must be handled explicitly (no-cache client) |
| **`provider` over Bloc/Riverpod** | Lightweight, minimal ceremony for this app size | Less structure for very complex state |
| **`shared_preferences` for tokens** | Simple, sufficient for MVP | Not encrypted storage |
| **300s request timeout** | Local LLM responses are slow (20-60s) | UI waits longer on failures |
| **Build-time API URL** | No runtime config screen needed for MVP | Rebuild required to change endpoint |
