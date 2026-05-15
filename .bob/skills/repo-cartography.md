---
name: "Repository Cartography"
description: "Structured four-stage walk through repository architecture, entry points, hotspots, and conventions"
auto_activate: false
---

# Repository Cartography Skill

This skill guides Bob through a deterministic, four-stage exploration of the target repository. It is the foundation of the OnboardOps onboarding experience and the most token-intensive feature.

## Overview

The cartography walk produces four cards emitted to the dashboard:
1. **Dependency Graph** - Module relationships and import structure
2. **Entry Points** - CLI, HTTP routes, scheduled jobs, message consumers
3. **Change Hotspots** - High-churn files with commit frequency and rationale
4. **Project Conventions** - Naming, error handling, test layout patterns

After each card, emit one Socratic question to validate the onboardee's understanding.

## Stage 1: Dependency Graph

**Goal**: Map top-level modules and their import relationships to reveal the codebase's architectural skeleton.

### Execution Instructions

When this stage activates, follow these steps in order:

#### Step 1: Discover Top-Level Python Modules
1. List all `.py` files in the repository root and immediate subdirectories (depth ≤2)
2. Exclude: `tests/`, `test_*.py`, `*_test.py`, `__pycache__/`, `.venv/`, `venv/`, `build/`, `dist/`
3. Focus on: `src/`, `app/`, `lib/`, or root-level modules
4. Target: 5-15 files (if more, sample the most recently modified)

#### Step 2: Parse Import Statements
For each discovered file:
1. Read the file content
2. Extract all import statements:
   - `import module_name`
   - `from module_name import ...`
   - `from .relative import ...`
3. Normalize to module names (strip `from`, `import`, aliases)
4. Resolve relative imports to absolute module paths
5. Filter to **internal modules only** (exclude stdlib and third-party packages)

**Example**:
```python
# File: src/api/routes.py
from src.core.auth import verify_token  # → edge: routes → auth
from src.db.models import User          # → edge: routes → models
import logging                          # → exclude (stdlib)
```

#### Step 3: Build Dependency Graph
1. Create nodes: one per discovered module (use file path as node ID)
2. Create edges: for each import, add directed edge from importer → imported
3. Calculate metrics:
   - **Fan-in**: Number of modules that import this module (incoming edges)
   - **Fan-out**: Number of modules this module imports (outgoing edges)
   - **Centrality**: Modules with high fan-in are architectural hubs
4. Detect circular dependencies: any cycle in the graph

**Graph Schema**:
```json
{
  "nodes": [
    {
      "id": "string - file path relative to repo root",
      "label": "string - module name (e.g., 'auth', 'models')",
      "fan_in": "integer",
      "fan_out": "integer",
      "is_hub": "boolean - true if fan_in >= 3"
    }
  ],
  "edges": [
    {
      "source": "string - importer node ID",
      "target": "string - imported node ID"
    }
  ],
  "circular_dependencies": [
    {
      "cycle": ["array of node IDs forming a cycle"]
    }
  ]
}
```

#### Step 4: Emit Card to Dashboard
Call the `emit_event` MCP tool with:
```json
{
  "event_type": "CardEmit",
  "payload": {
    "type": "graph",
    "title": "Dependency Graph",
    "data": {
      "nodes": [...],
      "edges": [...],
      "circular_dependencies": [...]
    },
    "summary": "One-sentence summary of the graph structure"
  }
}
```

**Summary template**: "This codebase has [N] core modules with [M] dependencies. [Hub module] is the central hub with [X] incoming connections."

#### Step 5: Narrate in Chat
Provide a **one-sentence** narration in the chat panel:
- If hub exists: "The dependency graph reveals [hub_name] as the architectural hub, imported by [N] other modules."
- If no clear hub: "The dependency graph shows a flat structure with [N] loosely coupled modules."
- If circular deps: "⚠️ Detected [N] circular dependencies—this may indicate tight coupling."

