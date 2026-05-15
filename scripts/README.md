# OnboardOps Scripts

This directory contains automation scripts for OnboardOps development and operations.

## Scripts Overview

### Telemetry & Session Management

#### `telemetry.py` (Phase 2, T5.1)
**Purpose:** Captures WebSocket events to JSONL session files for replay and analysis.

**Usage:**
```bash
# Start with default settings
python scripts/telemetry.py

# Custom WebSocket URL
python scripts/telemetry.py --ws-url ws://localhost:8765/events

# Custom output directory
python scripts/telemetry.py --output-dir /path/to/sessions

# Verbose logging
python scripts/telemetry.py --verbose
```

**Output:**
- Creates `.onboardops/sessions/<session-id>.jsonl`
- One JSON object per line (JSONL format)
- Auto-rotates on session close
- Reconnects automatically with exponential backoff

**Environment Variables:**
- `ONBOARDOPS_WS_URL` - WebSocket URL (default: `ws://localhost:8765/events`)
- `ONBOARDOPS_SESSION_DIR` - Output directory (default: `.onboardops/sessions`)

#### `scrub.py` (Phase 2, T5.2)
**Purpose:** Removes PII and secrets from session exports before committing.

**Usage:**
```bash
# Scrub a single file
python scripts/scrub.py input.jsonl output.jsonl

# Scrub all files in a directory
python scripts/scrub.py --dir .onboardops/sessions --output bob_sessions/

# CI check mode (fails if violations found)
python scripts/scrub.py --check bob_sessions/
```

**What it removes:**
- API keys (regex patterns)
- Email addresses (except team allow-list)
- Absolute paths with usernames (replaced with `$HOME`)
- GitHub tokens
- AWS credentials

#### `export_bob_sessions.py` (Phase 2, T5.3)
**Purpose:** Automated pipeline for exporting, scrubbing, and indexing Bob IDE sessions.

**Usage:**
```bash
# Run the full export pipeline
python scripts/export_bob_sessions.py

# Or use the Makefile target
make export-bob-sessions
```

**What it does:**
1. Prompts each dev to place raw exports in `bob_sessions/devN/raw/`
2. Runs PII scrubber on each export
3. Renames with canonical format: `NN_task-title.md`
4. Collects Bobcoin consumption screenshots
5. Generates `bob_sessions/README.md` index

**Output structure:**
```
bob_sessions/
├── README.md              # Auto-generated index
├── dev1/
│   ├── raw/              # Place raw exports here
│   ├── 01_verify-bob.md  # Scrubbed exports
│   ├── 02_create-repo.md
│   └── bobcoin-usage.png
├── dev2/
│   └── ...
```

**Interactive prompts:**
- Waits for each dev to place exports in raw/ directory
- Press ENTER when ready to process
- Automatically scrubs and renames all files

### Bootstrap & Auto-Recovery

#### `bootstrap.sh` (Phase 2, T4.1-T4.7)
**Purpose:** Installs demo repository dependencies with auto-recovery.

**Usage:**
```bash
# Run full bootstrap
./scripts/bootstrap.sh

# Run specific stage
./scripts/bootstrap.sh detect
./scripts/bootstrap.sh install
./scripts/bootstrap.sh healthcheck

# Auto-recover without prompts
./scripts/bootstrap.sh --auto-recover
```

#### `auto_bootstrap.py` (Phase 2, T4.5)
**Purpose:** Wraps bootstrap with Bob Shell error diagnosis loop.

**Usage:**
```bash
python scripts/auto_bootstrap.py /path/to/demo/repo
```

### PR Generation

#### `open_starter_pr.py` (Phase 2, T5.7)
**Purpose:** Opens a starter PR against the demo repository.

**Usage:**
```bash
# Open PR with default task
python scripts/open_starter_pr.py

# Specify task
python scripts/open_starter_pr.py --task candidate-1

# Dry run (don't actually open PR)
python scripts/open_starter_pr.py --dry-run
```

