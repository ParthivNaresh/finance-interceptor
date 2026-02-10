# Finance Interceptor - AI Agent Guidelines

## Quick Start

**Read these files first:**
1. `docs/ROADMAP.md` - Current phase, completed work, next tasks
2. `docs/schema.sql` - Complete database schema
3. This file - Architecture and patterns

## Project Overview

Personal finance app that detects subscription price changes and lifestyle creep. Built with:
- **Mobile:** Expo React Native (TypeScript)
- **Backend:** FastAPI (Python)
- **Database:** Supabase (PostgreSQL with RLS)
- **Banking:** Plaid API

## Monorepo Structure

```
finance-interceptor/
├── apps/
│   ├── mobile/          # Expo React Native app
│   └── backend/         # FastAPI server
├── docs/
│   ├── ROADMAP.md       # Development phases
│   ├── schema.sql       # Database schema
│   └── migrations/      # SQL migration files
└── justfile             # Task runner commands
```

---

## Backend (apps/backend)

### Directory Structure
```
apps/backend/
├── main.py              # FastAPI app factory
├── config.py            # Settings from env vars
├── observability/       # Logging infrastructure
│   ├── __init__.py      # Public API (get_logger, configure_logging)
│   ├── config.py        # Logging configuration
│   ├── context.py       # Request context utilities
│   ├── middleware.py    # Request logging middleware
│   ├── processors.py    # PII scrubbing, service info
│   └── constants.py     # Sensitive keys, patterns
├── workers/             # Background job processing (ARQ)
│   ├── __init__.py      # Exports WorkerSettings
│   ├── settings.py      # ARQ worker configuration
│   ├── lifecycle.py     # Startup/shutdown hooks
│   ├── context.py       # WorkerContext dataclass
│   ├── retry.py         # Exponential backoff utility
│   └── tasks/           # Task definitions
│       └── analytics.py # Analytics computation task
├── models/              # Pydantic models
│   ├── enums.py         # All enum types
│   ├── auth.py          # AuthenticatedUser
│   ├── plaid.py         # Plaid request/response
│   ├── transaction.py   # Transaction models
│   ├── recurring.py     # Recurring stream models
│   ├── webhook.py       # Webhook models
│   └── analytics.py     # Analytics models
├── repositories/        # Database access layer
│   ├── base.py          # BaseRepository class
│   ├── plaid_item.py
│   ├── account.py
│   ├── transaction.py
│   ├── recurring_stream.py
│   ├── alert.py
│   ├── spending_period.py
│   ├── category_spending.py
│   ├── merchant_spending.py
│   ├── analytics_log.py
│   ├── lifestyle_baseline.py    # Lifestyle baselines CRUD
│   └── lifestyle_creep_score.py # Creep scores CRUD
├── services/            # Business logic
│   ├── plaid.py         # Plaid API wrapper
│   ├── database.py      # Supabase client
│   ├── auth.py          # Token validation (with cache-first lookup)
│   ├── transaction_sync.py
│   ├── recurring.py
│   ├── alert_detection.py
│   ├── webhook.py
│   ├── cache/           # Redis caching layer
│   │   ├── base.py          # CacheService (generic Redis ops)
│   │   ├── auth_cache.py    # Auth token cache
│   │   ├── analytics_cache.py # Analytics response cache
│   │   ├── account_cache.py   # Account data cache
│   │   ├── recurring_cache.py # Recurring stream cache
│   │   └── invalidation.py   # CacheInvalidator orchestrator
│   └── analytics/       # Analytics package
│       ├── period_calculator.py
│       ├── transfer_detector.py
│       ├── spending_aggregator.py
│       ├── computation_manager.py
│       ├── merchant_stats_aggregator.py  # Merchant lifetime stats
│       ├── cash_flow_aggregator.py       # Cash flow metrics
│       ├── income_detector.py            # Income source detection
│       ├── baseline_calculator.py        # Lifestyle baseline computation
│       ├── creep_scorer.py               # Lifestyle creep scoring
│       └── seasonality_detector.py       # Seasonal spending detection
├── routers/             # API endpoints
│   ├── health.py
│   ├── plaid.py
│   ├── accounts.py
│   ├── transactions.py
│   ├── recurring.py
│   ├── alerts.py
│   ├── webhooks.py
│   └── analytics.py
└── middleware/
    └── auth.py          # get_current_user dependency
```

