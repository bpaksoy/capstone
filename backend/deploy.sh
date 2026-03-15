#!/bin/bash
# =============================================================
# Production Deployment Script for Wormie Backend
# =============================================================
# This script handles the full deployment lifecycle:
#   1. Runs database migrations against Cloud SQL (via proxy)
#   2. Deploys the backend to Google Cloud Run
#
# Usage:
#   ./deploy.sh              # Full deploy (migrate + deploy)
#   ./deploy.sh --migrate    # Only run migrations
#   ./deploy.sh --deploy     # Only deploy to Cloud Run (skip migrations)
# =============================================================

set -e  # Exit on any error

# --- Configuration ---
PROJECT_ID="hischolar-49a2a"
REGION="us-central1"
SERVICE_NAME="collegetracker-api"
CLOUD_SQL_INSTANCE="$PROJECT_ID:$REGION:collegetracker-db"
PROXY_PORT=5433

# Load credentials from .env file (which is gitignored)
ENV_FILE="$(dirname "$0")/.env"
if [ -f "$ENV_FILE" ]; then
    export $(grep -v '^#' "$ENV_FILE" | xargs)
fi

DB_NAME="${DB_NAME:-collegetracker}"
DB_USER="${DB_USER:-ctuser}"
DB_PASSWORD="${DB_PASSWORD:?ERROR: DB_PASSWORD not set. Add it to backend/.env}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# --- Helper Functions ---
log_step() { echo -e "\n${BLUE}▶ $1${NC}"; }
log_ok()   { echo -e "${GREEN}✔ $1${NC}"; }
log_warn() { echo -e "${YELLOW}⚠ $1${NC}"; }
log_err()  { echo -e "${RED}✖ $1${NC}"; }

cleanup() {
    if [ -n "$PROXY_PID" ] && kill -0 "$PROXY_PID" 2>/dev/null; then
        log_step "Stopping Cloud SQL Proxy (PID: $PROXY_PID)..."
        kill "$PROXY_PID" 2>/dev/null
        wait "$PROXY_PID" 2>/dev/null || true
        log_ok "Proxy stopped."
    fi
}
trap cleanup EXIT

# --- Parse Arguments ---
MODE="full"  # Default: run both migrate and deploy
if [ "$1" == "--migrate" ]; then
    MODE="migrate"
elif [ "$1" == "--deploy" ]; then
    MODE="deploy"
fi

# --- Determine Python & Virtualenv ---
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR"

# Try to find and activate a virtualenv
if [ -f "$SCRIPT_DIR/../venv/bin/activate" ]; then
    source "$SCRIPT_DIR/../venv/bin/activate"
elif [ -f "$SCRIPT_DIR/venv/bin/activate" ]; then
    source "$SCRIPT_DIR/venv/bin/activate"
fi

PYTHON=$(command -v python3 || command -v python)
if [ -z "$PYTHON" ]; then
    log_err "Python not found. Please install Python 3."
    exit 1
fi

echo ""
echo "================================================"
echo "  🐛 Wormie Backend Deployment"
echo "  Mode: $MODE"
echo "  Region: $REGION"
echo "================================================"

# =============================================================
# STEP 1: Run Migrations (unless --deploy only)
# =============================================================
if [ "$MODE" != "deploy" ]; then
    log_step "Starting Cloud SQL Proxy..."

    # Check if cloud-sql-proxy is available
    if ! command -v cloud-sql-proxy &>/dev/null; then
        log_warn "cloud-sql-proxy not found. Installing..."
        gcloud components install cloud-sql-proxy --quiet
    fi

    # Get an OAuth2 token for authentication
    TOKEN=$(gcloud auth print-access-token 2>/dev/null)
    if [ -z "$TOKEN" ]; then
        log_err "Failed to get access token. Run 'gcloud auth login' first."
        exit 1
    fi

    # Start the proxy in the background
    cloud-sql-proxy --credentials-file="" --token="$TOKEN" \
        "$CLOUD_SQL_INSTANCE" --port "$PROXY_PORT" &>/dev/null &
    PROXY_PID=$!

    # Wait for proxy to be ready
    sleep 3
    if ! kill -0 "$PROXY_PID" 2>/dev/null; then
        log_err "Cloud SQL Proxy failed to start."
        exit 1
    fi
    log_ok "Cloud SQL Proxy running on port $PROXY_PORT (PID: $PROXY_PID)"

    # Show pending migrations
    log_step "Checking for pending migrations..."
    export DB_HOST=127.0.0.1
    export DB_NAME="$DB_NAME"
    export DB_USER="$DB_USER"
    export DB_PASSWORD="$DB_PASSWORD"
    export DB_PORT="$PROXY_PORT"
    export DJANGO_SETTINGS_MODULE=collegetracker.settings_prod

    PENDING=$($PYTHON manage.py showmigrations collegetracker 2>/dev/null | grep "\[ \]" || true)

    if [ -z "$PENDING" ]; then
        log_ok "All migrations are already applied. Database is up to date."
    else
        echo -e "${YELLOW}Pending migrations:${NC}"
        echo "$PENDING"
        echo ""

        log_step "Applying migrations..."
        $PYTHON manage.py migrate collegetracker 2>/dev/null
        log_ok "Migrations applied successfully!"
    fi

    # Also run migrations for Django's built-in apps (auth, sessions, etc.)
    log_step "Checking Django system migrations..."
    $PYTHON manage.py migrate --run-syncdb 2>/dev/null || true
    log_ok "System migrations checked."

    # Stop proxy now that migrations are done
    cleanup
    unset PROXY_PID
fi

# =============================================================
# STEP 2: Deploy to Cloud Run (unless --migrate only)
# =============================================================
if [ "$MODE" != "migrate" ]; then
    log_step "Deploying to Google Cloud Run..."
    echo "  Service: $SERVICE_NAME"
    echo "  Region:  $REGION"
    echo ""

    gcloud run deploy "$SERVICE_NAME" \
        --source . \
        --region "$REGION" \
        --quiet

    log_ok "Deployment complete!"

    # Show the service URL
    URL=$(gcloud run services describe "$SERVICE_NAME" --region "$REGION" --format="value(status.url)" 2>/dev/null)
    echo ""
    echo -e "${GREEN}================================================${NC}"
    echo -e "${GREEN}  ✅ Backend is live at: $URL${NC}"
    echo -e "${GREEN}================================================${NC}"
fi

echo ""
log_ok "All done! 🎉"
