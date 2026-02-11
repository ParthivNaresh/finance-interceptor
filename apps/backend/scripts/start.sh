#!/bin/sh
set -e

case "${SERVICE_TYPE}" in
  api)
    echo "Starting API server on port ${PORT:-8000}..."
    exec /app/.venv/bin/uvicorn main:app --host 0.0.0.0 --port "${PORT:-8000}"
    ;;
  worker)
    echo "Starting ARQ worker..."
    exec /app/.venv/bin/arq workers.WorkerSettings
    ;;
  *)
    echo "ERROR: SERVICE_TYPE must be 'api' or 'worker' (got '${SERVICE_TYPE}')"
    exit 1
    ;;
esac
