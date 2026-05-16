# T1.3 Integration Test - Bobcoin Tracking

**Test Date**: _____________  
**Tester**: Dev 1  
**Demo Repository**: _____________  
**Bob IDE Version**: _____________

---

## Bobcoin Consumption by Stage

Record actual Bobcoin consumption for each stage of the `/onboard` flow.

### Greeting (Target: 0.2 Bobcoins)

| Metric | Value |
|--------|-------|
| Actual Bobcoins | _____ |
| Response Time | _____ seconds |
| Token Count | _____ |
| Notes | |

**Expected Output**: Four-part greeting (greeting + stopwatch + name request + first prompt)

---

### Stage 1: File Discovery (Target: 0.5 Bobcoins)

| Metric | Value |
|--------|-------|
| Actual Bobcoins | _____ |
| Files Discovered | _____ |
| Response Time | _____ seconds |
| Token Count | _____ |
| Notes | |

**Expected Output**: List of Python files (no narration, batched operation)

---

### Stage 1: Import Parsing (Target: 0.5 Bobcoins)

| Metric | Value |
|--------|-------|
| Actual Bobcoins | _____ |
| Files Parsed | _____ |
| Imports Extracted | _____ |
| Response Time | _____ seconds |
| Token Count | _____ |
| Notes | |

**Expected Output**: Import statements extracted (no narration, batched operation)

---

### Stage 1: Graph Construction (Target: 0.3 Bobcoins)

| Metric | Value |
|--------|-------|
| Actual Bobcoins | _____ |
| Nodes Created | _____ |
| Edges Created | _____ |
| Circular Dependencies | _____ |
| Response Time | _____ seconds |
| Token Count | _____ |
| Notes | |

**Expected Output**: Dependency graph with ≥5 nodes, ≥5 edges

---

### Stage 1: Card Emission (Target: 0.2 Bobcoins)

| Metric | Value |
|--------|-------|
| Actual Bobcoins | _____ |
| emit_event Success | ☐ Yes ☐ No |
| Dashboard Updated | ☐ Yes ☐ No |
| Response Time | _____ seconds |
| Token Count | _____ |
| Notes | |

**Expected Output**: CardEmit event sent, dashboard shows graph card

---

### Stage 1: Narration (Target: 0.1 Bobcoins)

| Metric | Value |
|--------|-------|
| Actual Bobcoins | _____ |
| Narration Length | _____ words |
| Response Time | _____ seconds |
| Token Count | _____ |
| Notes | |

**Expected Output**: 1-sentence summary (≤40 words)

---

### Stage 1: Question Emission (Target: 0.3 Bobcoins)

| Metric | Value |
|--------|-------|
| Actual Bobcoins | _____ |
| QuestionAsk Event | ☐ Yes ☐ No |
| Dashboard Updated | ☐ Yes ☐ No |
| Response Time | _____ seconds |
| Token Count | _____ |
| Notes | |

**Expected Output**: "Which module has the highest fan-in?"

---

### Stage 1: Answer Evaluation (Target: 0.2 Bobcoins)

**Test Case**: Correct Answer

| Metric | Value |
|--------|-------|
| Actual Bobcoins | _____ |
| Answer Provided | _____ |
| Evaluation Result | ☐ Correct ☐ Incorrect |
| Response Time | _____ seconds |
| Token Count | _____ |
| Notes | |

**Expected Output**: Acknowledgment + advance to Stage 2

---

### Stages 2-4: Stubs (Target: 0.3 Bobcoins total)

| Stage | Bobcoins | Card Emitted | Narration | Notes |
|-------|----------|--------------|-----------|-------|
| Stage 2 (Entry Points) | _____ | ☐ Yes ☐ No | _____ | |
| Stage 3 (Hotspots) | _____ | ☐ Yes ☐ No | _____ | |
| Stage 4 (Conventions) | _____ | ☐ Yes ☐ No | _____ | |

**Expected Output**: Placeholder cards + "Coming in Phase 3" narration

---

## Total Bobcoin Consumption

| Category | Target | Actual | Delta | % of Target |
|----------|--------|--------|-------|-------------|
| Greeting | 0.2 | _____ | _____ | _____ % |
| Stage 1: Discovery | 0.5 | _____ | _____ | _____ % |
| Stage 1: Parsing | 0.5 | _____ | _____ | _____ % |
| Stage 1: Graph | 0.3 | _____ | _____ | _____ % |
| Stage 1: Emission | 0.2 | _____ | _____ | _____ % |
| Stage 1: Narration | 0.1 | _____ | _____ | _____ % |
| Stage 1: Question | 0.3 | _____ | _____ | _____ % |
| Stage 1: Answer | 0.2 | _____ | _____ | _____ % |
| Stages 2-4 Stubs | 0.3 | _____ | _____ | _____ % |
| **TOTAL** | **2.6** | **_____** | **_____** | **_____ %** |

---

## Optimization Opportunities (for T1.4)

Based on actual consumption, identify areas for optimization:

### High-Cost Operations (>0.5 Bobcoins)

1. Operation: _____________
   - Actual Cost: _____ Bobcoins
   - Optimization Strategy: _____________

2. Operation: _____________
   - Actual Cost: _____ Bobcoins
   - Optimization Strategy: _____________

### Token-Heavy Responses (>500 tokens)

1. Response: _____________
   - Token Count: _____
   - Optimization Strategy: _____________

2. Response: _____________
   - Token Count: _____
   - Optimization Strategy: _____________

### Redundant Operations

1. Operation: _____________
   - Frequency: _____ times
   - Optimization Strategy: _____________

---

## T1.4 Optimization Targets

Based on this data, prioritize these optimizations for T1.4:

1. **Priority 1** (Must fix if >3 Bobcoins total):
   - _____________

2. **Priority 2** (Should fix if >2.5 Bobcoins total):
   - _____________

3. **Priority 3** (Nice to have if <2 Bobcoins total):
   - _____________

---

## Notes and Observations

### What Worked Well

- _____________
- _____________
- _____________

### What Needs Improvement

- _____________
- _____________
- _____________

### Unexpected Behaviors

- _____________
- _____________
- _____________

---

## Screenshots

Attach screenshots:
- [ ] Bob chat panel showing full `/onboard` flow
- [ ] Dashboard showing all 4 cards
- [ ] Bobcoin consumption summary from Bob IDE
- [ ] Backend logs (if errors occurred)
- [ ] Frontend console (if errors occurred)

---

## Sign-Off

**Test Completed**: ☐ Yes ☐ No  
**All P0 Criteria Met**: ☐ Yes ☐ No  
**Ready for T1.4**: ☐ Yes ☐ No  

**Tester Signature**: _____________  
**Date**: _____________