### Acceptance Criteria
- Graph has ≥5 nodes (if repo has ≥5 Python files)
- Graph has ≥5 edges (if imports exist)
- Payload matches schema in `docs/bob-contracts.md`
- Dashboard receives `CardEmit` event within 30 seconds
- Narration is exactly 1 sentence

### Error Handling
- If no Python files found: Emit card with empty graph and note "No Python modules detected"
- If import parsing fails: Log error, continue with partial graph
- If `emit_event` tool fails: Log error, narrate in chat only

### Token Budget
- Target: ≤2 Bobcoins for this stage
- If parsing takes >50 files, sample top 20 by recent modification
- Cache file reads (Bob's file tool caches within session)

### Socratic Question Loop

After emitting the dependency graph card and narration, immediately ask **one** Socratic question to validate the onboardee's understanding.

#### Step 6: Emit Question Event

Call the `emit_event` MCP tool with:
```json
{
  "event_type": "QuestionAsk",
  "payload": {
    "question": "Which module has the highest fan-in (is imported by the most other modules)?",
    "stage": "dependency-graph",
    "expected_answer_hint": "Look at the fan_in values in the graph nodes"
  }
}
```

Then ask the question in chat: **"Which module has the highest fan-in (is imported by the most other modules)?"**

#### Step 7: Evaluate Answer

When the onboardee responds, evaluate their answer:

**Correct Answer**:
- The module name matches the node with `max(fan_in)` from the graph
- Acknowledge: "Correct! [Module name] is the architectural hub with [N] incoming dependencies."
- Advance to Stage 2

**Incorrect Answer (First Attempt)**:
- Provide ≤80-word remediation pointing to the graph data
- Template: "Let's look at the dependency graph together. The fan-in column shows how many modules import each module. [Module name] has [N] incoming connections, making it the most imported module. Which module has the highest fan-in value?"
- Re-ask the same question
- Wait for second answer

**Incorrect Answer (Second Attempt)**:
- Reveal the answer with explanation
- Template: "The answer is [module name]. It has [N] incoming dependencies: [list up to 3 importers]. This makes it a central hub—changes here affect many other modules. Let's move to entry points."
- Advance to Stage 2 (do not block progress)

#### Answer Validation Logic

```
1. Extract module name from onboardee's answer (case-insensitive, strip paths)
2. Find the node with max fan_in in the graph data
3. Compare extracted name to max fan_in node's label or id
4. If match: correct
5. If no match: incorrect
```

**Edge Cases**:
- If graph has no clear hub (all fan_in ≤ 1): Ask "This codebase has a flat structure. Which module would you check first to understand the overall architecture?" (Accept any reasonable answer)
- If onboardee says "I don't know": Treat as incorrect, provide remediation
- If onboardee asks for clarification: Rephrase question without revealing answer

#### Event Emission

Emit a `QuestionAsk` event **before** asking in chat, so the dashboard can render the question card simultaneously.

#### Token Budget for Question Loop

- Question emission: ~50 tokens
- Correct answer acknowledgment: ~30 tokens
- First remediation: ≤80 words (~100 tokens)
- Second remediation (reveal): ~50 tokens
- **Total budget**: ~230 tokens (~0.5 Bobcoins)

## Stage 2: Entry Points

**Goal**: Identify all ways code execution can begin in this codebase.

### Phase 2 Stub Implementation

This stage is **stubbed** for Phase 2 vertical slice. Real implementation comes in Phase 3.

**Execution**: Emit placeholder card and advance immediately to Stage 3.

```json
{
  "event_type": "CardEmit",
  "payload": {
    "type": "entry",
    "title": "Entry Points",
    "data": {
      "note": "Coming in Phase 3",
      "preview": "Will identify CLI entry points, HTTP routes, scheduled jobs, and message consumers"
    },
    "summary": "Entry point detection will be implemented in Phase 3."
  }
}
```

**Narration**: "Entry point mapping coming in Phase 3. Moving to hotspots analysis..."

### Full Implementation (Phase 3)

**Process**:
- Scan for CLI entry points (`if __name__ == "__main__"`, `@click.command()`, etc.)
- Enumerate HTTP route handlers (`@app.get()`, `@app.post()`, etc.)
- Find scheduled jobs (cron decorators, celery tasks)
- Detect message consumers (queue listeners, webhooks)

**Output**:
- List of entry points with file paths and line numbers
- Categorized by type (CLI, HTTP, scheduled, message)
- Socratic question: "If a user reports a bug in the /users endpoint, which file would you check first?"

## Stage 3: Change Hotspots

**Goal**: Surface files that change frequently and understand why they're hotspots.

### Phase 2 Stub Implementation

This stage is **stubbed** for Phase 2 vertical slice. Real implementation comes in Phase 3.

**Execution**: Emit placeholder card and advance immediately to Stage 4.

```json
{
  "event_type": "CardEmit",
  "payload": {
    "type": "hotspot",
    "title": "Change Hotspots",
    "data": {
      "note": "Coming in Phase 3",
      "preview": "Will identify high-churn files using git history and explain why they change frequently"
    },
    "summary": "Hotspot analysis will be implemented in Phase 3."
  }
}
```

**Narration**: "Hotspot analysis coming in Phase 3. Moving to conventions detection..."

### Full Implementation (Phase 3)

**Process**:
- Call MCP tool `commit_frequency` for top 10 files (last 180 days)
- For each hotspot, call `recent_authors` and `rationale_for_commit`
- Generate one-sentence rationale per file (why it changes often)

**Output**:
- Hotspots card with: file path, commit count, distinct authors, rationale
- Socratic question: "Why do you think [hotspot file] changes so frequently?"

## Stage 4: Project Conventions

**Goal**: Infer coding standards and patterns that new contributors should follow.

### Phase 2 Stub Implementation

This stage is **stubbed** for Phase 2 vertical slice. Real implementation comes in Phase 3.

**Execution**: Emit placeholder card and mark cartography complete.

```json
{
  "event_type": "CardEmit",
  "payload": {
    "type": "convention",
    "title": "Project Conventions",
    "data": {
      "note": "Coming in Phase 3",
      "preview": "Will infer naming conventions, error handling patterns, test layout, and documentation style"
    },
    "summary": "Convention detection will be implemented in Phase 3."
  }
}
```

**Narration**: "Convention detection coming in Phase 3. Cartography complete—ready for environment bootstrap."

**Action**: Return control to the onboard mode for next stage (bootstrap or certification).

### Full Implementation (Phase 3)

**Process**:
- Analyze naming conventions (camelCase vs. snake_case, prefixes, suffixes)
- Identify error-handling patterns (exceptions, result types, error codes)
- Examine test layout (co-located vs. separate, naming patterns)
- Detect documentation style (docstrings, inline comments, README structure)

**Output**:
- Conventions card with at least 3 discovered patterns
- Socratic question: "Based on the test files you've seen, where would you add a test for the auth module?"

## Socratic Branching

After each card, the skill emits exactly one question. On the onboardee's answer:
- **Correct**: Acknowledge and advance to next stage
- **Incorrect (first time)**: Provide remedial paragraph (≤80 words) and re-ask
- **Incorrect (second time)**: Reveal answer and continue

**TODO (Phase 2)**: Implement answer validation logic, remedial content generation.

## Token Discipline

- **Budget cap**: 25 Bobcoins per cartography session
- If exceeded, emit "cartography curtailed" card with rationale
- Prioritize stages: Dependency Graph > Entry Points > Hotspots > Conventions
- Use MCP tool caching to reduce redundant calls

**TODO (Phase 2)**: Implement token tracking, early termination logic.

## Phase 1 Note

This is a **stub file** for Phase 1. The actual parsing, MCP integration, and Socratic logic will be implemented in Phase 2. For now, this establishes the skill's structure and ensures Bob can reference it.