# Finance Interceptor

A proactive financial monitoring app that detects subscription price changes and lifestyle creep before they impact your budget.

## Overview

Finance Interceptor connects to your bank accounts via Plaid, syncs transactions automatically, and provides intelligent analytics about your spending patterns.

### Key Features

- **Automatic Transaction Sync** - Bank transactions sync via Plaid webhooks
- **Recurring Detection** - Automatic identification of subscriptions and recurring charges
- **Lifestyle Creep Scoring** - Compares current spending to historical baselines with seasonality awareness
- **Real-Time Pacing** - Track monthly spending progress against targets
- **Spending Analytics** - Pre-computed insights by category, merchant, and time period

## Tech Stack

| Layer | Technology |
|-------|------------|
| Mobile | React Native + Expo + TypeScript |
| Backend | FastAPI + Python |
| Database | Supabase (PostgreSQL with RLS) |
| Auth | Supabase Auth |
| Banking | Plaid API |
| Job Queue | ARQ + Redis |

## Getting Started

See the [Setup Guide](SETUP.md) for complete installation instructions, or the [Commands Reference](COMMANDS.md) for available task runner commands.
