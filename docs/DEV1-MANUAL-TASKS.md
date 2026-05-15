# Dev 1 Manual Tasks - Phase 2 Completion

**Status**: 7 of 10 tasks complete  
**Remaining**: 3 tasks (2 require Bob IDE, 1 documentation)  
**Time Required**: ~2 hours  
**Bobcoin Budget**: 3 Bobcoins remaining (1.5 + 1.5 + 0)

---

## Quick Status

✅ **Completed (7 tasks)**:
- T1.1: Onboard Mode Body (60 min, 1.5 Bobcoins)
- T1.2: Stage 1 Dependency Graph (75 min, 2 Bobcoins)
- T1.5: Socratic Question Loop (45 min, 1 Bobcoin)
- T1.6: Stub Stages 2-4 (60 min, 0.5 Bobcoins)
- T1.7: Cartography Style Rules (30 min, 0 Bobcoins)
- T1.8: Prompt Patterns Handoff (30 min, 0 Bobcoins)
- T1.9: Session Export Prep (15 min, 0 Bobcoins) ✅ JUST COMPLETED

⏳ **Remaining (3 tasks)**:
- T1.3: First Integration Test (45 min, 1.5 Bobcoins) - **REQUIRES BOB IDE**
- T1.4: Compress Cartography Prompt (45 min, 1.5 Bobcoins) - **REQUIRES T1.3 DATA**
- T1.10: Phase 2 Gate Prep (75 min, 2 Bobcoins) ✅ JUST COMPLETED

---

## Task T1.3: First Integration Test (CRITICAL - DO THIS FIRST)

### What This Is

The first end-to-end test of OnboardOps. You'll execute `/onboard` in Bob IDE on the demo repository and verify that:
1. Bob greets you Socratically
2. Stage 1 (Dependency Graph) runs with real data
3. Dashboard shows the graph card
4. Socratic question appears
5. All 4 stages complete

### Prerequisites

Before starting, ensure:
- [ ] Backend MCP server running (port 8765)
- [ ] Frontend dashboard running (port 3000)
- [ ] Demo repository cloned and open in Bob IDE
- [ ] Bob IDE authenticated with hackathon team

### Quick Start (5 minutes)

```bash
# 1. Start backend and frontend
cd c:/Projects/Hackathon/IBM/OnboardOps
./scripts/start-integration-test.sh

# 2. Verify services
curl http://127.0.0.1:8765/health  # Should return {"status":"ok"}
curl http://localhost:3000          # Should return HTML

# 3. Open demo repo in Bob IDE
# (Open the demo repo folder in Bob, not OnboardOps)

# 4. Type in Bob chat:
/onboard
```

### What to Expect

**Turn 1 (Greeting)**:
- Bob says: "Welcome to [repo name]! Let's explore this codebase together..."
- Asks for your name
- Mentions stopwatch starting
- Asks first cartography question

**Turn 2-5 (Stage 1)**:
- Bob analyzes dependency graph
- Dashboard shows graph card with nodes and edges
- Bob asks Socratic question about the graph

**Turn 6-8 (Stages 2-4)**:
- Bob emits placeholder cards for Entry Points, Hotspots, Conventions
- Each stage says "Coming in Phase 3"

**Turn 9 (Complete)**:
- Bob says "Cartography complete"
- Dashboard shows all 4 cards

### Recording Data

As you go, fill out `docs/bobcoin-tracking-t1.3.md`:

1. **After each turn**: Note Bobcoin consumption in Bob IDE
2. **After Stage 1**: Record time taken, nodes/edges count
3. **After full session**: Calculate total Bobcoins used

### Success Criteria

**P0 (Must Pass)**:
- [ ] Greeting appears within 5 seconds
- [ ] Greeting is ≤120 words
- [ ] Stage 1 completes without errors
- [ ] Dashboard shows graph card with ≥5 nodes, ≥5 edges
- [ ] Socratic question appears after Stage 1
- [ ] All 4 stages complete
- [ ] Total Bobcoins ≤5 (acceptable for first run)

**P1 (Should Pass)**:
- [ ] Response time <15 seconds per turn
- [ ] No errors in backend logs
- [ ] No errors in frontend console
- [ ] WebSocket connection stays green

### Troubleshooting

**Problem**: `/onboard` command not found
- **Fix**: Check `.bob/modes/onboard.md` exists in demo repo
- **Fix**: Verify mode YAML front matter is correct
- **Fix**: Restart Bob IDE

