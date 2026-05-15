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

**Goal**: Map top-level modules and their import relationships.

**Process**:
- Parse source files to extract imports
- Build directed graph of module dependencies
- Identify core vs. peripheral modules
- Detect circular dependencies (if any)

**Output**:
- JSON graph object for dashboard visualization
- One-paragraph human-readable summary in chat
- Socratic question: "Which module appears to be the central hub, and why?"

**TODO (Phase 2)**: Implement parsing logic, graph construction, visualization format.

## Stage 2: Entry Points

**Goal**: Identify all ways code execution can begin.

**Process**:
- Scan for CLI entry points (`if __name__ == "__main__"`, `@click.command()`, etc.)
- Enumerate HTTP route handlers (`@app.get()`, `@app.post()`, etc.)
- Find scheduled jobs (cron decorators, celery tasks)
- Detect message consumers (queue listeners, webhooks)

**Output**:
- List of entry points with file paths and line numbers
- Categorized by type (CLI, HTTP, scheduled, message)
- Socratic question: "If a user reports a bug in the /users endpoint, which file would you check first?"

**TODO (Phase 2)**: Implement entry point detection for FastAPI, Flask, Django patterns.

## Stage 3: Change Hotspots

**Goal**: Surface files that change frequently and understand why.

**Process**:
- Call MCP tool `commit_frequency` for top 10 files (last 180 days)
- For each hotspot, call `recent_authors` and `rationale_for_commit`
- Generate one-sentence rationale per file (why it changes often)

**Output**:
- Hotspots card with: file path, commit count, distinct authors, rationale
- Socratic question: "Why do you think [hotspot file] changes so frequently?"

**TODO (Phase 2)**: Integrate with MCP server, implement rationale generation.

## Stage 4: Project Conventions

**Goal**: Infer coding standards and patterns from the codebase.

**Process**:
- Analyze naming conventions (camelCase vs. snake_case, prefixes, suffixes)
- Identify error-handling patterns (exceptions, result types, error codes)
- Examine test layout (co-located vs. separate, naming patterns)
- Detect documentation style (docstrings, inline comments, README structure)

**Output**:
- Conventions card with at least 3 discovered patterns
- Socratic question: "Based on the test files you've seen, where would you add a test for the auth module?"

**TODO (Phase 2)**: Implement pattern detection, heuristic rules for common conventions.

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