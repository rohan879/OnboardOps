# Phase 4 - Dev 2 (Backend/MCP) Implementation Plan

**Owner:** Dev 2 (Backend/MCP Engineer)  
**Phase Window:** H+28 to H+40 (12 hours)  
**Effective Work Time:** ~10 hours  
**Bobcoin Budget:** 3 coins  
**Status:** Ready to implement

---

## Current State Analysis

### Backend Health
✅ **Working:**
- All 7 MCP tools implemented with real GitPython/GitHub API
- WebSocket bridge functional
- Session management with 30-minute timeout
- Cache manager with in-session caching
- Observability with structured logging and metrics
- Allow-list enforcement for tool calls
- MCP protocol compliance (JSON-RPC 2.0)

⚠️ **Needs Hardening:**
- Error handling is basic (raises exceptions, no typed errors)
- No retry logic for GitHub API calls
- No per-tool health check endpoints
- No stress testing done
- Documentation incomplete (missing error codes, retry semantics)

### Identified Defects from Phase 3
Based on `docs/demo-defects.md` (template, not filled):
1. **Potential:** MCP tools may fail silently during demo
2. **Potential:** GitHub API rate limiting not handled
3. **Potential:** Network errors cause hard failures
4. **Potential:** No way to verify tool health before recording

---

## Task Breakdown with Implementation Details

### T2.1 - Defect Triage (30 min) ✓ COMPLETED
**Status:** Analysis complete  
**Findings:**
- No critical P0 defects found in backend
- P1: Need structured error responses
- P1: Need GitHub API retry logic
- P1: Need health check endpoints
- P2: Documentation gaps

---

### T2.2 - Per-Tool Error Handling (60 min)

**Goal:** Add structured error handling to all 7 tools

**Implementation:**
1. Create `backend/mcp/errors.py`:
   ```python
   class MCPToolError(BaseModel):
       error_code: str
       message: str
       retryable: bool
       details: Optional[Dict[str, Any]] = None
   ```

2. Define error codes:
   - `GIT_COMMAND_ERROR` - Git operation failed (retryable)
   - `FILE_NOT_FOUND` - File doesn't exist (not retryable)
   - `NETWORK_ERROR` - GitHub API unreachable (retryable)
   - `RATE_LIMIT` - GitHub rate limited (retryable with backoff)
   - `TIMEOUT` - Operation exceeded timeout (retryable)
   - `UNKNOWN_ERROR` - Unexpected error (not retryable)

3. Wrap each tool with try-except:
   - Catch `git.exc.GitCommandError` → `GIT_COMMAND_ERROR`
   - Catch `httpx.TimeoutException` → `TIMEOUT`
   - Catch `httpx.NetworkError` → `NETWORK_ERROR`
   - Catch `FileNotFoundError` → `FILE_NOT_FOUND`
   - Catch `Exception` → `UNKNOWN_ERROR`

4. Return typed error in tool response (not raise)

**Files to modify:**
- `backend/mcp/errors.py` (new)
- `backend/tools/git_blame_summary.py`
- `backend/tools/commit_frequency.py`
- `backend/tools/recent_authors.py`
- `backend/tools/pr_for_file.py`
- `backend/tools/file_changelog.py`
- `backend/tools/rationale_for_commit.py`
- `backend/tools/incident_for_file.py`

**Testing:**
- Deliberately inject 3 error types per tool
- Verify typed error response returned
- Verify no 500-level HTTP responses

**Bobcoin:** 0 (pure implementation)

---

### T2.3 - Stress Test: 50 Consecutive E2E Runs (90 min)

**Goal:** Verify backend stability under repeated load

**Implementation:**
1. Create `scripts/stress_test_backend.py`:
   - Load pre-recorded MCP payloads from `backend/test_payloads/`
   - Drive 50 simulated sessions through MCP server
   - Each session: 20 tool calls (mix of all 7 tools)
   - Measure: peak memory, p95 latency, error rate, cache hit rate

