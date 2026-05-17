"""
Emit Event MCP Tool - Critical Integration Point
Allows Bob to emit structured events that are broadcast via WebSocket to the dashboard
"""

from typing import Any, Dict, Optional
from pydantic import BaseModel, Field
from ws.events import (
    EventType,
    TurnStart,
    TurnEnd,
    ToolCall,
    ToolResponse,
    CheckpointCreate,
    CheckpointRestore,
    CardEmit,
    QuestionAsk,
    BootstrapStatus,
    BootstrapRecovery,
    CertificationGrade,
    CertificationComplete,
    SessionStart,
    SessionEnd,
)
from ws.handler import manager
from session_manager import session_manager


class EmitEventInput(BaseModel):
    """Input for emit_event MCP tool"""

    event_type: str = Field(..., description="Type of event to emit")
    event_data: Dict[str, Any] = Field(..., description="Event data payload")
    session_id: Optional[str] = Field(
        None, description="Session ID for routing (auto-generated if not provided)"
    )


class EmitEventOutput(BaseModel):
    """Output for emit_event MCP tool"""

    success: bool
    event_id: str
    message: str
    session_id: str  # Return the session ID (created or existing)


async def emit_event(input_data: EmitEventInput) -> EmitEventOutput:
    """
    Emit a structured event to the WebSocket bridge

    This is the critical integration point that allows Bob to communicate
    with the dashboard in real-time. Bob calls this tool to emit:
    - Turn start/end events
    - Tool call events
    - Cartography card emissions
    - Certification grades
    - Session lifecycle events

    The event is validated, wrapped in an envelope, and broadcast to all
    WebSocket clients subscribed to the session.

    If no session_id is provided, a new session is created automatically.
    """
    try:
        # Handle session creation/retrieval
        session_id = input_data.session_id
        if session_id is None:
            # Create a new session
            session_id = await session_manager.create_session()
            print(f"[EMIT_EVENT] Created new session: {session_id}")
        else:
            # Touch existing session to update activity
            session_exists = await session_manager.touch_session(session_id)
            if not session_exists:
                # Session expired or doesn't exist, create it
                session_id = await session_manager.create_session(session_id)
                print(f"[EMIT_EVENT] Recreated expired session: {session_id}")

        # Parse the event based on event_type
        event: EventType
        event_payload = {**input_data.event_data, "session_id": session_id}

        if input_data.event_type == "turn_start":
            event = TurnStart(**event_payload)
        elif input_data.event_type == "turn_end":
            event = TurnEnd(**event_payload)
        elif input_data.event_type == "tool_call":
            event = ToolCall(**event_payload)
        elif input_data.event_type == "tool_response":
            event = ToolResponse(**event_payload)
        elif input_data.event_type == "checkpoint_create":
            event = CheckpointCreate(**event_payload)
        elif input_data.event_type == "checkpoint_restore":
            event = CheckpointRestore(**event_payload)
        elif input_data.event_type == "card_emit":
            event = CardEmit(**event_payload)
        elif input_data.event_type == "question_ask":
            event = QuestionAsk(**event_payload)
        elif input_data.event_type == "bootstrap_status":
            event = BootstrapStatus(**event_payload)
        elif input_data.event_type == "bootstrap_recovery":
            event = BootstrapRecovery(**event_payload)
        elif input_data.event_type == "certification_grade":
            event = CertificationGrade(**event_payload)
        elif input_data.event_type == "certification_complete":
            event = CertificationComplete(**event_payload)
        elif input_data.event_type == "session_start":
            event = SessionStart(**event_payload)
        elif input_data.event_type == "session_end":
            event = SessionEnd(**event_payload)
        else:
            return EmitEventOutput(
                success=False,
                event_id="",
                message=f"Unknown event type: {input_data.event_type}",
                session_id=session_id,
            )

        # Broadcast the event to the session
        await manager.broadcast_to_session(session_id, event)

        return EmitEventOutput(
            success=True,
            event_id=event.event_id,
            message=f"Event {input_data.event_type} emitted successfully",
            session_id=session_id,
        )

    except Exception as e:
        return EmitEventOutput(
            success=False,
            event_id="",
            message=f"Error emitting event: {str(e)}",
            session_id=input_data.session_id or "",
        )


# Made with Bob