### Key Patterns

**Service Container Pattern:**
```python
class PlaidServiceContainer:
    _instance: PlaidService | None = None
    
    @classmethod
    def get(cls) -> PlaidService:
        if cls._instance is None:
            cls._instance = PlaidService(...)
        return cls._instance
```

**Repository Pattern:**
- All DB access through repository classes
- Repositories inherit from `BaseRepository`
- Use Supabase client, not raw SQL

**Dependency Injection:**
```python
CurrentUser = Annotated[AuthenticatedUser, Depends(get_current_user)]

@router.get("/endpoint")
async def endpoint(user: CurrentUser):
    ...
```

**Auth Flow:**
- JWT token in `Authorization: Bearer <token>` header
- Cache-first: checks `AuthCache` (Redis, SHA-256 hashed key, 5 min TTL)
- On cache miss: validates via Supabase `auth.get_user(token)`, stores result in cache
- Returns `AuthenticatedUser` with `id` and `email`

**Logging Pattern:**
```python
from observability import get_logger, bind_context

logger = get_logger("services.plaid")

# Basic logging with structured data
logger.info("plaid.link_token.created", user_id=user_id)

# Bind context for request-scoped data
bind_context(user_id=str(user.id))

# Use bound logger for operation-specific context
log = logger.bind(plaid_item_id=item_id)
log.info("transaction_sync.started")
log.info("transaction_sync.completed", transactions_added=48)
```

Log output (console):
```
2024-01-15 14:32:01 [info] transaction_sync.completed [services.transaction_sync] plaid_item_id=abc-123 transactions_added=48 request_id=xyz-789
```

### Running Backend
```bash
just backend-start
# Or manually:
cd apps/backend && poetry run uvicorn main:app --reload
```

### API Docs
http://localhost:8000/docs

---

## Background Worker (ARQ)

Webhook processing and analytics computation run asynchronously via a Redis-backed job queue.

### Architecture
```
Plaid Webhook → FastAPI → Store Event → Return 200 → Redis Queue → ARQ Worker
                                                           ↓
                                              ┌────────────┴────────────┐
                                              │                         │
                                    Webhook Processing          Analytics Computation
                                    (transaction sync,          (30s debounce)
                                     recurring sync)
```

### Key Design: Fast Webhook Acknowledgment
Plaid webhooks have a ~5 second timeout. The webhook endpoint:
1. Validates the webhook payload
2. Stores the event in DB
3. **Returns HTTP 200 immediately** (typically <50ms)
4. Enqueues processing to the ARQ worker

This prevents `ClientDisconnect()` errors from Plaid timing out.

### Worker Tasks

**`process_plaid_webhook`** (`workers/tasks/webhook.py`):
- Transaction sync (calls Plaid API)
- Recurring stream sync
- Enqueues analytics computation

**`compute_analytics_for_user`** (`workers/tasks/analytics.py`):
- Spending periods (monthly rollups)
- Merchant stats (lifetime spending per merchant)
- Cash flow metrics (income, expenses, savings rate)
- Lifestyle baselines and creep scores

### Key Features
- **Fast acknowledgment**: Webhooks return <50ms, processing happens async
- **Debouncing**: Multiple webhooks for same user within 30s trigger only one analytics computation
- **Retry with backoff**: Failed jobs retry with exponential backoff (10s, 20s, 40s...)
- **Graceful fallback**: If Redis unavailable, uses FastAPI BackgroundTasks

### Running Worker
```bash
# Start Redis (Docker)
just redis-start

# Start worker
just worker-start
```

### Task Queue Service
```python
from services.task_queue import get_task_queue_service

task_queue = get_task_queue_service()

# Enqueue webhook processing (immediate)
result = await task_queue.enqueue_webhook_processing(
    event_id, webhook_type, webhook_code, item_id, payload
)

# Enqueue analytics computation (with debouncing)
result = await task_queue.enqueue_analytics_computation(user_id)
# result.was_debounced = True if existing job was cancelled
```