### Utilities

#### `bootstrap_relay.py` (Phase 2, T4.8)
**Purpose:** Relays bootstrap events to WebSocket for dashboard display.

**Usage:**
```bash
# Pipe bootstrap output through relay
./scripts/bootstrap.sh | python scripts/bootstrap_relay.py
```

## Installation

Install script dependencies:

```bash
pip install -r scripts/requirements.txt
```

Or install individually:

```bash
pip install websockets PyGithub python-dotenv
```

## Development

### Running Telemetry Locally

The telemetry service is automatically started by `make dev`:

```bash
make dev
# Starts: telemetry + backend + frontend
```

To run telemetry standalone:

```bash
python scripts/telemetry.py
```

### Testing Telemetry

1. Start the backend (with WebSocket support):
   ```bash
   cd backend
   source .venv/bin/activate
   uvicorn app:app --port 8765 --reload
   ```

2. Start telemetry:
   ```bash
   python scripts/telemetry.py
   ```

3. Trigger events (via Bob or test client):
   ```bash
   # Using wscat
   wscat -c ws://localhost:8765/events
   > {"type": "SessionStart", "session_id": "test-123"}
   ```

4. Check output:
   ```bash
   cat .onboardops/sessions/test-123.jsonl
   ```

### Session File Format

Each line in a session JSONL file is a complete JSON object:

```json
{"type": "SessionStart", "session_id": "abc123", "timestamp": "2026-05-15T22:00:00Z", "_captured_at": "2026-05-15T22:00:00.123Z"}
{"type": "TurnStart", "session_id": "abc123", "turn_id": 1, "_captured_at": "2026-05-15T22:00:01.456Z"}
{"type": "ToolCall", "session_id": "abc123", "tool": "git_blame_summary", "args": {...}, "_captured_at": "2026-05-15T22:00:02.789Z"}
```

Metadata added by telemetry:
- `_captured_at` - UTC timestamp when event was captured
- `_session_id` - Session ID (redundant but useful for grep)

## Troubleshooting

### Telemetry not capturing events

1. Check WebSocket connection:
   ```bash
   python scripts/telemetry.py --verbose
   ```

2. Verify backend is running:
   ```bash
   curl http://localhost:8765/health
   ```

3. Check WebSocket endpoint:
   ```bash
   wscat -c ws://localhost:8765/events
   ```

### Session files not created

1. Check output directory exists:
   ```bash
   ls -la .onboardops/sessions/
   ```

2. Check permissions:
   ```bash
   chmod 755 .onboardops/sessions/
   ```

3. Check logs:
   ```bash
   python scripts/telemetry.py --verbose 2>&1 | tee telemetry.log
   ```

### Scrubber not removing secrets

1. Test with known patterns:
   ```bash
   echo '{"key": "sk-1234567890"}' | python scripts/scrub.py --stdin
   ```

2. Check regex patterns in `scrub.py`

3. Add custom patterns to allow-list

## CI Integration

The CI pipeline checks for unscrubbed files:

```yaml
# .github/workflows/ci.yml
- name: Check for secrets in bob_sessions
  run: |
    python scripts/scrub.py --check bob_sessions/
```

This fails the build if any session file contains:
- Unredacted API keys
- Email addresses not in allow-list
- Absolute paths with usernames

## Phase 2 Acceptance Criteria

### T5.1 - Telemetry Capture
- ✅ Service connects to WebSocket
- ✅ Events written to JSONL (one per line)
- ✅ Session files auto-rotate on close
- ✅ Line count matches dashboard event count

### T5.2 - PII Scrubber
- ✅ Removes 5 planted "leaks" from test file
- ✅ CI fails on unscrubbed file commit

### T5.3 - Export Pipeline
- ✅ `make export-bob-sessions` runs successfully
- ✅ Two devs can run back-to-back
- ✅ Index README regenerated correctly

---

**Last Updated:** Phase 2, H+2  
**Owner:** Dev 5 (Integration Engineer)