# JobPilot AI — Mobile App

Flutter client for JobPilot AI, an AI-powered career assistant. It talks to the
NestJS/GraphQL backend in `apps/api` of the same repository.

## Features

- **French Coach** — practice job interviews with an AI recruiter (text-to-speech
  and speech-to-text based, France or Quebec French).
- **Vocabulary Builder** — learn interview and job-specific French vocabulary.
- **LinkedIn Optimizer** — generate headlines, summaries, and experience entries
  for your LinkedIn profile.
- **Interview Coach** — practice English job interviews, get per-answer scoring
  (grammar, confidence, technical), hints, and overall feedback.

## Tech Stack

- Flutter / Dart
- `graphql_flutter` + `graphql` for API communication
- `provider` for state management
- `shared_preferences` for token storage
- `flutter_tts` + `speech_to_text` for voice features

## Prerequisites

- Flutter SDK 3.x (Dart ^3.11)
- The JobPilot API running on port `4000` (see `apps/api`)

## Getting Started

```bash
flutter pub get
flutter run
```

### API base URL

The API URL is read from the `API_BASE_URL` dart-define and defaults to
`http://10.0.2.2:4000` (the Android emulator loopback to the host machine):

```bash
# Android emulator (default works out of the box)
flutter run

# Physical device via USB (port-forward to the host)
adb reverse tcp:4000 tcp:4000
flutter run --dart-define=API_BASE_URL=http://127.0.0.1:4000

# Custom endpoint
flutter run --dart-define=API_BASE_URL=https://api.example.com
```

### Demo login

Demo account: `demo@jobpilot.ai` / `demo1234`

## Project Structure

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

## Build

```bash
flutter build apk --debug --dart-define=API_BASE_URL=http://127.0.0.1:4000
```

## License

Private project.
