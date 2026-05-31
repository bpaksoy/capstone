#!/bin/bash
# =============================================================
# Production Scorecard Data Update Script for Wormie
# =============================================================
set -e

# --- Configuration ---
PROJECT_ID="hischolar-49a2a"
REGION="us-central1"
CLOUD_SQL_INSTANCE="$PROJECT_ID:$REGION:collegetracker-db"
PROXY_PORT=5434

# Load credentials from .env
ENV_FILE="$(dirname "$0")/.env"
if [ -f "$ENV_FILE" ]; then
    export $(grep -v '^#' "$ENV_FILE" | xargs)
fi

DB_NAME="${DB_NAME:-collegetracker}"
DB_USER="${DB_USER:-ctuser}"
DB_PASSWORD="${DB_PASSWORD:?ERROR: DB_PASSWORD not set in .env}"

# Determine Python
PYTHON="./temp_venv/bin/python"

# --- Cleanup ---
cleanup() {
    if [ -n "$PROXY_PID" ] && kill -0 "$PROXY_PID" 2>/dev/null; then
        echo "Stopping Cloud SQL Proxy (PID: $PROXY_PID)..."
        kill "$PROXY_PID" 2>/dev/null
        wait "$PROXY_PID" 2>/dev/null || true
    fi
}
trap cleanup EXIT

# --- Start Proxy ---
echo "▶ Starting Cloud SQL Proxy..."
TOKEN=$(gcloud auth print-access-token 2>/dev/null)
cloud-sql-proxy --credentials-file="" --token="$TOKEN" \
    "$CLOUD_SQL_INSTANCE" --port "$PROXY_PORT" &>/dev/null &
PROXY_PID=$!
sleep 3

# --- Run Update ---
echo "▶ Running 2026 Scorecard Update on Production Database..."
export DB_HOST=127.0.0.1
export DB_NAME="$DB_NAME"
export DB_USER="$DB_USER"
export DB_PASSWORD="$DB_PASSWORD"
export DB_PORT="$PROXY_PORT"
export DJANGO_SETTINGS_MODULE=collegetracker.settings_prod

$PYTHON manage.py update_scorecard_2026 \
    /Users/banupaksoy/Desktop/capstone/College_Scorecard_Raw_Data_03232026/Most-Recent-Cohorts-Institution.csv \
    /Users/banupaksoy/Desktop/capstone/College_Scorecard_Raw_Data_03232026/Most-Recent-Cohorts-Field-of-Study.csv

echo "✅ Production Data Update Complete! 🎉"