2. Create test payloads:
   - Extract from Phase 3 Bob sessions
   - Sanitize (remove session IDs, use test repo)
   - Store in `backend/test_payloads/session_*.jsonl`

3. Run stress test:
   ```bash
   cd backend
   python ../scripts/stress_test_backend.py
   ```

4. Fix worst regression:
   - If memory leak: add explicit cleanup
   - If latency degradation: optimize hot path
   - If errors: add missing error handling

**Acceptance:**
- 50 runs complete without crash
- Peak memory < 500 MB
- p95 latency stable (no degradation over time)
- Error rate < 1%

**Bobcoin:** 0 (synthetic test, no live Bob)

---

### T2.4 - GitHub API Retry and Backoff (45 min)

**Goal:** Make GitHub API calls resilient to transient failures

**Implementation:**
1. Create `backend/utils/retry.py`:
   ```python
   def with_retry(
       func,
       max_retries=3,
       backoff_base=1.0,
       retryable_exceptions=(httpx.TimeoutException, httpx.NetworkError)
   ):
       # Exponential backoff: 1s, 2s, 4s
   ```

2. Wrap all GitHub API calls in `pr_for_file.py`:
   - `client.get(commits_url)` → `with_retry(lambda: client.get(...))`
   - `client.get(prs_url)` → `with_retry(lambda: client.get(...))`

3. Add retry logging:
   - Log each retry attempt with attempt number
   - Log final failure if retries exhausted

4. Handle rate limiting:
   - Check for 403 with `X-RateLimit-Remaining: 0`
   - Return typed error `RATE_LIMIT` (retryable=True)
   - Include `retry_after` in error details

**Testing:**
- Mock GitHub API to return 503 three times, then 200
- Verify retry succeeds on 4th attempt
- Mock sustained 503, verify clean error after 3 retries

**Bobcoin:** 0 (pure implementation)

---

### T2.5 - Per-Tool Self-Test Endpoints (60 min)

**Goal:** Add `/tools/<name>/healthz` for preflight checks

**Implementation:**
1. Add routes to `backend/app.py`:
   ```python
   @app.get("/tools/{tool_name}/healthz")
   async def tool_health_check(tool_name: str):
       # Run tiny self-test for the tool
       # Return 200 + success message or 503 + error details
   ```

2. Self-test logic per tool:
   - `git_blame_summary`: Check demo repo exists, run blame on README
   - `commit_frequency`: Check demo repo exists, count commits
   - `recent_authors`: Check demo repo exists, list authors
   - `pr_for_file`: Check GitHub token set, make test API call
   - `file_changelog`: Check demo repo exists, get changelog for README
   - `rationale_for_commit`: Check demo repo exists, get HEAD commit
   - `incident_for_file`: Always return 200 (mock data)

3. Return structured response:
   ```json
   {
     "tool": "git_blame_summary",
     "status": "healthy",
     "latency_ms": 45,
     "details": "Successfully ran blame on README.md"
   }
   ```

4. On failure:
   ```json
   {
     "tool": "git_blame_summary",
     "status": "unhealthy",
     "error": "Demo repo not found at /path/to/repo",
     "retryable": false
   }
   ```

**Testing:**
- Call all 7 health endpoints with demo repo present → 200
- Remove demo repo, call again → 503 with clear error
- Unset GitHub token, call `pr_for_file/healthz` → 503

**Bobcoin:** 0 (pure implementation)

---

### T2.6 - Documentation Polish (45 min)

**Goal:** Finalize `docs/mcp-api.md` and `backend/README.md`

**Updates to `docs/mcp-api.md`:**
1. Add "Error Codes" section:
   - List all 6 error codes with descriptions
   - Show example error response for each

2. Add "Retry Semantics" section:
   - Document exponential backoff (1s, 2s, 4s)
   - List which errors are retryable
   - Explain rate limiting behavior

