"""
Performance Testing Script for T2.5 - Final Performance Pass
Profile all seven implemented tools and measure p95 latency
Target: p95 < 800ms for all tools
"""

import httpx
import sys
import time
import statistics
from typing import List, Dict, Any

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")

BASE_URL = "http://127.0.0.1:8765"
NUM_RUNS = 10  # Run each tool 10 times for statistical significance


def measure_tool_latency(
    tool_name: str, arguments: Dict[str, Any], runs: int = NUM_RUNS
) -> List[float]:
    """Measure latency for a tool over multiple runs"""
    latencies = []
    client = httpx.Client(timeout=10.0)

    for i in range(runs):
        payload = {"tool_name": tool_name, "arguments": arguments}

        start = time.time()
        try:
            response = client.post(f"{BASE_URL}/mcp/invoke", json=payload)
            latency_ms = (time.time() - start) * 1000

            body = response.json() if response.status_code == 200 else {}

            if response.status_code == 200 and body.get("error") is None:
                latencies.append(latency_ms)
                cache_status = response.headers.get("X-Cache", "UNKNOWN")
                print(f"  Run {i+1}: {latency_ms:.1f}ms ({cache_status})")
            elif response.status_code == 200:
                print(f"  Run {i+1}: TOOL ERROR {body.get('error')}")
            else:
                print(f"  Run {i+1}: ERROR {response.status_code}")
        except Exception as e:
            print(f"  Run {i+1}: EXCEPTION {e}")

    client.close()
    return latencies


def calculate_percentiles(latencies: List[float]) -> Dict[str, float]:
    """Calculate p50, p95, p99 from latency samples"""
    if not latencies:
        return {"p50": 0, "p95": 0, "p99": 0, "min": 0, "max": 0, "mean": 0}

    sorted_latencies = sorted(latencies)
    n = len(sorted_latencies)

    return {
        "min": sorted_latencies[0],
        "max": sorted_latencies[-1],
        "mean": statistics.mean(sorted_latencies),
        "p50": sorted_latencies[int(n * 0.50)],
        "p95": sorted_latencies[int(n * 0.95)] if n > 1 else sorted_latencies[0],
        "p99": sorted_latencies[int(n * 0.99)] if n > 1 else sorted_latencies[0],
    }


def test_all_tools():
    """Test all seven implemented tools"""
    print("=" * 70)
    print("T2.5 Performance Testing - Target: p95 < 800ms for ALL 7 tools")
    print("=" * 70)

    tools_to_test = [
        {
            "name": "git_blame_summary",
            "arguments": {
                "file_path": "backend/app.py",
                "session_id": "perf-test-session",
            },
        },
        {
            "name": "commit_frequency",
            "arguments": {
                "file_path": "backend/app.py",
                "days": 180,
                "session_id": "perf-test-session",
            },
        },
        {
            "name": "recent_authors",
            "arguments": {"days": 90, "limit": 10, "session_id": "perf-test-session"},
        },
        {
            "name": "pr_for_file",
            "arguments": {
                "file_path": "backend/app.py",
                "limit": 5,
                "session_id": "perf-test-session",
            },
        },
        {
            "name": "file_changelog",
            "arguments": {
                "file_path": "backend/app.py",
                "limit": 20,
                "session_id": "perf-test-session",
            },
        },
        {
            "name": "rationale_for_commit",
            "arguments": {
                "commit_hash": "HEAD",
                "session_id": "perf-test-session",
            },
        },
        {
            "name": "incident_for_file",
            "arguments": {
                "file_path": "backend/app.py",
                "days": 90,
                "session_id": "perf-test-session",
            },
        },
    ]

    results = []

    for tool_config in tools_to_test:
        tool_name = tool_config["name"]
        arguments = tool_config["arguments"]

        print(f"\n[{tool_name}]")
        print(f"Arguments: {arguments}")

        latencies = measure_tool_latency(tool_name, arguments)

        if latencies:
            stats = calculate_percentiles(latencies)
            results.append(
                {"tool": tool_name, "stats": stats, "pass": stats["p95"] < 800}
            )

            print("\nStatistics:")
            print(f"  Min:  {stats['min']:.1f}ms")
            print(f"  Mean: {stats['mean']:.1f}ms")
            print(f"  p50:  {stats['p50']:.1f}ms")
            print(
                f"  p95:  {stats['p95']:.1f}ms ({'✓ PASS' if stats['p95'] < 800 else '✗ FAIL'})"
            )
            print(f"  p99:  {stats['p99']:.1f}ms")
            print(f"  Max:  {stats['max']:.1f}ms")
        else:
            print("  No successful runs!")
            results.append({"tool": tool_name, "stats": None, "pass": False})

    # Summary
    print("\n" + "=" * 70)
    print("SUMMARY")
    print("=" * 70)

    all_pass = True
    slowest_tool = None
    slowest_p95 = 0

    for result in results:
        tool = result["tool"]
        stats = result["stats"]
        passed = result["pass"]

        if stats:
            p95 = stats["p95"]
            status = "✓ PASS" if passed else "✗ FAIL"
            print(f"{tool:25s} p95={p95:6.1f}ms  {status}")

            if p95 > slowest_p95:
                slowest_p95 = p95
                slowest_tool = tool

            if not passed:
                all_pass = False
        else:
            print(f"{tool:25s} ERROR")
            all_pass = False

    print("=" * 70)

    if all_pass:
        print("✓ All tools meet p95 < 800ms target!")
    else:
        print("✗ Performance target not met")
        if slowest_tool:
            print(f"  Slowest tool: {slowest_tool} (p95={slowest_p95:.1f}ms)")
            print(f"  Recommendation: Profile {slowest_tool} and optimize")

    print("\nNext steps:")
    print("1. Check /metrics endpoint for detailed per-tool stats")
    print("2. Profile slowest tool with cProfile")
    print("3. Consider optimizations:")
    print("   - GitPython vs subprocess for git operations")
    print("   - Pre-load git repo handle at server start")
    print("   - Increase cache aggressiveness")
    print("   - Reduce GitHub API calls")


if __name__ == "__main__":
    try:
        test_all_tools()
    except KeyboardInterrupt:
        print("\n\nTest interrupted by user")
    except Exception as e:
        print(f"\n\nTest failed with error: {e}")
        import traceback

        traceback.print_exc()


# Made with Bob
