#!/bin/bash
# =============================================================
# Run Seeding Script Against Production PostgreSQL Database
# =============================================================
set -e

PROJECT_ID="hischolar-49a2a"
REGION="us-central1"
CLOUD_SQL_INSTANCE="$PROJECT_ID:$REGION:collegetracker-db"
PROXY_PORT=5433

# Load credentials from .env file
ENV_FILE="$(dirname "$0")/.env"
if [ -f "$ENV_FILE" ]; then
    export $(grep -v '^#' "$ENV_FILE" | xargs)
fi

DB_NAME="${DB_NAME:-collegetracker}"
DB_USER="${DB_USER:-ctuser}"
DB_PASSWORD="${DB_PASSWORD:?ERROR: DB_PASSWORD not set in .env}"

cleanup() {
    if [ -n "$PROXY_PID" ] && kill -0 "$PROXY_PID" 2>/dev/null; then
        echo "Stopping Cloud SQL Proxy (PID: $PROXY_PID)..."
        kill "$PROXY_PID" 2>/dev/null
        wait "$PROXY_PID" 2>/dev/null || true
        echo "Proxy stopped."
    fi
}
trap cleanup EXIT

echo "Starting Cloud SQL Proxy..."
TOKEN=$(gcloud auth print-access-token 2>/dev/null)
if [ -z "$TOKEN" ]; then
    echo "ERROR: Failed to get access token. Run 'gcloud auth login' first."
    exit 1
fi

cloud-sql-proxy --credentials-file="" --token="$TOKEN" \
    "$CLOUD_SQL_INSTANCE" --port "$PROXY_PORT" &>/dev/null &
PROXY_PID=$!

sleep 3
if ! kill -0 "$PROXY_PID" 2>/dev/null; then
    echo "ERROR: Cloud SQL Proxy failed to start."
    exit 1
fi
echo "Cloud SQL Proxy running on port $PROXY_PORT (PID: $PROXY_PID)"

echo "Running seed_advisors_prod.py..."
export DB_HOST=127.0.0.1
export DB_NAME="$DB_NAME"
export DB_USER="$DB_USER"
export DB_PASSWORD="$DB_PASSWORD"
export DB_PORT="$PROXY_PORT"
export DJANGO_SETTINGS_MODULE=collegetracker.settings_prod

# Run the python script
# Determine Python & Virtualenv path
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
if [ -f "$SCRIPT_DIR/../venv/bin/activate" ]; then
    source "$SCRIPT_DIR/../venv/bin/activate"
elif [ -f "$SCRIPT_DIR/venv/bin/activate" ]; then
    source "$SCRIPT_DIR/venv/bin/activate"
fi

python seed_advisors_prod.py

echo "Production seeding completed successfully!"
