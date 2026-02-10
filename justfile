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

# Kill any existing backend process on port 8000
backend-kill:
    -lsof -ti:8000 | xargs kill -9 2>/dev/null || true

# Start backend server (kills existing process first)
backend-start: backend-kill
    cd apps/backend && source .venv/bin/activate && \
    export SSL_CERT_FILE=$(.venv/bin/python -c "import certifi; print(certifi.where())") && \
    export REQUESTS_CA_BUNDLE=$SSL_CERT_FILE && \
    uvicorn main:app --reload --host 0.0.0.0 --port 8000

# Start background worker
worker-start:
    cd apps/backend && source .venv/bin/activate && \
    export SSL_CERT_FILE=$(.venv/bin/python -c "import certifi; print(certifi.where())") && \
    export REQUESTS_CA_BUNDLE=$SSL_CERT_FILE && \
    arq workers.WorkerSettings

# Lint backend code
backend-lint:
    cd apps/backend && source .venv/bin/activate && ruff check .

# Lint and fix backend code
backend-lint-fix:
    cd apps/backend && source .venv/bin/activate && ruff check . --fix

# Check backend formatting (fails if not formatted)
backend-format-check:
    cd apps/backend && source .venv/bin/activate && ruff format --check .

# Format backend code
backend-format:
    cd apps/backend && source .venv/bin/activate && ruff format .

# Type check backend code
backend-typecheck:
    cd apps/backend && source .venv/bin/activate && mypy .

# Run backend tests
backend-test *args='':
    cd apps/backend && source .venv/bin/activate && \
    export SSL_CERT_FILE=$(.venv/bin/python -c "import certifi; print(certifi.where())") && \
    export REQUESTS_CA_BUNDLE=$SSL_CERT_FILE && \
    pytest tests/ {{ args }}

# Run backend tests with coverage report
backend-test-cov:
    just backend-test --cov=. --cov-report=term-missing --cov-report=html:htmlcov

# Install backend dependencies
backend-install:
    cd apps/backend && uv sync --extra dev

# Sync backend from lock file (CI: fails if lock is stale)
backend-sync-locked:
    cd apps/backend && uv sync --locked --extra dev

# Install testing framework into backend venv
backend-install-testing:
    cd apps/backend && uv pip install -e ../testing/

# Install testing framework (standalone venv for development)
testing-install:
    cd apps/testing && uv sync --dev

# Lock backend dependencies
backend-lock:
    cd apps/backend && uv lock

# Lock testing dependencies
testing-lock:
    cd apps/testing && uv lock

# Upgrade backend dependencies to latest compatible versions
backend-upgrade:
    cd apps/backend && uv lock --upgrade && uv sync --extra dev

# Show outdated backend dependencies
backend-outdated:
    cd apps/backend && uv pip list --outdated

# ============================================================================
# REDIS
# ============================================================================

# Start Redis (Docker)
redis-start:
    docker run -d --name finance-interceptor-redis -p 6379:6379 redis:alpine

# Stop Redis (Docker)
redis-stop:
    docker stop finance-interceptor-redis && docker rm finance-interceptor-redis

# Check Redis status
redis-status:
    @docker inspect -f '{{`{{.State.Status}}`}}' finance-interceptor-redis 2>/dev/null || echo "not running"

# ============================================================================
# DOCS
# ============================================================================

# Build documentation (strict mode, fails on warnings)
docs-build:
    mkdocs build --strict

# Serve documentation locally with live reload
docs-serve:
    mkdocs serve

# ============================================================================
# ALL
# ============================================================================

# Install all dependencies (mobile + backend + testing)
install: mobile-install backend-install testing-install

# Lint all code
lint: mobile-lint backend-lint

# Lint and fix all code
lint-fix: mobile-lint-fix backend-lint-fix

# Type check all code
typecheck: mobile-typecheck backend-typecheck

# Run all checks (lint + format check + typecheck)
check: lint backend-format-check typecheck

# Format all code
format: backend-format

# ============================================================================
# CI
# ============================================================================

# Run CI checks with no caching (deterministic, mirrors GitHub Actions)
ci-check:
    @echo "=== Backend lint (no cache) ==="
    cd apps/backend && source .venv/bin/activate && ruff check --no-cache .
    @echo "=== Backend format check (no cache) ==="
    cd apps/backend && source .venv/bin/activate && ruff format --no-cache --check .
    @echo "=== Backend typecheck (no incremental cache) ==="
    cd apps/backend && source .venv/bin/activate && mypy --no-incremental .
    @echo "=== Mobile lint ==="
    cd apps/mobile && bun run lint
    @echo "=== Mobile typecheck ==="
    cd apps/mobile && bun run typecheck
    @echo "=== Docs build ==="
    mkdocs build --strict
    @echo "=== All CI checks passed ==="

# Run full CI pipeline locally (checks + tests)
ci-full:
    just ci-check
    @echo "=== Backend tests with coverage ==="
    just backend-test --cov=. --cov-report=term-missing -v

# ============================================================================
# CLEANUP
# ============================================================================

# Remove Python caches and build artifacts
clean:
    find . -type d -name __pycache__ -exec rm -rf {} + 2>/dev/null || true
    find . -type d -name .mypy_cache -exec rm -rf {} + 2>/dev/null || true
    find . -type d -name .ruff_cache -exec rm -rf {} + 2>/dev/null || true
    find . -type d -name .pytest_cache -exec rm -rf {} + 2>/dev/null || true
    find . -type d -name htmlcov -exec rm -rf {} + 2>/dev/null || true
    find . -name '*.pyc' -delete 2>/dev/null || true
    rm -rf apps/backend/coverage.xml site/ 2>/dev/null || true
    @echo "Cleaned."

# Remove all generated/installed artifacts (nuclear option)
clean-all: clean
    rm -rf apps/backend/.venv apps/testing/.venv node_modules apps/mobile/node_modules 2>/dev/null || true
    @echo "Cleaned all. Run 'just install' to reinstall."
