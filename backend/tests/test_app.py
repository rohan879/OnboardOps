from pathlib import Path

import httpx
import pytest

import app as app_module
from app import app
from dashboard_answer_manager import DashboardAnswerManager
from mcp.contracts import CommitFrequencyOutput
from session_manager import session_manager
import tools.emit_event as emit_event_module
from ws.handler import ConnectionManager


pytestmark = pytest.mark.anyio
REPO_ROOT = Path(__file__).resolve().parents[2]


async def make_request(method: str, path: str, **kwargs: object) -> httpx.Response:
    transport = httpx.ASGITransport(app=app)
    async with httpx.AsyncClient(
        transport=transport, base_url="http://testserver"
    ) as client:
        return await client.request(method, path, **kwargs)


class FakeWebSocket:
    def __init__(self):
        self.messages: list[str] = []

    async def accept(self):
        return None

    async def send_text(self, message: str):
        self.messages.append(message)


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


async def test_recent_authors_requires_demo_repo(monkeypatch: pytest.MonkeyPatch):
    monkeypatch.delenv("ONBOARDOPS_DEMO_REPO_PATH", raising=False)

    response = await make_request(
        "POST",
        "/mcp/invoke",
        json={
            "tool_name": "recent_authors",
            "arguments": {
                "days": 90,
                "limit": 2,
                "session_id": "pytest-recent-authors-missing",
            },
        },
    )

    body = response.json()
    assert response.status_code == 200
    assert body["result"] == {}
    assert body["error"].startswith("REPO_NOT_CONFIGURED")


async def test_recent_authors_uses_real_git_history(
    monkeypatch: pytest.MonkeyPatch,
):
    monkeypatch.setenv("ONBOARDOPS_DEMO_REPO_PATH", str(REPO_ROOT))

    response = await make_request(
        "POST",
        "/mcp/invoke",
        json={
            "tool_name": "recent_authors",
            "arguments": {
                "days": 3650,
                "limit": 2,
                "session_id": "pytest-recent-authors-real",
            },
        },
    )

    body = response.json()
    assert response.status_code == 200
    assert body["error"] is None
    assert 1 <= len(body["result"]["authors"]) <= 2
    assert body["result"]["authors"][0]["commit_count"] >= 1


async def test_file_changelog_does_not_fabricate_history_without_repo(
    monkeypatch: pytest.MonkeyPatch,
):
    monkeypatch.delenv("ONBOARDOPS_DEMO_REPO_PATH", raising=False)

    response = await make_request(
        "POST",
        "/mcp/invoke",
        json={
            "tool_name": "file_changelog",
            "arguments": {
                "file_path": "README.md",
                "limit": 2,
                "session_id": "pytest-file-changelog-missing",
            },
        },
    )

    body = response.json()
    assert response.status_code == 200
    assert body["result"] == {}
    assert body["error"].startswith("REPO_NOT_CONFIGURED")


async def test_dashboard_answer_wait_is_strictly_session_scoped():
    manager = DashboardAnswerManager()
    await manager.submit_answer("session-a", "cert-q1", "answer from A")

    assert await manager.wait_for_answer("session-b", "cert-q1", 0) is None

    await manager.submit_answer("session-b", "cert-q1", "answer from B")
    record = await manager.wait_for_answer("session-b", "cert-q1", 1)

    assert record is not None
    assert record.session_id == "session-b"
    assert record.answer == "answer from B"


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


async def test_emit_event_reuses_active_session_when_session_id_is_omitted():
    start_response = await make_request(
        "POST",
        "/mcp/invoke",
        json={
            "tool_name": "emit_event",
            "arguments": {
                "event_type": "session_start",
                "event_data": {
                    "onboardee_name": "Pytest",
                    "repository_url": "pytest/repo",
                },
            },
        },
    )

    start_body = start_response.json()
    assert start_response.status_code == 200
    assert start_body["error"] is None
    active_session_id = start_body["result"]["session_id"]

    card_response = await make_request(
        "POST",
        "/mcp/invoke",
        json={
            "tool_name": "emit_event",
            "arguments": {
                "event_type": "card_emit",
                "event_data": {
                    "card_type": "dependency_graph",
                    "title": "Dependency Graph",
                    "body_markdown": "Live graph",
                    "data": {"nodes": [], "edges": []},
                },
            },
        },
    )

    card_body = card_response.json()
    assert card_response.status_code == 200
    assert card_body["error"] is None
    assert card_body["result"]["success"] is True
    assert card_body["result"]["session_id"] == active_session_id

    next_start_response = await make_request(
        "POST",
        "/mcp/invoke",
        json={
            "tool_name": "emit_event",
            "arguments": {
                "event_type": "session_start",
                "event_data": {
                    "onboardee_name": "Next Pytest",
                    "repository_url": "pytest/next-repo",
                },
            },
        },
    )

    next_start_body = next_start_response.json()
    assert next_start_response.status_code == 200
    assert next_start_body["error"] is None
    assert next_start_body["result"]["session_id"] != active_session_id


