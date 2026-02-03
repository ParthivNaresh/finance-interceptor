# Finance Interceptor - Development Guidelines

## Architecture

**Monorepo Structure:**
- `apps/mobile` - Expo React Native app (TypeScript)
- `apps/backend` - FastAPI server (Python)
- `docs/` - Architecture diagrams, schema, roadmap

## Database

**Supabase (PostgreSQL):**
- Schema defined in `docs/schema.sql`
- Row Level Security (RLS) enabled on all tables
- Auto-creates user profile on signup via trigger

**Key Tables:**
- `users` - User profiles (extends auth.users)
- `plaid_items` - Connected bank accounts
- `accounts` - Bank accounts from Plaid
- `transactions` - Transaction history
- `recurring_transactions` - Detected subscriptions
- `alerts` - User notifications

## Mobile App (apps/mobile)

### Running
```bash
just mobile-start    # Start Metro bundler
just mobile-ios      # Build and run on iOS
```

### Key Patterns

**File-based routing** via expo-router:
- `app/(auth)/` - Auth screens (login, register)
- `app/(tabs)/` - Protected tab screens
- `app/_layout.tsx` - Root layout with auth routing

**Directory structure:**
- `components/` - UI components
- `config/` - App configuration (includes Supabase URL/key)
- `contexts/` - React contexts (AuthContext)
- `hooks/` - Custom React hooks (useAuth, usePlaidLink)
- `services/` - API and Supabase services
- `types/` - TypeScript interfaces

**Authentication:**
- `AuthProvider` wraps the app in `_layout.tsx`
- `useAuth()` hook provides: user, session, isAuthenticated, signIn, signUp, signOut
- Root layout auto-redirects based on auth state
- API client automatically includes JWT in requests

**Plaid integration:**
- Use `usePlaidLink` hook from `@/hooks`
- API calls via `plaidApi` from `@/services`

### Path Aliases
- `@/` maps to project root

## Backend (apps/backend)

### Running
```bash
just backend-start   # Handles SSL certs automatically
```

Or manually:
```bash
cd apps/backend
source .venv/bin/activate
export SSL_CERT_FILE=$(.venv/bin/python -c "import certifi; print(certifi.where())")
export REQUESTS_CA_BUNDLE=$SSL_CERT_FILE
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### Directory Structure
```
apps/backend/
├── config.py           # Settings (env vars)
├── main.py             # FastAPI app factory
├── models/             # Pydantic models
│   ├── auth.py         # AuthenticatedUser model
│   ├── common.py       # Shared models (HealthResponse)
│   └── plaid.py        # Plaid request/response models
├── routers/            # API endpoints
│   ├── health.py
│   └── plaid.py
├── services/           # Business logic
│   ├── auth.py         # Token validation via Supabase
│   ├── database.py     # Supabase client wrapper
│   └── plaid.py        # Plaid API wrapper
└── middleware/         # FastAPI middleware
    └── auth.py         # get_current_user, get_optional_user
```

### Key Patterns

**Service Container Pattern:**
- Services use container classes for singleton management
- Example: `PlaidServiceContainer.get()`, `DatabaseServiceContainer.get()`
- Initialized in `lifespan` context, reset on shutdown

**Dependency Injection:**
- Use `Annotated[Service, Depends(get_service)]` pattern
- Avoids B008 lint error (function call in default args)

**Auth Middleware:**
- `get_current_user` - Requires valid JWT, returns `AuthenticatedUser`
- `get_optional_user` - Returns `AuthenticatedUser | None`
- Token validation done via Supabase `auth.get_user(token)` - no JWT secret needed

### API Documentation
Available at http://localhost:8000/docs when server is running.

## Environment Variables

**Backend (.env):**
```
PLAID_CLIENT_ID=xxx
PLAID_SECRET=xxx
PLAID_ENVIRONMENT=sandbox

SUPABASE_URL=https://xxx.supabase.co
SUPABASE_ANON_KEY=xxx
SUPABASE_SERVICE_ROLE_KEY=xxx
```

**Mobile (app.json extra):**
```json
{
  "extra": {
    "supabaseUrl": "https://xxx.supabase.co",
    "supabaseAnonKey": "xxx"
  }
}
```

## Testing Plaid

Sandbox credentials:
- Bank: Search "Platypus"
- Username: `user_good`
- Password: `pass_good`

## Code Quality

**Linting:**
```bash
just lint        # Lint all code
just lint-fix    # Auto-fix issues
just check       # Lint + typecheck
```

**Python (Ruff + mypy):**
- Strict type checking enabled
- Pydantic models for all request/response types

**TypeScript (ESLint):**
- Strict mode enabled
- No `any` types allowed

## Task Runner

Use `just` for all commands:
```bash
just                  # Show all commands
just backend-start    # Start backend
just mobile-start     # Start Metro
just mobile-ios       # Run iOS simulator
just lint             # Lint everything
just check            # Lint + typecheck
```

## Key Files

- `docs/ROADMAP.md` - Development phases and tasks
- `docs/schema.sql` - Database schema
- `docs/architecture.puml` - Sequence diagrams
- `justfile` - Task runner commands