### Worker Contexts
- `WorkerContext` - Analytics services (spending, merchant, cash flow, etc.) + `CacheInvalidator`
- `WebhookWorkerContext` - Webhook processing services (transaction sync, recurring sync, etc.) + `CacheInvalidator`

Both are initialized in `workers/lifecycle.py` and passed to tasks via the ARQ context. Workers call `CacheInvalidator` methods after sync/compute operations to clear stale cached data.

### Configuration
```env
REDIS_URL=redis://localhost:6379
TASK_QUEUE_ENABLED=true
TASK_DEBOUNCE_SECONDS=30
```

Set `TASK_QUEUE_ENABLED=false` to disable background processing. Webhooks will use FastAPI BackgroundTasks as fallback.

---

## Redis Caching Layer

All API GET endpoints are cached in Redis to reduce Supabase load and latency. Uses the same Redis instance as ARQ and rate limiting.

### Architecture
```
Request → Auth middleware → [AuthCache] → Router → [DomainCache] → Repository → Supabase
                                                       ↑
                                              Cache miss? Query DB,
                                              store result in cache

Webhook Worker → Sync Data → [CacheInvalidator] → Delete stale keys
```

### Cache Domains

| Domain | Key Prefix | TTL | Description |
|--------|-----------|-----|-------------|
| Auth | `fi:auth:{sha256}` | 5 min | JWT validation results |
| Spending | `fi:analytics:{uid}:spending:*` | 2 min | Current period analytics |
| Merchant Stats | `fi:analytics:{uid}:merchant_stats:*` | 10 min | Lifetime merchant stats |
| Cash Flow | `fi:analytics:{uid}:cashflow:*` | 2 min | Income/expense metrics |
| Pacing | `fi:analytics:{uid}:creep:pacing` | 1 min | Real-time pacing |
| Baselines | `fi:analytics:{uid}:creep:baselines` | 1h / 24h | Unlocked / locked |
| Creep | `fi:analytics:{uid}:creep:*` | 5 min | Creep summary/history |
| Accounts | `fi:accounts:{uid}:*` | 10 min | Account listings |
| Recurring | `fi:recurring:{uid}:*` | 10 min | Recurring streams |

### Invalidation Events

| Event | Trigger | Caches Invalidated |
|-------|---------|-------------------|
| Transaction sync | Webhook worker | Spending, merchants, cashflow, creep, accounts |
| Analytics compute | Worker or POST endpoint | All analytics for user |
| Recurring sync | Webhook worker | Recurring streams |
| Baseline change | POST compute/lock/unlock/reset | Creep domain |
| Plaid item deleted | DELETE endpoint | Everything for user |

### Key Design Decisions
- **Graceful degradation**: All cache operations wrapped in `try/except RedisError` — endpoints work without Redis
- **No JWT in keys**: Auth cache uses `SHA-256(token)[:32]` — token never stored as key
- **SCAN-based deletion**: `delete_pattern()` uses `scan_iter` (not `KEYS`) — production-safe
- **Key prefix `fi:`**: Avoids collision with ARQ (`arq:`) and rate limiter (`LIMITER`)

### Key Files
- `services/cache/base.py` - `CacheService` with get/set/delete/delete_pattern
- `services/cache/auth_cache.py` - Auth token cache
- `services/cache/analytics_cache.py` - All analytics response caching
- `services/cache/account_cache.py` - Account data cache
- `services/cache/recurring_cache.py` - Recurring stream cache
- `services/cache/invalidation.py` - `CacheInvalidator` orchestrator

