"""
OnboardOps Backend - Main FastAPI Application
Institutional Knowledge MCP Server with WebSocket Bridge
"""

from fastapi import FastAPI, WebSocket, HTTPException, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional
import time
import hashlib
import json
import os
from contextlib import asynccontextmanager
from datetime import datetime

# Import MCP tool implementations
from tools import (
    git_blame_summary,
    commit_frequency,
    recent_authors,
    pr_for_file,
    file_changelog,
    rationale_for_commit,
    incident_for_file,
    starter_issue_candidates,
    wait_for_dashboard_answer,
)
from mcp import contracts
from mcp.errors import MCPToolError
from tools.emit_event import emit_event, EmitEventInput
from ws.handler import websocket_handler
from session_manager import session_manager
from cache_manager import cache_manager
from dashboard_answer_manager import dashboard_answer_manager
from observability import (
    logger,
    metrics_collector,
    log_mcp_call,
)
from allowlist_manager import allowlist_manager, AllowListViolation


@asynccontextmanager
async def lifespan(app_instance: FastAPI):
    """Initialize and tear down backend process services."""
    logger.info(
        "server_startup",
        message="OnboardOps MCP Server starting",
        health_endpoint="http://127.0.0.1:8765/health",
        mcp_endpoint="http://127.0.0.1:8765/mcp",
        metrics_endpoint="http://127.0.0.1:8765/metrics",
        websocket_endpoint="ws://127.0.0.1:8765/events",
    )
    await session_manager.start_cleanup_task()
    logger.info("session_manager_initialized", timeout_minutes=30)
    yield


app = FastAPI(
    title="OnboardOps Institutional Knowledge MCP Server",
    version="1.0.0",
    description="MCP server exposing institutional knowledge tools for Bob IDE",
    lifespan=lifespan,
)

# CORS configuration - allow the local dashboard only.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class DashboardCertificationAnswerRequest(BaseModel):
    """Answer submitted from the website certification panel."""

    session_id: str
    question_id: str
    answer: str = Field(..., min_length=1)
    question_text: Optional[str] = None


class DashboardCertificationAnswerResponse(BaseModel):
    """Acknowledgement for a dashboard-submitted certification answer."""

    success: bool
    session_id: str
    question_id: str
    submitted_at: datetime


# ============================================================================
# Health Check Endpoint
# ============================================================================


@app.get("/health")
async def health_check():
    """Health check endpoint for bootstrap verification"""
    return {"status": "ok", "service": "onboardops-mcp-server", "version": "1.0.0"}


@app.get("/cache/stats")
async def cache_stats():
    """Get cache statistics for observability"""
    stats = await cache_manager.get_stats()
    return {
        "cache": stats,
        "sessions": {
            "active_count": session_manager.get_active_session_count(),
            "session_ids": session_manager.get_all_session_ids(),
        },
    }


@app.get("/metrics")
async def metrics():
    """
    Metrics endpoint exposing per-tool counters and latency statistics

    Returns:
        - Per-tool call counts
        - Per-tool error rates
        - Per-tool cache hit rates
        - Per-tool latency (p50, p95, p99)
        - Uptime
    """
    return await metrics_collector.get_metrics()


@app.post(
    "/dashboard/certification/answers",
    response_model=DashboardCertificationAnswerResponse,
)
async def submit_dashboard_certification_answer(
    request: DashboardCertificationAnswerRequest,
):
    """Persist an answer typed into the website certification panel."""
    if not request.answer.strip():
        raise HTTPException(status_code=400, detail="Answer cannot be empty")

    record = await dashboard_answer_manager.submit_answer(
        request.session_id,
        request.question_id,
        request.answer,
        request.question_text,
    )

    return DashboardCertificationAnswerResponse(
        success=True,
        session_id=record.session_id,
        question_id=record.question_id,
        submitted_at=record.submitted_at,
    )


# ============================================================================
# Tool Health Check Endpoints
# ============================================================================


