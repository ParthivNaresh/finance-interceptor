set dotenv-load := false

# Default recipe - show available commands
default:
    @just --list

# ============================================================================
# MOBILE
# ============================================================================

# Start Metro bundler
mobile-start:
    cd apps/mobile && bun start

# Run iOS simulator
mobile-ios:
    cd apps/mobile && bunx expo run:ios

# Run Android emulator
mobile-android:
    cd apps/mobile && bunx expo run:android

# Lint mobile code
mobile-lint:
    cd apps/mobile && bun run lint

# Lint and fix mobile code
mobile-lint-fix:
    cd apps/mobile && bun run lint:fix

# Type check mobile code
mobile-typecheck:
    cd apps/mobile && bun run typecheck

# Install mobile dependencies
mobile-install:
    cd apps/mobile && bun install

# Rebuild iOS native code
mobile-prebuild-ios:
    cd apps/mobile && bunx expo prebuild --platform ios --clean

# Rebuild Android native code
mobile-prebuild-android:
    cd apps/mobile && bunx expo prebuild --platform android --clean

# ============================================================================
# BACKEND
# ============================================================================

# Start backend server
backend-start:
    cd apps/backend && source .venv/bin/activate && \
    export SSL_CERT_FILE=$(.venv/bin/python -c "import certifi; print(certifi.where())") && \
    export REQUESTS_CA_BUNDLE=$SSL_CERT_FILE && \
    uvicorn main:app --reload --host 0.0.0.0 --port 8000

# Lint backend code
backend-lint:
    cd apps/backend && source .venv/bin/activate && ruff check .

# Lint and fix backend code
backend-lint-fix:
    cd apps/backend && source .venv/bin/activate && ruff check . --fix

# Format backend code
backend-format:
    cd apps/backend && source .venv/bin/activate && ruff format .

# Type check backend code
backend-typecheck:
    cd apps/backend && source .venv/bin/activate && mypy .

# Install backend dependencies
backend-install:
    cd apps/backend && uv venv && source .venv/bin/activate && uv pip install -e ".[dev]"

# ============================================================================
# ALL
# ============================================================================

# Install all dependencies
install: mobile-install backend-install

# Lint all code
lint: mobile-lint backend-lint

# Lint and fix all code
lint-fix: mobile-lint-fix backend-lint-fix

# Type check all code
typecheck: mobile-typecheck backend-typecheck

# Run all checks (lint + typecheck)
check: lint typecheck

# Format all code
format: backend-format

# ============================================================================
# CI
# ============================================================================

# Run CI checks (for GitLab/GitHub pipelines)
ci-check:
    @echo "Running lint checks..."
    just lint
    @echo "Running type checks..."
    just typecheck
    @echo "All checks passed!"
