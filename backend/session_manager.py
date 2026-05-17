"""
Session Manager for OnboardOps
Manages session lifecycle, auto-expiry, and session ID propagation
"""

import uuid
from datetime import datetime, timedelta, timezone
from typing import Dict, Optional, Any
import asyncio

# Import cache manager for cache invalidation on session close
from cache_manager import cache_manager


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


# Import structured logging (lazy import to avoid circular dependency)
def get_logger():
    try:
        from observability import log_session_event

        return log_session_event
    except ImportError:
        return None


class Session:
    """Represents an active onboarding session"""

    def __init__(self, session_id: str):
        self.session_id = session_id
        self.created_at = utc_now()
        self.last_activity = utc_now()
        self.tool_calls = 0
        self.metadata: Dict[str, Any] = {}

    def touch(self):
        """Update last activity timestamp"""
        self.last_activity = utc_now()
        self.tool_calls += 1

    def is_expired(self, timeout_minutes: int = 30) -> bool:
        """Check if session has expired due to inactivity"""
        expiry_time = self.last_activity + timedelta(minutes=timeout_minutes)
        return utc_now() > expiry_time

    def age_seconds(self) -> float:
        """Get session age in seconds"""
        return (utc_now() - self.created_at).total_seconds()


class SessionManager:
    """
    Manages active sessions with auto-expiry

    Features:
    - Auto-generate session IDs
    - Track session activity
    - Auto-close after 30 minutes of inactivity
    - Thread-safe operations
    """

    def __init__(self, timeout_minutes: int = 30):
        self.sessions: Dict[str, Session] = {}
        self.timeout_minutes = timeout_minutes
        self._lock = asyncio.Lock()
        self._cleanup_task: Optional[asyncio.Task] = None

    async def start_cleanup_task(self):
        """Start background task to clean up expired sessions"""
        if self._cleanup_task is None:
            self._cleanup_task = asyncio.create_task(self._cleanup_loop())

    async def _cleanup_loop(self):
        """Background loop to clean up expired sessions every 5 minutes"""
        while True:
            await asyncio.sleep(300)  # 5 minutes
            await self.cleanup_expired_sessions()

    async def create_session(self, session_id: Optional[str] = None) -> str:
        """
        Create a new session

        Args:
            session_id: Optional custom session ID, otherwise auto-generated

        Returns:
            The session ID
        """
        async with self._lock:
            if session_id is None:
                session_id = str(uuid.uuid4())

            if session_id in self.sessions:
                # Session already exists, just touch it
                self.sessions[session_id].touch()
            else:
                # Create new session
                self.sessions[session_id] = Session(session_id)
                log_fn = get_logger()
                if log_fn:
                    log_fn("session_created", session_id)

            return session_id

    async def get_session(self, session_id: str) -> Optional[Session]:
        """Get a session by ID, returns None if not found or expired"""
        async with self._lock:
            session = self.sessions.get(session_id)

            if session is None:
                return None

            if session.is_expired(self.timeout_minutes):
                # Session expired, remove it
                del self.sessions[session_id]
                log_fn = get_logger()
                if log_fn:
                    log_fn("session_expired", session_id)
                return None

            return session

    async def touch_session(self, session_id: str) -> bool:
        """
        Update session activity timestamp

        Returns:
            True if session exists and was touched, False otherwise
        """
        session = await self.get_session(session_id)
        if session:
            session.touch()
            return True
        return False

    async def get_latest_active_session_id(self) -> Optional[str]:
        """
        Return the most recently active non-expired session ID.

        This is a compatibility fallback for Bob tool calls that omit
        session_id after a session_start event has already created the
        dashboard session.
        """
        async with self._lock:
            latest_session: Optional[Session] = None
            expired: list[str] = []

            for session_id, session in self.sessions.items():
                if session.is_expired(self.timeout_minutes):
                    expired.append(session_id)
                    continue

                if (
                    latest_session is None
                    or session.last_activity > latest_session.last_activity
                ):
                    latest_session = session

            for session_id in expired:
                del self.sessions[session_id]
                log_fn = get_logger()
                if log_fn:
                    log_fn("session_expired", session_id)

            if latest_session is None:
                return None

            latest_session.touch()
            return latest_session.session_id

    async def update_session_metadata(
        self, session_id: str, metadata: Dict[str, Any]
    ) -> bool:
        """Merge metadata into an active session."""
        session = await self.get_session(session_id)
        if not session:
            return False

        session.metadata.update(
            {key: value for key, value in metadata.items() if value is not None}
        )
        session.touch()
        return True

    async def get_session_metadata(self, session_id: str) -> Dict[str, Any]:
        """Return a shallow copy of session metadata."""
        session = await self.get_session(session_id)
        if not session:
            return {}

        return dict(session.metadata)

    async def close_session(self, session_id: str):
        """Explicitly close a session and invalidate its cache"""
        async with self._lock:
            if session_id in self.sessions:
                del self.sessions[session_id]
                log_fn = get_logger()
                if log_fn:
                    log_fn("session_closed", session_id)

        # Invalidate cache entries for this session (outside lock to avoid deadlock)
        cache_entries_removed = await cache_manager.invalidate_session(session_id)
        if cache_entries_removed > 0:
            log_fn = get_logger()
            if log_fn:
                log_fn(
                    "cache_invalidated", session_id, cache_entries=cache_entries_removed
                )

    async def cleanup_expired_sessions(self):
        """Remove all expired sessions and invalidate their cache"""
        expired = []
        async with self._lock:
            expired = [
                sid
                for sid, session in self.sessions.items()
                if session.is_expired(self.timeout_minutes)
            ]

            for sid in expired:
                del self.sessions[sid]

        # Invalidate cache for expired sessions (outside lock)
        total_cache_entries = 0
        for sid in expired:
            cache_entries = await cache_manager.invalidate_session(sid)
            total_cache_entries += cache_entries

        if expired:
            log_fn = get_logger()
            if log_fn:
                log_fn(
                    "sessions_cleanup",
                    "system",
                    expired_count=len(expired),
                    cache_entries_invalidated=total_cache_entries,
                )

    def get_active_session_count(self) -> int:
        """Get count of active sessions"""
        return len(self.sessions)

    def get_all_session_ids(self) -> list[str]:
        """Get list of all active session IDs"""
        return list(self.sessions.keys())


# Global session manager instance
session_manager = SessionManager(timeout_minutes=30)

# Made with Bob
