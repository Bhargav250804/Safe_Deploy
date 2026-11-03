#!/bin/bash
# =============================================================================
# SafeDeploy - Rollback Script
# Triggers rollback to previous deployment on Render
#
# IMPORTANT NOTES:
#   - Render free tier supports rolling back to the PREVIOUS deployment only
#     (one level of rollback). There is no multi-version rollback history.
#   - The primary rollback method on Render free tier is via the Dashboard:
#       1. Go to https://dashboard.render.com
#       2. Select the SafeDeploy service
#       3. Navigate to "Events" or "Deploys"
#       4. Click "Rollback" on the previous successful deploy
#   - This script re-triggers the deploy hook, which rebuilds from the latest
#     commit on main. For a true rollback, use the dashboard or revert the
#     commit in Git and push.
#
# Usage: ./scripts/rollback.sh [--verify]
# =============================================================================
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
VERIFY=false
TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ")

# ── Parse arguments ─────────────────────────────────────────────────────────

for arg in "$@"; do
    case ${arg} in
        --verify)
            VERIFY=true
            shift
            ;;
        --help|-h)
            echo "Usage: $0 [--verify]"
            echo ""
            echo "Options:"
            echo "  --verify   Run health check after rollback"
            echo "  --help     Show this help message"
            echo ""
            echo "Recommended: Use the Render Dashboard for rollbacks on free tier."
            exit 0
            ;;
        *)
            echo "Unknown option: ${arg}" >&2
            exit 1
            ;;
    esac
done

# ── Helpers ──────────────────────────────────────────────────────────────────

log()  { echo "[${TIMESTAMP}] [ROLLBACK] [INFO]  $*"; }
err()  { echo "[${TIMESTAMP}] [ROLLBACK] [ERROR] $*" >&2; }
warn() { echo "[${TIMESTAMP}] [ROLLBACK] [WARN]  $*"; }

# ── Guidance ────────────────────────────────────────────────────────────────

log "=============================================="
log "  SafeDeploy Rollback Procedure"
log "=============================================="
log ""
log "PREFERRED METHOD (Render Dashboard):"
log "  1. Open https://dashboard.render.com"
log "  2. Select the SafeDeploy service"
log "  3. Go to 'Events' → find previous successful deploy"
log "  4. Click 'Rollback'"
log ""
log "ALTERNATIVE (Git revert + redeploy):"
log "  1. git revert HEAD"
log "  2. git push origin main"
log "  3. The CI/CD pipeline will deploy the reverted commit"
log ""

# ── Automated redeploy (best-effort) ───────────────────────────────────────

if [ -z "${RENDER_DEPLOY_HOOK_URL:-}" ]; then
    warn "RENDER_DEPLOY_HOOK_URL is not set."
    warn "Cannot trigger automated redeploy. Use the Dashboard method above."
    exit 1
fi

log "Triggering redeploy via deploy hook (this rebuilds from the latest main commit)..."

HTTP_CODE=$(curl -s -o /tmp/rollback_response.txt -w "%{http_code}" \
    "${RENDER_DEPLOY_HOOK_URL}")

if [ "${HTTP_CODE}" -ge 200 ] && [ "${HTTP_CODE}" -lt 300 ]; then
    log "Redeploy triggered successfully (HTTP ${HTTP_CODE})."
else
    err "Deploy hook returned HTTP ${HTTP_CODE}."
    err "Response: $(cat /tmp/rollback_response.txt 2>/dev/null)"
    exit 1
fi

# ── Optional health verification ───────────────────────────────────────────

if [ "${VERIFY}" = true ]; then
    log "Waiting 90 seconds for rollback deployment..."
    sleep 90
    log "Running health verification..."
    if [ -x "${SCRIPT_DIR}/health_check.sh" ]; then
        "${SCRIPT_DIR}/health_check.sh"
        if [ $? -eq 0 ]; then
            log "✅ Rollback health check passed."
        else
            err "❌ Rollback health check failed."
            exit 1
        fi
    else
        warn "health_check.sh not found. Skipping verification."
    fi
fi

log "Rollback process finished."
