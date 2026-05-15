# Prompt Patterns for OnboardOps

This document captures the prompt engineering patterns converged on during Phase 2 implementation. These patterns are essential for Dev 4 (auto-recovery prompts) and Dev 5 (AGENTS.md generator).

**Author**: Dev 1 (Bob Architect)  
**Version**: 1.0  
**Last Updated**: 2026-05-15  
**Status**: Phase 2 Handoff

---

## Pattern 1: Emitting Structured Events

### Problem
Bob needs to send structured data to the dashboard via the MCP server's `emit_event` tool, but the data must conform to exact schemas.

### Solution
Always use explicit JSON blocks with the full schema, even if verbose. Bob is better at matching exact structures than inferring them.

**Template**:
```
Call the emit_event MCP tool with this exact payload:

{
  "event_type": "CardEmit",
  "payload": {
    "type": "graph",
    "title": "Dependency Graph",
    "data": {
      "nodes": [...],
      "edges": [...]
    },
    "summary": "One-sentence summary here"
  }
}
```

**Why it works**: Explicit JSON prevents Bob from "helpfully" reformatting or omitting fields.

**Anti-pattern**: "Emit a graph card with the dependency data" (too vague, Bob will guess the schema).

---

## Pattern 2: Enforcing Token Budgets

### Problem
Bob can consume Bobcoins rapidly on verbose responses. We have a strict 15-Bobcoin budget per session.

### Solution
Use three-layer budget enforcement:

1. **Front matter cap**: Set `max_tokens: 8000` in mode/skill YAML
2. **Inline reminders**: "Keep narration to 1-2 sentences"
3. **Rule file**: Load `.bob/rules/cartography-style.md` once per session

**Template**:
```
Your response must be ≤40 words. Prioritize structured data over prose.

If you exceed 2 sentences, the system will truncate your response.
```

**Why it works**: Bob respects explicit constraints when they're framed as system requirements, not suggestions.

**Anti-pattern**: "Please try to be concise" (Bob interprets this as optional).

---

## Pattern 3: Enforcing Socratic Stance

### Problem
Bob defaults to being helpful by writing code. We need it to refuse code-writing requests and redirect to discovery.

### Solution
Use a two-part pattern: acknowledge intent, then redirect with a specific question.

**Template**:
```
When the user asks you to write code (outside the Starter PR step):

1. Acknowledge: "I understand you want to implement X."
2. Redirect: "Before we write it, let's understand where it fits. [Specific question about existing patterns]."
3. Offer context: "I can show you similar implementations using git history."

Never say: "I can't do that" or "That's not my role."
```

**Why it works**: Acknowledging intent prevents the user from feeling blocked. The specific question gives them a clear next action.

**Anti-pattern**: "I'm not allowed to write code" (feels like a limitation, not guidance).

---

## Pattern 4: Making Rules Survive Context Compaction

### Problem
Bob's context window fills during long sessions. Inline instructions get dropped, causing behavior drift.

### Solution
Move repeating instructions to `.bob/rules/` files, which Bob loads once and treats as persistent constraints.

**What goes in rules files**:
- Tone and voice guidelines
- Forbidden phrases
- Output length constraints
- Error handling patterns

**What stays inline**:
- Task-specific instructions
- Dynamic data (file paths, user names)
- Stage-specific logic

**Template** (in skill file):
```
Load the rules from .bob/rules/cartography-style.md at the start of this skill.
Apply those rules to every response in this skill.
```

**Why it works**: Bob treats rule files as higher-priority than conversation history when compacting context.

**Anti-pattern**: Repeating "be concise" in every stage (gets dropped after 3-4 turns).

---

## Pattern 5: Handling Tool Failures Gracefully

### Problem
MCP tools can fail (network issues, rate limits, missing data). We don't want failures to block the onboarding flow.

### Solution
Use a three-tier fallback strategy:

1. **Retry once**: If tool fails, retry with same args
2. **Emit placeholder**: If retry fails, emit a card with "Data unavailable" note
3. **Continue**: Advance to next stage without blocking

**Template**:
```
If the git_blame_summary tool fails:
1. Retry once with the same arguments
2. If retry fails, emit this placeholder card:
   {
     "type": "graph",
     "data": {"note": "Data unavailable - git history inaccessible"},
     "summary": "Dependency graph unavailable due to tool failure."
   }
3. Continue to Stage 2 (do not block the flow)
```

**Why it works**: Silent degradation keeps the user moving forward. The placeholder card documents what was skipped.

**Anti-pattern**: "An error occurred. Please try again later." (blocks the flow, no recovery path).

---

## Pattern 6: Socratic Question Design

### Problem
Vague questions ("What do you think?") don't validate understanding. Leading questions ("The hub is auth.py, right?") don't test knowledge.

