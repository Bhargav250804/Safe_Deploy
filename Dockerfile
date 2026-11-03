# =============================================================================
# SafeDeploy Dockerfile
# Multi-purpose: CI builds, GHCR publishing, and Render deployment
# =============================================================================
FROM python:3.12-slim AS base

# Metadata
LABEL maintainer="SafeDeploy Team"
LABEL org.opencontainers.image.source="https://github.com/OWNER/SafeDeploy"
LABEL org.opencontainers.image.description="SafeDeploy - Automated CI/CD and Reliable Deployment System"

# Prevent Python from writing .pyc files and enable unbuffered stdout/stderr
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

# Default port — overridable at runtime
ENV PORT=8000

# Install curl for health checks, then clean up
RUN apt-get update \
    && apt-get install -y --no-install-recommends curl \
    && rm -rf /var/lib/apt/lists/*

# Create non-root user
RUN groupadd --gid 1000 appuser \
    && useradd --uid 1000 --gid appuser --shell /bin/bash --create-home appuser

# Set working directory
WORKDIR /app

# Copy requirements first for layer caching
COPY requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir --upgrade pip \
    && pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY app/ ./app/

# Expose port (documentation only — actual binding uses $PORT)
EXPOSE 8000

# Health check: verify /health returns HTTP 200
HEALTHCHECK --interval=30s --timeout=10s --start-period=15s --retries=3 \
    CMD curl -f http://localhost:${PORT}/health || exit 1

# Switch to non-root user
USER appuser

# Start the application — shell form so $PORT is expanded at runtime
CMD uvicorn app.main:app --host 0.0.0.0 --port ${PORT}
