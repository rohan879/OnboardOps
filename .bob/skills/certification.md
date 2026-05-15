---
name: "Certification"
description: "Three-question assessment to validate repository understanding before first PR"
auto_activate: false
---

# Certification Skill

This skill gates the end of the onboarding session. Bob selects three questions from a pool of twelve, calibrated against the cartography output, and grades the onboardee's free-text answers using machine-readable rubrics.

## Grading System

- **Pass**: Answer demonstrates understanding with evidence from cartography
- **Partial**: Answer is directionally correct but lacks depth
- **Fail**: Answer is incorrect or shows fundamental misunderstanding

**Pass threshold**: At least 2 of 3 answers graded "pass", none graded "fail"

## Question Pool (12 Templates)

### Q1: Dependency Graph - Central Module
```yaml
id: dep-graph-central
topic: Dependency Graph
question: "Based on the dependency graph, which module appears to be the central hub of the application, and what evidence supports this?"
rubric:
  pass:
    - Names the correct central module (most imports/exports)
    - Cites specific import counts or relationships from cartography
    - Explains why centrality matters (e.g., "changes here affect many modules")
  partial:
    - Names a plausible module but not the most central
    - Provides reasoning but lacks specific evidence
  fail:
    - Names an incorrect or peripheral module
    - No reasoning or evidence provided
```

### Q2: Dependency Graph - Circular Dependencies
```yaml
id: dep-graph-circular
topic: Dependency Graph
question: "Did the cartography reveal any circular dependencies? If so, which modules are involved, and why might this be a concern?"
rubric:
  pass:
    - Correctly identifies presence/absence of circular dependencies
    - Names specific modules if present
    - Explains risk (e.g., "makes testing harder, can cause import errors")
  partial:
    - Correct on presence/absence but vague on details
    - Partial explanation of risk
  fail:
    - Incorrect on presence/absence
    - No explanation of why it matters
```

### Q3: Entry Points - HTTP Route
```yaml
id: entry-http-route
topic: Entry Points
question: "If a user reports a bug in the [SPECIFIC_ENDPOINT] endpoint, which file and function would you investigate first?"
rubric:
  pass:
    - Names correct file path from cartography entry points
    - Identifies correct function/handler name
    - Explains reasoning (e.g., "this is where the route is defined")
  partial:
    - Correct file but wrong function, or vice versa
    - Vague reasoning
  fail:
    - Incorrect file and function
    - No reasoning
```

### Q4: Entry Points - CLI vs. HTTP
```yaml
id: entry-cli-vs-http
topic: Entry Points
question: "This repository has both CLI and HTTP entry points. When would you use each, and how do they differ in terms of user interaction?"
rubric:
  pass:
    - Distinguishes CLI (scripts, automation) from HTTP (web requests)
    - Provides use case examples from the repo
    - Explains interaction model (synchronous CLI vs. request/response HTTP)
  partial:
    - Correct distinction but generic examples
    - Incomplete explanation of interaction model
  fail:
    - Confuses CLI and HTTP
    - No examples or explanation
```

### Q5: Change Hotspots - High Churn File
```yaml
id: hotspot-high-churn
topic: Change Hotspots
question: "The file [HOTSPOT_FILE] has [N] commits in the last 180 days. Based on the cartography, why do you think it changes so frequently?"
rubric:
  pass:
    - Cites rationale from cartography (e.g., "config file updated per feature")
    - Connects to file's role in architecture
    - Mentions distinct authors if relevant
  partial:
    - Plausible guess but not grounded in cartography data
    - Partial connection to architecture
  fail:
    - Incorrect or nonsensical rationale
    - No connection to cartography
```

### Q6: Change Hotspots - Ownership
```yaml
id: hotspot-ownership
topic: Change Hotspots
question: "If you needed to make a change to [HOTSPOT_FILE], which team member would you ask for a code review, and why?"
rubric:
  pass:
    - Names author with most commits (from cartography)
    - Explains reasoning (e.g., "they've touched it 15 times, know it best")
    - Acknowledges alternative (e.g., "or [second author] as backup")
  partial:
    - Names a plausible author but not the top contributor
    - Weak reasoning
  fail:
    - Names someone not in the author list
    - No reasoning
```

