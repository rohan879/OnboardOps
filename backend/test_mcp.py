import urllib.request
import json

# Test MCP discovery endpoint
req = urllib.request.Request("http://127.0.0.1:8765/mcp", method="POST")
response = urllib.request.urlopen(req)
data = json.loads(response.read())

tools = data["tools"]
emit_tool = [t for t in tools if t["name"] == "emit_event"]

print("[OK] emit_event tool found!" if emit_tool else "[FAIL] emit_event NOT found")
print(f"Total tools: {len(tools)}")
print("\nAll tools:")
for t in tools:
    print(f"  - {t['name']}")

if emit_tool:
    print("\nemit_event tool details:")
    print(json.dumps(emit_tool[0], indent=2))

# Made with Bob
