# Finance Interceptor

A proactive financial monitoring app that detects subscription price increases and lifestyle creep before they impact your budget.

## Features

- 🏦 Connect bank accounts via Plaid
- 📊 View accounts and transaction history
- 🔄 Automatic transaction sync via webhooks
- 🔐 Secure token storage with encryption
- 📱 Cross-platform mobile app (iOS/Android)
- 📈 Pre-computed spending analytics
- 🔔 Subscription price change detection
- 📝 Structured logging with PII protection
- ⚡ Background job processing with Redis + ARQ

## Quick Start

**Prerequisites:** macOS, Xcode, Python 3.11+, Bun, uv, just, Docker

```bash
# Install dependencies
just install

# Start Redis (Terminal 1)
just redis-start

# Start backend (Terminal 2)
just backend-start

# Start worker (Terminal 3)
just worker-start

# Start mobile (Terminal 4)
just mobile-start
# Press 'i' for iOS simulator
```

**Note:** Redis and worker are optional. Set `TASK_QUEUE_ENABLED=false` in `.env` to run without them.

## Documentation

| Document | Description |
|----------|-------------|
| [Setup Guide](docs/SETUP.md) | Complete setup instructions from scratch |
| [Commands Reference](docs/COMMANDS.md) | All available just commands |
| [Roadmap](docs/ROADMAP.md) | Project status and planned features |
| [Database Schema](docs/schema.sql) | Supabase database structure |

## Project Structure

```
finance-interceptor/
├── apps/
│   ├── backend/          # Python FastAPI server
│   │   ├── routers/      # API endpoints
│   │   ├── services/     # Business logic
│   │   ├── repositories/ # Database operations
│   │   ├── models/       # Pydantic models
│   │   ├── workers/      # Background job processing
│   │   └── observability/# Logging infrastructure
│   │
│   └── mobile/           # React Native Expo app
│       ├── app/          # Screens (file-based routing)
│       ├── components/   # UI components
│       ├── hooks/        # Custom React hooks
│       ├── services/     # API services
│       └── types/        # TypeScript types
│
├── docs/                 # Documentation
└── justfile              # Task runner commands
```

## Tech Stack

| Layer | Technology |
|-------|------------|
| Mobile | React Native + Expo + TypeScript |
| Backend | FastAPI + Python |
| Database | Supabase (PostgreSQL) |
| Auth | Supabase Auth |
| Banking | Plaid API |
| Job Queue | ARQ + Redis |

## Testing (Sandbox)

1. Start the app (see Quick Start)
2. Register/login
3. Connect bank → Search "Platypus"
4. Credentials: `user_good` / `pass_good`

## License

MIT
