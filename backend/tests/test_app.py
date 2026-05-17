import httpx
import pytest

from app import app


pytestmark = pytest.mark.anyio


async def make_request(method: str, path: str, **kwargs: object) -> httpx.Response:
    transport = httpx.ASGITransport(app=app)
    async with httpx.AsyncClient(
        transport=transport, base_url="http://testserver"
    ) as client:
        return await client.request(method, path, **kwargs)


async def test_health_check():
    response = await make_request("GET", "/health")

    assert response.status_code == 200
    assert response.json()["status"] == "ok"


async def test_mcp_discovery_lists_required_tools():
    response = await make_request("POST", "/mcp", json={})

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
        "starter_issue_candidates",
        "wait_for_dashboard_answer",
    }.issubset(tool_names)


async def test_mcp_get_discovery_lists_required_tools():
    response = await make_request("GET", "/mcp")

    assert response.status_code == 200
    tool_names = {tool["name"] for tool in response.json()["tools"]}
    assert {
        "emit_event",
        "starter_issue_candidates",
        "wait_for_dashboard_answer",
    }.issubset(tool_names)


async def test_recent_authors_invocation_works_without_demo_repo():
    response = await make_request(
        "POST",
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


async def test_blocked_file_path_returns_403():
    response = await make_request(
        "POST",
        "/mcp/invoke",
        json={
            "tool_name": "git_blame_summary",
            "arguments": {"file_path": "../.env", "session_id": "pytest-session"},
        },
    )

    assert response.status_code == 403


async def test_emit_event_supports_bootstrap_recovery():
    response = await make_request(
        "POST",
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


async def test_emit_event_supports_certification_complete():
    response = await make_request(
        "POST",
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


async def test_dashboard_answer_submission_can_be_retrieved_by_mcp_tool():
    submit_response = await make_request(
        "POST",
        "/dashboard/certification/answers",
        json={
            "session_id": "pytest-session",
            "question_id": "cert-q1",
            "question_text": "What is the entry point?",
            "answer": "I would start in backend/app.py.",
        },
    )

    submit_body = submit_response.json()
    assert submit_response.status_code == 200
    assert submit_body["success"] is True

    wait_response = await make_request(
        "POST",
        "/mcp/invoke",
        json={
            "tool_name": "wait_for_dashboard_answer",
            "arguments": {
                "session_id": "pytest-session",
                "question_id": "cert-q1",
                "timeout_seconds": 1,
            },
        },
    )

    wait_body = wait_response.json()
    assert wait_response.status_code == 200
    assert wait_body["error"] is None
    assert wait_body["result"]["answer"] == "I would start in backend/app.py."
    assert wait_body["result"]["question_text"] == "What is the entry point?"
