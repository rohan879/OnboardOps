# Phase 3 Allow-List Refusal Demo Session

**Developer**: Dev 2 (Backend/MCP)  
**Task**: T2.4 - Implement Allow-List Configuration  
**Date**: Phase 3, H+12  
**Bobcoin Cost**: 0.5  
**Mode Used**: Code (for test script generation)

---

## Context

For the Phase 5 demo video, we need to show the allow-list enforcement in action. This session documents the creation of a demo script that shows:
1. Blocked file path access (secrets)
2. Allowed file path access (normal code)
3. Hot-reload capability with SIGHUP

## Demo Script Creation

Created `backend/demo_allowlist.sh`:

```bash
#!/bin/bash
# OnboardOps Allow-List Demo Script

echo "=== OnboardOps Allow-List Enforcement Demo ==="
echo ""

# Test 1: Blocked file path (.env)
echo "Test 1: Attempting to access .env file (should be blocked)"
curl -s -X POST http://localhost:8765/mcp/invoke \
  -H "Content-Type: application/json" \
  -d '{"tool_name": "git_blame_summary", "arguments": {"file_path": ".env"}}' \
  | jq -r '.error // "ERROR: Expected 403"'
echo ""

# Test 2: Blocked file path (*.key)
echo "Test 2: Attempting to access private.key file (should be blocked)"
curl -s -X POST http://localhost:8765/mcp/invoke \
  -H "Content-Type: application/json" \
  -d '{"tool_name": "git_blame_summary", "arguments": {"file_path": "secrets/private.key"}}' \
  | jq -r '.error // "ERROR: Expected 403"'
echo ""

# Test 3: Allowed file path (normal code)
echo "Test 3: Accessing backend/app.py (should succeed)"
curl -s -X POST http://localhost:8765/mcp/invoke \
  -H "Content-Type: application/json" \
  -d '{"tool_name": "git_blame_summary", "arguments": {"file_path": "backend/app.py"}}' \
  | jq -r 'if .error then "ERROR: \(.error)" else "✅ SUCCESS: \(.result.file_path)" end'
echo ""

# Test 4: Allowed template file (.env.example)
echo "Test 4: Accessing .env.example (should succeed)"
curl -s -X POST http://localhost:8765/mcp/invoke \
  -H "Content-Type: application/json" \
  -d '{"tool_name": "git_blame_summary", "arguments": {"file_path": "backend/.env.example"}}' \
  | jq -r 'if .error then "ERROR: \(.error)" else "✅ SUCCESS: \(.result.file_path)" end'
echo ""

echo "=== Demo Complete ==="
```

## Test Results

Ran the demo script:

```bash
chmod +x backend/demo_allowlist.sh
./backend/demo_allowlist.sh
```

**Output**:
```
=== OnboardOps Allow-List Enforcement Demo ===

Test 1: Attempting to access .env file (should be blocked)
Access to file path '.env' is blocked by allow-list

Test 2: Attempting to access private.key file (should be blocked)
Access to file path 'secrets/private.key' is blocked by allow-list

Test 3: Accessing backend/app.py (should succeed)
✅ SUCCESS: backend/app.py

Test 4: Accessing .env.example (should succeed)
✅ SUCCESS: backend/.env.example

=== Demo Complete ===
```

**Analysis**:
- ✅ All 4 tests passed
- ✅ Blocked paths return clear error messages
- ✅ Allowed paths return results
- ✅ Template files (.env.example) correctly allowed

## Hot-Reload Demo

Created a second script to demonstrate hot-reload:

```bash
#!/bin/bash
# Hot-reload demo

echo "=== Hot-Reload Demo ==="
echo ""

# Step 1: Test access to a file (should succeed)
echo "Step 1: Accessing backend/README.md (currently allowed)"
curl -s -X POST http://localhost:8765/mcp/invoke \
  -H "Content-Type: application/json" \
  -d '{"tool_name": "git_blame_summary", "arguments": {"file_path": "backend/README.md"}}' \
  | jq -r 'if .error then "❌ BLOCKED" else "✅ ALLOWED" end'
echo ""

# Step 2: Add README.md to blocked_paths in allowlist.yaml
echo "Step 2: Adding 'README.md' to blocked_paths..."
echo "  (Edit .onboardops/allowlist.yaml manually)"
read -p "Press Enter after editing allowlist.yaml..."

# Step 3: Send SIGHUP to reload
echo "Step 3: Sending SIGHUP to reload configuration..."
kill -HUP $(pgrep -f "uvicorn app:app")
sleep 1
echo ""

# Step 4: Test access again (should now be blocked)
echo "Step 4: Accessing backend/README.md (should now be blocked)"
curl -s -X POST http://localhost:8765/mcp/invoke \
  -H "Content-Type: application/json" \
  -d '{"tool_name": "git_blame_summary", "arguments": {"file_path": "backend/README.md"}}' \
  | jq -r 'if .error then "✅ BLOCKED (as expected)" else "❌ ERROR: Still allowed" end'
echo ""

echo "=== Hot-Reload Demo Complete ==="
```

**Demo Flow**:
1. Access README.md → ✅ Allowed
2. Edit allowlist.yaml to block README.md
3. Send SIGHUP to server
4. Access README.md → ✅ Blocked

**Server logs during hot-reload**:
```
[ALLOWLIST] Received SIGHUP, reloading configuration...
[ALLOWLIST] Loaded configuration from .onboardops/allowlist.yaml
[ALLOWLIST VIOLATION] Tool: git_blame_summary, Reason: Blocked file path: backend/README.md
```

## Demo Video Storyboard

For Phase 5 video recording:

1. **Scene 1: Security Enforcement** (30 seconds)
   - Show terminal with demo script
   - Run `./backend/demo_allowlist.sh`
   - Highlight the 403 errors for .env and *.key files
   - Highlight the success for normal code files

2. **Scene 2: Hot-Reload** (45 seconds)
   - Show allowlist.yaml in editor
   - Add a new blocked path
   - Send SIGHUP signal
   - Show server logs confirming reload
   - Test the newly blocked path

3. **Scene 3: Dashboard Integration** (15 seconds)
   - Show frontend dashboard
   - Trigger a blocked path access
   - Show error banner on dashboard

## Integration Impact

- **Dev 1**: Cartography skills can safely read code files, blocked from secrets
- **Dev 3**: Dashboard can display allow-list violations as error banners
- **Dev 4**: Bootstrap respects allow-list (won't read secrets)
- **Dev 5**: Demo video has a compelling security story

## Files Created

- `backend/demo_allowlist.sh` - Main demo script
- `backend/demo_hotreload.sh` - Hot-reload demo script
- `bob_sessions/dev2/03_phase3-allowlist-refusal.md` - This session export

## Lessons Learned

1. **Clear error messages matter**: "Access to file path '.env' is blocked by allow-list" is much better than "403 Forbidden"
2. **Hot-reload is a killer feature**: No server restart needed for security updates
3. **Demo scripts are reusable**: Can be run during Phase 4 testing and Phase 5 video recording

---

**Session Export**: This session demonstrates security enforcement and hot-reload, key differentiators for OnboardOps.

**Made with Bob** 🤖