#!/bin/bash
# =============================================================
# Production Deployment Script for Wormie Frontend
# =============================================================
# This script builds the React app and deploys to Firebase Hosting.
#
# Usage:
#   ./deploy.sh              # Build and deploy
#   ./deploy.sh --build      # Only build (no deploy)
# =============================================================

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

log_step() { echo -e "\n${BLUE}▶ $1${NC}"; }
log_ok()   { echo -e "${GREEN}✔ $1${NC}"; }
log_err()  { echo -e "${RED}✖ $1${NC}"; }

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR"

echo ""
echo "================================================"
echo "  🐛 Wormie Frontend Deployment"
echo "================================================"

# Build
log_step "Building production bundle..."
npm run build

log_ok "Build complete!"

# Deploy (unless --build only)
if [ "$1" != "--build" ]; then
    log_step "Deploying to Firebase Hosting..."
    firebase deploy --only hosting

    echo ""
    echo -e "${GREEN}================================================${NC}"
    echo -e "${GREEN}  ✅ Frontend is live at: https://wormie.app${NC}"
    echo -e "${GREEN}================================================${NC}"
fi

echo ""
log_ok "All done! 🎉"
