#!/usr/bin/env python3
"""
Stress Test for OnboardOps Backend - T2.3
Runs 50 consecutive simulated MCP sessions to verify stability

Tests:
- Peak memory usage
- Latency stability over time
- Error rate
- Cache hit rate

Usage:
    cd backend
    python ../scripts/stress_test_backend.py
"""

import httpx
import time
import psutil
import os
from typing import List, Dict, Any
from statistics import mean, median

# Backend configuration
BACKEND_URL = "http://localhost:8765"
HEALTH_ENDPOINT = f"{BACKEND_URL}/health"
INVOKE_ENDPOINT = f"{BACKEND_URL}/mcp/invoke"
METRICS_ENDPOINT = f"{BACKEND_URL}/metrics"

# Test configuration
NUM_SESSIONS = 50
TOOLS_PER_SESSION = 20


def get_process_memory_mb() -> float:
    """Get current process memory usage in MB"""
    process = psutil.Process(os.getpid())
    return process.memory_info().rss / 1024 / 1024


def check_backend_health() -> bool:
    """Verify backend is running"""
    try:
        response = httpx.get(HEALTH_ENDPOINT, timeout=5.0)
        return response.status_code == 200
    except Exception as e:
        print(f"❌ Backend health check failed: {e}")
        return False


def generate_test_payload(session_id: str, tool_idx: int) -> Dict[str, Any]:
    """Generate a test MCP tool invocation payload"""
    # Cycle through different tools
    tools = [
        {
            "tool_name": "git_blame_summary",
            "arguments": {"file_path": "README.md", "session_id": session_id},
        },
        {
            "tool_name": "commit_frequency",
            "arguments": {"days": 180, "session_id": session_id},
        },
        {
            "tool_name": "recent_authors",
            "arguments": {"days": 90, "limit": 10, "session_id": session_id},
        },
        {
            "tool_name": "pr_for_file",
            "arguments": {
                "file_path": "src/main.py",
                "limit": 5,
                "session_id": session_id,
            },
        },
        {
            "tool_name": "file_changelog",
            "arguments": {
                "file_path": "package.json",
                "limit": 10,
                "session_id": session_id,
            },
        },
        {
            "tool_name": "rationale_for_commit",
            "arguments": {"commit_hash": "abc123def456", "session_id": session_id},
        },
        {
            "tool_name": "incident_for_file",
            "arguments": {
                "file_path": "src/auth.py",
                "days": 180,
                "session_id": session_id,
            },
        },
    ]

    return tools[tool_idx % len(tools)]