### Configuration
```env
CACHE_ENABLED=true                          # Master switch
CACHE_AUTH_TTL_SECONDS=300                  # Auth token (5 min)
CACHE_ANALYTICS_CURRENT_TTL_SECONDS=120     # Current period (2 min)
CACHE_ANALYTICS_HISTORICAL_TTL_SECONDS=3600 # Historical (1 hour)
CACHE_ANALYTICS_FINALIZED_TTL_SECONDS=86400 # Finalized (24 hours)
CACHE_MERCHANT_STATS_TTL_SECONDS=600        # Merchant stats (10 min)
CACHE_PACING_TTL_SECONDS=60                 # Pacing (1 min)
CACHE_BASELINES_TTL_SECONDS=3600            # Unlocked baselines (1 hour)
CACHE_BASELINES_LOCKED_TTL_SECONDS=86400    # Locked baselines (24 hours)
CACHE_CREEP_TTL_SECONDS=300                 # Creep summary (5 min)
CACHE_ACCOUNTS_TTL_SECONDS=600              # Accounts (10 min)
CACHE_RECURRING_TTL_SECONDS=600             # Recurring (10 min)
```

Set `CACHE_ENABLED=false` to disable all caching (endpoints hit Supabase directly).

---

## Webhook Verification

Plaid webhooks are verified using ES256 JWT signatures per Plaid's security specification.

### How It Works
1. Plaid signs each webhook with a JWT in the `Plaid-Verification` header
2. The JWT contains a SHA-256 hash of the request body and an `iat` (issued at) timestamp
3. Our backend fetches Plaid's public key (JWK) and verifies the signature
4. Keys are cached in Redis for 24 hours

### Verification Flow
```
Webhook arrives → Extract JWT header → Validate alg=ES256
    → Fetch public key (cache-first) → Verify signature
    → Check token age (<5 min) → Verify body hash
    → Process webhook
```

### Configuration
```env
PLAID_WEBHOOK_VERIFICATION_ENABLED=false  # Enable in production
WEBHOOK_KEY_CACHE_TTL_SECONDS=86400       # 24-hour key cache
WEBHOOK_VERIFICATION_TIMEOUT_SECONDS=10.0  # Plaid API timeout
```

### Key Files
- `services/webhook_verification.py` - Core verification logic
- `services/webhook_key_cache.py` - Redis-backed key caching
- `models/webhook_verification.py` - Domain models (JWKPublicKey, etc.)
- `errors.py` - WebhookVerificationError (401 response)

### Testing Locally
Set `PLAID_WEBHOOK_VERIFICATION_ENABLED=false` for local development with curl.
Set to `true` when testing with ngrok + real Plaid webhooks.

---

## Rate Limiting

### Rate Limit Tiers

| Tier | Limit | Endpoints |
|------|-------|-----------|
| `auth` | 5/minute | Authentication (IP-based) |
| `plaid` | 10/minute | Plaid API calls, sync operations |
| `analytics_write` | 5/minute | Analytics computation triggers |
| `default` | 60/minute | All other authenticated endpoints |

### Exempt Endpoints
- `/api/webhooks/*` - Plaid webhooks must not be rate limited
- `/health` - Health checks always accessible

### Implementation
```python
from middleware.rate_limit import get_limiter, get_rate_limits

limiter = get_limiter()
limits = get_rate_limits()

@router.get("/endpoint")
@limiter.limit(limits.default)
async def endpoint(request: Request, user: CurrentUser):
    ...
```

### Response Headers
On successful requests:
- `X-RateLimit-Limit`: Max requests allowed
- `X-RateLimit-Remaining`: Requests remaining
- `X-RateLimit-Reset`: Unix timestamp when limit resets

On 429 Too Many Requests:
```json
{
  "error": "rate_limit_exceeded",
  "detail": "Too many requests. Please try again later.",
  "retry_after": 60
}
```
With `Retry-After` header.

### Configuration
```env
RATE_LIMIT_ENABLED=true
RATE_LIMIT_AUTH=5/minute
RATE_LIMIT_PLAID=10/minute
RATE_LIMIT_ANALYTICS_WRITE=5/minute
RATE_LIMIT_DEFAULT=60/minute
```

Set `RATE_LIMIT_ENABLED=false` to disable rate limiting (development only).

---

## Encryption

Plaid access tokens are encrypted at rest using Argon2id key derivation and Fernet (AES-128-CBC + HMAC).

### Encryption Format
```
┌─────────────────────────────────────────────────────────────────┐
│                    Encrypted Token Format v1                     │
├─────────────────────────────────────────────────────────────────┤
│ Version (1 byte) │ Salt (16 bytes) │ Fernet Ciphertext (N bytes)│
│      0x01        │    random        │   AES-128-CBC + HMAC      │
└─────────────────────────────────────────────────────────────────┘
```

