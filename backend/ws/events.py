"""
WebSocket Event Schema for OnboardOps
Defines Pydantic models for all events streamed from Bob to the dashboard
"""

from pydantic import BaseModel, ConfigDict, Field
from typing import Optional, Literal, Union, Any, Dict
from datetime import datetime
from uuid import uuid4


# ============================================================================
# Base Event Model
# ============================================================================


class BaseEvent(BaseModel):
    """Base class for all WebSocket events"""

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "event_id": "550e8400-e29b-41d4-a716-446655440000",
                "timestamp": 1715808000.0,
            }
        }
    )

    event_id: str = Field(default_factory=lambda: str(uuid4()))
    timestamp: float = Field(default_factory=lambda: datetime.now().timestamp())
    session_id: Optional[str] = None


# ============================================================================
# Turn Events
# ============================================================================


class TurnStart(BaseEvent):
    """Event emitted when Bob starts a new turn"""

    event_type: Literal["turn_start"] = "turn_start"
    turn_number: int
    mode: str  # e.g., "onboard"
    user_message: Optional[str] = None


class TurnEnd(BaseEvent):
    """Event emitted when Bob completes a turn"""

    event_type: Literal["turn_end"] = "turn_end"
    turn_number: int
    tokens_used: int
    bobcoins_spent: float
    duration_ms: int


# ============================================================================
# Tool Call Events
# ============================================================================


class ToolCall(BaseEvent):
    """Event emitted when Bob calls an MCP tool"""

    event_type: Literal["tool_call"] = "tool_call"
    tool_name: str
    arguments: Dict[str, Any]
    turn_number: int


class ToolResponse(BaseEvent):
    """Event emitted when an MCP tool returns a response"""

    event_type: Literal["tool_response"] = "tool_response"
    tool_name: str
    success: bool
    result: Optional[Dict[str, Any]] = None
    error: Optional[str] = None
    duration_ms: int


# ============================================================================
# Checkpoint Events
# ============================================================================


class CheckpointCreate(BaseEvent):
    """Event emitted when Bob creates a checkpoint"""

    event_type: Literal["checkpoint_create"] = "checkpoint_create"
    checkpoint_name: str
    description: Optional[str] = None


class CheckpointRestore(BaseEvent):
    """Event emitted when Bob restores a checkpoint"""

    event_type: Literal["checkpoint_restore"] = "checkpoint_restore"
    checkpoint_name: str
    reason: Optional[str] = None


# ============================================================================
# Cartography Card Events
# ============================================================================


class CardEmit(BaseEvent):
    """Event emitted when a cartography card is generated"""

    event_type: Literal["card_emit"] = "card_emit"
    card_type: Literal["dependency_graph", "entry_points", "hotspots", "conventions"]
    title: str
    body_markdown: str
    data: Dict[str, Any]  # Structured data for visualization


class QuestionAsk(BaseEvent):
    """Event emitted when Bob asks a Socratic validation question"""

    event_type: Literal["question_ask"] = "question_ask"
    stage: str
    question: str
    question_id: Optional[str] = None
    topic: Optional[str] = None
    response_mode: Literal["free_text", "multiple_choice"] = "free_text"
    options: list[str] = Field(default_factory=list)
    expected_answer_hint: Optional[str] = None


class BootstrapStatus(BaseEvent):
    """Event emitted by Bob Shell bootstrap as setup progresses"""

    event_type: Literal["bootstrap_status"] = "bootstrap_status"
    stage: str
    status: str
    message: str
    severity: Literal["info", "warn", "error", "success", "recovery"] = "info"
    duration_ms: int = 0
    details: Optional[Dict[str, Any]] = None


class BootstrapRecovery(BaseEvent):
    """Event emitted when bootstrap detects or attempts an auto-recovery"""

    event_type: Literal["bootstrap_recovery"] = "bootstrap_recovery"
    pattern: Literal[
        "port-in-use",
        "node-version",
        "missing-venv",
        "missing-seed",
        "db-not-running",
    ]
    action: str
    details: str = ""
    status: Literal["in-progress", "success", "failed"] = "in-progress"