3. Add "Health Checks" section:
   - Document `/tools/<name>/healthz` endpoints
   - Show example responses (healthy and unhealthy)
   - Explain when to use (preflight checks)

4. Add "Cache Behavior" section:
   - Document cache eviction on session close
   - Explain cache key structure
   - Show `X-Cache` header usage

**Updates to `backend/README.md`:**
1. Add "Error Handling" section
2. Add "Retry Logic" section
3. Add "Health Checks" section
4. Add "Performance" section (link to PERFORMANCE.md)

**Acceptance:**
- Dev 3 can read docs and call all 7 tools without asking questions
- All error codes documented with examples
- All retry behavior documented

**Bobcoin:** 0 (documentation)

---

### T2.7 - Live Demo Support (60 min)

**Goal:** Monitor backend during Dev 5's recording sessions

**Activities:**
1. Open terminal with backend logs:
   ```bash
   cd backend
   uvicorn app:app --reload --log-level debug
   ```

2. Open second terminal with metrics:
   ```bash
   watch -n 1 'curl -s localhost:8765/metrics | jq'
   ```

3. Create `notes/phase4-recording-observations.md`:
   - Note every retry attempt
   - Note every cache miss
   - Note every slow tool (>500ms)
   - Note any errors (even if recovered)

4. Be available in team chat for questions

**Acceptance:**
- Notes file has at least 3 observations
- No surfaced bugs go unaddressed
- Dev 5 reports no blocking waits

**Bobcoin:** 1 (monitoring live sessions)

---

### T2.8 - Final Performance Verification (60 min)

**Goal:** Re-run Phase 3 load test, document final numbers

**Implementation:**
1. Run existing test:
   ```bash
   cd backend
   python test_performance.py
   ```

2. Verify all tools p95 < 800ms

3. Update `docs/perf-results.md`:
   ```markdown
   # Final Performance Results - Phase 4

   | Tool | p50 | p95 | p99 | Status |
   |------|-----|-----|-----|--------|
   | git_blame_summary | 120ms | 350ms | 550ms | ✅ PASS |
   | commit_frequency | 180ms | 480ms | 680ms | ✅ PASS |
   | ... | ... | ... | ... | ... |
   ```

4. Add to slide deck data (coordinate with Dev 5)

**Acceptance:**
- All 7 tools p95 < 800ms
- Results documented
- Ready for slide

**Bobcoin:** 0 (synthetic test)

---

### T2.9 - Joint Integration Debugging (60 min)

**Goal:** Capture a "three-dev integration debug" Bob session

**Activities:**
1. Coordinate with Dev 1 and Dev 3
2. Deliberately introduce a subtle bug (e.g., cache key collision)
3. Use Bob to debug across backend + frontend + Bob mode
4. Capture the session export
5. Fix the bug
6. Document the debugging arc

**Acceptance:**
- One captured session exported to `bob_sessions/dev2/`
- Session shows cross-component debugging
- Bug fixed

**Bobcoin:** 1 (live Bob session)

---

### T2.10 - Bob Session Curation (45 min)

**Goal:** Curate `bob_sessions/dev2/` to 4 best sessions

**Sessions to include:**
1. **Integration debugging** (from T2.9)
2. **Performance tuning** (from Phase 3 T2.9)
3. **Allow-list refusal** (from Phase 3 T2.8)
4. **Cache tuning** (from Phase 3 T2.6)

**For each session:**
1. Add narrative foreword (1 paragraph):
   - What was attempted
   - What Bob did
   - What the Bobcoin cost was
   - Why it matters for judges

2. Add consumption screenshot:
   - Show Bob's response
   - Show the code change
   - Show the test passing

3. Update `bob_sessions/dev2/README.md`:
   - List all 4 sessions
   - Provide reading order
   - Highlight key moments

**Acceptance:**
- 4 sessions curated with forewords
- Screenshots added
- README guides judges through sessions

**Bobcoin:** 0 (curation)

---

### T2.11 - Buffer / Cross-Team Help (45 min)

