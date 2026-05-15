"""
Complete test for T2.4 - emit_event MCP Tool + WebSocket Bridge
Tests the critical path integration between Bob and the dashboard
"""

import urllib.request
import json
import asyncio
import websockets


def test_emit_event_mcp_tool():
    """Test 1: Invoke emit_event via MCP endpoint"""
    print("\n=== Test 1: emit_event MCP Tool Invocation ===")

    # Prepare test event with proper TurnStart schema
    test_payload = {
        "tool_name": "emit_event",
        "arguments": {
            "event_type": "turn_start",
            "event_data": {
                "turn_number": 1,
                "mode": "code",
                "prompt": "Test prompt from T2.4 verification",
            },
            "session_id": "test-session-456",
        },
    }

    # Invoke the tool
    req = urllib.request.Request(
        "http://127.0.0.1:8765/mcp/invoke",
        data=json.dumps(test_payload).encode("utf-8"),
        headers={"Content-Type": "application/json"},
        method="POST",
    )

    try:
        response = urllib.request.urlopen(req)
        result = json.loads(response.read())

        print("[OK] MCP invocation successful")
        print(f"  Tool: {result['tool_name']}")
        print(f"  Success: {result['result'].get('success', False)}")
        print(f"  Event ID: {result['result'].get('event_id', 'N/A')}")
        print(f"  Message: {result['result'].get('message', 'N/A')}")

        if result["result"].get("success"):
            print("\n[PASS] emit_event tool works correctly!")
            return True
        else:
            print(f"\n[FAIL] emit_event returned success=False: {result.get('error')}")
            return False

    except Exception as e:
        print(f"\n[FAIL] Error invoking emit_event: {e}")
        return False


async def test_websocket_connection():
    """Test 2: WebSocket connection and event reception"""
    print("\n=== Test 2: WebSocket Event Reception ===")

    try:
        # Connect to WebSocket
        uri = "ws://127.0.0.1:8765/events?session_id=test-session-456"
        print(f"Connecting to {uri}...")

        async with websockets.connect(uri) as websocket:
            print("[OK] WebSocket connected successfully")

            # Give the WebSocket time to fully register with the connection manager
            await asyncio.sleep(0.5)

            # Now send the test event
            print("Sending test event...")
            test_payload = {
                "tool_name": "emit_event",
                "arguments": {
                    "event_type": "card_emit",
                    "event_data": {
                        "card_id": "test-card-789",
                        "card_type": "info",
                        "title": "Test Card",
                        "content": "This is a test card from T2.4 verification",
                        "metadata": {},
                    },
                    "session_id": "test-session-456",
                },
            }
            req = urllib.request.Request(
                "http://127.0.0.1:8765/mcp/invoke",
                data=json.dumps(test_payload).encode("utf-8"),
                headers={"Content-Type": "application/json"},
                method="POST",
            )

            # Send event in executor to not block async loop
            loop = asyncio.get_event_loop()
            await loop.run_in_executor(None, lambda: urllib.request.urlopen(req))

            # Wait for event (with timeout)
            print("Waiting for event...")
            try:
                message = await asyncio.wait_for(websocket.recv(), timeout=2.0)
                event = json.loads(message)

                print("[OK] Received event!")
                print(
                    f"  Event type: {event.get('event', {}).get('event_type', 'N/A')}"
                )
                print(f"  Event ID: {event.get('event', {}).get('event_id', 'N/A')}")
                print(f"  Timestamp: {event.get('event', {}).get('timestamp', 'N/A')}")

                print("\n[PASS] WebSocket bridge works correctly!")
                return True

            except asyncio.TimeoutError:
                print("\n[FAIL] Timeout waiting for event (3 seconds)")
                return False

    except Exception as e:
        print(f"\n[FAIL] WebSocket error: {e}")
        return False


def main():
    """Run all T2.4 tests"""
    print("=" * 60)
    print("T2.4 Complete Verification")
    print("emit_event MCP Tool + WebSocket Bridge")
    print("=" * 60)

    # Test 1: MCP tool invocation
    test1_pass = test_emit_event_mcp_tool()

    # Test 2: WebSocket event reception
    test2_pass = asyncio.run(test_websocket_connection())

    # Summary
    print("\n" + "=" * 60)
    print("SUMMARY")
    print("=" * 60)
    print(f"Test 1 (MCP Tool):      {'PASS' if test1_pass else 'FAIL'}")
    print(f"Test 2 (WebSocket):     {'PASS' if test2_pass else 'FAIL'}")
    print("=" * 60)

    if test1_pass and test2_pass:
        print("\n*** T2.4 COMPLETE - All tests passed! ***")
        print("The critical path is now unblocked for:")
        print("  - Dev 1 (Bob mode)")
        print("  - Dev 3 (Dashboard)")
        print("  - Dev 4 (Bob Shell)")
        print("  - Dev 5 (Certification)")
        return 0
    else:
        print("\n*** T2.4 INCOMPLETE - Some tests failed ***")
        return 1


if __name__ == "__main__":
    exit(main())

# Made with Bob
