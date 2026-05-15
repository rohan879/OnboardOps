# Phase 2 Gate Checklist (H+10)

**Gate Time**: H+10 (2 hours after Phase 2 start)  
**Duration**: 15 minutes  
**Format**: Synchronous team review  
**Participants**: All 5 developers

---

## Gate Purpose

The Phase 2 gate confirms that the **vertical slice** is complete and working. This is the first end-to-end signal of life for OnboardOps. The team does not proceed to Phase 3 until all P0 criteria pass.

---

## Gate Criteria (from Phase 2 Doc)

### G2.1: Socratic Greeting ✓

**Requirement**: `/onboard` produces Socratic greeting mentioning repo by name

**Verification**:
- [ ] Type `/onboard` in Bob IDE on demo repo
- [ ] Greeting appears within 5 seconds
- [ ] Greeting contains 4 parts: welcome + stopwatch + name request + first prompt
- [ ] Repo name mentioned explicitly (not generic "your repository")
- [ ] Greeting is ≤120 words

**Evidence Required**:
- Screenshot of Bob chat showing greeting
- Timestamp showing <5 second response time

**Owner**: Dev 1  
**Status**: ⬜ Not Tested | ⬜ Pass | ⬜ Fail

---

### G2.2: Real MCP Tool Call ✓

**Requirement**: Bob successfully calls `git_blame_summary` with real data

**Verification**:
- [ ] Backend MCP server running on port 8765
- [ ] Bob calls `git_blame_summary` during Stage 1
- [ ] Tool returns real git data (not mock)
- [ ] Response time <800ms (p95 requirement)
- [ ] No errors in backend logs

**Evidence Required**:
- Backend log showing `git_blame_summary` call
- Tool response with real file paths and authors
- Response time measurement

**Owner**: Dev 2  
**Status**: ⬜ Not Tested | ⬜ Pass | ⬜ Fail

---

### G2.3: Dashboard Card Rendering ✓

**Requirement**: Dependency graph card renders on dashboard with ≥5 nodes, ≥5 edges

**Verification**:
- [ ] Frontend dashboard running on port 3000
- [ ] WebSocket connection established (green indicator)
- [ ] Dependency graph card appears within 30 seconds of Stage 1 start
- [ ] Card shows ≥5 nodes
- [ ] Card shows ≥5 edges
- [ ] Node labels visible (module names)
- [ ] No errors in frontend console

**Evidence Required**:
- Screenshot of dashboard showing graph card
- Browser console showing no errors
- WebSocket connection indicator green

**Owner**: Dev 3  
**Status**: ⬜ Not Tested | ⬜ Pass | ⬜ Fail

---

### G2.4: Full 4-Stage Flow (Implicit)

**Requirement**: All 4 cartography stages execute in sequence

**Verification**:
- [ ] Stage 1 (Dependency Graph) completes with real data
- [ ] Stage 2 (Entry Points) emits placeholder card
- [ ] Stage 3 (Hotspots) emits placeholder card
- [ ] Stage 4 (Conventions) emits placeholder card
- [ ] Bob says "Cartography complete" at end
- [ ] No crashes or hangs

**Evidence Required**:
- Dashboard showing all 4 cards
- Bob chat showing stage transitions
- Full session export

**Owner**: Dev 1  
**Status**: ⬜ Not Tested | ⬜ Pass | ⬜ Fail

---

### G2.5: Socratic Question Loop (Implicit)

**Requirement**: Bob asks question after Stage 1 and evaluates answer

**Verification**:
- [ ] Question emitted after dependency graph card
- [ ] Question is specific and checkable from graph
- [ ] Correct answer acknowledged
- [ ] Incorrect answer triggers remediation (≤80 words)
- [ ] Second incorrect answer reveals answer and continues

**Evidence Required**:
- Bob chat showing question
- Dashboard showing QuestionAsk event
- Test of correct and incorrect answers

**Owner**: Dev 1  
**Status**: ⬜ Not Tested | ⬜ Pass | ⬜ Fail

---

### G2.6: Measured Bobcoin Cost ✓

**Requirement**: Bobcoin cost for vertical slice measured and documented

**Verification**:
- [ ] Full `/onboard` session completed
- [ ] Bobcoin consumption recorded per stage
- [ ] Total consumption documented in `docs/bobcoin-tracking-t1.3.md`
- [ ] Consumption ≤3 Bobcoins (acceptable for first run)
- [ ] Optimization targets identified for T1.4