### Argon2id Parameters (OWASP "Moderate" Profile)
| Parameter | Value | Description |
|-----------|-------|-------------|
| `time_cost` | 3 | Number of iterations |
| `memory_cost` | 65536 | 64 MB of RAM |
| `parallelism` | 4 | 4 parallel threads |
| `hash_len` | 32 | 256-bit derived key |

### Security Features
- **Random salt per encryption**: Each encrypted value has a unique 16-byte salt
- **Memory-hard KDF**: Argon2id is resistant to GPU/ASIC attacks
- **Version byte**: Allows future algorithm changes without breaking existing data
- **Authenticated encryption**: Fernet provides both confidentiality and integrity

### Key Files
- `services/encryption.py` - EncryptionService with encrypt/decrypt
- `config.py` - ENCRYPTION_KEY setting

### Usage
```python
from services.encryption import get_encryption_service

encryption = get_encryption_service()
ciphertext = encryption.encrypt("access-token-here")
plaintext = encryption.decrypt(ciphertext)
```

---

## Mobile App (apps/mobile)

### Directory Structure
```
apps/mobile/
├── app/                 # Expo Router screens
│   ├── (auth)/          # Login, register
│   ├── (tabs)/          # Main tab screens
│   │   ├── activity.tsx
│   │   ├── index.tsx    # Home
│   │   ├── insights.tsx # Analytics dashboard
│   │   └── recurring.tsx
│   ├── alerts.tsx
│   ├── recurring/[id].tsx
│   └── transactions/[id].tsx
├── components/
│   ├── analytics/       # SpendingCard, CategoryItem, etc.
│   ├── recurring/
│   ├── alerts/
│   ├── accounts/
│   ├── glass/           # Glassmorphism components
│   └── index.ts         # Barrel exports
├── hooks/
│   ├── useAuth.ts
│   ├── useAccounts.ts
│   ├── useTransactions.ts
│   ├── useRecurring.ts
│   ├── useAlerts.ts
│   ├── usePlaidLink.ts
│   └── analytics/       # Analytics hooks package
│       ├── useSpending.ts
│       ├── useCategories.ts
│       ├── useMerchants.ts
│       ├── useCashFlow.ts
│       ├── useComputation.ts
│       ├── useLifestyleCreep.ts  # Lifestyle creep hooks
│       ├── types.ts
│       └── utils.ts
├── services/
│   ├── api/             # API client and endpoints
│   │   ├── client.ts    # Base API client
│   │   ├── accounts.ts
│   │   ├── transactions.ts
│   │   ├── recurring.ts
│   │   ├── alerts.ts
│   │   └── analytics.ts
│   └── supabase/        # Supabase client
├── types/               # TypeScript interfaces
│   ├── account.ts
│   ├── transaction.ts
│   ├── recurring.ts
│   ├── analytics.ts
│   └── index.ts         # Barrel exports
├── styles/              # Design tokens
│   ├── colors.ts
│   ├── typography.ts
│   ├── spacing.ts
│   └── glass.ts
├── i18n/                # Internationalization
│   └── locales/en.ts
└── utils/               # Helper functions
```

### Key Patterns

**Hook Pattern:**
```typescript
export function useSpendingSummary(periodType: PeriodType = 'monthly') {
  const [state, setState] = useState<State>({ ... });
  
  const fetchData = useCallback(async (isRefresh = false) => {
    // Fetch logic
  }, [periodType]);
  
  useEffect(() => {
    void fetchData();
  }, [fetchData]);
  
  return { ...state, refresh, derivedData };
}
```

**API Service Pattern:**
```typescript
export const analyticsApi = {
  getCurrentSpending: (periodType: PeriodType) => 
    apiClient.get<SpendingSummaryResponse>(`/api/analytics/spending/current?period_type=${periodType}`),
};
```

**Component Pattern:**
- Functional components with TypeScript interfaces
- Styles via `StyleSheet.create()`
- Use design tokens from `@/styles`

### Path Aliases
- `@/` maps to project root

