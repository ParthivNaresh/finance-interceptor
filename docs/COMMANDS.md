# Finance Interceptor - Commands Reference

All commands are run using `just` from the project root directory.

Run `just` with no arguments to see all available commands.

---

## Quick Reference

| Command | Description |
|---------|-------------|
| `just` | Show all available commands |
| `just backend-start` | Start backend server |
| `just mobile-start` | Start Metro bundler |
| `just mobile-ios` | Run iOS simulator |
| `just install` | Install all dependencies |
| `just check` | Run all linting and type checks |

---

## Daily Development

### Starting the App

You need 3 terminals running simultaneously:

```bash
# Terminal 1: Backend
just backend-start

# Terminal 2: Metro bundler
just mobile-start
# Then press 'i' for iOS

# Terminal 3 (alternative): Direct iOS launch
just mobile-ios
```

### Stopping the App

- **Backend**: `Ctrl+C` in terminal
- **Metro**: `Ctrl+C` in terminal
- **Simulator**: Close the Simulator app or `killall Simulator`

---

## Mobile Commands

| Command | Description |
|---------|-------------|
| `just mobile-start` | Start Metro bundler (development server) |
| `just mobile-ios` | Build and run on iOS simulator |
| `just mobile-android` | Build and run on Android emulator |
| `just mobile-install` | Install mobile dependencies |
| `just mobile-prebuild-ios` | Regenerate iOS native code (clean build) |
| `just mobile-prebuild-android` | Regenerate Android native code (clean build) |
| `just mobile-lint` | Run ESLint on mobile code |
| `just mobile-lint-fix` | Run ESLint and auto-fix issues |
| `just mobile-typecheck` | Run TypeScript type checking |

### When to Use Prebuild

Run `just mobile-prebuild-ios` when:
- First time setup
- After adding native dependencies
- After changing `app.json` configuration
- When native code seems out of sync
- After updating Expo SDK

---

## Backend Commands

| Command | Description |
|---------|-------------|
| `just backend-start` | Start FastAPI server with hot reload |
| `just backend-install` | Create venv and install dependencies |
| `just backend-lint` | Run Ruff linter |
| `just backend-lint-fix` | Run Ruff and auto-fix issues |
| `just backend-format` | Format code with Ruff |
| `just backend-typecheck` | Run mypy type checking |

### Backend Server Details

The `backend-start` command:
- Activates the virtual environment
- Sets SSL certificate environment variables (fixes Plaid API issues)
- Starts uvicorn with hot reload on port 8000
- Binds to `0.0.0.0` (accessible from simulator)

---

## Code Quality Commands

| Command | Description |
|---------|-------------|
| `just lint` | Lint all code (mobile + backend) |
| `just lint-fix` | Lint and auto-fix all code |
| `just typecheck` | Type check all code |
| `just check` | Run lint + typecheck (use before commits) |
| `just format` | Format backend code |

### Pre-Commit Workflow

Before committing changes:
```bash
just check
```

This runs all linting and type checking. Fix any issues before committing.

---

## Installation Commands

| Command | Description |
|---------|-------------|
| `just install` | Install all dependencies (mobile + backend) |
| `just mobile-install` | Install mobile dependencies only |
| `just backend-install` | Install backend dependencies only |

### Fresh Install

For a completely fresh install:
```bash
# Remove existing dependencies
rm -rf apps/mobile/node_modules
rm -rf apps/backend/.venv

# Reinstall everything
just install
```

---

## CI Commands

| Command | Description |
|---------|-------------|
| `just ci-check` | Run all CI checks (for pipelines) |

---

## External Tools

These aren't `just` commands but are commonly used:

### ngrok (Webhooks)

```bash
# Start tunnel for webhooks
ngrok http 8000

# View webhook inspector
open http://127.0.0.1:4040
```

### Xcode

```bash
# Open iOS project directly
open apps/mobile/ios/FinanceInterceptor.xcworkspace
```

### Supabase

```bash
# Access Supabase dashboard
open https://supabase.com/dashboard
```

### Plaid

```bash
# Access Plaid dashboard
open https://dashboard.plaid.com
```

---

## Troubleshooting Commands

### Kill Stuck Processes

```bash
# Kill backend on port 8000
lsof -ti:8000 | xargs kill -9

# Kill Metro bundler on port 8081
lsof -ti:8081 | xargs kill -9

# Kill iOS Simulator
killall Simulator
```

### Clean Builds

```bash
# Clean iOS build
cd apps/mobile
rm -rf ios
just mobile-prebuild-ios

# Clean node_modules
rm -rf apps/mobile/node_modules
just mobile-install

# Clean Python venv
rm -rf apps/backend/.venv
just backend-install
```

### Reset Simulator

```bash
# Reset all simulator content and settings
xcrun simctl erase all
```

---

## Command Aliases

You can add these to your shell profile (`~/.zshrc` or `~/.bashrc`):

```bash
# Quick aliases for this project
alias fi-backend="cd ~/path/to/finance-interceptor && just backend-start"
alias fi-mobile="cd ~/path/to/finance-interceptor && just mobile-start"
alias fi-ios="cd ~/path/to/finance-interceptor && just mobile-ios"
alias fi-check="cd ~/path/to/finance-interceptor && just check"
```

---

## Adding New Commands

To add new commands, edit the `justfile` in the project root.

Example:
```just
# My new command
my-command:
    echo "Hello from my command"
```

Then run with `just my-command`.
