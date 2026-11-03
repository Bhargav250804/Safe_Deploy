#!/bin/bash
# =============================================================================
# SafeDeploy - Health Check Script
# Verifies application health after deployment
#
# Usage: ./scripts/health_check.sh [url]
#   url  - Base URL of the deployed app (default: $RENDER_APP_URL)
#
# Exit codes:
#   0 - All checks passed (healthy)
#   1 - Health check failed (unhealthy)
# =============================================================================
set -euo pipefail

# ── Configuration ───────────────────────────────────────────────────────────

BASE_URL="${1:-${RENDER_APP_URL:-http://localhost:8000}}"
MAX_RETRIES=5
INITIAL_DELAY=10      # seconds — accounts for Render cold-start spin-up
MAX_DELAY=60

# ── Helpers ──────────────────────────────────────────────────────────────────

PASS=0
FAIL=0

timestamp() { date -u +"%Y-%m-%dT%H:%M:%SZ"; }
log()  { echo "[$(timestamp)] [HEALTH] [INFO]  $*"; }
err()  { echo "[$(timestamp)] [HEALTH] [ERROR] $*" >&2; }
ok()   { echo "[$(timestamp)] [HEALTH] [PASS]  $*"; PASS=$((PASS + 1)); }
fail() { echo "[$(timestamp)] [HEALTH] [FAIL]  $*"; FAIL=$((FAIL + 1)); }

# ── Health endpoint check with retry & exponential backoff ──────────────────

check_health() {
    log "Checking /health at ${BASE_URL}/health ..."
    DELAY=${INITIAL_DELAY}

    for i in $(seq 1 ${MAX_RETRIES}); do
        HTTP_CODE=$(curl -s -o /tmp/health_body.json -w "%{http_code}" \
            "${BASE_URL}/health" 2>/dev/null || echo "000")

        if [ "${HTTP_CODE}" = "200" ]; then
            STATUS=$(jq -r '.status' /tmp/health_body.json 2>/dev/null || echo "")
            if [ "${STATUS}" = "healthy" ]; then
                ok "/health returned 200 with status=healthy"
                log "Response: $(cat /tmp/health_body.json)"
                return 0
            else
                fail "/health returned 200 but status='${STATUS}' (expected 'healthy')"
            fi
        else
            log "Attempt ${i}/${MAX_RETRIES}: HTTP ${HTTP_CODE} (retrying in ${DELAY}s)"
        fi

        if [ "${i}" -lt "${MAX_RETRIES}" ]; then
            sleep ${DELAY}
            DELAY=$((DELAY * 2))
            if [ ${DELAY} -gt ${MAX_DELAY} ]; then
                DELAY=${MAX_DELAY}
            fi
        fi
    done

    fail "/health did not return healthy after ${MAX_RETRIES} attempts"
    return 1
}

# ── Version endpoint check ──────────────────────────────────────────────────

check_version() {
    log "Checking /version at ${BASE_URL}/version ..."

    HTTP_CODE=$(curl -s -o /tmp/version_body.json -w "%{http_code}" \
        "${BASE_URL}/version" 2>/dev/null || echo "000")

    if [ "${HTTP_CODE}" = "200" ]; then
        VERSION=$(jq -r '.version' /tmp/version_body.json 2>/dev/null || echo "")
        GIT_SHA=$(jq -r '.git_sha' /tmp/version_body.json 2>/dev/null || echo "")

        if [ -n "${VERSION}" ] && [ "${VERSION}" != "null" ]; then
            ok "/version returned version='${VERSION}', git_sha='${GIT_SHA}'"
            log "Response: $(cat /tmp/version_body.json)"
        else
            fail "/version returned 200 but version field is empty"
        fi
    else
        fail "/version returned HTTP ${HTTP_CODE}"
    fi
}

# ── Main ────────────────────────────────────────────────────────────────────

log "=============================================="
log "  SafeDeploy Health Check"
log "  Target: ${BASE_URL}"
log "=============================================="
echo ""

check_health
check_version

echo ""
log "=============================================="
log "  Results: ${PASS} passed, ${FAIL} failed"
log "=============================================="

if [ ${FAIL} -gt 0 ]; then
    err "❌ Health check FAILED"
    exit 1
else
    log "✅ All health checks PASSED"
    exit 0
fi
