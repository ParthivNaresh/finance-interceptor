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
│   └── analytics_log.py
├── services/            # Business logic
│   ├── plaid.py         # Plaid API wrapper
│   ├── database.py      # Supabase client
│   ├── auth.py          # Token validation
│   ├── transaction_sync.py
│   ├── recurring.py
│   ├── alert_detection.py
│   ├── webhook.py
│   └── analytics/       # Analytics package
│       ├── period_calculator.py
│       ├── transfer_detector.py
│       ├── spending_aggregator.py
│       └── computation_manager.py
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
- Validated via Supabase `auth.get_user(token)`
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

Analytics computation runs asynchronously via a Redis-backed job queue.

### Architecture
```
Webhook → FastAPI → Redis Queue → ARQ Worker → Analytics Computation
                         ↓
                   30s debounce
```

### Key Features
- **Debouncing**: Multiple webhooks for same user within 30s trigger only one computation
- **Retry with backoff**: Failed jobs retry with exponential backoff (10s, 20s, 40s...)
- **Graceful fallback**: If Redis unavailable, runs synchronously

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

# Enqueue analytics computation with debouncing
task_queue = get_task_queue_service()
result = await task_queue.enqueue_analytics_computation(user_id)
# result.was_debounced = True if existing job was cancelled
```

### Configuration
```env
REDIS_URL=redis://localhost:6379
TASK_QUEUE_ENABLED=true
TASK_DEBOUNCE_SECONDS=30
```

Set `TASK_QUEUE_ENABLED=false` to disable background processing (analytics runs synchronously).

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
│   ├── useAnalytics.ts
│   └── usePlaidLink.ts
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

**Next:**
- Spending trend chart component
- Merchant intelligence
- Cash flow analysis
- Anomaly detection

See `docs/ROADMAP.md` for full task list.