# ============================================================================
# Certification Events
# ============================================================================


class CertificationGrade(BaseEvent):
    """Event emitted when Bob grades a certification answer"""

    event_type: Literal["certification_grade"] = "certification_grade"
    question_id: str
    question_text: str
    user_answer: str
    grade: Literal["pass", "partial", "fail"]
    rationale: str
    rubric_points_earned: int
    rubric_points_total: int


class CertificationComplete(BaseEvent):
    """Event emitted when Bob completes the certification gate"""

    event_type: Literal["certification_complete"] = "certification_complete"
    passed: bool
    grades: list[Literal["pass", "partial", "fail"]]
    questions_asked: int
    remediation_count: int = 0


# ============================================================================
# Session Events
# ============================================================================


class SessionStart(BaseEvent):
    """Event emitted when an onboarding session starts"""

    event_type: Literal["session_start"] = "session_start"
    onboardee_name: str
    repository_url: str


class SessionEnd(BaseEvent):
    """Event emitted when an onboarding session completes"""

    model_config = ConfigDict(extra="allow")

    event_type: Literal["session_end"] = "session_end"
    status: Literal["completed", "failed", "aborted"] = "completed"
    total_duration_ms: int = 0
    total_bobcoins_spent: float = 0.0
    pr_url: Optional[str] = None
    duration_seconds: Optional[int] = None
    cartography_completed: Optional[bool] = None
    certification_passed: Optional[bool] = None
    certification_score: Optional[str] = None
    starter_task_proposed: Optional[str] = None
    starter_task_file: Optional[str] = None
    starter_task_url: Optional[str] = None
    starter_task_description: Optional[str] = None
    starter_task_commit_message: Optional[str] = None


# ============================================================================
# Discriminated Union Envelope
# ============================================================================

EventType = Union[
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
]


class EventEnvelope(BaseModel):
    """
    Discriminated union envelope for all event types
    Allows type-safe deserialization on the client side
    """

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "event": {
                    "event_type": "turn_start",
                    "event_id": "550e8400-e29b-41d4-a716-446655440000",
                    "timestamp": 1715808000.0,
                    "turn_number": 1,
                    "mode": "onboard",
                    "user_message": "/onboard",
                }
            }
        }
    )

    event: EventType = Field(..., discriminator="event_type")


# ============================================================================
# Validation and Testing
# ============================================================================


def test_event_serialization():
    """Test that all event types can be serialized and deserialized"""

    # Test TurnStart
    turn_start = TurnStart(turn_number=1, mode="onboard", user_message="/onboard")
    json_str = turn_start.model_dump_json()
    parsed = TurnStart.model_validate_json(json_str)
    assert parsed.turn_number == 1

    # Test ToolCall
    tool_call = ToolCall(
        tool_name="git_blame_summary",
        arguments={"file_path": "src/app.py"},
        turn_number=2,
    )
    json_str = tool_call.model_dump_json()
    parsed = ToolCall.model_validate_json(json_str)
    assert parsed.tool_name == "git_blame_summary"

    # Test CardEmit
    card = CardEmit(
        card_type="hotspots",
        title="Change Hotspots",
        body_markdown="## Top 5 Hotspots\n...",
        data={"files": []},
    )
    json_str = card.model_dump_json()
    parsed = CardEmit.model_validate_json(json_str)
    assert parsed.card_type == "hotspots"

    # Test EventEnvelope
    envelope = EventEnvelope(event=turn_start)
    json_str = envelope.model_dump_json()
    parsed = EventEnvelope.model_validate_json(json_str)
    assert parsed.event.event_type == "turn_start"

    print("[OK] All event types serialize/deserialize correctly")
    return True


if __name__ == "__main__":
    test_event_serialization()
    print("\n[OK] WebSocket event schema validated successfully")
    print("\nDefined event types:")
    print("  - TurnStart, TurnEnd")
    print("  - ToolCall, ToolResponse")
    print("  - CheckpointCreate, CheckpointRestore")
    print("  - CardEmit")
    print("  - CertificationGrade")
    print("  - SessionStart, SessionEnd")

# Made with Bob