@app.get("/tools/{tool_name}/healthz")
async def tool_health_check(tool_name: str):
    """
    Health check endpoint for individual MCP tools

    Returns 200 if tool is healthy, 503 if unhealthy
    Used by preflight script before demo recordings
    """
    import time

    def health_response(payload: Dict[str, Any], status_code: int = 200):
        return JSONResponse(content=payload, status_code=status_code)

    start_time = time.time()

    try:
        # Route to appropriate health check based on tool name
        if tool_name == "git_blame_summary":
            # Test: Can we access the demo repo and run git blame?
            repo_path = os.getenv("ONBOARDOPS_DEMO_REPO_PATH")
            if not repo_path or not os.path.exists(repo_path):
                return health_response(
                    {
                        "tool": tool_name,
                        "status": "unhealthy",
                        "error": "Demo repo not configured or not found",
                        "retryable": False,
                    },
                    503,
                )

            # Try to run git blame on README
            try:
                input_data = contracts.GitBlameSummaryInput(file_path="README.md")
                result = git_blame_summary(input_data)
                if isinstance(result, MCPToolError):
                    return health_response(
                        {
                            "tool": tool_name,
                            "status": "unhealthy",
                            "error": result.message,
                            "retryable": result.retryable,
                        },
                        503,
                    )
            except Exception as e:
                return health_response(
                    {
                        "tool": tool_name,
                        "status": "unhealthy",
                        "error": str(e),
                        "retryable": False,
                    },
                    503,
                )

        elif tool_name == "commit_frequency":
            # Test: Can we get commit frequency?
            repo_path = os.getenv("ONBOARDOPS_DEMO_REPO_PATH")
            if not repo_path or not os.path.exists(repo_path):
                return health_response(
                    {
                        "tool": tool_name,
                        "status": "unhealthy",
                        "error": "Demo repo not configured or not found",
                        "retryable": False,
                    },
                    503,
                )

            try:
                input_data = contracts.CommitFrequencyInput(days=180)
                result = commit_frequency(input_data)
                if isinstance(result, MCPToolError):
                    return health_response(
                        {
                            "tool": tool_name,
                            "status": "unhealthy",
                            "error": result.message,
                            "retryable": result.retryable,
                        },
                        503,
                    )
            except Exception as e:
                return health_response(
                    {
                        "tool": tool_name,
                        "status": "unhealthy",
                        "error": str(e),
                        "retryable": False,
                    },
                    503,
                )

        elif tool_name == "recent_authors":
            # Mock-only tool, always healthy
            pass

        elif tool_name == "pr_for_file":
            # Test: Check if GitHub token is set (optional)
            github_token = os.getenv("ONBOARDOPS_GITHUB_TOKEN")
            if not github_token:
                # Not an error - will fall back to mock
                pass

        elif tool_name == "file_changelog":
            # Test: Can we access the demo repo?
            repo_path = os.getenv("ONBOARDOPS_DEMO_REPO_PATH")
            if not repo_path or not os.path.exists(repo_path):
                # Not an error - will fall back to mock
                pass

        elif tool_name == "rationale_for_commit":
            # Test: Can we access the demo repo?
            repo_path = os.getenv("ONBOARDOPS_DEMO_REPO_PATH")
            if not repo_path or not os.path.exists(repo_path):
                # Not an error - will fall back to mock
                pass

        elif tool_name == "incident_for_file":
            # Test: Can we access the demo repo?
            repo_path = os.getenv("ONBOARDOPS_DEMO_REPO_PATH")
            if not repo_path or not os.path.exists(repo_path):
                # Not an error - will fall back to mock
                pass

        elif tool_name == "starter_issue_candidates":
            # Optional GitHub-backed tool. Empty results are acceptable.
            pass

        elif tool_name == "wait_for_dashboard_answer":
            # In-memory coordination tool, no external dependencies.
            pass

        elif tool_name == "emit_event":
            # Always healthy (no external dependencies)
            pass

        else:
            return health_response(
                {
                    "tool": tool_name,
                    "status": "unknown",
                    "error": f"Unknown tool: {tool_name}",
                    "retryable": False,
                },
                404,
            )

        # If we get here, tool is healthy
        latency_ms = (time.time() - start_time) * 1000
        return health_response(
            {
                "tool": tool_name,
                "status": "healthy",
                "latency_ms": round(latency_ms, 2),
                "details": "Self-test passed",
            }
        )

    except Exception as e:
        latency_ms = (time.time() - start_time) * 1000
        return health_response(
            {
                "tool": tool_name,
                "status": "unhealthy",
                "error": str(e),
                "latency_ms": round(latency_ms, 2),
                "retryable": False,
            },
            503,
        )


# ============================================================================
# MCP Discovery Endpoint
# ============================================================================


class MCPTool(BaseModel):
    """MCP tool definition"""

    name: str
    description: str
    input_schema: Dict[str, Any]


class MCPDiscoveryResponse(BaseModel):
    """MCP server discovery response"""

    server_name: str
    server_version: str
    tools: List[MCPTool]


