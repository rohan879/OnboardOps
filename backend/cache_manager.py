"""
In-session response caching for MCP tool calls.
Cache entries are keyed by (session_id, tool_name, input_hash) and live for the session duration.
Implements LRU eviction at 1000 entries per session.
"""

import hashlib
import json
from typing import Any, Dict, Optional
from datetime import datetime
import asyncio
from collections import OrderedDict


class CacheManager:
    """Manages in-memory cache for MCP tool responses, scoped to sessions."""

    def __init__(self, max_entries_per_session: int = 1000):
        self._cache: Dict[
            str, Dict[str, Any]
        ] = {}  # {cache_key: {result, timestamp, access_count}}
        self._lru_order: Dict[
            str, OrderedDict
        ] = {}  # {session_id: OrderedDict of cache_keys}
        self._lock = asyncio.Lock()
        self._max_entries_per_session = max_entries_per_session

        # Statistics for observability
        self._stats = {
            "total_hits": 0,
            "total_misses": 0,
            "total_evictions": 0,
            "total_sets": 0,
        }

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
        Updates LRU order on hit.
        """
        input_hash = self._compute_input_hash(tool_input)
        cache_key = self._make_cache_key(session_id, tool_name, input_hash)

        async with self._lock:
            if cache_key in self._cache:
                entry = self._cache[cache_key]
                entry["access_count"] = entry.get("access_count", 0) + 1
                entry["last_accessed"] = datetime.utcnow().isoformat()

                # Update LRU order - move to end (most recently used)
                if session_id in self._lru_order:
                    self._lru_order[session_id].move_to_end(cache_key)

                self._stats["total_hits"] += 1
                return entry["result"]

            self._stats["total_misses"] += 1
            return None

    async def set(
        self, session_id: str, tool_name: str, tool_input: Dict[str, Any], result: Any
    ) -> None:
        """
        Cache a tool call result.
        Implements LRU eviction if session exceeds max_entries_per_session.
        """
        input_hash = self._compute_input_hash(tool_input)
        cache_key = self._make_cache_key(session_id, tool_name, input_hash)

        async with self._lock:
            # Initialize LRU order for session if needed
            if session_id not in self._lru_order:
                self._lru_order[session_id] = OrderedDict()

            # Check if we need to evict (LRU)
            session_entries = self._lru_order[session_id]
            if (
                len(session_entries) >= self._max_entries_per_session
                and cache_key not in session_entries
            ):
                # Evict least recently used entry
                lru_key, _ = session_entries.popitem(last=False)
                if lru_key in self._cache:
                    del self._cache[lru_key]
                    self._stats["total_evictions"] += 1

            # Add/update cache entry
            now = datetime.utcnow().isoformat()
            self._cache[cache_key] = {
                "result": result,
                "timestamp": now,
                "last_accessed": now,
                "session_id": session_id,
                "tool_name": tool_name,
                "input_hash": input_hash,
                "access_count": 0,
            }

            # Update LRU order
            if cache_key in session_entries:
                session_entries.move_to_end(cache_key)
            else:
                session_entries[cache_key] = None

            self._stats["total_sets"] += 1

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

            # Clean up LRU order
            if session_id in self._lru_order:
                del self._lru_order[session_id]

            return len(keys_to_remove)

    async def get_stats(self) -> Dict[str, Any]:
        """
        Get comprehensive cache statistics for observability.
        Includes hit rate, eviction rate, and average entry age.
        """
        async with self._lock:
            total_entries = len(self._cache)
            sessions = set()
            tools = {}

            # Calculate entry ages
            now = datetime.utcnow()
            ages = []
            access_counts = []

            for key, entry in self._cache.items():
                parts = key.split(":")
                if len(parts) >= 2:
                    sessions.add(parts[0])
                    tool_name = parts[1]
                    tools[tool_name] = tools.get(tool_name, 0) + 1

                # Calculate age
                try:
                    created = datetime.fromisoformat(entry["timestamp"])
                    age_seconds = (now - created).total_seconds()
                    ages.append(age_seconds)
                except (ValueError, KeyError):
                    pass

                access_counts.append(entry.get("access_count", 0))

            # Calculate hit rate
            total_requests = self._stats["total_hits"] + self._stats["total_misses"]
            hit_rate = (
                (self._stats["total_hits"] / total_requests * 100)
                if total_requests > 0
                else 0
            )

            # Calculate eviction rate
            eviction_rate = (
                (self._stats["total_evictions"] / self._stats["total_sets"] * 100)
                if self._stats["total_sets"] > 0
                else 0
            )

            # Calculate average age
            avg_age_seconds = sum(ages) / len(ages) if ages else 0
            avg_access_count = (
                sum(access_counts) / len(access_counts) if access_counts else 0
            )

            return {
                "total_entries": total_entries,
                "unique_sessions": len(sessions),
                "unique_tools": len(tools),
                "sessions": list(sessions),
                "tools_breakdown": tools,
                "hit_rate_percent": round(hit_rate, 2),
                "eviction_rate_percent": round(eviction_rate, 2),
                "average_entry_age_seconds": round(avg_age_seconds, 2),
                "average_access_count": round(avg_access_count, 2),
                "total_hits": self._stats["total_hits"],
                "total_misses": self._stats["total_misses"],
                "total_evictions": self._stats["total_evictions"],
                "total_sets": self._stats["total_sets"],
                "max_entries_per_session": self._max_entries_per_session,
            }

    async def clear_all(self) -> int:
        """Clear all cache entries. Returns number of entries cleared."""
        async with self._lock:
            count = len(self._cache)
            self._cache.clear()
            self._lru_order.clear()
            return count


# Global cache manager instance
cache_manager = CacheManager()

# Made with Bob