**Problem**: Backend not responding
- **Fix**: Check backend logs: `tail -f backend/logs/app.log`
- **Fix**: Verify port 8765 not in use: `lsof -i :8765`
- **Fix**: Restart backend: `./scripts/stop-integration-test.sh && ./scripts/start-integration-test.sh`

**Problem**: Dashboard not updating
- **Fix**: Check browser console for errors
- **Fix**: Verify WebSocket connection (green indicator)
- **Fix**: Check frontend logs: `cd frontend && pnpm dev`

**Problem**: Bobcoin consumption too high (>5)
- **Fix**: This is expected for first run
- **Fix**: Document actual spend in tracking sheet
- **Fix**: Proceed to T1.4 for optimization

### After Completion

1. **Export Bob session**:
   - In Bob IDE: Task → Export Session
   - Save as `bob_sessions/dev1/01_vertical-slice.md`
   - Take screenshot of Bobcoin consumption
   - Save as `bob_sessions/dev1/01_vertical-slice.png`

2. **Complete tracking sheet**:
   - Fill out all sections in `docs/bobcoin-tracking-t1.3.md`
   - Note any issues or surprises
   - Calculate total Bobcoins used

3. **Proceed to T1.4**

---

## Task T1.4: Compress Cartography Prompt (DO THIS SECOND)

### What This Is

Based on T1.3 results, optimize the cartography skill to reduce Bobcoin consumption. Target: ≤2 Bobcoins per stage.

### Prerequisites

- [ ] T1.3 completed
- [ ] `docs/bobcoin-tracking-t1.3.md` filled out
- [ ] Actual Bobcoin consumption known

### Optimization Strategy

**If Stage 1 used >2 Bobcoins**:

1. **Move repeating instructions to rules**:
   - Identify instructions that appear in every stage
   - Move to `.bob/rules/cartography-style.md`
   - Reference rule file in skill front matter

2. **Compress examples**:
   - Replace verbose examples with pattern descriptions
   - Use "e.g." instead of full code blocks
   - Remove redundant explanations

3. **Cap output tokens**:
   - Add `max_output_tokens: 500` to front matter
   - Enforce "one-sentence summary" in narration
   - Limit card data to essential fields only

4. **Batch operations**:
   - Parse all files in one turn, not file-by-file
   - Emit card and question in same turn
   - Reduce back-and-forth with MCP server

### Files to Edit

1. **`.bob/skills/repo-cartography.md`**:
   - Compress Stage 1 instructions
   - Add token caps to front matter
   - Remove verbose examples

2. **`.bob/rules/cartography-style.md`**:
   - Add any repeating instructions from skill
   - Ensure loaded once per session

3. **`.bob/modes/onboard.md`**:
   - Add reference to cartography-style rules
   - Ensure rules loaded at session start

### Testing

After optimization:
1. Run `/onboard` again on demo repo
2. Measure Bobcoin consumption per stage
3. Target: Stage 1 ≤2 Bobcoins
4. If still >2, iterate

### Success Criteria

- [ ] Stage 1 Bobcoin consumption ≤2 Bobcoins
- [ ] Full session ≤8 Bobcoins (down from initial run)
- [ ] No functionality lost (still produces valid graph)
- [ ] Response time unchanged or faster

### After Completion

1. **Document optimization**:
   - Update `docs/bobcoin-tracking-t1.3.md` with "After Optimization" section
   - Note what changes had biggest impact
   - Calculate Bobcoin savings

2. **Export optimized session**:
   - Export as `bob_sessions/dev1/02_optimized-cartography.md`
   - Screenshot as `bob_sessions/dev1/02_optimized-cartography.png`

3. **Commit changes**:
   ```bash
   git add .bob/skills/repo-cartography.md .bob/rules/cartography-style.md
   git commit -m "Phase 2 T1.4: Optimize cartography for Bobcoin economy"
   git push
   ```

---

## Task T1.10: Phase 2 Gate Prep (COMPLETED ✅)

### Status: COMPLETED

All documentation for Phase 2 gate has been created:

✅ **Created Files**:
- `docs/phase2-gate-checklist.md` - Complete gate criteria and verification
- `bob_sessions/dev1/README.md` - Session export guidelines
- `docs/T1.3-QUICK-START.md` - Quick start guide for integration test
- `docs/phase2-integration-test-plan.md` - Detailed test plan
- `docs/bobcoin-tracking-t1.3.md` - Bobcoin tracking template

### What You Need to Do

At H+10 (Phase 2 gate meeting):

1. **Prepare evidence**:
   - Screenshot of `/onboard` greeting
   - Screenshot of dashboard with all 4 cards
   - Completed `docs/bobcoin-tracking-t1.3.md`
   - Backend logs showing MCP tool calls
   - Bob session exports