async def test_emit_event_recovers_session_from_active_websocket(
    monkeypatch: pytest.MonkeyPatch,
):
    for existing_session_id in list(session_manager.get_all_session_ids()):
        await session_manager.close_session(existing_session_id)

    local_manager = ConnectionManager()
    websocket = FakeWebSocket()
    await local_manager.connect(websocket, "pytest-websocket-session")
    monkeypatch.setattr(emit_event_module, "manager", local_manager)

    response = await make_request(
        "POST",
        "/mcp/invoke",
        json={
            "tool_name": "emit_event",
            "arguments": {
                "event_type": "card_emit",
                "event_data": {
                    "card_type": "entry_points",
                    "title": "Entry Points",
                    "body_markdown": "Live entry points",
                    "data": {"routes": [], "cli": [], "jobs": [], "consumers": []},
                },
            },
        },
    )

    body = response.json()
    assert response.status_code == 200
    assert body["error"] is None
    assert body["result"]["success"] is True
    assert body["result"]["session_id"] == "pytest-websocket-session"
    assert websocket.messages


async def test_commit_frequency_uses_active_session_repository(
    monkeypatch: pytest.MonkeyPatch,
):
    for existing_session_id in list(session_manager.get_all_session_ids()):
        await session_manager.close_session(existing_session_id)

    captured = {}

    def fake_commit_frequency(input_data):
        captured["repository"] = input_data.repository
        captured["days"] = input_data.days
        return CommitFrequencyOutput(files=[], total_commits=0, date_range_days=180)

    monkeypatch.setattr(app_module, "commit_frequency", fake_commit_frequency)

    start_response = await make_request(
        "POST",
        "/mcp/invoke",
        json={
            "tool_name": "emit_event",
            "arguments": {
                "event_type": "session_start",
                "event_data": {
                    "onboardee_name": "Pytest",
                    "repository_url": "https://github.com/tinyhumansai/openhuman",
                },
            },
        },
    )
    assert start_response.status_code == 200

    response = await make_request(
        "POST",
        "/mcp/invoke",
        json={
            "tool_name": "commit_frequency",
            "arguments": {"days": 180},
        },
    )

    body = response.json()
    assert response.status_code == 200
    assert body["error"] is None
    assert captured == {
        "repository": "https://github.com/tinyhumansai/openhuman",
        "days": 180,
    }


async def test_explicit_repository_is_not_overridden_by_session_metadata(
    monkeypatch: pytest.MonkeyPatch,
):
    for existing_session_id in list(session_manager.get_all_session_ids()):
        await session_manager.close_session(existing_session_id)

    captured = {}

    def fake_starter_issue_candidates(input_data):
        captured["repository"] = input_data.repository
        captured["repository_url"] = input_data.repository_url
        return app_module.contracts.StarterIssueCandidatesOutput(
            repository=input_data.repository or "missing",
            issues=[],
        )

    monkeypatch.setattr(
        app_module, "starter_issue_candidates", fake_starter_issue_candidates
    )

    start_response = await make_request(
        "POST",
        "/mcp/invoke",
        json={
            "tool_name": "emit_event",
            "arguments": {
                "event_type": "session_start",
                "event_data": {
                    "onboardee_name": "Pytest",
                    "repository_url": "https://github.com/RSSNext/follow",
                },
            },
        },
    )
    assert start_response.status_code == 200

    response = await make_request(
        "POST",
        "/mcp/invoke",
        json={
            "tool_name": "starter_issue_candidates",
            "arguments": {
                "limit": 3,
                "repository": "https://github.com/tinyhumansai/openhuman",
            },
        },
    )

    body = response.json()
    assert response.status_code == 200
    assert body["error"] is None
    assert captured == {
        "repository": "https://github.com/tinyhumansai/openhuman",
        "repository_url": None,
    }


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
