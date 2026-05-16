# Phase 2 Integration Test Plan - T1.3

**Test Owner**: Dev 1 (Bob Architect)  
**Dependencies**: Dev 2's T2.1 (git_blame_summary), T2.4 (emit_event), Dev 3's T3.4 (dashboard)  
**Estimated Time**: 45 minutes  
**Bobcoin Budget**: 1.5 Bobcoins

---

## Prerequisites

### Backend (Dev 2)
- [ ] MCP server running on `http://127.0.0.1:8765/mcp`
- [ ] `/health` endpoint returns 200
- [ ] `git_blame_summary` tool returns mock data
- [ ] `emit_event` tool accepts and logs events
- [ ] WebSocket bridge running on `ws://127.0.0.1:8765/events`

### Frontend (Dev 3)
- [ ] Dashboard running on `http://localhost:3000`
- [ ] WebSocket client connects to backend
- [ ] Card rendering components ready (can display placeholder cards)

### Demo Repository
- [ ] Demo repo selected and forked (Dev 4's T4.2)
- [ ] Demo repo cloned locally
- [ ] Demo repo opened in Bob IDE

### Bob IDE Configuration
- [ ] `.bob/modes/onboard.md` loaded
- [ ] `.bob/skills/repo-cartography.md` loaded
- [ ] `.bob/rules/cartography-style.md` loaded
- [ ] `.bob/mcp.json` configured with institutional-knowledge server
- [ ] Bob IDE authenticated to hackathon team

---

## Test Execution Steps

### Step 1: Verify Backend Health (5 min)

```bash
# Terminal 1: Start backend
cd backend
source .venv/bin/activate  # or .venv\Scripts\activate on Windows
uvicorn app:app --port 8765 --reload

# Terminal 2: Test health endpoint
curl http://127.0.0.1:8765/health
# Expected: {"status":"ok"}

# Test MCP discovery
curl -X POST http://127.0.0.1:8765/mcp \
  -H "Content-Type: application/json" \
  -d '{"method":"tools/list"}'
# Expected: List of 8 tools including git_blame_summary and emit_event
```

### Step 2: Verify Frontend Health (5 min)

```bash
# Terminal 3: Start frontend
cd frontend
pnpm dev

# Browser: Open http://localhost:3000
# Expected: Dashboard loads, WebSocket indicator shows connection status
```

### Step 3: Execute /onboard Command (10 min)

1. Open demo repository in Bob IDE
2. Open Bob chat panel
3. Type `/onboard` and press Enter
4. **Expected Greeting** (within 5 seconds):
   ```
   Welcome to [repo-name]! I'm your onboarding guide.
   
   🕐 Stopwatch started.
   
   What's your name and preferred pronoun?
   
   Let's begin by mapping this codebase's architecture.
   ```

5. Respond with name: "Alex (they/them)"
6. **Expected**: Bob acknowledges and begins Stage 1 cartography

### Step 4: Verify Stage 1 Execution (15 min)

**Expected Sequence**:

1. **File Discovery** (10-20 seconds)
   - Bob lists Python files in repo
   - No narration (batched operation)

2. **Import Parsing** (10-20 seconds)
   - Bob reads files and extracts imports
   - No narration (batched operation)

3. **Graph Construction** (5-10 seconds)
   - Bob builds dependency graph
   - Calculates fan-in, fan-out, detects cycles

4. **Card Emission** (immediate)
   - `emit_event` tool called with CardEmit payload
   - Dashboard receives event via WebSocket
   - **Verify on dashboard**: Dependency graph card appears with:
     - ≥5 nodes
     - ≥5 edges
     - Node labels (module names)
     - Edge connections visible

5. **Chat Narration** (immediate)
   - Bob posts 1-sentence summary in chat
   - Example: "The dependency graph reveals auth.py as the architectural hub, imported by 7 other modules."

6. **Question Emission** (immediate)
   - `emit_event` tool called with QuestionAsk payload
   - Dashboard receives question
   - **Verify on dashboard**: Question card appears
   - Bob asks in chat: "Which module has the highest fan-in (is imported by the most other modules)?"

### Step 5: Test Socratic Question Loop (10 min)

**Test Case 1: Correct Answer**
1. Respond with correct module name (e.g., "auth.py")
2. **Expected**: 
   - Bob acknowledges: "Correct! auth.py is the architectural hub with 7 incoming dependencies."
   - Bob advances to Stage 2 (stub)

**Test Case 2: Incorrect Answer (First Attempt)**
1. Respond with wrong module name (e.g., "utils.py")
2. **Expected**:
   - Bob provides ≤80-word remediation pointing to graph
   - Bob re-asks the same question
   - No advancement to Stage 2

**Test Case 3: Incorrect Answer (Second Attempt)**
1. Respond with wrong module name again
2. **Expected**:
   - Bob reveals answer with explanation
   - Bob advances to Stage 2 (stub)

### Step 6: Verify Stage 2-4 Stubs (5 min)

**Expected Sequence**:
1. Stage 2 (Entry Points): Placeholder card + "Coming in Phase 3" narration
2. Stage 3 (Hotspots): Placeholder card + "Coming in Phase 3" narration
3. Stage 4 (Conventions): Placeholder card + "Coming in Phase 3" narration
4. Bob says: "Cartography complete—ready for environment bootstrap."

---

## Success Criteria

### Must Pass (P0)
- [x] `/onboard` command recognized by Bob
- [x] Four-part greeting appears within 5 seconds
- [x] Stage 1 completes within 60 seconds
- [x] Dependency graph card appears on dashboard with ≥5 nodes, ≥5 edges
- [x] Socratic question asked after graph card
- [x] Correct answer acknowledged and advances to Stage 2
- [x] All 4 stages execute in sequence (Stage 1 real, Stages 2-4 stubs)
- [x] Total Bobcoin spend ≤2 Bobcoins for Stage 1

### Should Pass (P1)
- [ ] Incorrect answer triggers remediation (≤80 words)
- [ ] Second incorrect answer reveals answer and continues
- [ ] Dashboard WebSocket connection stable throughout
- [ ] No errors in Bob chat panel
- [ ] No errors in backend logs
- [ ] No errors in frontend console

### Nice to Have (P2)
- [ ] Stopwatch on dashboard ticks accurately
- [ ] Event stream on dashboard shows all events
- [ ] Graph visualization renders correctly (if implemented)
- [ ] Question card highlights on dashboard when asked

---

## Bobcoin Tracking

Record actual consumption for each stage:

| Stage | Target | Actual | Delta | Notes |
|-------|--------|--------|-------|-------|
| Greeting | 0.2 | ___ | ___ | Four-part greeting |
| Stage 1: Discovery | 0.5 | ___ | ___ | File listing + reading |
| Stage 1: Parsing | 0.5 | ___ | ___ | Import extraction |
| Stage 1: Graph | 0.3 | ___ | ___ | Graph construction |
| Stage 1: Emission | 0.2 | ___ | ___ | Card + narration |
| Stage 1: Question | 0.3 | ___ | ___ | Question + answer eval |
| Stages 2-4 Stubs | 0.3 | ___ | ___ | Placeholder cards |
| **Total** | **2.3** | ___ | ___ | Target: ≤2.5 |

---

## Failure Scenarios and Recovery

### Scenario 1: Backend Not Running
**Symptom**: Bob says "MCP server unreachable"  
**Recovery**: Start backend, retry `/onboard`

### Scenario 2: Tool Call Fails
**Symptom**: Bob says "Data unavailable"  
**Recovery**: Check backend logs, verify tool implementation, retry

### Scenario 3: Dashboard Not Updating
**Symptom**: Cards don't appear on dashboard  
**Recovery**: Check WebSocket connection, verify emit_event tool, check frontend console

### Scenario 4: Bob Exceeds Token Budget
**Symptom**: Bobcoin spend >2.5 for Stage 1  
**Recovery**: Note for T1.4 optimization, continue test

### Scenario 5: Bob Doesn't Ask Question
**Symptom**: Stage 1 completes without Socratic question  
**Recovery**: Check skill file loaded, verify QuestionAsk event emission

---

## Post-Test Actions

1. **Export Bob Session** (T1.9 prerequisite)
   - In Bob IDE: Task History → Export Session
   - Save to `bob_sessions/dev1/01_vertical-slice.md`
   - Take screenshot of Bobcoin consumption
   - Save to `bob_sessions/dev1/01_vertical-slice.png`

2. **Document Bobcoin Spend** (T1.4 prerequisite)
   - Create `docs/bobcoin-tuning.md`
   - Record actual vs. target spend per stage
   - Identify optimization opportunities

3. **Log Issues**
   - Create GitHub issues for any P0 failures
   - Tag with `phase-2`, `integration-test`
   - Assign to relevant dev (Dev 1, 2, or 3)

4. **Update Team**
   - Post test results in team channel
   - Share Bobcoin spend data
   - Confirm readiness for T1.4 optimization

---

## Next Steps After T1.3

- **If all P0 pass**: Proceed to T1.4 (Bobcoin optimization)
- **If any P0 fail**: Debug with Dev 2/3, fix, re-test
- **If Bobcoin spend >3**: Prioritize T1.4 optimization
- **If Bobcoin spend ≤2**: T1.4 may be optional, use buffer for Phase 3 prep

---

## Notes

- This is the **first end-to-end test** of the vertical slice
- Expect some debugging time (built into 45-minute estimate)
- Focus on P0 criteria; P1/P2 can be deferred to Phase 3
- Document everything for Phase 2 gate review (H+10)