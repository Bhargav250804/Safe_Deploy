# SafeDeploy DevOps Dashboard (React Frontend)

The SafeDeploy Dashboard provides an interactive, real-time interface for monitoring application health, CI/CD pipeline states, container specs, vulnerability scan audits, deployment history, and live event logs.

---

## 1. Dashboard Capabilities & Architecture

The frontend displays all 12 core DevOps operational components:
1. **Application Health:** Live HTTP status code, `/health` response time, and uptime in seconds.
2. **Current Application Version:** Active semantic version tag and Git commit SHA reference.
3. **Deployment Status:** Indicator of live production vs staging status.
4. **CI/CD Pipeline Stages:** Interactive cards for all 10 GitHub Actions stages with durations.
5. **Docker Image Information:** Base image (`python:3.12-slim`), image footprint (172 MB), and non-root execution user (`appuser`, UID 1000).
6. **Latest Testing Results:** Pytest test count (27 passed, 0 failed) and execution duration.
7. **Security Scan Results:** Aqua Security Trivy vulnerability status (0 Critical, 0 High CVEs).
8. **Deployment History:** Historical table of previous deployments with Git SHAs and timestamps.
9. **Application Logs:** In-memory structured JSON event log stream.
10. **Deployment Logs:** Detailed step-by-step CI/CD timestamps.
11. **Rollback Status:** Active rollback mode and recovery triggers.
12. **Recovery Information:** Measured Mean Time to Restore (MTTR) of 81 seconds and previous stable commit SHA.

---

## 2. Running the Dashboard

SafeDeploy supports two deployment and execution modes:

### Mode A: Integrated Zero-Dependency Mode (Direct via FastAPI)
No Node.js or npm installation is required. The dashboard is embedded and served directly by the FastAPI web service:
1. Start the FastAPI backend:
   ```bash
   python -m app.main
   ```
2. Open your web browser to:
   ```text
   http://127.0.0.1:8000/dashboard
   ```
   *(Or in production at `https://safedeploy-api.onrender.com/dashboard`)*

The page uses React 18 and Tailwind CSS delivered via high-speed CDNs with automatic 5-second polling against `/api/dashboard-data`.

---

### Mode B: Standalone React Development Server (Vite)
For frontend developers modifying the React source code:
```bash
cd 02_CODEBASE/frontend

# Install npm dependencies
npm install

# Start Vite dev server on port 3000 with API proxy to FastAPI
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser. All API queries (`/api/dashboard-data`, `/health`, `/version`) are automatically proxied to the FastAPI backend running on port 8000.

