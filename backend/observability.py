"""
Observability module for OnboardOps MCP Server
Provides structured logging and metrics collection
"""

import structlog
from typing import Dict, Any, Optional, List
from collections import defaultdict
from datetime import datetime
import asyncio
import statistics


# Configure structlog for JSON output
structlog.configure(
    processors=[
        structlog.stdlib.filter_by_level,
        structlog.stdlib.add_logger_name,
        structlog.stdlib.add_log_level,
        structlog.stdlib.PositionalArgumentsFormatter(),
        structlog.processors.TimeStamper(fmt="iso"),
        structlog.processors.StackInfoRenderer(),
        structlog.processors.format_exc_info,
        structlog.processors.UnicodeDecoder(),
        structlog.processors.JSONRenderer(),
    ],
    wrapper_class=structlog.stdlib.BoundLogger,
    context_class=dict,
    logger_factory=structlog.stdlib.LoggerFactory(),
    cache_logger_on_first_use=True,
)

# Get logger instance
logger = structlog.get_logger()


class MetricsCollector:
    """
    Collects metrics for MCP tool calls

    Tracks:
    - Per-tool call counts
    - Per-tool latency (p50, p95, p99)
    - Cache hit rates
    - Error rates
    """

    def __init__(self):
        self._lock = asyncio.Lock()
        self._tool_calls: Dict[str, int] = defaultdict(int)
        self._tool_errors: Dict[str, int] = defaultdict(int)
        self._tool_cache_hits: Dict[str, int] = defaultdict(int)
        self._tool_cache_misses: Dict[str, int] = defaultdict(int)
        self._tool_latencies: Dict[str, List[float]] = defaultdict(list)
        self._max_latency_samples = 1000  # Keep last 1000 samples per tool
        self._start_time = datetime.utcnow()

    async def record_call(
        self, tool_name: str, latency_ms: float, cache_hit: bool, error: bool = False
    ):
        """Record a tool call with its metrics"""
        async with self._lock:
            self._tool_calls[tool_name] += 1

            if error:
                self._tool_errors[tool_name] += 1

            if cache_hit:
                self._tool_cache_hits[tool_name] += 1
            else:
                self._tool_cache_misses[tool_name] += 1

            # Store latency (keep only last N samples)
            latencies = self._tool_latencies[tool_name]
            latencies.append(latency_ms)
            if len(latencies) > self._max_latency_samples:
                latencies.pop(0)

    async def get_metrics(self) -> Dict[str, Any]:
        """Get current metrics snapshot"""
        async with self._lock:
            metrics = {
                "uptime_seconds": (
                    datetime.utcnow() - self._start_time
                ).total_seconds(),
                "tools": {},
            }

            for tool_name in self._tool_calls.keys():
                latencies = self._tool_latencies[tool_name]

                # Calculate percentiles if we have data
                if latencies:
                    sorted_latencies = sorted(latencies)
                    p50 = statistics.median(sorted_latencies)
                    p95_idx = int(len(sorted_latencies) * 0.95)
                    p99_idx = int(len(sorted_latencies) * 0.99)
                    p95 = (
                        sorted_latencies[p95_idx]
                        if p95_idx < len(sorted_latencies)
                        else sorted_latencies[-1]
                    )
                    p99 = (
                        sorted_latencies[p99_idx]
                        if p99_idx < len(sorted_latencies)
                        else sorted_latencies[-1]
                    )
                else:
                    p50 = p95 = p99 = 0

                total_calls = self._tool_calls[tool_name]
                cache_hits = self._tool_cache_hits[tool_name]
                cache_misses = self._tool_cache_misses[tool_name]
                cache_hit_rate = (
                    (cache_hits / (cache_hits + cache_misses) * 100)
                    if (cache_hits + cache_misses) > 0
                    else 0
                )

                error_rate = (
                    (self._tool_errors[tool_name] / total_calls * 100)
                    if total_calls > 0
                    else 0
                )

                metrics["tools"][tool_name] = {
                    "total_calls": total_calls,
                    "errors": self._tool_errors[tool_name],
                    "error_rate_percent": round(error_rate, 2),
                    "cache_hits": cache_hits,
                    "cache_misses": cache_misses,
                    "cache_hit_rate_percent": round(cache_hit_rate, 2),
                    "latency_ms": {
                        "p50": round(p50, 2),
                        "p95": round(p95, 2),
                        "p99": round(p99, 2),
                        "samples": len(latencies),
                    },
                }

            return metrics

    async def reset(self):
        """Reset all metrics (useful for testing)"""
        async with self._lock:
            self._tool_calls.clear()
            self._tool_errors.clear()
            self._tool_cache_hits.clear()
            self._tool_cache_misses.clear()
            self._tool_latencies.clear()
            self._start_time = datetime.utcnow()


# Global metrics collector instance
metrics_collector = MetricsCollector()


def log_mcp_call(
    session_id: Optional[str],
    tool_name: str,
    input_hash: str,
    latency_ms: float,
    cache_hit: bool,
    error: Optional[str] = None,
):
    """
    Log an MCP tool call with structured logging

    This replaces ad-hoc print statements with proper JSON logging
    """
    logger.info(
        "mcp_tool_call",
        session_id=session_id[:8] if session_id else None,
        tool_name=tool_name,
        input_hash=input_hash,
        latency_ms=round(latency_ms, 2),
        cache_hit=cache_hit,
        error=error,
    )


def log_session_event(event_type: str, session_id: str, **kwargs):
    """Log a session lifecycle event"""
    logger.info(
        "session_event",
        event_type=event_type,
        session_id=session_id[:8] if session_id else None,
        **kwargs,
    )


def log_websocket_event(event_type: str, session_id: Optional[str], **kwargs):
    """Log a WebSocket event"""
    logger.info(
        "websocket_event",
        event_type=event_type,
        session_id=session_id[:8] if session_id else None,
        **kwargs,
    )


def log_cache_event(event_type: str, session_id: str, **kwargs):
    """Log a cache event"""
    logger.info(
        "cache_event",
        event_type=event_type,
        session_id=session_id[:8] if session_id else None,
        **kwargs,
    )


# Made with Bob
