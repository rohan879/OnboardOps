"""
MCP tool that lets Bob wait for a certification answer submitted on the website.
"""

from typing import Union

from dashboard_answer_manager import dashboard_answer_manager
from mcp.contracts import DashboardAnswerOutput, WaitForDashboardAnswerInput
from mcp.errors import MCPToolError, timeout_error


async def wait_for_dashboard_answer(
    input_data: WaitForDashboardAnswerInput,
) -> Union[DashboardAnswerOutput, MCPToolError]:
    record = await dashboard_answer_manager.wait_for_answer(
        input_data.session_id,
        input_data.question_id,
        input_data.timeout_seconds,
    )

    if record is None:
        return timeout_error(
            f"waiting for dashboard answer for {input_data.question_id}",
            input_data.timeout_seconds,
        )

    return DashboardAnswerOutput(
        session_id=record.session_id,
        question_id=record.question_id,
        question_text=record.question_text,
        answer=record.answer,
        submitted_at=record.submitted_at,
    )
