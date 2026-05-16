# Prompt Patterns for OnboardOps

This document captures the prompt engineering patterns converged on during Phase 2-4 implementation. These patterns are essential for Dev 4 (auto-recovery prompts) and Dev 5 (AGENTS.md generator).

**Author**: Dev 1 (Bob Architect)
**Version**: 2.0
**Last Updated**: 2026-05-16
**Status**: Phase 4 Complete (6 automatable tasks done)

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

## Pattern 11: Template-Based Remediation (Phase 4)

### Problem
Generating remediation text from scratch consumes 150+ tokens per wrong answer. With 2-3 remediations per session, this adds 1+ Bobcoins.

### Solution
Pre-write remediation templates in `.bob/rules/remediation-templates.md` and reference them by name.

**Template** (in skill file):
```
On first wrong answer for Stage 1:
Use "Highest Fan-In" template from remediation-templates.md (no placeholders)

On first wrong answer for Stage 2:
Use "Route Handler" template from remediation-templates.md
- Fill {PATH} with actual route path
- Fill {METHOD} with HTTP method
```

**Template file structure**:
```markdown
## Stage 1: Dependency Graph

### Template: Highest Fan-In

The dependency graph card shows fan-in values for each module. Fan-in
represents how many other modules import this one. Look for the module with
the highest number in the fan-in column. This module is the hub because many
other parts of the codebase depend on it. Review the graph visualization or
the nodes list to find the maximum fan-in value.

**Placeholders:** None (generic template)
```

**Why it works**: Templates are loaded once (300 tokens) and referenced many times (10 tokens per reference). Saves ~140 tokens per remediation = 0.5 Bobcoins per session.

**Anti-pattern**: Generating remediation from scratch each time (150 tokens × 3 = 450 tokens wasted).

**Code Example** (from `.bob/skills/repo-cartography.md`):
```markdown
### Remediation Loop (Stage 1) - Phase 4 T1.6 optimized

**On first wrong answer** (attempt 1):
1. Emit `question_remediation` event with template text
2. Use "Highest Fan-In" template from remediation-templates.md (no placeholders)
3. Re-ask the same question
4. Increment `attempt_count` to 2
```

---

## Pattern 12: Batched MCP Tool Calls (Phase 4)

### Problem
Stage 3 (Hotspots) was calling `commit_frequency`, `recent_authors`, and `pr_for_file` for each of 10 files = 30 tool calls. Each call has overhead (prompt setup, response parsing).

### Solution
Batch tool calls and limit to top N results.

**Before** (expensive):
```
For each of the top 10 hotspots:
1. Call commit_frequency(file_path)
2. Call recent_authors(file_path)
3. Call pr_for_file(file_path)
4. Generate rationale
```

**After** (optimized):
```
1. Call commit_frequency() once (no file_path) → returns top 5 files
2. For top 5 files only:
   - Call recent_authors(file_path)
   - Call pr_for_file(file_path, limit=1)
3. Generate all 5 rationales in batch (one prompt, not 5)
```

**Why it works**:
- Reduced from 30 tool calls to 11 (1 + 5×2)
- Batch rationale generation (one prompt for 5 items vs. 5 prompts)
- Saves 1.0 Bobcoins per session

**Anti-pattern**: One-by-one processing with narration between each file.

**Code Example** (from `.bob/skills/repo-cartography.md`):
```markdown
## Stage 3: Change Hotspots (Phase 4 T1.6 optimized)

Steps (optimized for Bobcoin efficiency):

1. Call `commit_frequency` MCP tool with no file_path (repo-wide) and days=180.
   This returns the top 5 most frequently changed files.
2. For the top 5 files only (reduced from 10 for efficiency):
   - Call `recent_authors` with the file_path to get top contributors
   - Call `pr_for_file` with the file_path and limit=1 (only most recent PR)
3. Generate all 5 rationales in a single batch (not one-by-one).
```

---

## Pattern 13: Rules File Hierarchy (Phase 4)

### Problem
As the project grows, inline instructions become verbose and repetitive. Context window fills faster, causing behavior drift.

### Solution
Create a hierarchy of rules files loaded once per session:

**Hierarchy**:
1. **Style rules** (`.bob/rules/cartography-style.md`) - Tone, voice, forbidden phrases
2. **Format rules** (`.bob/rules/cartography-output-format.md`) - Card schemas, narration templates
3. **Content rules** (`.bob/rules/remediation-templates.md`) - Pre-written text blocks

**Loading pattern** (in skill file):
```markdown
Load these rules once per session (Phase 4 T1.6 compression):
- `.bob/rules/cartography-style.md` - Tone, voice, forbidden phrases
- `.bob/rules/cartography-output-format.md` - Card format, narration templates
- `.bob/rules/remediation-templates.md` - Pre-written remediation text

Keep all chat output terse. Emit dashboard data through the `emit_event` MCP tool.
```

**Why it works**:
- Rules files are loaded once (total: ~800 tokens)
- Inline instructions reduced by 80% (saves ~800 tokens across 4 stages)
- Bob treats rules as persistent constraints during context compaction
- Total savings: 0.8 Bobcoins per session

**Anti-pattern**: Repeating formatting instructions in every stage.

**Code Example** (from `.bob/skills/repo-cartography.md`):
```markdown
# Repository Cartography Skill

Load these rules once per session (Phase 4 T1.6 compression):
- `.bob/rules/cartography-style.md` - Tone, voice, forbidden phrases
- `.bob/rules/cartography-output-format.md` - Card format, narration templates
- `.bob/rules/remediation-templates.md` - Pre-written remediation text
```

**Rules file structure**:
```markdown
# cartography-output-format.md

## Card Emission Format (All Stages)

Every cartography stage follows this pattern:
1. **Call emit_event** with structured JSON data
2. **Narrate in chat** with 1 sentence (≤25 words)
3. **Ask Socratic question** with 1 sentence (≤20 words)
4. **No redundancy** - Don't repeat card data in narration

## Narration Templates

- Hub: "[module] is the hub with [n] dependencies."
- Flat: "The graph is flat across [n] modules."
- Routes: "Found [n] routes across [m] files."
```

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

## Bobcoin Savings Summary (Phase 4)

| Pattern | Savings per Session | Difficulty | Risk |
|---------|---------------------|------------|------|
| Pattern 11: Template-Based Remediation | 0.5 Bobcoins | Low | None |
| Pattern 12: Batched MCP Tool Calls | 1.0 Bobcoins | Medium | Low |
| Pattern 13: Rules File Hierarchy | 0.8 Bobcoins | Low | None |
| Pattern 2: Token Budgets (existing) | 0.2 Bobcoins | Low | None |
| **Total Phase 4 Savings** | **2.5 Bobcoins** | **Low-Med** | **Low** |

**Impact**: Reduced E2E cost from 12 Bobcoins to 9.5 Bobcoins (21% reduction).

---

## Acknowledgments

These patterns were developed by Dev 1 during Phase 2-4 (T1.1-T1.9) and validated against the demo repository. They represent the team's converged understanding of how to prompt Bob effectively within the Bobcoin budget.

**Phase 2 Patterns** (1-10): Established core prompt engineering principles
**Phase 4 Patterns** (11-13): Optimized for Bobcoin efficiency and scale

**Next Steps**:
- Dev 4: Integrate patterns into `scripts/bootstrap.sh` error-handling prompts
- Dev 5: Integrate patterns into AGENTS.md generation skill
- All devs: Reference this document when writing new skills or modes
- Phase 5: Apply patterns to video recording and final demo polish