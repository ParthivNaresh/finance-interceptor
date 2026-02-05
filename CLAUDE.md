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

### Running Backend
```bash
just backend-start
# Or manually:
cd apps/backend && poetry run uvicorn main:app --reload
```

### API Docs
http://localhost:8000/docs

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

**Backend (.env):**
```
PLAID_CLIENT_ID=xxx
PLAID_SECRET=xxx
PLAID_ENVIRONMENT=sandbox
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_ANON_KEY=xxx
SUPABASE_SERVICE_ROLE_KEY=xxx
ENCRYPTION_KEY=xxx
```

**Mobile (config/supabase.ts):**
Supabase URL and anon key are in config file.

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
