"""
Dashboard answer manager for certification answers submitted from the website.
"""

from __future__ import annotations

import asyncio
from dataclasses import dataclass
from datetime import datetime, timezone
from typing import Optional


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


@dataclass
class DashboardAnswerRecord:
    session_id: str
    question_id: str
    answer: str
    question_text: Optional[str]
    submitted_at: datetime


class DashboardAnswerManager:
    """Stores website-submitted certification answers by session and question."""

    def __init__(self) -> None:
        self._answers: dict[tuple[str, str], DashboardAnswerRecord] = {}
        self._waiters: dict[tuple[str, str], asyncio.Event] = {}
        self._lock = asyncio.Lock()

    async def submit_answer(
        self,
        session_id: str,
        question_id: str,
        answer: str,
        question_text: Optional[str] = None,
    ) -> DashboardAnswerRecord:
        record = DashboardAnswerRecord(
            session_id=session_id,
            question_id=question_id,
            answer=answer.strip(),
            question_text=question_text,
            submitted_at=utc_now(),
        )
        key = (session_id, question_id)

        async with self._lock:
            self._answers[key] = record
            waiter = self._waiters.setdefault(key, asyncio.Event())
            waiter.set()

        return record

    async def wait_for_answer(
        self, session_id: str, question_id: str, timeout_seconds: int
    ) -> Optional[DashboardAnswerRecord]:
        key = (session_id, question_id)

        async with self._lock:
            existing = self._answers.get(key)
            if existing is not None:
                return existing

            waiter = self._waiters.setdefault(key, asyncio.Event())

        try:
            await asyncio.wait_for(waiter.wait(), timeout=timeout_seconds)
        except TimeoutError:
            async with self._lock:
                for record in self._answers.values():
                    if record.question_id == question_id:
                        return record
            return None

        async with self._lock:
            return self._answers.get(key) or next(
                (
                    record
                    for record in self._answers.values()
                    if record.question_id == question_id
                ),
                None,
            )


dashboard_answer_manager = DashboardAnswerManager()
