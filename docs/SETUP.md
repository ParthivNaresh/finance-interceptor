# Finance Interceptor - Setup Guide

Complete setup instructions for developing Finance Interceptor from scratch.

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Initial Setup](#initial-setup)
3. [Plaid Configuration](#plaid-configuration)
4. [Supabase Configuration](#supabase-configuration)
5. [Running the App](#running-the-app)
6. [Webhook Setup (ngrok)](#webhook-setup-ngrok)
7. [Testing](#testing)
8. [Common Issues & Fixes](#common-issues--fixes)

---

## Prerequisites

### Required Software

| Software | Version | Installation |
|----------|---------|--------------|
| macOS | 13+ | Required for iOS development |
| Xcode | 15+ | Mac App Store |
| Python | 3.11+ | `brew install python@3.11` |
| Bun | Latest | `curl -fsSL https://bun.sh/install \| bash` |
| uv | Latest | `curl -LsSf https://astral.sh/uv/install.sh \| sh` |
| just | Latest | `brew install just` |
| ngrok | Latest | `brew install ngrok` |

### Xcode Setup

After installing Xcode from the App Store:

```bash
# Accept license
sudo xcode-select -s /Applications/Xcode.app/Contents/Developer
sudo xcodebuild -license accept

# Run first launch tasks
xcodebuild -runFirstLaunch

# Download iOS Simulator
# Xcode → Settings → Components → Download iOS 17+ Simulator
```

### Account Requirements

1. **Expo Account** - https://expo.dev/signup
2. **Plaid Account** - https://dashboard.plaid.com/signup
3. **Supabase Account** - https://supabase.com/dashboard

---

## Initial Setup

### 1. Clone and Install Dependencies

```bash
git clone <repository-url>
cd finance-interceptor

# Install all dependencies (mobile + backend)
just install
```

### 2. Backend Environment Setup

```bash
cd apps/backend

# Create virtual environment and install dependencies
uv venv
source .venv/bin/activate
uv pip install -e ".[dev]"

# Create environment file
cp .env.example .env
```

Edit `apps/backend/.env` with your credentials (see sections below for values).

### 3. Mobile Native Build (First Time Only)

```bash
cd apps/mobile

# Login to Expo
bunx expo login

# Generate native iOS project
bunx expo prebuild --platform ios --clean

# Build and run (this takes several minutes first time)
bunx expo run:ios
```

---

## Plaid Configuration

### 1. Create Plaid Account

1. Go to https://dashboard.plaid.com/signup
2. Complete registration
3. You'll start in **Sandbox** environment (free, uses test data)

### 2. Get API Credentials

1. Go to https://dashboard.plaid.com/developers/keys
2. Copy:
   - **Client ID**
   - **Sandbox Secret**

### 3. Configure Redirect URI

1. Go to https://dashboard.plaid.com/developers/api
2. Under "Allowed redirect URIs", add:
   ```
   https://auth.expo.io/@YOUR_EXPO_USERNAME/finance-interceptor
   ```
   Replace `YOUR_EXPO_USERNAME` with your Expo username.

### 4. Add to Backend .env

```env
PLAID_CLIENT_ID=your_client_id_here
PLAID_SECRET=your_sandbox_secret_here
PLAID_ENVIRONMENT=sandbox
PLAID_WEBHOOK_URL=  # Set this after ngrok setup
```

---

## Supabase Configuration

### 1. Create Supabase Project

1. Go to https://supabase.com/dashboard
2. Click "New Project"
3. Choose organization, name, password, region
4. Wait for project to be created (~2 minutes)

### 2. Get API Keys

1. Go to Project Settings → API
2. Copy:
   - **Project URL** (e.g., `https://xxxxx.supabase.co`)
   - **anon/public key**
   - **service_role key** (keep this secret!)

### 3. Run Database Schema

1. Go to SQL Editor in Supabase Dashboard
2. Copy contents of `docs/schema.sql`
3. Run the SQL

### 4. Add to Backend .env

```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

### 5. Generate Encryption Key

```bash
python -c "import secrets; print(secrets.token_urlsafe(32))"
```

Add to `.env`:
```env
ENCRYPTION_KEY=your_generated_key_here
```

### 6. Configure Mobile App

Edit `apps/mobile/app.json`, find the `extra` section:

```json
{
  "expo": {
    "extra": {
      "supabaseUrl": "https://your-project.supabase.co",
      "supabaseAnonKey": "your_anon_key_here",
      "apiUrl": "http://localhost:8000"
    }
  }
}
```

---

## Running the App

You need **3 terminal windows** running simultaneously:

### Terminal 1: Backend Server
```bash
just backend-start
```
Server runs at http://localhost:8000

### Terminal 2: Metro Bundler
```bash
just mobile-start
```
Press `i` to open iOS simulator.

### Terminal 3: iOS Simulator (Alternative)
```bash
just mobile-ios
```

Or open Xcode directly:
```bash
open apps/mobile/ios/FinanceInterceptor.xcworkspace
```

---

## Webhook Setup (ngrok)

Webhooks allow Plaid to notify your app when transactions are available.

### 1. Install and Configure ngrok

```bash
# Install
brew install ngrok

# Create account at https://ngrok.com and get auth token
ngrok config add-authtoken YOUR_AUTH_TOKEN
```

### 2. Start ngrok Tunnel

```bash
ngrok http 8000
```

You'll see output like:
```
Forwarding  https://abc123.ngrok-free.dev -> http://localhost:8000
```

### 3. Configure Webhook URL

Add the ngrok URL to your backend `.env`:
```env
PLAID_WEBHOOK_URL=https://abc123.ngrok-free.dev/api/webhooks/plaid
```

**Important:** The ngrok URL changes every time you restart ngrok (on free plan). Update `.env` and restart the backend each time.

### 4. Monitor Webhooks

Open http://127.0.0.1:4040 to see incoming webhook requests.

---

## Testing

### Test Bank Connection (Sandbox)

1. Start all 3 terminals (backend, metro, simulator)
2. Register/login in the app
3. Tap "Connect Your Bank"
4. Search for **"Platypus"** (Plaid's sandbox OAuth bank)
5. Use credentials:
   - Username: `user_good`
   - Password: `pass_good`
6. Complete the flow
7. Check Supabase tables:
   - `plaid_items` - Should have new row
   - `accounts` - Should have 12 accounts
   - `transactions` - Should have ~48 transactions (after webhook)

### Test API Endpoints

Get a JWT token by logging in, then:

```bash
# Health check
curl http://localhost:8000/health

# List accounts (requires auth)
curl -H "Authorization: Bearer YOUR_JWT" http://localhost:8000/api/accounts

# List transactions
curl -H "Authorization: Bearer YOUR_JWT" "http://localhost:8000/api/transactions?limit=10"
```

Or use Swagger UI at http://localhost:8000/docs

---

## Common Issues & Fixes

### Port 8000 Already in Use

```bash
lsof -ti:8000 | xargs kill -9
```

### SSL Certificate Errors

The `just backend-start` command handles this automatically. If running manually:
```bash
export SSL_CERT_FILE=$(.venv/bin/python -c "import certifi; print(certifi.where())")
export REQUESTS_CA_BUNDLE=$SSL_CERT_FILE
```

### "No script URL provided" in Simulator

Metro bundler isn't running. Run `just mobile-start` in another terminal.

### Plaid Link Shows "Development Mode" Alert

Rebuild the native app:
```bash
just mobile-prebuild-ios
just mobile-ios
```

### Simulator Crashes or Freezes

```bash
killall Simulator
just mobile-ios
```

### "Module not found" Errors in Backend

```bash
cd apps/backend
source .venv/bin/activate
uv pip install -e ".[dev]"
```

### TypeScript Errors After Adding New Files

```bash
cd apps/mobile
bun install
```

### Webhooks Not Received

1. Check ngrok is running: `ngrok http 8000`
2. Check ngrok URL in `.env` matches current tunnel
3. Restart backend after changing `.env`
4. Check http://127.0.0.1:4040 for incoming requests
5. Connect a **new** bank (existing items don't get new webhook URL)

### Database Constraint Errors

Check for orphaned data:
```sql
-- Delete orphaned transactions
DELETE FROM transactions WHERE account_id NOT IN (SELECT id FROM accounts);

-- Delete orphaned accounts
DELETE FROM accounts WHERE plaid_item_id NOT IN (SELECT id FROM plaid_items);
```

### "Invalid API key" from Plaid

1. Check `PLAID_CLIENT_ID` and `PLAID_SECRET` in `.env`
2. Make sure you're using **Sandbox** credentials (not Development/Production)
3. Restart backend after changing `.env`

### iOS Build Fails

```bash
cd apps/mobile

# Clean and rebuild
rm -rf ios
bunx expo prebuild --platform ios --clean
bunx expo run:ios
```

### CocoaPods Issues

```bash
cd apps/mobile/ios
pod deintegrate
pod install
```

---

## Environment Variables Reference

### Backend (`apps/backend/.env`)

| Variable | Description | Example |
|----------|-------------|---------|
| `PLAID_CLIENT_ID` | Plaid API client ID | `abc123...` |
| `PLAID_SECRET` | Plaid API secret (sandbox) | `xyz789...` |
| `PLAID_ENVIRONMENT` | Plaid environment | `sandbox` |
| `PLAID_WEBHOOK_URL` | ngrok URL for webhooks | `https://xxx.ngrok-free.dev/api/webhooks/plaid` |
| `SUPABASE_URL` | Supabase project URL | `https://xxx.supabase.co` |
| `SUPABASE_ANON_KEY` | Supabase public key | `eyJ...` |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service key | `eyJ...` |
| `ENCRYPTION_KEY` | Key for encrypting tokens | `abc123...` |
| `DEBUG` | Enable debug mode | `true` |

### Mobile (`apps/mobile/app.json` → extra)

| Variable | Description | Example |
|----------|-------------|---------|
| `supabaseUrl` | Supabase project URL | `https://xxx.supabase.co` |
| `supabaseAnonKey` | Supabase public key | `eyJ...` |
| `apiUrl` | Backend API URL | `http://localhost:8000` |

---

## Next Steps

After setup is complete:

1. Read `docs/ROADMAP.md` for project status and planned features
2. Read `docs/COMMANDS.md` for available just commands
3. Check `docs/schema.sql` for database structure