2. **Demo your work** (2 minutes):
   - Show `/onboard` command in Bob
   - Show Stage 1 execution
   - Show Socratic question
   - Show dashboard with graph card
   - Show Bobcoin consumption

3. **Review gate criteria**:
   - Go through `docs/phase2-gate-checklist.md`
   - Mark each criterion as Pass/Fail
   - Identify any blockers

4. **If all pass**: Proceed to Phase 3
5. **If any fail**: Fix immediately, re-test, re-gate

---

## Summary: What You Need to Do Now

### Immediate Actions (Next 2 Hours)

1. **Start services** (5 min):
   ```bash
   cd c:/Projects/Hackathon/IBM/OnboardOps
   ./scripts/start-integration-test.sh
   ```

2. **Run T1.3** (45 min):
   - Open demo repo in Bob IDE
   - Type `/onboard`
   - Follow test plan in `docs/T1.3-QUICK-START.md`
   - Fill out `docs/bobcoin-tracking-t1.3.md`
   - Export session to `bob_sessions/dev1/01_vertical-slice.md`

3. **Run T1.4** (45 min):
   - Review T1.3 Bobcoin data
   - Optimize `.bob/skills/repo-cartography.md`
   - Re-test `/onboard`
   - Verify Bobcoin savings
   - Export session to `bob_sessions/dev1/02_optimized-cartography.md`

4. **Prepare for gate** (15 min):
   - Review `docs/phase2-gate-checklist.md`
   - Gather evidence (screenshots, logs)
   - Mark gate criteria as Pass/Fail
   - Prepare 2-minute demo

### Files You'll Create

- `bob_sessions/dev1/01_vertical-slice.md` - T1.3 session export
- `bob_sessions/dev1/01_vertical-slice.png` - T1.3 Bobcoin screenshot
- `bob_sessions/dev1/02_optimized-cartography.md` - T1.4 session export
- `bob_sessions/dev1/02_optimized-cartography.png` - T1.4 Bobcoin screenshot
- `docs/bobcoin-tracking-t1.3.md` - Completed tracking sheet (already exists, you fill it out)

### Files You'll Edit

- `.bob/skills/repo-cartography.md` - Optimize Stage 1 (T1.4)
- `.bob/rules/cartography-style.md` - Add repeating instructions (T1.4)
- `docs/phase2-gate-checklist.md` - Mark gate criteria (at H+10)

---

## Quick Reference

### Key Documents

- **Quick Start**: `docs/T1.3-QUICK-START.md`
- **Test Plan**: `docs/phase2-integration-test-plan.md`
- **Tracking Sheet**: `docs/bobcoin-tracking-t1.3.md`
- **Gate Checklist**: `docs/phase2-gate-checklist.md`
- **Export Guidelines**: `bob_sessions/dev1/README.md`

### Key Commands

```bash
# Start services
./scripts/start-integration-test.sh

# Stop services
./scripts/stop-integration-test.sh

# Check backend health
curl http://127.0.0.1:8765/health

# Check frontend
curl http://localhost:3000

# View backend logs
tail -f backend/logs/app.log

# View frontend logs
cd frontend && pnpm dev
```

### Key Ports

- **Backend MCP Server**: 8765
- **Frontend Dashboard**: 3000
- **WebSocket Bridge**: 8765/events

### Success Metrics

- **T1.3**: Full session completes, ≤5 Bobcoins
- **T1.4**: Stage 1 optimized to ≤2 Bobcoins
- **Gate**: All P0 criteria pass

---

## Need Help?

### If T1.3 Fails

1. Check `docs/T1.3-QUICK-START.md` troubleshooting section
2. Review `docs/phase2-integration-test-plan.md` for detailed steps
3. Check backend logs for errors
4. Check frontend console for errors
5. Verify services running: `curl http://127.0.0.1:8765/health`

### If T1.4 Optimization Unclear

1. Review `docs/prompt-patterns.md` for optimization techniques
2. Check `.bob/rules/cartography-style.md` for token-saving patterns
3. Focus on: moving instructions to rules, compressing examples, capping output
4. Test incrementally: optimize one thing, re-test, measure

### If Gate Criteria Unclear

1. Review `docs/phase2-gate-checklist.md` for detailed criteria
2. Each criterion has verification steps and evidence requirements
3. Focus on P0 criteria first (G2.1-G2.6)
4. P1 criteria are nice-to-have but not blockers

---

**Last Updated**: 2026-05-15  
**Status**: Ready for T1.3 execution  
**Next Action**: Start services and run `/onboard` in Bob IDE