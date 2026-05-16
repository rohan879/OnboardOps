from fastapi.testclient import TestClient

from app import app


client = TestClient(app)


def test_health_check():
    response = client.get("/health")

    assert response.status_code == 200
    assert response.json()["status"] == "ok"


def test_mcp_discovery_lists_required_tools():
    response = client.post("/mcp", json={})

    assert response.status_code == 200
    tool_names = {tool["name"] for tool in response.json()["tools"]}
    assert {
        "git_blame_summary",
        "commit_frequency",
        "recent_authors",
        "pr_for_file",
        "file_changelog",
        "rationale_for_commit",
        "incident_for_file",
        "emit_event",
    }.issubset(tool_names)


def test_recent_authors_invocation_works_without_demo_repo():
    response = client.post(
        "/mcp/invoke",
        json={
            "tool_name": "recent_authors",
            "arguments": {"days": 90, "limit": 2, "session_id": "pytest-session"},
        },
    )

    body = response.json()
    assert response.status_code == 200
    assert body["error"] is None
    assert len(body["result"]["authors"]) == 2


def test_blocked_file_path_returns_403():
    response = client.post(
        "/mcp/invoke",
        json={
            "tool_name": "git_blame_summary",
            "arguments": {"file_path": "../.env", "session_id": "pytest-session"},
        },
    )

    assert response.status_code == 403


def test_emit_event_supports_bootstrap_recovery():
    response = client.post(
        "/mcp/invoke",
        json={
            "tool_name": "emit_event",
            "arguments": {
                "event_type": "bootstrap_recovery",
                "event_data": {
                    "pattern": "port-in-use",
                    "action": "Port 3000 in use; retrying on the configured port",
                    "details": "Detected a local dev server collision.",
                    "status": "success",
                },
                "session_id": "pytest-session",
            },
        },
    )

    body = response.json()
    assert response.status_code == 200
    assert body["error"] is None
    assert body["result"]["success"] is True


def test_emit_event_supports_certification_complete():
    response = client.post(
        "/mcp/invoke",
        json={
            "tool_name": "emit_event",
            "arguments": {
                "event_type": "certification_complete",
                "event_data": {
                    "passed": True,
                    "grades": ["pass", "pass", "partial"],
                    "questions_asked": 3,
                    "remediation_count": 0,
                },
                "session_id": "pytest-session",
            },
        },
    )

    body = response.json()
    assert response.status_code == 200
    assert body["error"] is None
    assert body["result"]["success"] is True
