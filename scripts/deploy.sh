#!/bin/bash
# =============================================================================
# SafeDeploy - Deployment Trigger Script
# Triggers Render deployment via deploy hook
# Usage: ./scripts/deploy.sh [image_tag]
# =============================================================================
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
IMAGE_TAG="${1:-latest}"
TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ")

# ── Helpers ──────────────────────────────────────────────────────────────────

log()  { echo "[${TIMESTAMP}] [INFO]  $*"; }
err()  { echo "[${TIMESTAMP}] [ERROR] $*" >&2; }
warn() { echo "[${TIMESTAMP}] [WARN]  $*"; }

# ── Validate prerequisites ──────────────────────────────────────────────────

if [ -z "${RENDER_DEPLOY_HOOK_URL:-}" ]; then
    err "RENDER_DEPLOY_HOOK_URL environment variable is not set."
    err "Set it with:  export RENDER_DEPLOY_HOOK_URL='https://api.render.com/deploy/...'"
    exit 1
fi

if ! command -v curl &> /dev/null; then
    err "curl is required but not installed."
    exit 1
fi

# ── Trigger deployment ──────────────────────────────────────────────────────

log "Triggering Render deployment..."
log "Image tag: ${IMAGE_TAG}"

HTTP_CODE=$(curl -s -o /tmp/deploy_response.txt -w "%{http_code}" \
    "${RENDER_DEPLOY_HOOK_URL}")

if [ "${HTTP_CODE}" -ge 200 ] && [ "${HTTP_CODE}" -lt 300 ]; then
    log "Deploy hook triggered successfully (HTTP ${HTTP_CODE})."
else
    err "Deploy hook returned HTTP ${HTTP_CODE}."
    err "Response: $(cat /tmp/deploy_response.txt 2>/dev/null)"
    exit 1
fi

# ── Wait and verify health ──────────────────────────────────────────────────

log "Waiting 60 seconds for deployment to start..."
sleep 60

log "Running post-deploy health check..."
if [ -x "${SCRIPT_DIR}/health_check.sh" ]; then
    "${SCRIPT_DIR}/health_check.sh"
    HEALTH_EXIT=$?
    if [ ${HEALTH_EXIT} -eq 0 ]; then
        log "✅ Deployment completed successfully."
    else
        err "❌ Post-deploy health check failed."
        exit 1
    fi
else
    warn "health_check.sh not found or not executable. Skipping health verification."
    warn "Run manually:  ./scripts/health_check.sh"
fi

log "Deployment process finished."