### Solution
Design questions that are:
1. **Checkable from output**: Answer must be in the card data
2. **Specific**: Single correct answer
3. **Non-leading**: Don't hint at the answer

**Template**:
```
After emitting the dependency graph card, ask:

"Which module has the highest fan-in (most incoming dependencies)?"

Expected answer: [module name from graph with max fan_in]

On wrong answer:
- First attempt: "Look at the fan-in column in the graph. Which module is imported by the most other modules?"
- Second attempt: "The answer is [module name]. It's imported by [N] modules: [list]. This makes it a central hub."
```

**Why it works**: The question has one correct answer derivable from the card. Remediation points back to the data.

**Anti-pattern**: "What patterns do you notice in the graph?" (too open-ended, no clear right answer).

---

## Pattern 7: Checkpoint Wrapping for Safety

### Problem
File mutations (bootstrap, PR generation) can fail or produce unwanted changes. Users need a rollback path.

### Solution
Wrap every mutation in a Bob checkpoint with a descriptive name.

**Template**:
```
Before running the bootstrap script:
1. Create a checkpoint named "pre-bootstrap"
2. Run the script
3. If script fails, restore the checkpoint automatically
4. If script succeeds, commit the checkpoint

The user can manually restore the checkpoint at any time by saying "restore pre-bootstrap".
```

**Why it works**: Bob's checkpoint mechanism is atomic and user-controllable. Naming checkpoints clearly helps users understand what they're rolling back.

**Anti-pattern**: Making changes without checkpoints (no undo path).

---

## Pattern 8: Batching Operations for Efficiency

### Problem
Parsing 20 files one-by-one generates 20 separate Bob turns, consuming Bobcoins rapidly.

### Solution
Batch file reads and parsing into a single turn.

**Template**:
```
Read all Python files in src/ in a single operation:
1. List files matching src/**/*.py
2. Read all files in one batch (Bob's file tool caches reads)
3. Parse imports from all files
4. Build the complete graph
5. Emit one card with all results

Do NOT narrate progress file-by-file. Emit only the final card and one-sentence summary.
```

**Why it works**: Bob can process multiple files in one turn. Batching reduces turn count and Bobcoin spend.

**Anti-pattern**: "Now reading src/auth.py... Now reading src/models.py..." (wastes tokens on narration).

---

## Pattern 9: Remediation Without Shame

### Problem
Wrong answers can make users feel inadequate, especially new hires. We want to correct without discouraging.

### Solution
Use a neutral, data-focused remediation style.

**Template**:
```
On wrong answer:
"Let's look at the data together. [Point to specific card field]. [One-sentence explanation]. [Re-ask question]."

Never say:
- "That's incorrect."
- "You should have noticed..."
- "The obvious answer is..."

Always say:
- "Let's check the graph."
- "The data shows..."
- "Looking at the fan-in column..."
```

**Why it works**: Framing remediation as collaborative data review removes judgment. The user learns without feeling tested.

**Anti-pattern**: "Wrong. The answer is X." (feels like a quiz, not mentorship).

---

## Pattern 10: Context-Aware Personalization

### Problem
Generic responses feel robotic. We want Bob to reference the actual repository by name and use real file paths.

### Solution
Always infer and use concrete details from the workspace.

**Template**:
```
In your greeting, mention the repository by name:
"Welcome to [infer repo name from workspace directory]!"

In questions, use real file paths:
"If you needed to add authentication, would you modify src/auth.py or src/api/routes.py?"

Never use placeholders like [repo-name] or [file-path] in responses to the user.
```

**Why it works**: Concrete details make Bob feel like it understands *this* codebase, not a generic one.

**Anti-pattern**: "Welcome to your repository!" (generic, impersonal).

---

## Usage Guidelines for Dev 4 and Dev 5

### For Dev 4 (Auto-Recovery Prompts)
- Use **Pattern 5** (tool failure handling) for bootstrap error recovery
- Use **Pattern 7** (checkpoint wrapping) for all bootstrap mutations
- Use **Pattern 2** (token budgets) to keep recovery prompts under 100 tokens

### For Dev 5 (AGENTS.md Generator)
- Use **Pattern 10** (context-aware personalization) to make AGENTS.md repo-specific
- Use **Pattern 2** (token budgets) to cap AGENTS.md at 4,000 tokens
- Use **Pattern 8** (batching) to generate all sections in one turn

---

## Acknowledgments

These patterns were developed by Dev 1 during Phase 2 T1.1-T1.7 and validated against the demo repository. They represent the team's converged understanding of how to prompt Bob effectively within the Bobcoin budget.

**Next Steps**:
- Dev 4: Integrate patterns into `scripts/bootstrap.sh` error-handling prompts
- Dev 5: Integrate patterns into AGENTS.md generation skill
- All devs: Reference this document when writing new skills or modes