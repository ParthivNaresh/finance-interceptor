# Finance Interceptor

A proactive financial monitoring app that detects subscription price increases and lifestyle creep before they impact your budget.

---

## Quick Start (Daily Development)

You need **3 terminal windows** running simultaneously:

### Terminal 1: Backend Server
```bash
just backend-start
```

### Terminal 2: Metro Bundler
```bash
just mobile-start
```

### Terminal 3: iOS Simulator
```bash
just mobile-ios
```

Or open Xcode directly:
```bash
open apps/mobile/ios/FinanceInterceptor.xcworkspace
```

---

## First-Time Setup

### Prerequisites

1. **Bun** (JavaScript runtime)
   ```bash
   curl -fsSL https://bun.sh/install | bash
   ```

2. **Python 3.11+**
   ```bash
   python3 --version
   ```

3. **uv** (Python package manager)
   ```bash
   curl -LsSf https://astral.sh/uv/install.sh | sh
   ```

4. **just** (task runner)
   ```bash
   brew install just
   ```

5. **Xcode** (from Mac App Store)
   ```bash
   sudo xcode-select -s /Applications/Xcode.app/Contents/Developer
   sudo xcodebuild -license accept
   xcodebuild -runFirstLaunch
   ```
   Then: Xcode → Settings → Components → Download iOS Simulator

6. **Expo Account**
   ```bash
   bunx expo login
   ```

7. **Plaid Account**
   - Sign up at https://dashboard.plaid.com/signup
   - Get API keys from https://dashboard.plaid.com/developers/keys
   - Add redirect URI: `https://auth.expo.io/@YOUR_EXPO_USERNAME/finance-interceptor`

### Installation

```bash
cd finance-interceptor

# Install all dependencies
just install

# Configure backend environment
cd apps/backend
cp .env.example .env
# Edit .env with your Plaid credentials

# Build iOS app (first time only)
cd ../mobile
bunx expo prebuild --clean
bunx expo run:ios
```

---

## Available Commands

Run `just` to see all available commands:

```bash
just                      # Show all commands

# Development
just backend-start        # Start backend server (handles SSL certs)
just mobile-start         # Start Metro bundler
just mobile-ios           # Run iOS simulator
just mobile-android       # Run Android emulator

# Code Quality
just lint                 # Lint all code
just lint-fix             # Lint and auto-fix all code
just typecheck            # Type check all code
just check                # Run all checks (lint + typecheck)
just format               # Format backend code

# Installation
just install              # Install all dependencies
just mobile-install       # Install mobile dependencies only
just backend-install      # Install backend dependencies only

# Rebuild
just mobile-prebuild-ios  # Rebuild iOS native code
```

---

## Project Structure

```
finance-interceptor/
├── apps/
│   ├── backend/                 # Python FastAPI server
│   │   ├── main.py              # App factory & startup
│   │   ├── config.py            # Environment configuration
│   │   ├── models.py            # Pydantic request/response models
│   │   ├── routers/             # API route handlers
│   │   │   ├── __init__.py      # Router aggregation
│   │   │   ├── health.py        # Health check endpoint
│   │   │   └── plaid.py         # Plaid endpoints
│   │   ├── services/            # Business logic
│   │   │   ├── __init__.py
│   │   │   └── plaid.py         # Plaid API wrapper
│   │   ├── .env                 # Secrets (not in git)
│   │   └── .env.example         # Template for .env
│   │
│   └── mobile/                  # React Native Expo app
│       ├── app/                 # Screens (file-based routing)
│       │   ├── (tabs)/          # Tab navigation
│       │   │   ├── _layout.tsx  # Tab configuration
│       │   │   ├── index.tsx    # Connect bank screen
│       │   │   └── two.tsx      # Activity screen
│       │   ├── _layout.tsx      # Root navigation
│       │   ├── modal.tsx        # About modal
│       │   └── plaid-oauth.tsx  # OAuth redirect handler
│       ├── components/          # UI components
│       │   ├── Themed.tsx       # Theme-aware Text/View
│       │   └── index.ts         # Barrel export
│       ├── config/              # App configuration
│       │   └── index.ts
│       ├── constants/           # Static values
│       │   └── Colors.ts        # Theme colors
│       ├── hooks/               # Custom React hooks
│       │   ├── usePlaidLink.ts  # Plaid Link hook
│       │   └── index.ts
│       ├── services/            # API services
│       │   ├── api/
│       │   │   ├── client.ts    # HTTP client
│       │   │   ├── plaid.ts     # Plaid API calls
│       │   │   └── index.ts
│       │   └── index.ts
│       ├── types/               # TypeScript types
│       │   ├── api.ts           # API types
│       │   └── index.ts
│       └── ios/                 # Generated native code
│
├── justfile                     # Task runner commands
├── package.json                 # Monorepo root
└── README.md
```

---

## Testing Plaid

1. Start backend and mobile app (see Quick Start)
2. Tap "Connect Your Bank"
3. Search for **"Platypus"** (Plaid's sandbox OAuth bank)
4. Use credentials:
   - Username: `user_good`
   - Password: `pass_good`
5. Complete the flow → You should see "Success" alert with Item ID

---

## Common Issues

### "Address already in use" (port 8000)
```bash
lsof -ti:8000 | xargs kill -9
```

### SSL Certificate errors
The `just backend-start` command handles this automatically. If running manually:
```bash
export SSL_CERT_FILE=$(.venv/bin/python -c "import certifi; print(certifi.where())")
export REQUESTS_CA_BUNDLE=$SSL_CERT_FILE
```

### "No script URL provided" in simulator
Metro bundler isn't running. Run `just mobile-start` in another terminal.

### Plaid Link shows "Development Mode" alert
```bash
just mobile-prebuild-ios
just mobile-ios
```

### Simulator crashes
```bash
killall Simulator
just mobile-ios
```

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Health check |
| POST | `/api/plaid/link-token` | Create Plaid Link token |
| POST | `/api/plaid/exchange-token` | Exchange public token for access token |

---

## Environment Variables

### Backend (`apps/backend/.env`)
```
PLAID_CLIENT_ID=your_client_id
PLAID_SECRET=your_sandbox_secret
PLAID_ENVIRONMENT=sandbox
```

---

## Code Quality

Before committing, run:
```bash
just check
```

This runs linting and type checking for both backend and mobile.

---

## TODO: POC → Production

### High Priority
- [ ] Database integration (store access_token, item_id)
- [ ] User authentication
- [ ] Transaction fetching via Plaid
- [ ] Plaid webhooks for real-time updates
- [ ] Proper error handling & retry logic
- [ ] Security hardening (CORS, rate limiting)

### Medium Priority
- [ ] Recurring transaction detection
- [ ] Price change alerts
- [ ] Transaction list UI
- [ ] Multiple bank account support

### Lower Priority
- [ ] Push notifications
- [ ] Spending analytics
- [ ] Unit & integration tests

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Mobile | React Native + Expo + TypeScript |
| Backend | FastAPI + Python |
| Banking | Plaid API |
| Task Runner | just |
| Linting | Ruff (Python), ESLint (TypeScript) |
| Type Checking | mypy (Python), TypeScript |
| Package Managers | Bun (JS), uv (Python) |