**Evidence Required**:
- Completed `docs/bobcoin-tracking-t1.3.md`
- Screenshot of Bob IDE Bobcoin consumption
- Breakdown by stage

**Owner**: Dev 1  
**Status**: ⬜ Not Tested | ⬜ Pass | ⬜ Fail

---

## Additional Verification (P1 - Should Pass)

### Bootstrap Script Exists

- [ ] `scripts/bootstrap.sh` exists with 5 stages
- [ ] Script is executable
- [ ] Script runs without errors (even if no-op)

**Owner**: Dev 4  
**Status**: ⬜ Not Tested | ⬜ Pass | ⬜ Fail

---

### Demo Repo Selected

- [ ] Demo repo forked to team org
- [ ] Demo repo cloned locally
- [ ] Friction audit completed (`notes/demo-repo-friction.md`)
- [ ] 5 auto-recovery patterns identified

**Owner**: Dev 4  
**Status**: ⬜ Not Tested | ⬜ Pass | ⬜ Fail

---

### CI Pipeline Running

- [ ] GitHub Actions CI configured
- [ ] Secrets scan (gitleaks) runs on push
- [ ] Backend lint (ruff) runs on push
- [ ] Frontend lint (eslint) runs on push
- [ ] All checks passing on main branch

**Owner**: Dev 5  
**Status**: ⬜ Not Tested | ⬜ Pass | ⬜ Fail

---

## Gate Meeting Protocol

### Pre-Meeting (H+9:45 - 15 min before gate)

Each developer:
1. Runs their verification checklist
2. Marks status: Pass / Fail / Not Tested
3. Prepares evidence (screenshots, logs)
4. Identifies any blockers

### Meeting Agenda (H+10:00 - 15 min)

**Minutes 0-10: Round-Robin Demos**

Each developer gets 2 minutes to demonstrate their gate criteria:

1. **Dev 1** (2 min): Show `/onboard` greeting, Stage 1 execution, Socratic question
2. **Dev 2** (2 min): Show backend logs with MCP tool calls, response times
3. **Dev 3** (2 min): Show dashboard with all 4 cards, WebSocket connection
4. **Dev 4** (2 min): Show demo repo, friction audit, bootstrap script
5. **Dev 5** (2 min): Show CI pipeline, Makefile targets, README

**Minutes 10-13: Gate Review**

- Review each gate criterion (G2.1-G2.6)
- Mark as Pass / Fail
- Any Fail becomes a P0 for immediate fix

**Minutes 13-15: Phase 3 Kickoff**

- If all P0 pass: Proceed to Phase 3
- If any P0 fail: Assign owner, set deadline, re-gate

---

## Failure Scenarios

### Scenario 1: G2.1 Fails (Greeting)

**Symptom**: Greeting doesn't appear or is wrong format

**Root Causes**:
- `.bob/modes/onboard.md` not loaded
- Mode YAML front matter incorrect
- Greeting template wrong

**Fix**:
- Verify mode file in demo repo
- Check Bob's mode list (Settings → Modes)
- Fix greeting template in mode file
- Re-test

**Owner**: Dev 1  
**Estimated Fix Time**: 15 minutes

---

### Scenario 2: G2.2 Fails (MCP Tool)

**Symptom**: `git_blame_summary` not called or returns error

**Root Causes**:
- Backend not running
- MCP server not bound in `.bob/mcp.json`
- Tool implementation broken
- GitHub token missing

**Fix**:
- Verify backend health: `curl http://127.0.0.1:8765/health`
- Check MCP binding in Bob settings
- Test tool directly: `curl -X POST http://127.0.0.1:8765/mcp`
- Verify `ONBOARDOPS_GITHUB_TOKEN` env var

**Owner**: Dev 2  
**Estimated Fix Time**: 30 minutes

---

### Scenario 3: G2.3 Fails (Dashboard)

**Symptom**: Cards don't appear on dashboard

**Root Causes**:
- Frontend not running
- WebSocket connection failed
- `emit_event` tool not working
- Card rendering component broken

**Fix**:
- Verify frontend: `curl http://localhost:3000`
- Check WebSocket indicator on dashboard
- Check browser console for errors
- Test `emit_event` tool directly

**Owner**: Dev 3  
**Estimated Fix Time**: 30 minutes

---

### Scenario 4: G2.6 Fails (Bobcoin Budget)

**Symptom**: Bobcoin consumption >5 Bobcoins

**Root Causes**:
- Verbose responses
- Redundant file reads
- No caching
- Inefficient prompts