@app.post("/mcp")
async def mcp_discovery(request: Request):
    """
    MCP discovery endpoint - returns list of available tools
    This is a stub that returns hard-coded tool definitions
    """
    tools = [
        MCPTool(
            name="git_blame_summary",
            description="Get git blame summary for a file showing who last modified each section",
            input_schema={
                "type": "object",
                "properties": {
                    "file_path": {
                        "type": "string",
                        "description": "Relative path to the file",
                    },
                    "line_start": {
                        "type": "integer",
                        "description": "Starting line number (optional)",
                    },
                    "line_end": {
                        "type": "integer",
                        "description": "Ending line number (optional)",
                    },
                },
                "required": ["file_path"],
            },
        ),
        MCPTool(
            name="commit_frequency",
            description="Get commit frequency statistics for files",
            input_schema={
                "type": "object",
                "properties": {
                    "file_path": {
                        "type": "string",
                        "description": "Specific file path (optional)",
                    },
                    "days": {
                        "type": "integer",
                        "description": "Number of days to look back",
                        "default": 180,
                    },
                },
            },
        ),
        MCPTool(
            name="recent_authors",
            description="Get list of recent contributors to the repository or specific file",
            input_schema={
                "type": "object",
                "properties": {
                    "file_path": {
                        "type": "string",
                        "description": "Specific file path (optional)",
                    },
                    "days": {
                        "type": "integer",
                        "description": "Number of days to look back",
                        "default": 90,
                    },
                    "limit": {
                        "type": "integer",
                        "description": "Maximum number of authors",
                        "default": 10,
                    },
                },
            },
        ),
        MCPTool(
            name="pr_for_file",
            description="Get pull requests that modified a specific file",
            input_schema={
                "type": "object",
                "properties": {
                    "file_path": {
                        "type": "string",
                        "description": "Relative path to the file",
                    },
                    "limit": {
                        "type": "integer",
                        "description": "Maximum number of PRs",
                        "default": 5,
                    },
                },
                "required": ["file_path"],
            },
        ),
        MCPTool(
            name="file_changelog",
            description="Get commit history for a specific file",
            input_schema={
                "type": "object",
                "properties": {
                    "file_path": {
                        "type": "string",
                        "description": "Relative path to the file",
                    },
                    "limit": {
                        "type": "integer",
                        "description": "Maximum number of commits",
                        "default": 10,
                    },
                },
                "required": ["file_path"],
            },
        ),
        MCPTool(
            name="rationale_for_commit",
            description="Get detailed information and rationale for a specific commit",
            input_schema={
                "type": "object",
                "properties": {
                    "commit_hash": {"type": "string", "description": "Git commit hash"}
                },
                "required": ["commit_hash"],
            },
        ),
        MCPTool(
            name="incident_for_file",
            description="Get incidents (issues, bugs) related to a specific file",
            input_schema={
                "type": "object",
                "properties": {
                    "file_path": {
                        "type": "string",
                        "description": "Relative path to the file",
                    },
                    "days": {
                        "type": "integer",
                        "description": "Number of days to look back",
                        "default": 180,
                    },
                },
                "required": ["file_path"],
            },
        ),
        MCPTool(
            name="emit_event",
            description="Emit a structured event to the WebSocket bridge for dashboard display, including cartography, certification, and bootstrap recovery events. Auto-creates session if session_id not provided.",
            input_schema={
                "type": "object",
                "properties": {
                    "event_type": {
                        "type": "string",
                        "description": "Type of event (turn_start, turn_end, tool_call, card_emit, etc.)",
                    },
                    "event_data": {
                        "type": "object",
                        "description": "Event-specific data payload",
                    },
                    "session_id": {
                        "type": "string",
                        "description": "Session ID for routing (auto-generated if not provided)",
                    },
                },
                "required": ["event_type", "event_data"],
            },
        ),
        MCPTool(
            name="starter_issue_candidates",
            description="List open GitHub issues that are good starter-PR candidates, prioritizing labels such as good first issue and help wanted.",
            input_schema={
                "type": "object",
                "properties": {
                    "limit": {
                        "type": "integer",
                        "description": "Maximum number of issue candidates",
                        "default": 3,
                    },
                    "labels": {
                        "type": "array",
                        "items": {"type": "string"},
                        "description": "Preferred GitHub labels to prioritize",
                    },
                },
            },
        ),
        MCPTool(
            name="wait_for_dashboard_answer",
            description="Wait for an answer submitted through the website certification panel for a specific session and question.",
            input_schema={
                "type": "object",
                "properties": {
                    "session_id": {
                        "type": "string",
                        "description": "Active onboarding session ID",
                    },
                    "question_id": {
                        "type": "string",
                        "description": "Certification question ID",
                    },
                    "timeout_seconds": {
                        "type": "integer",
                        "description": "Maximum wait time for a website answer",
                        "default": 300,
                    },
                },
                "required": ["session_id", "question_id"],
            },
        ),
    ]

    try:
        body = await request.json()
    except Exception:
        body = None

    if isinstance(body, dict) and "jsonrpc" in body:
        request_id = body.get("id")
        method = body.get("method")
        params = body.get("params") or {}

        if method == "initialize":
            return {
                "jsonrpc": "2.0",
                "id": request_id,
                "result": {
                    "protocolVersion": params.get("protocolVersion", "2024-11-05"),
                    "capabilities": {"tools": {}},
                    "serverInfo": {
                        "name": "institutional-knowledge",
                        "version": "1.0.0",
                    },
                },
            }

        if method == "notifications/initialized":
            return Response(status_code=202)

        if method == "tools/list":
            return {
                "jsonrpc": "2.0",
                "id": request_id,
                "result": {
                    "tools": [
                        {
                            "name": tool.name,
                            "description": tool.description,
                            "inputSchema": tool.input_schema,
                        }
                        for tool in tools
                    ]
                },
            }

        if method == "tools/call":
            tool_result = await invoke_mcp_tool(
                MCPToolRequest(
                    tool_name=params.get("name", ""),
                    arguments=params.get("arguments") or {},
                ),
                Response(),
            )
            payload = tool_result.model_dump()
            return {
                "jsonrpc": "2.0",
                "id": request_id,
                "result": {
                    "content": [
                        {
                            "type": "text",
                            "text": json.dumps(payload, default=str),
                        }
                    ],
                    "structuredContent": payload,
                    "isError": tool_result.error is not None,
                },
            }

        return {
            "jsonrpc": "2.0",
            "id": request_id,
            "error": {
                "code": -32601,
                "message": f"Method not found: {method}",
            },
        }

    return MCPDiscoveryResponse(
        server_name="institutional-knowledge", server_version="1.0.0", tools=tools
    )


