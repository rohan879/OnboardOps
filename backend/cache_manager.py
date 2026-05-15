"""
In-session response caching for MCP tool calls.
Cache entries are keyed by (session_id, tool_name, input_hash) and live for the session duration.
"""

import hashlib
import json
from typing import Any, Dict, Optional
from datetime import datetime
import asyncio


class CacheManager:
    """Manages in-memory cache for MCP tool responses, scoped to sessions."""

    def __init__(self):
        self._cache: Dict[str, Dict[str, Any]] = {}  # {cache_key: {result, timestamp}}
        self._lock = asyncio.Lock()

    def _compute_input_hash(self, tool_input: Dict[str, Any]) -> str:
        """Compute stable hash of tool input for cache key."""
        # Sort keys for stable hashing
        normalized = json.dumps(tool_input, sort_keys=True)
        return hashlib.sha256(normalized.encode()).hexdigest()[:16]

    def _make_cache_key(self, session_id: str, tool_name: str, input_hash: str) -> str:
        """Create cache key from session, tool, and input hash."""
        return f"{session_id}:{tool_name}:{input_hash}"

    async def get(
        self, session_id: str, tool_name: str, tool_input: Dict[str, Any]
    ) -> Optional[Any]:
        """
        Get cached result for a tool call.
        Returns None if not cached.
        """
        input_hash = self._compute_input_hash(tool_input)
        cache_key = self._make_cache_key(session_id, tool_name, input_hash)

        async with self._lock:
            if cache_key in self._cache:
                entry = self._cache[cache_key]
                return entry["result"]
            return None

    async def set(
        self, session_id: str, tool_name: str, tool_input: Dict[str, Any], result: Any
    ) -> None:
        """Cache a tool call result."""
        input_hash = self._compute_input_hash(tool_input)
        cache_key = self._make_cache_key(session_id, tool_name, input_hash)

        async with self._lock:
            self._cache[cache_key] = {
                "result": result,
                "timestamp": datetime.utcnow().isoformat(),
                "session_id": session_id,
                "tool_name": tool_name,
                "input_hash": input_hash,
            }

    async def invalidate_session(self, session_id: str) -> int:
        """
        Remove all cache entries for a session.
        Returns number of entries removed.
        """
        async with self._lock:
            keys_to_remove = [
                key for key in self._cache.keys() if key.startswith(f"{session_id}:")
            ]
            for key in keys_to_remove:
                del self._cache[key]
            return len(keys_to_remove)

    async def get_stats(self) -> Dict[str, Any]:
        """Get cache statistics."""
        async with self._lock:
            total_entries = len(self._cache)
            sessions = set()
            tools = set()

            for key in self._cache.keys():
                parts = key.split(":")
                if len(parts) >= 2:
                    sessions.add(parts[0])
                    tools.add(parts[1])

            return {
                "total_entries": total_entries,
                "unique_sessions": len(sessions),
                "unique_tools": len(tools),
                "sessions": list(sessions),
                "tools": list(tools),
            }

    async def clear_all(self) -> int:
        """Clear all cache entries. Returns number of entries cleared."""
        async with self._lock:
            count = len(self._cache)
            self._cache.clear()
            return count


# Global cache manager instance
cache_manager = CacheManager()

# Made with Bob