### Q7: Project Conventions - Naming
```yaml
id: convention-naming
topic: Project Conventions
question: "Based on the codebase, what naming convention is used for [ENTITY_TYPE] (e.g., functions, classes, files)? Provide an example."
rubric:
  pass:
    - Correctly identifies convention (e.g., snake_case for functions)
    - Provides specific example from cartography
    - Explains consistency (e.g., "all 15 functions follow this pattern")
  partial:
    - Correct convention but generic example
    - No mention of consistency
  fail:
    - Incorrect convention
    - No example
```

### Q8: Project Conventions - Error Handling
```yaml
id: convention-error-handling
topic: Project Conventions
question: "How does this codebase handle errors? Do functions raise exceptions, return error codes, or use a Result type?"
rubric:
  pass:
    - Correctly identifies error-handling pattern from cartography
    - Provides example (e.g., "raises HTTPException in routes")
    - Explains when pattern is used
  partial:
    - Correct pattern but no example
    - Incomplete explanation
  fail:
    - Incorrect pattern
    - No example or explanation
```

### Q9: Project Conventions - Test Layout
```yaml
id: convention-test-layout
topic: Project Conventions
question: "Where would you add a test for the [MODULE_NAME] module? What naming convention should the test file follow?"
rubric:
  pass:
    - Correct directory (e.g., tests/ or co-located)
    - Correct naming pattern (e.g., test_module_name.py)
    - Cites example from cartography
  partial:
    - Correct directory but wrong naming, or vice versa
    - No example
  fail:
    - Incorrect directory and naming
    - No reasoning
```

### Q10: Integration - Dependency + Entry Point
```yaml
id: integration-dep-entry
topic: Integration
question: "If you wanted to add a new HTTP endpoint that uses [CENTRAL_MODULE], which file would you modify, and what imports would you need?"
rubric:
  pass:
    - Names correct route file from entry points
    - Lists correct import statement for central module
    - Explains reasoning (e.g., "routes are defined in app.py, module is in core/")
  partial:
    - Correct file but incomplete imports
    - Weak reasoning
  fail:
    - Incorrect file or imports
    - No reasoning
```

### Q11: Integration - Hotspot + Convention
```yaml
id: integration-hotspot-convention
topic: Integration
question: "If you needed to refactor [HOTSPOT_FILE] to reduce its change frequency, what convention would you follow for splitting it into smaller modules?"
rubric:
  pass:
    - Proposes split aligned with project conventions (e.g., single responsibility)
    - References naming or directory conventions from cartography
    - Explains benefit (e.g., "reduces merge conflicts")
  partial:
    - Plausible split but not aligned with conventions
    - Weak explanation of benefit
  fail:
    - Nonsensical split
    - No connection to conventions
```

### Q12: Architecture - End-to-End Flow
```yaml
id: architecture-e2e-flow
topic: Architecture
question: "Trace the flow of a request from [ENTRY_POINT] to [CENTRAL_MODULE]. Which files and functions are involved?"
rubric:
  pass:
    - Correctly traces flow using dependency graph and entry points
    - Names all intermediate files/functions
    - Explains data transformations if relevant
  partial:
    - Correct start and end but missing intermediate steps
    - Incomplete explanation
  fail:
    - Incorrect flow
    - No explanation
```

## Question Selection Logic (Phase 2)

- Select 3 questions from the pool
- Ensure coverage: at least one from each cartography stage (Dependency, Entry, Hotspot, Convention)
- Parameterize questions with actual data from cartography (e.g., replace [HOTSPOT_FILE] with real file path)
- Randomize order to prevent memorization on repeated demos

## Grading Logic (Phase 2)

- Parse onboardee's free-text answer
- Check for presence of required elements from rubric
- Use anti-sycophancy prompt: penalize plausible-but-shallow answers
- Require evidence drawn from cartography output or MCP responses

## Remediation Loop

On any "fail":
1. Re-surface the relevant cartography card
2. Ask one targeted follow-up question
3. Re-grade the answer
4. If still "fail", reveal the answer and continue

## Phase 1 Note

This is a **stub file** for Phase 1. The question selection, parameterization, and grading logic will be implemented in Phase 2. For now, this establishes the machine-readable structure judges can inspect.