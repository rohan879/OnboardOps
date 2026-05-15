"""
OnboardOps Backend - Main FastAPI Application
Institutional Knowledge MCP Server with WebSocket Bridge
"""

from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict, Any, Optional

# Import MCP tool implementations
from backend.tools import (
    git_blame_summary,
    commit_frequency,
    recent_authors,
    pr_for_file,
    file_changelog,
    rationale_for_commit,
    incident_for_file,
)
from backend.mcp import contracts

app = FastAPI(
    title="OnboardOps Institutional Knowledge MCP Server",
    version="1.0.0",
    description="MCP server exposing institutional knowledge tools for Bob IDE",
)

# CORS configuration - allow frontend on localhost:3000
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ============================================================================
# Health Check Endpoint
# ============================================================================


@app.get("/health")
async def health_check():
    """Health check endpoint for bootstrap verification"""
    return {"status": "ok", "service": "onboardops-mcp-server", "version": "1.0.0"}


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
async def mcp_discovery():
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
    ]

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
async def invoke_mcp_tool(request: MCPToolRequest):
    """
    Invoke a specific MCP tool with given arguments
    Returns mock data from the tool implementations
    """
    tool_name = request.tool_name
    arguments = request.arguments

    try:
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
        else:
            raise HTTPException(status_code=404, detail=f"Tool '{tool_name}' not found")

        # Convert Pydantic model to dict for JSON response
        return MCPToolResponse(
            tool_name=tool_name, result=result.model_dump(), error=None
        )

    except Exception as e:
        return MCPToolResponse(tool_name=tool_name, result={}, error=str(e))


# ============================================================================
# WebSocket Event Stream Endpoint
# ============================================================================


@app.websocket("/events")
async def websocket_endpoint(websocket: WebSocket):
    """
    WebSocket endpoint for real-time event streaming to the dashboard
    This is a stub that echoes received messages
    """
    await websocket.accept()
    try:
        while True:
            # Receive message from client
            data = await websocket.receive_text()

            # Echo it back (stub behavior)
            # In production, this would relay events from Bob sessions
            await websocket.send_text(f"Echo: {data}")

    except WebSocketDisconnect:
        print("WebSocket client disconnected")


# ============================================================================
# Application Startup
# ============================================================================


@app.on_event("startup")
async def startup_event():
    """Initialize application on startup"""
    print("OnboardOps MCP Server starting...")
    print("Health check available at: http://127.0.0.1:8765/health")
    print("MCP discovery available at: http://127.0.0.1:8765/mcp")
    print("WebSocket events available at: ws://127.0.0.1:8765/events")


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="127.0.0.1", port=8765, log_level="info")

# Made with Bob