### Running Mobile
```bash
just mobile-start    # Start Metro
just mobile-ios      # Run on iOS simulator
```

---

## Database

### Key Tables
| Table | Purpose |
|-------|---------|
| `users` | User profiles (extends auth.users) |
| `plaid_items` | Connected bank accounts |
| `accounts` | Bank accounts from Plaid |
| `transactions` | Transaction history |
| `recurring_streams` | Detected subscriptions |
| `alerts` | User notifications |
| `spending_periods` | Pre-computed spending rollups |
| `category_spending` | Spending by category per period |
| `merchant_spending` | Spending by merchant per period |

### RLS (Row Level Security)
All tables have RLS policies. Users can only access their own data.

### Migrations
Located in `docs/migrations/`. Run via Supabase dashboard SQL editor.

---

## Environment Variables

**Backend (`apps/backend/.env`):**
```
PLAID_CLIENT_ID=xxx
PLAID_SECRET=xxx
PLAID_ENVIRONMENT=sandbox
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_ANON_KEY=xxx
SUPABASE_SERVICE_ROLE_KEY=xxx
ENCRYPTION_KEY=xxx
LOG_LEVEL=INFO
LOG_FORMAT=console
REDIS_URL=redis://localhost:6379
TASK_QUEUE_ENABLED=true
TASK_DEBOUNCE_SECONDS=30
RATE_LIMIT_ENABLED=true
RATE_LIMIT_AUTH=5/minute
RATE_LIMIT_PLAID=10/minute
RATE_LIMIT_ANALYTICS_WRITE=5/minute
RATE_LIMIT_DEFAULT=60/minute
CACHE_ENABLED=true
```

**Mobile (`apps/mobile/.env`):**
```
EXPO_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=xxx
EXPO_PUBLIC_API_URL=http://localhost:8000
```

Note: Mobile uses `EXPO_PUBLIC_` prefix for environment variables (Expo convention).

---

## Testing

### Plaid Sandbox
- Bank: Search "Platypus"
- Username: `user_good`
- Password: `pass_good`