**Goal:** Reserve time for unexpected issues

**Potential activities:**
- Help Dev 5 with architecture diagram (data flow expertise)
- Fix any late-discovered backend bugs
- Support Dev 1 with MCP tool behavior questions
- Assist with final E2E runs

**Acceptance:**
- No outstanding backend issues at H+40
- Team reports Dev 2 was responsive

**Bobcoin:** 1 (buffer for live work)

---

## Manual Tasks for You (Dev 2)

### Before Starting Implementation

1. **Review this plan:**
   - Does the task order make sense?
   - Any missing dependencies?
   - Any concerns about Bobcoin budget?

2. **Confirm demo repo path:**
   ```bash
   echo $ONBOARDOPS_DEMO_REPO_PATH
   # Should point to a real git repo
   ```

3. **Confirm GitHub token (if using real API):**
   ```bash
   echo $ONBOARDOPS_GITHUB_TOKEN
   # Should be set if using real GitHub API
   ```

### During Implementation

1. **After T2.2 (Error Handling):**
   - Manually test each tool with deliberate errors
   - Verify typed error responses
   - Confirm no 500-level responses

2. **After T2.3 (Stress Test):**
   - Review stress test output
   - Identify any memory leaks or latency issues
   - Fix worst regression before continuing

3. **After T2.5 (Health Checks):**
   - Manually call all 7 `/tools/<name>/healthz` endpoints
   - Verify responses are clear and actionable
   - Test with broken state (no repo, no token)

4. **After T2.6 (Documentation):**
   - Ask Dev 3 to review docs
   - Incorporate feedback
   - Ensure docs are judge-ready

5. **During T2.7 (Live Demo Support):**
   - Keep terminal windows open during recordings
   - Take notes in real-time
   - Don't interrupt unless critical

### After All Tasks Complete

1. **Final checklist:**
   - [ ] All 7 tools have structured error handling
   - [ ] GitHub API has retry logic
   - [ ] All 7 health check endpoints working
   - [ ] Stress test passes (50 runs, <500MB, stable latency)
   - [ ] Documentation complete and reviewed
   - [ ] 4 Bob sessions curated
   - [ ] Bobcoin spend ≤ 3

2. **Commit and push:**
   ```bash
   git add backend/ docs/ bob_sessions/dev2/
   git commit -m "Phase 4 Dev 2: Backend hardening complete"
   git push
   ```

3. **Report to team:**
   - Post in team channel: "Dev 2 Phase 4 complete"
   - Share any observations from live demo support
   - Highlight any remaining concerns

---

## Bobcoin Budget Tracking

| Task | Budgeted | Actual | Notes |
|------|----------|--------|-------|
| T2.1 | 0 | - | Defect triage |
| T2.2 | 0 | - | Error handling |
| T2.3 | 0 | - | Stress test (synthetic) |
| T2.4 | 0 | - | Retry logic |
| T2.5 | 0 | - | Health checks |
| T2.6 | 0 | - | Documentation |
| T2.7 | 1 | - | Live demo support |
| T2.8 | 0 | - | Performance verification |
| T2.9 | 1 | - | Integration debugging |
| T2.10 | 0 | - | Session curation |
| T2.11 | 1 | - | Buffer |
| **Total** | **3** | **0** | **Under budget** |

---

## Success Criteria

Phase 4 Dev 2 tasks are complete when:

✅ All 7 tools return typed errors (no exceptions to caller)  
✅ GitHub API calls have retry logic with exponential backoff  
✅ All 7 health check endpoints return 200 or 503 with clear errors  
✅ Stress test passes: 50 runs, <500MB memory, stable latency  
✅ Documentation complete: error codes, retry semantics, health checks  
✅ 4 Bob sessions curated with forewords and screenshots  
✅ Bobcoin spend ≤ 3  
✅ No outstanding backend issues at H+40

---

**Ready to implement?** Let me know if you want me to proceed or if you have any questions/changes to this plan.