# ============================================================================
# MCP Tool Invocation Endpoint
# ============================================================================


class MCPToolRequest(BaseModel):
    """Request to invoke an MCP tool"""

    tool_name: str
    arguments: Dict[str, Any]


class MCPToolResponse(BaseModel):
    """Response from an MCP tool invocation"""

    tool_name: str
    result: Dict[str, Any]
    error: Optional[str] = None


@app.post("/mcp/invoke", response_model=MCPToolResponse)
async def invoke_mcp_tool(request: MCPToolRequest, response: Response):
    """
    Invoke a specific MCP tool with given arguments
    Implements in-session response caching with X-Cache header
    Logs all calls with structured logging and records metrics
    """
    tool_name = request.tool_name
    arguments = request.arguments

    # Extract session_id from arguments if present (for caching)
    session_id = arguments.get("session_id")

    # Compute input hash for logging
    input_hash = hashlib.sha256(
        json.dumps(arguments, sort_keys=True).encode()
    ).hexdigest()[:16]

    # Start timing for latency tracking
    start_time = time.time()
    cache_hit = False

    try:
        # Validate tool call against allow-list
        try:
            allowlist_manager.validate_tool_call(tool_name, arguments)
        except AllowListViolation as e:
            # Return 403 error for allow-list violations
            latency_ms = (time.time() - start_time) * 1000
            log_mcp_call(
                session_id, tool_name, input_hash, latency_ms, False, error=str(e)
            )
            await metrics_collector.record_call(
                tool_name, latency_ms, False, error=True
            )
            raise HTTPException(status_code=403, detail=str(e))

        # Check cache if session_id is present and the tool is cacheable.
        non_cacheable_tools = {"emit_event", "wait_for_dashboard_answer"}
        if session_id and tool_name not in non_cacheable_tools:
            cached_result = await cache_manager.get(session_id, tool_name, arguments)
            if cached_result is not None:
                cache_hit = True
                response.headers["X-Cache"] = "HIT"
                latency_ms = (time.time() - start_time) * 1000

                # Log with structured logging
                log_mcp_call(session_id, tool_name, input_hash, latency_ms, cache_hit)

                # Record metrics
                await metrics_collector.record_call(tool_name, latency_ms, cache_hit)

                # Check if cached result is an error response
                if "error" in cached_result and len(cached_result) == 1:
                    return MCPToolResponse(
                        tool_name=tool_name, result={}, error=cached_result["error"]
                    )
                else:
                    return MCPToolResponse(
                        tool_name=tool_name, result=cached_result, error=None
                    )

        # Cache miss or not cacheable - execute tool
        response.headers["X-Cache"] = "MISS"

        # Route to the appropriate tool based on tool_name
        if tool_name == "git_blame_summary":
            input_data = contracts.GitBlameSummaryInput(**arguments)
            result = git_blame_summary(input_data)
        elif tool_name == "commit_frequency":
            input_data = contracts.CommitFrequencyInput(**arguments)
            result = commit_frequency(input_data)
        elif tool_name == "recent_authors":
            input_data = contracts.RecentAuthorsInput(**arguments)
            result = recent_authors(input_data)
        elif tool_name == "pr_for_file":
            input_data = contracts.PrForFileInput(**arguments)
            result = pr_for_file(input_data)
        elif tool_name == "file_changelog":
            input_data = contracts.FileChangelogInput(**arguments)
            result = file_changelog(input_data)
        elif tool_name == "rationale_for_commit":
            input_data = contracts.RationaleForCommitInput(**arguments)
            result = rationale_for_commit(input_data)
        elif tool_name == "incident_for_file":
            input_data = contracts.IncidentForFileInput(**arguments)
            result = incident_for_file(input_data)
        elif tool_name == "starter_issue_candidates":
            input_data = contracts.StarterIssueCandidatesInput(**arguments)
            result = starter_issue_candidates(input_data)
        elif tool_name == "wait_for_dashboard_answer":
            input_data = contracts.WaitForDashboardAnswerInput(**arguments)
            result = await wait_for_dashboard_answer(input_data)
        elif tool_name == "emit_event":
            # Special handling for emit_event (async, not cacheable)
            input_data = EmitEventInput(**arguments)
            result = await emit_event(input_data)
        else:
            raise HTTPException(status_code=404, detail=f"Tool '{tool_name}' not found")

        # Check if result is an MCPToolError (structured error response)
        if isinstance(result, MCPToolError):
            latency_ms = (time.time() - start_time) * 1000

            # Log the error
            log_mcp_call(
                session_id,
                tool_name,
                input_hash,
                latency_ms,
                cache_hit,
                error=f"{result.error_code}: {result.message}",
            )

            # Record metrics
            await metrics_collector.record_call(
                tool_name, latency_ms, cache_hit, error=True
            )

            # Cache the error if session present
            error_dict = result.model_dump()
            if session_id and tool_name not in non_cacheable_tools:
                await cache_manager.set(session_id, tool_name, arguments, error_dict)

            # Return error response (not raising exception - graceful degradation)
            return MCPToolResponse(
                tool_name=tool_name,
                result={},
                error=f"{result.error_code}: {result.message}",
            )

        # Convert Pydantic model to dict for JSON response
        result_dict = result.model_dump()

        # Cache the result if session_id present and tool is cacheable
        if session_id and tool_name not in non_cacheable_tools:
            await cache_manager.set(session_id, tool_name, arguments, result_dict)

        latency_ms = (time.time() - start_time) * 1000

        # Log with structured logging
        log_mcp_call(session_id, tool_name, input_hash, latency_ms, cache_hit)

        # Record metrics
        await metrics_collector.record_call(tool_name, latency_ms, cache_hit)

        return MCPToolResponse(tool_name=tool_name, result=result_dict, error=None)

    except HTTPException:
        raise
    except Exception as e:
        latency_ms = (time.time() - start_time) * 1000

        # Log with structured logging
        log_mcp_call(
            session_id, tool_name, input_hash, latency_ms, cache_hit, error=str(e)
        )

        # Record metrics (with error flag)
        await metrics_collector.record_call(
            tool_name, latency_ms, cache_hit, error=True
        )

        # Cache error responses too (to avoid repeated failures)
        error_response = {"error": str(e)}
        if session_id and tool_name not in non_cacheable_tools:
            await cache_manager.set(session_id, tool_name, arguments, error_response)

        return MCPToolResponse(tool_name=tool_name, result={}, error=str(e))


# ============================================================================
# WebSocket Event Stream Endpoint
# ============================================================================


@app.websocket("/events")
async def websocket_endpoint(websocket: WebSocket, session_id: Optional[str] = None):
    """
    WebSocket endpoint for real-time event streaming to the dashboard

    Clients can optionally provide a session_id query parameter to subscribe
    to events from a specific session. Without session_id, clients receive
    all events (global subscription).

    Example:
        ws://localhost:8765/events?session_id=abc123
    """
    await websocket_handler(websocket, session_id)


if __name__ == "__main__":
    import uvicorn

    port = int(os.getenv("ONBOARDOPS_MCP_PORT", "8765"))
    uvicorn.run(app, host="127.0.0.1", port=port, log_level="info")

# Made with Bob
