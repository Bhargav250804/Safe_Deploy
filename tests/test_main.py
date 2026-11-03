"""Comprehensive tests for the SafeDeploy FastAPI application."""

import platform
from datetime import datetime, timezone

import pytest
from fastapi.testclient import TestClient

from app.main import app


@pytest.fixture(name="client")
def fixture_client() -> TestClient:
    """Provide a FastAPI TestClient for each test."""
    return TestClient(app)


# ── Root endpoint ("/") ─────────────────────────────────────────────────────


class TestRootEndpoint:
    """Tests for GET /."""

    def test_root_returns_200(self, client: TestClient) -> None:
        """Root endpoint must return HTTP 200."""
        response = client.get("/")
        assert response.status_code == 200

    def test_root_response_structure(self, client: TestClient) -> None:
        """Root response must contain message, status, and version keys."""
        data = client.get("/").json()
        assert "message" in data
        assert "status" in data
        assert "version" in data

    def test_root_message_content(self, client: TestClient) -> None:
        """Root message must welcome users to SafeDeploy."""
        data = client.get("/").json()
        assert data["message"] == "Welcome to SafeDeploy"

    def test_root_status_running(self, client: TestClient) -> None:
        """Root status must report 'running'."""
        data = client.get("/").json()
        assert data["status"] == "running"

    def test_root_content_type_json(self, client: TestClient) -> None:
        """Root response Content-Type must be application/json."""
        response = client.get("/")
        assert "application/json" in response.headers["content-type"]


# ── Health endpoint ("/health") ──────────────────────────────────────────────


class TestHealthEndpoint:
    """Tests for GET /health."""

    def test_health_returns_200(self, client: TestClient) -> None:
        """Health endpoint must return HTTP 200."""
        response = client.get("/health")
        assert response.status_code == 200

    def test_health_response_keys(self, client: TestClient) -> None:
        """Health response must contain status, timestamp, version, uptime_seconds."""
        data = client.get("/health").json()
        expected_keys = {"status", "timestamp", "version", "uptime_seconds"}
        assert expected_keys.issubset(data.keys())

    def test_health_status_healthy(self, client: TestClient) -> None:
        """Health status must report 'healthy'."""
        data = client.get("/health").json()
        assert data["status"] == "healthy"

    def test_health_timestamp_is_valid_iso(self, client: TestClient) -> None:
        """Health timestamp must be a valid ISO-8601 datetime string."""
        data = client.get("/health").json()
        ts = datetime.fromisoformat(data["timestamp"])
        # Timestamp should be very recent (within 60 seconds)
        delta = (datetime.now(timezone.utc) - ts).total_seconds()
        assert abs(delta) < 60

    def test_health_uptime_non_negative(self, client: TestClient) -> None:
        """Uptime must be a non-negative number."""
        data = client.get("/health").json()
        assert isinstance(data["uptime_seconds"], (int, float))
        assert data["uptime_seconds"] >= 0

    def test_health_content_type_json(self, client: TestClient) -> None:
        """Health response Content-Type must be application/json."""
        response = client.get("/health")
        assert "application/json" in response.headers["content-type"]


# ── Version endpoint ("/version") ───────────────────────────────────────────


class TestVersionEndpoint:
    """Tests for GET /version."""

    def test_version_returns_200(self, client: TestClient) -> None:
        """Version endpoint must return HTTP 200."""
        response = client.get("/version")
        assert response.status_code == 200

    def test_version_response_keys(self, client: TestClient) -> None:
        """Version response must contain version, git_sha, environment, python_version."""
        data = client.get("/version").json()
        expected_keys = {"version", "git_sha", "environment", "python_version"}
        assert expected_keys.issubset(data.keys())

    def test_version_python_matches_runtime(self, client: TestClient) -> None:
        """Reported python_version must match the running interpreter."""
        data = client.get("/version").json()
        assert data["python_version"] == platform.python_version()

    def test_version_has_git_sha(self, client: TestClient) -> None:
        """git_sha field must be a non-empty string."""
        data = client.get("/version").json()
        assert isinstance(data["git_sha"], str)
        assert len(data["git_sha"]) > 0

    def test_version_content_type_json(self, client: TestClient) -> None:
        """Version response Content-Type must be application/json."""
        response = client.get("/version")
        assert "application/json" in response.headers["content-type"]


# ── 404 / undefined routes ──────────────────────────────────────────────────


class TestNotFound:
    """Tests for undefined routes."""

    def test_undefined_route_returns_404(self, client: TestClient) -> None:
        """Requests to unknown paths must return HTTP 404."""
        response = client.get("/this-does-not-exist")
        assert response.status_code == 404

    def test_404_response_structure(self, client: TestClient) -> None:
        """404 response must contain error and detail keys."""
        data = client.get("/nonexistent").json()
        assert "error" in data
        assert "detail" in data

    def test_404_content_type_json(self, client: TestClient) -> None:
        """404 response Content-Type must be application/json."""
        response = client.get("/nonexistent")
        assert "application/json" in response.headers["content-type"]

    def test_404_includes_available_endpoints(self, client: TestClient) -> None:
        """404 response should list available endpoints for discoverability."""
        data = client.get("/nonexistent").json()
        assert "available_endpoints" in data
        assert "/" in data["available_endpoints"]
        assert "/health" in data["available_endpoints"]


# ── HTTP method handling ────────────────────────────────────────────────────


class TestHTTPMethods:
    """Tests for unsupported HTTP methods."""

    def test_post_root_returns_405(self, client: TestClient) -> None:
        """POST to / must return HTTP 405 Method Not Allowed."""
        response = client.post("/")
        assert response.status_code == 405

    def test_put_health_returns_405(self, client: TestClient) -> None:
        """PUT to /health must return HTTP 405 Method Not Allowed."""
        response = client.put("/health")
        assert response.status_code == 405

    def test_delete_version_returns_405(self, client: TestClient) -> None:
        """DELETE to /version must return HTTP 405 Method Not Allowed."""
        response = client.delete("/version")
        assert response.status_code == 405


# ── Response consistency ────────────────────────────────────────────────────


class TestResponseConsistency:
    """Cross-endpoint consistency checks."""

    def test_version_consistent_across_endpoints(self, client: TestClient) -> None:
        """Version reported by / and /version must match."""
        root_version = client.get("/").json()["version"]
        ver_version = client.get("/version").json()["version"]
        assert root_version == ver_version

    def test_health_version_matches_root(self, client: TestClient) -> None:
        """Version reported by /health must match /."""
        root_version = client.get("/").json()["version"]
        health_version = client.get("/health").json()["version"]
        assert root_version == health_version


# ── Dashboard & telemetry endpoints ─────────────────────────────────────────


class TestDashboardEndpoints:
    """Tests for /dashboard UI and /api/dashboard-data."""

    def test_dashboard_ui_returns_200_html(self, client: TestClient) -> None:
        """GET /dashboard must return HTTP 200 with HTML content."""
        response = client.get("/dashboard")
        assert response.status_code == 200
        assert "text/html" in response.headers["content-type"]
        assert "SafeDeploy" in response.text
        assert "React" in response.text or "ReactDOM" in response.text

    def test_dashboard_data_returns_200_json(self, client: TestClient) -> None:
        """GET /api/dashboard-data must return HTTP 200 with complete telemetry."""
        response = client.get("/api/dashboard-data")
        assert response.status_code == 200
        assert "application/json" in response.headers["content-type"]
        data = response.json()
        assert "health" in data
        assert "version" in data
        assert "pipeline_stages" in data
        assert "test_summary" in data
        assert "security_audit" in data
        assert len(data["pipeline_stages"]) == 10