### Backend API Testing
```bash
# Get JWT token
curl -X POST "https://YOUR_PROJECT.supabase.co/auth/v1/token?grant_type=password" \
  -H "apikey: YOUR_ANON_KEY" \
  -d '{"email": "test@example.com", "password": "password"}'

# Use token
curl "http://localhost:8000/api/analytics/spending/current" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## Code Quality

**Linting:**
```bash
just lint        # Lint all
just lint-fix    # Auto-fix
just check       # Lint + typecheck
```

**Python:** Ruff + mypy (strict)
**TypeScript:** ESLint (strict, no `any`)

---

## Common Tasks

### Adding a New API Endpoint
1. Create/update Pydantic models in `models/`
2. Create/update repository in `repositories/`
3. Create/update service in `services/`
4. Add router in `routers/`
5. Register router in `routers/__init__.py`

### Adding a New Mobile Screen
1. Create types in `types/`
2. Create API service in `services/api/`
3. Create hook in `hooks/`
4. Create components in `components/`
5. Create screen in `app/`
6. Update navigation if needed

### Adding a Database Table
1. Add to `docs/schema.sql`
2. Create migration in `docs/migrations/`
3. Run migration in Supabase
4. Create repository
5. Create Pydantic models

---

## Current Work (Phase 5)

Analytics Engine - pre-computed spending insights.

**Completed:**
- Database schema (10 new tables)
- Backend services for spending aggregation
- API endpoints for spending data
- Mobile Insights screen with basic UI
- Lifestyle creep scoring (Phase 5.6)
  - Baseline calculator (first 3 months per category)
  - Creep scorer (compares current vs baseline)
  - Seasonality detector (reduces severity for expected seasonal spending)
  - 12 API endpoints under `/api/analytics/lifestyle-creep/`
  - Mobile hooks and types for lifestyle creep
- Real-time pacing mode (Phase 5.6.1)
  - Three display modes: Kickoff (days 1-3), Pacing (days 4-7), Stability (days 8+)
  - Progress bar with "today" marker showing expected vs actual spending
  - `usePacing` hook and `SpendingStabilityCard` component

**Next:**
- Spending trend chart component
- Anomaly detection
- Cash flow dashboard screen
- Period selector component

See `docs/ROADMAP.md` for full task list.

---

## Lifestyle Creep System

Detects gradual spending increases by comparing current spending to historical baselines.

### Key Concepts

**Baselines:** Average monthly spending per discretionary category from the user's first 3 months of data.

**Discretionary Categories:** ENTERTAINMENT, FOOD_AND_DRINK, GENERAL_MERCHANDISE, PERSONAL_CARE, GENERAL_SERVICES, TRAVEL

**Severity Levels:**
| Percentage Change | Severity |
|-------------------|----------|
| < 10% | none |
| 10-25% | low |
| 25-50% | medium |
| > 50% | high |

**Seasonality:** Certain categories have expected high-spend months (e.g., TRAVEL in summer/December). Severity is reduced by one level during seasonal periods.

### API Endpoints

```
GET  /api/analytics/lifestyle-creep/baselines
POST /api/analytics/lifestyle-creep/baselines/compute
POST /api/analytics/lifestyle-creep/baselines/lock
POST /api/analytics/lifestyle-creep/baselines/unlock
POST /api/analytics/lifestyle-creep/baselines/reset
GET  /api/analytics/lifestyle-creep/summary
GET  /api/analytics/lifestyle-creep/history
GET  /api/analytics/lifestyle-creep/category/{name}
POST /api/analytics/lifestyle-creep/compute
POST /api/analytics/lifestyle-creep/compute/current
```

### Mobile Hooks

```typescript
import {
  useLifestyleBaselines,
  useLifestyleCreepSummary,
  useLifestyleCreepHistory,
  useCategoryCreepHistory,
  useBaselineComputation,
  useCreepComputation,
} from '@/hooks/analytics';
```

### Typical Usage Flow

1. User has 2-3 months of transaction data
2. Call `POST /baselines/compute` to establish baselines
3. Optionally lock baselines with `POST /baselines/lock`
4. Call `POST /compute` to calculate creep scores
5. Display results via `GET /summary` or `GET /history`

---

## Real-Time Pacing System

Shows users their spending progress throughout the month compared to their established target.

### Pacing Modes

The UI displays different content based on the day of the month:

| Days | Mode | Display |
|------|------|---------|
| 1-3 | **Kickoff** | "New month!" with target amount and current spend |
| 4-7 | **Pacing** | Progress bar with "today" marker, pacing status |
| 8+ | **Stability** | Full stability score + pacing bar + top drifting category |

### Pacing Status

| Status | Meaning | Color |
|--------|---------|-------|
| `behind` | Spending slower than usual | Green (positive) |
| `on_track` | On pace with target | Teal (neutral) |
| `ahead` | Spending faster than usual | Warning (caution) |

### API Endpoint

```
GET /api/analytics/lifestyle-creep/pacing
```

**Response:**
```json
{
  "mode": "stability",
  "period_start": "2026-02-01",
  "period_end": "2026-02-28",
  "days_into_period": 8,
  "total_days_in_period": 28,
  "target_amount": "3184.23",
  "current_discretionary_spend": "500.00",
  "pacing_percentage": "15.70",
  "expected_pacing_percentage": "28.57",
  "pacing_status": "behind",
  "pacing_difference": "-12.87",
  "stability_score": 85,
  "overall_severity": "low",
  "top_drifting_category": { ... }
}
```

### Mobile Hook

```typescript
import { usePacing } from '@/hooks/analytics';

const {
  pacing,
  isLoading,
  mode,           // 'kickoff' | 'pacing' | 'stability'
  pacingStatus,   // 'behind' | 'on_track' | 'ahead'
  targetAmount,
  currentSpend,
  pacingPercentage,
  expectedPercentage,
  stabilityScore,
  refetch,
} = usePacing();
```

### Key Files

- `services/analytics/creep_scorer.py` - `get_pacing_status()` method
- `models/analytics.py` - `PacingResponse`, `PacingMode`, `PacingStatus`
- `hooks/analytics/usePacing.ts` - Mobile hook
- `components/analytics/SpendingStabilityCard.tsx` - UI component with all three modes
