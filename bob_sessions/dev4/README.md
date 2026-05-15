# Bob Shell Session Exports - Dev 4

**Purpose:** Store Bob Shell session transcripts for demo content and analysis  
**Phase:** 2, Task T4.9

## Directory Structure

```
bob_sessions/dev4/
├── README.md                          # This file
├── session-001-error-pipe-loop.md     # Auto-recovery demonstration
├── session-002-checkpoint-restore.md  # Checkpoint rollback demo
├── session-003-bootstrap-success.md   # Successful bootstrap run
└── [additional sessions as needed]
```

## Session Export Guidelines

### What to Export

1. **Error-Pipe Loop Sessions** (Priority: HIGH)
   - Sessions where Bob Shell diagnosed and recovered from errors
   - These are the showpiece demos for F3 (Bob-assisted recovery)
   - Include the full error → diagnosis → recovery → retry cycle

2. **Checkpoint Restore Sessions** (Priority: MEDIUM)
   - Sessions demonstrating checkpoint creation and restoration
   - Show before/after workspace state

3. **Successful Bootstrap Sessions** (Priority: LOW)
   - Clean runs for baseline comparison
   - Useful for timing analysis

### How to Export

#### Method 1: Bob Shell CLI (if available)
```bash
bob session export <session-id> --output bob_sessions/dev4/session-XXX.md
```

#### Method 2: Manual Copy
1. Run the bootstrap with Bob Shell integration
2. Copy the terminal output
3. Format as markdown with proper sections
4. Save to this directory

#### Method 3: Programmatic Export
```bash
# Using the auto_bootstrap.py script
./scripts/auto_bootstrap.py --auto-recover 2>&1 | tee bob_sessions/dev4/session-XXX-raw.log

# Then format the log into markdown
```

## Session Template

Each session export should follow this structure:

```markdown
# Bob Shell Session: [Title]

**Date:** YYYY-MM-DD  
**Duration:** X minutes  
**Bobcoins Used:** X.X  
**Outcome:** Success / Failure / Partial

## Context

Brief description of what was being attempted.

## Session Transcript

\`\`\`
[Full terminal output or Bob Shell conversation]
\`\`\`

## Key Moments

1. **Error Detection** (timestamp)
   - What went wrong
   
2. **Bob's Diagnosis** (timestamp)
   - Bob's analysis
   
3. **Recovery Action** (timestamp)
   - What was done to fix it
   
4. **Outcome** (timestamp)
   - Final result

## Bobcoin Breakdown

- Diagnosis: X.X Bobcoins
- Recovery suggestions: X.X Bobcoins
- Total: X.X Bobcoins

## Lessons Learned

- Key insight 1
- Key insight 2
```

## Current Sessions

### Session 001: Error-Pipe Loop Demo
**Status:** [TO BE EXPORTED]  
**Scenario:** Port-in-use error with auto-recovery  
**Priority:** HIGH (demo content)

### Session 002: Checkpoint Restore
**Status:** [TO BE EXPORTED]  
**Scenario:** Failed bootstrap with rollback  
**Priority:** MEDIUM (demo content)

### Session 003: Successful Bootstrap
**Status:** [TO BE EXPORTED]  
**Scenario:** Clean run on demo repository  
**Priority:** LOW (baseline)

## Bobcoin Tracking

Track all Bobcoin usage in [`notes/bobcoin-tracking-dev4.md`](../../notes/bobcoin-tracking-dev4.md)

## Demo Preparation

For the H+10 demo, prioritize:
1. Session 001 (error-pipe loop) - This is the F3 showpiece
2. Session 002 (checkpoint restore) - Shows robustness
3. Any other interesting recovery scenarios

## Notes

- Keep sessions under 5 minutes for demo purposes
- Highlight the AI-assisted recovery moments
- Show both successful and failed recovery attempts
- Include Bobcoin costs to demonstrate economy awareness

---

**Last Updated:** 2026-05-15  
**Maintained By:** Dev 4