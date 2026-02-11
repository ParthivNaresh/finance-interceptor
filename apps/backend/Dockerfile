# === Build stage ===
FROM python:3.12-slim AS builder

COPY --from=ghcr.io/astral-sh/uv:latest /uv /usr/local/bin/uv

WORKDIR /app

# Install deps first (layer caching — only reinstalls when lock changes)
COPY pyproject.toml uv.lock ./
RUN uv sync --locked --no-dev --no-install-project

# Copy application code
COPY . .

# === Runtime stage ===
FROM python:3.12-slim

WORKDIR /app

# Copy virtual environment and application from builder
COPY --from=builder /app /app

# Set certifi CA bundle for Plaid SDK and httpx
ENV SSL_CERT_FILE=/app/.venv/lib/python3.12/site-packages/certifi/cacert.pem
ENV REQUESTS_CA_BUNDLE=/app/.venv/lib/python3.12/site-packages/certifi/cacert.pem

# Render injects PORT; default to 8000
ENV PORT=8000

COPY scripts/start.sh /app/scripts/start.sh
RUN chmod +x /app/scripts/start.sh

EXPOSE ${PORT}

ENTRYPOINT ["/app/scripts/start.sh"]