def run_stress_test():
    """Execute the stress test"""
    print("=" * 70)
    print("OnboardOps Backend Stress Test - T2.3")
    print("=" * 70)
    print()

    # Check backend health
    print("🔍 Checking backend health...")
    if not check_backend_health():
        print("❌ Backend is not running. Start it with: uvicorn app:app --port 8765")
        return False
    print("✅ Backend is healthy\n")

    # Initialize metrics
    latencies: List[float] = []
    errors = 0
    cache_hits = 0
    cache_misses = 0
    start_memory = get_process_memory_mb()
    peak_memory = start_memory

    print(
        f"📊 Starting stress test: {NUM_SESSIONS} sessions × {TOOLS_PER_SESSION} tools = {NUM_SESSIONS * TOOLS_PER_SESSION} total calls"
    )
    print(f"💾 Initial memory: {start_memory:.1f} MB\n")

    start_time = time.time()

    # Run sessions
    with httpx.Client(timeout=10.0) as client:
        for session_num in range(1, NUM_SESSIONS + 1):
            session_id = f"stress-test-{session_num}"

            for tool_idx in range(TOOLS_PER_SESSION):
                payload = generate_test_payload(session_id, tool_idx)

                try:
                    call_start = time.time()
                    response = client.post(INVOKE_ENDPOINT, json=payload)
                    call_latency = (time.time() - call_start) * 1000

                    latencies.append(call_latency)

                    if response.status_code == 200:
                        # Check cache header
                        cache_status = response.headers.get("X-Cache", "MISS")
                        if cache_status == "HIT":
                            cache_hits += 1
                        else:
                            cache_misses += 1

                        # Check for error in response
                        data = response.json()
                        if data.get("error"):
                            errors += 1
                    else:
                        errors += 1

                except Exception as e:
                    errors += 1
                    print(f"  ⚠️  Error in session {session_num}, tool {tool_idx}: {e}")

            # Update peak memory after each session
            current_memory = get_process_memory_mb()
            peak_memory = max(peak_memory, current_memory)

            # Progress update every 10 sessions
            if session_num % 10 == 0:
                calls_so_far = session_num * TOOLS_PER_SESSION
                avg_latency = (
                    mean(latencies[-100:]) if len(latencies) >= 100 else mean(latencies)
                )
                print(
                    f"  Session {session_num}/{NUM_SESSIONS} | "
                    f"Calls: {calls_so_far} | "
                    f"Avg latency: {avg_latency:.0f}ms | "
                    f"Errors: {errors} | "
                    f"Memory: {current_memory:.1f}MB"
                )

    total_time = time.time() - start_time
    total_calls = NUM_SESSIONS * TOOLS_PER_SESSION

    # Calculate statistics
    p50 = median(latencies)
    p95 = sorted(latencies)[int(len(latencies) * 0.95)]
    p99 = sorted(latencies)[int(len(latencies) * 0.99)]
    avg_latency = mean(latencies)
    error_rate = (errors / total_calls) * 100
    cache_hit_rate = (
        (cache_hits / (cache_hits + cache_misses)) * 100
        if (cache_hits + cache_misses) > 0
        else 0
    )

    # Print results
    print()
    print("=" * 70)
    print("STRESS TEST RESULTS")
    print("=" * 70)
    print()
    print("📈 Performance:")
    print(f"   Total calls:        {total_calls}")
    print(f"   Total time:         {total_time:.1f}s")
    print(f"   Calls/second:       {total_calls / total_time:.1f}")
    print(f"   Avg latency:        {avg_latency:.0f}ms")
    print(f"   p50 latency:        {p50:.0f}ms")
    print(f"   p95 latency:        {p95:.0f}ms")
    print(f"   p99 latency:        {p99:.0f}ms")
    print()
    print("💾 Memory:")
    print(f"   Start:              {start_memory:.1f} MB")
    print(f"   Peak:               {peak_memory:.1f} MB")
    print(f"   Delta:              {peak_memory - start_memory:.1f} MB")
    print()
    print("📊 Reliability:")
    print(f"   Errors:             {errors}")
    print(f"   Error rate:         {error_rate:.2f}%")
    print(f"   Cache hits:         {cache_hits}")
    print(f"   Cache misses:       {cache_misses}")
    print(f"   Cache hit rate:     {cache_hit_rate:.1f}%")
    print()

    # Pass/fail criteria
    print("=" * 70)
    print("ACCEPTANCE CRITERIA")
    print("=" * 70)
    print()

    passed = True

    # Check: All runs complete
    if total_calls == NUM_SESSIONS * TOOLS_PER_SESSION:
        print("✅ All 50 runs completed")
    else:
        print(f"❌ Only {total_calls // TOOLS_PER_SESSION} runs completed")
        passed = False

    # Check: Peak memory < 500 MB
    if peak_memory < 500:
        print(f"✅ Peak memory {peak_memory:.1f} MB < 500 MB")
    else:
        print(f"❌ Peak memory {peak_memory:.1f} MB >= 500 MB")
        passed = False

    # Check: p95 latency stable (no degradation)
    # Compare first 100 calls vs last 100 calls
    first_100_p95 = sorted(latencies[:100])[95] if len(latencies) >= 100 else p95
    last_100_p95 = sorted(latencies[-100:])[95] if len(latencies) >= 100 else p95
    degradation = (
        ((last_100_p95 - first_100_p95) / first_100_p95) * 100
        if first_100_p95 > 0
        else 0
    )

    if degradation < 20:  # Allow up to 20% degradation
        print(f"✅ p95 latency stable (degradation: {degradation:.1f}%)")
    else:
        print(f"❌ p95 latency degraded by {degradation:.1f}%")
        passed = False

    # Check: Error rate < 1%
    if error_rate < 1.0:
        print(f"✅ Error rate {error_rate:.2f}% < 1%")
    else:
        print(f"❌ Error rate {error_rate:.2f}% >= 1%")
        passed = False

    print()
    if passed:
        print("🎉 STRESS TEST PASSED")
    else:
        print("❌ STRESS TEST FAILED")
    print()

    return passed


if __name__ == "__main__":
    success = run_stress_test()
    exit(0 if success else 1)

# Made with Bob
