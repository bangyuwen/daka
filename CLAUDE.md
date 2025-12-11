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

Required: `MODULE`, `USERNAME`, `PASSWORD`
Optional: `MODULE_OPTIONS`, `DELAY_START_MINS`, `DELAY_END_MINS`, `IMMEDIATE_DAKA`, `MAX_RETRY_COUNT`

## Key Types

```ts
type PunchType = 'S' | 'E';  // Start (in) or End (out)

interface DakaModule {
  login(credentials): Promise<void>;
  logout(): Promise<void>;
  checkDakaDay(options): Promise<boolean>;
  punch(options): Promise<void>;
}
```

## Code Patterns

- Strict TypeScript with `as const` for type-safe constants
- `DakaModule` interface for pluggable attendance systems
- Small, focused functions (<20 lines) in resource.ts
- Module factory pattern in index.ts (avoids dynamic require)
