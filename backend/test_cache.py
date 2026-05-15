"""
Test script for T2.6 - In-Session Response Caching
Tests cache hits, misses, and X-Cache headers
"""

import httpx
import time
import json

BASE_URL = "http://127.0.0.1:8765"


def test_cache_functionality():
    """Test that caching works correctly with session_id"""

    print("=" * 60)
    print("T2.6 Cache Testing")
    print("=" * 60)

    # Create httpx client
    client = httpx.Client()

    # Test 1: Cache MISS on first call
    print("\n[TEST 1] First call - should be CACHE MISS")
    session_id = "test-session-123"
    payload = {
        "tool_name": "git_blame_summary",
        "arguments": {"file_path": "app/main.py", "session_id": session_id},
    }

    start = time.time()
    response1 = client.post(f"{BASE_URL}/mcp/invoke", json=payload)
    latency1 = (time.time() - start) * 1000

    print(f"Status: {response1.status_code}")
    print(f"X-Cache: {response1.headers.get('X-Cache', 'NOT SET')}")
    print(f"Latency: {latency1:.1f}ms")
    print(f"Result preview: {json.dumps(response1.json(), indent=2)[:200]}...")

    assert response1.status_code == 200, "First call should succeed"
    assert response1.headers.get("X-Cache") == "MISS", "First call should be cache MISS"

    # Test 2: Cache HIT on second call with same arguments
    print("\n[TEST 2] Second call (same args) - should be CACHE HIT")
    time.sleep(0.1)  # Small delay

    start = time.time()
    response2 = client.post(f"{BASE_URL}/mcp/invoke", json=payload)
    latency2 = (time.time() - start) * 1000

    print(f"Status: {response2.status_code}")
    print(f"X-Cache: {response2.headers.get('X-Cache', 'NOT SET')}")
    print(f"Latency: {latency2:.1f}ms")
    print(f"Speedup: {latency1/latency2:.1f}x faster")

    assert response2.status_code == 200, "Second call should succeed"
    assert response2.headers.get("X-Cache") == "HIT", "Second call should be cache HIT"
    assert latency2 < 50, f"Cache hit should be <50ms, got {latency2:.1f}ms"
    assert response1.json() == response2.json(), "Results should be identical"

    # Test 3: Cache MISS with different arguments
    print("\n[TEST 3] Different file - should be CACHE MISS")
    payload3 = {
        "tool_name": "git_blame_summary",
        "arguments": {
            "file_path": "app/different.py",  # Different file
            "session_id": session_id,
        },
    }

    response3 = client.post(f"{BASE_URL}/mcp/invoke", json=payload3)
    print(f"Status: {response3.status_code}")
    print(f"X-Cache: {response3.headers.get('X-Cache', 'NOT SET')}")

    assert response3.status_code == 200, "Third call should succeed"
    assert (
        response3.headers.get("X-Cache") == "MISS"
    ), "Different args should be cache MISS"

    # Test 4: Different session should not share cache
    print("\n[TEST 4] Different session - should be CACHE MISS")
    payload4 = {
        "tool_name": "git_blame_summary",
        "arguments": {
            "file_path": "app/main.py",  # Same file as test 1
            "session_id": "different-session-456",  # Different session
        },
    }

    response4 = client.post(f"{BASE_URL}/mcp/invoke", json=payload4)
    print(f"Status: {response4.status_code}")
    print(f"X-Cache: {response4.headers.get('X-Cache', 'NOT SET')}")

    assert response4.status_code == 200, "Fourth call should succeed"
    assert (
        response4.headers.get("X-Cache") == "MISS"
    ), "Different session should be cache MISS"

    # Test 5: No session_id should not use cache
    print("\n[TEST 5] No session_id - should be CACHE MISS (no caching)")
    payload5 = {
        "tool_name": "git_blame_summary",
        "arguments": {
            "file_path": "app/main.py"
            # No session_id
        },
    }

    response5 = client.post(f"{BASE_URL}/mcp/invoke", json=payload5)
    print(f"Status: {response5.status_code}")
    print(f"X-Cache: {response5.headers.get('X-Cache', 'NOT SET')}")

    assert response5.status_code == 200, "Fifth call should succeed"
    assert (
        response5.headers.get("X-Cache") == "MISS"
    ), "No session_id should be cache MISS"

    # Test 6: Check cache stats
    print("\n[TEST 6] Cache statistics")
    stats_response = client.get(f"{BASE_URL}/cache/stats")
    stats = stats_response.json()

    print(f"Cache stats: {json.dumps(stats, indent=2)}")

    assert stats["cache"]["total_entries"] >= 3, "Should have at least 3 cached entries"
    assert (
        len(stats["cache"]["unique_sessions"]) >= 2
    ), "Should have at least 2 sessions"

    print("\n" + "=" * 60)
    print("[OK] All cache tests passed!")
    print("=" * 60)
    print("\nKey findings:")
    print(f"- Cache HIT latency: {latency2:.1f}ms (target: <50ms)")
    print(f"- Cache speedup: {latency1/latency2:.1f}x")
    print("- Session isolation: Working")
    print("- X-Cache headers: Working")


if __name__ == "__main__":
    try:
        test_cache_functionality()
    except AssertionError as e:
        print(f"\n[FAIL] Test failed: {e}")
        exit(1)
    except Exception as e:
        print(f"\n[ERROR] Unexpected error: {e}")
        import traceback

        traceback.print_exc()
        exit(1)

# Made with Bob
