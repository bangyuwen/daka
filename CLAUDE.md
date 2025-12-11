# Daka - Automated Attendance System

## Project Overview

Automated punch-in/punch-out system that checks holidays and personal events before clocking attendance.

## Tech Stack

- **Language**: TypeScript
- **Runtime**: Node.js
- **Testing**: Jest with ts-jest (`npm test`)
- **Formatting**: Prettier
- **Dependencies**: cheerio (HTML parsing), date-fns (dates), dotenv (env)

## Project Structure

```
src/
├── index.ts          # Entry point, CLI args, module factory
├── daka.ts           # Core Daka class with punch logic and retry
├── env.ts            # Environment variable parsing
├── constants.ts      # Typed constants (PUNCH_TYPE, WORK_HOURS, etc.)
├── modules/
│   ├── types.ts      # DakaModule interface
│   └── mayo.ts       # Mayo integration
├── utils/
│   └── resource.ts   # Date utilities, event checking helpers
└── test/
    └── daka.test.ts  # Unit tests
```

## Commands

| Command | Description |
|---------|-------------|
| `npm test` | Run Jest tests |
| `npm run build` | Compile TypeScript to dist/ |
| `npm run dev` | Run with ts-node |
| `npm start` | Run compiled JS |

## Environment Variables

Required: `USERNAME`, `PASSWORD`
Optional: `MAX_DELAY_MINS` (default 30), `MAX_RETRY_COUNT` (default 3)

## Key Types

```ts
type PunchType = 'S' | 'E';  // Start (in) or End (out)

interface DakaModule {
  login(credentials): Promise<void>;
  logout(): Promise<void>;
  checkDakaDay(options): Promise<boolean>;
  punch(options): Promise<string>;  // returns punch time
}

interface DakaResult {
  status: 'success' | 'skipped' | 'failed';
  punchType: PunchType;
  time?: string;
  reason?: string;
}
```

## Code Patterns

- Strict TypeScript with `as const` for type-safe constants
- `DakaModule` interface for pluggable attendance systems
- Small, focused functions (<20 lines) in resource.ts