**Fix**:
- This is expected for first run
- Document actual spend
- Proceed to T1.4 for optimization
- Do not block Phase 3

**Owner**: Dev 1  
**Estimated Fix Time**: T1.4 (45 minutes in Phase 3)

---

## Post-Gate Actions

### If All P0 Pass ✅

1. **Update Phase 2 status**: Mark as complete in project tracker
2. **Commit all changes**: Ensure all work is pushed to main
3. **Export sessions**: All devs export Bob sessions to `bob_sessions/`
4. **Phase 3 kickoff**: Distribute Phase 3 task lists
5. **Celebrate**: 🎉 First vertical slice working!

### If Any P0 Fail ❌

1. **Triage**: Identify root cause and owner
2. **Fix**: Owner fixes issue immediately
3. **Re-test**: Run verification again
4. **Re-gate**: Hold mini-gate when fixed (5 min)
5. **Document**: Log issue and fix in `notes/phase2-issues.md`

---

## Phase 2 Deliverables Checklist

Before proceeding to Phase 3, verify all deliverables exist:

### Code Artifacts

- [ ] `.bob/modes/onboard.md` - Complete Socratic mentor mode
- [ ] `.bob/skills/repo-cartography.md` - Stage 1 real + Stages 2-4 stubs
- [ ] `.bob/skills/certification.md` - 12 question templates
- [ ] `.bob/rules/cartography-style.md` - Style guide for token economy
- [ ] `.bob/mcp.json` - MCP server binding with 8 tools
- [ ] `backend/app.py` - FastAPI MCP server
- [ ] `backend/mcp/contracts.py` - Pydantic models for 8 tools
- [ ] `backend/tools/*.py` - 8 tool implementations (mocked or real)
- [ ] `frontend/src/app/page.tsx` - Dashboard layout
- [ ] `frontend/src/components/Stopwatch.tsx` - Stopwatch component
- [ ] `frontend/src/hooks/useEvents.ts` - WebSocket client
- [ ] `scripts/bootstrap.sh` - Environment bootstrap script
- [ ] `scripts/start-integration-test.sh` - Server startup automation
- [ ] `scripts/stop-integration-test.sh` - Server shutdown automation

### Documentation

- [ ] `AGENTS.md` - Team context file
- [ ] `README.md` - v1 draft with install instructions
- [ ] `docs/bob-contracts.md` - MCP tool specifications
- [ ] `docs/prompt-patterns.md` - 10 prompt engineering patterns
- [ ] `docs/phase2-integration-test-plan.md` - T1.3 test plan
- [ ] `docs/bobcoin-tracking-t1.3.md` - Bobcoin consumption tracking
- [ ] `docs/T1.3-QUICK-START.md` - Quick start guide
- [ ] `docs/phase2-gate-checklist.md` - This document
- [ ] `bob_sessions/dev1/README.md` - Session export guidelines
- [ ] `notes/demo-repo-friction.md` - Friction audit (Dev 4)

### Session Exports

- [ ] `bob_sessions/dev1/01_vertical-slice.md` - T1.3 session
- [ ] `bob_sessions/dev1/01_vertical-slice.png` - Bobcoin screenshot
- [ ] `bob_sessions/dev2/` - Dev 2's sessions
- [ ] `bob_sessions/dev3/` - Dev 3's sessions
- [ ] `bob_sessions/dev4/` - Dev 4's sessions
- [ ] `bob_sessions/dev5/` - Dev 5's sessions

---

## Success Metrics

Phase 2 is successful if:

1. **Vertical slice works**: `/onboard` runs end-to-end
2. **All layers connected**: Bob → MCP → Backend → WebSocket → Dashboard
3. **Real data flows**: At least one MCP tool returns real git data
4. **Bobcoin measured**: Consumption documented and <5 Bobcoins
5. **Team aligned**: All 5 devs understand the architecture
6. **Phase 3 ready**: No blockers for parallel feature development

---

## Phase 3 Preview

After passing this gate, Phase 3 (H+10 to H+18) will:
- Implement real logic for Stages 2-4 (Entry Points, Hotspots, Conventions)
- Implement 5 auto-recovery patterns in bootstrap engine
- Implement certification rubric grading
- Implement starter PR generator
- Optimize Bobcoin consumption to ≤15 per session

---

**Last Updated**: 2026-05-15  
**Owner**: Dev 1 (Bob Architect)  
**Status**: Ready for H+10 Gate