# Daka - Automated Attendance System

## Project Overview
Automated punch-in/punch-out system that checks holidays and personal events before clocking attendance.

## Tech Stack
- **Runtime**: Node.js
- **Testing**: Jest (`npm test`)
- **Formatting**: Prettier
- **Dependencies**: cheerio (HTML parsing), date-fns (dates), dotenv (env)

## Project Structure
```
src/
├── index.js          # Entry point, handles CLI args and orchestration
├── daka.js           # Core Daka class with punch logic and retry
├── env.js            # Environment variable parsing with defaults
├── modules/          # Attendance system adapters
│   └── mayo.js       # Mayo integration
├── utils/
│   └── resource.js   # Date utilities, delay, sleep helpers
└── test/
    └── daka.test.js  # Unit tests for checkPersonalEvents
```

## Commands
| Command | Description |
|---------|-------------|
| `npm test` | Run Jest tests |
| `node src/index.js S` | Manual punch-in (Start) |
| `node src/index.js E` | Manual punch-out (End) |

## Environment Variables
Required: `MODULE`, `USERNAME`, `PASSWORD`
Optional: `MODULE_OPTIONS`, `DELAY_START_MINS`, `DELAY_END_MINS`, `IMMEDIATE_DAKA`, `MAX_RETRY_COUNT`

## Key Concepts
- **punchType**: `S` (Start/in) or `E` (End/out) - auto-determined by time if not specified
- **Modules**: Each module implements `login()`, `logout()`, `checkDakaDay()`, `punch()`
- **CST Timezone**: Uses UTC+8 (Taiwan timezone), offset = -480 minutes

## Code Patterns
- Async/await for all HTTP operations
- Cheerio for HTML parsing of response pages
- Random delay before punching to simulate natural behavior
- Retry mechanism with exponential backoff on failure

## Testing
- Tests focus on `checkPersonalEvents` utility function
- Test data uses fixed dates (2022) for deterministic results
- Run `npm test` before committing changes
