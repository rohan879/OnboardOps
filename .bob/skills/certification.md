---
name: "Certification"
description: "Three-question assessment to validate repository understanding before first PR"
auto_activate: false
output_token_cap: 400
grading_temperature: 0.3
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

## Question Selection Logic

The certification skill selects 3 questions from the pool of 12 using these rules:

1. **Coverage requirement**: Select at least one question from each of the four
   cartography stages (Dependency Graph, Entry Points, Hotspots, Conventions).
   Since we need 3 questions and have 4 stages, one stage will be skipped.
2. **Parameterization**: Replace placeholders in question text with actual data
   from cartography output:
   - `[SPECIFIC_ENDPOINT]` → actual route path from entry points
   - `[HOTSPOT_FILE]` → top hotspot file path
   - `[N]` → actual commit count
   - `[CENTRAL_MODULE]` → hub module from dependency graph
   - `[MODULE_NAME]` → any module from the graph
   - `[ENTITY_TYPE]` → "functions", "classes", or "files"
3. **Randomization**: Shuffle question order to prevent memorization across demos.
4. **Fallback**: If cartography data is missing for a question's stage, skip that
   question and select another from a different stage.

### Selection Algorithm

```python
# Pseudocode for question selection
available_questions = [Q1-Q12]
selected = []

# Ensure at least 2 distinct stages covered
stages_covered = set()
for question in shuffle(available_questions):
    if len(selected) >= 3:
        break
    if can_parameterize(question, cartography_data):
        selected.append(parameterize(question, cartography_data))
        stages_covered.add(question.topic)

# Verify coverage: at least 2 distinct stages
if len(stages_covered) < 2:
    raise ValueError("Insufficient cartography data for certification")
```

## Grading Logic

Each answer is graded using a three-tier system: **pass**, **partial**, **fail**.

### Grading Process

1. **Parse answer**: Extract key terms, file paths, module names, and reasoning.
2. **Check rubric requirements**:
   - **Pass**: All required elements present + evidence from cartography
   - **Partial**: Some required elements present OR correct but shallow
   - **Fail**: Missing required elements OR incorrect information
3. **Anti-sycophancy check**: Penalize plausible-but-shallow answers:
   - "It does the auth stuff" → **fail** (no evidence)
   - "The auth module handles JWT tokens, as shown in the dependency graph" → **pass**
4. **Evidence requirement**: Answers must reference cartography data or MCP tool
   output. Generic knowledge without repo-specific evidence is **partial** at best.
5. **Emit grade event**: Call `emit_event` with `event_type: "certification_grade"`
   and `event_data` containing:
   ```json
   {
     "question_id": "dep-graph-central",
     "grade": "pass",
     "rationale": "Correctly identified core.py as the hub with 12 incoming dependencies, citing the dependency graph data.",
     "onboardee_answer": "<full answer text>"
   }
   ```

### Grading Rubric Application

For each question, apply the rubric strictly:

- **Pass criteria**: ALL pass requirements met
- **Partial criteria**: SOME pass requirements OR all partial requirements met
- **Fail criteria**: Fail requirements met OR insufficient pass/partial requirements

### Pass Threshold

Certification passes if: **At least 2 of 3 answers graded "pass" OR "partial"**

- 3 pass → **Certified**
- 2 pass, 1 partial → **Certified**
- 2 pass, 1 fail → **Certified**
- 1 pass, 2 partial → **Certified**
- 1 pass, 1 partial, 1 fail → **Not Certified** (remediation offered)
- 0 pass → **Not Certified** (remediation offered)

## Remediation Loop

When an answer is graded **fail**, the remediation loop activates:

1. **First wrong answer**:
   - Emit an 80-word remediation paragraph pointing to relevant cartography data
   - Example: "The dependency graph shows that `core.py` has 12 incoming edges,
     making it the central hub. Review the graph card and look for the module
     with the highest fan-in count. This indicates which module is most depended
     upon by others."
   - Re-ask the same question
   - Grade the second answer using the same rubric
2. **Second wrong answer**:
   - Reveal the correct answer in one sentence with evidence
   - Example: "The correct answer is `core.py`, which has 12 incoming dependencies
     as shown in the dependency graph."
   - Continue to next question (do not loop further)
3. **Partial answer**: No remediation loop; accept as-is and continue

### Remediation Event

Emit `event_type: "certification_remediation"` with:
```json
{
  "question_id": "dep-graph-central",
  "attempt": 1,
  "remediation_text": "<80-word guidance>",
  "hint": "Look at the fan-in values in the dependency graph card."
}
```

## Certification Flow

1. **Trigger**: Onboardee declares readiness after cartography completes
2. **Selection**: Choose 3 questions using selection logic
3. **Ask Q1**: Emit `question_ask` event, wait for answer
4. **Grade Q1**: Apply rubric, emit `certification_grade` event
5. **Remediation (if fail)**: Emit remediation, re-ask, re-grade
6. **Ask Q2**: Repeat for second question
7. **Ask Q3**: Repeat for third question
8. **Final decision**: Check pass threshold
9. **Emit result**: Call `emit_event` with `event_type: "certification_complete"`
   ```json
   {
     "passed": true,
     "grades": ["pass", "partial", "pass"],
     "questions_asked": 3,
     "remediation_count": 1
   }
   ```
10. **Narrate**: "Certification complete. You passed 2 of 3 questions. Ready for
    your first PR."

## Integration with Cartography

The certification skill depends on cartography output. Before selecting questions:

1. Verify cartography data is available in session context
2. Check which stages have sufficient data for parameterization
3. If fewer than 2 stages have data, defer certification and request more cartography

## Anti-Sycophancy Grader Prompt

When grading answers, Bob must use this strict anti-sycophancy prompt to avoid
inflating grades for plausible-but-shallow responses.

### Grader System Prompt

```
You are grading an onboarding certification answer. Your role is to be STRICT
and EVIDENCE-FOCUSED. Do not be lenient or encouraging.

GRADING RULES:
1. PASS requires ALL of:
   - Correct answer with specific details
   - Evidence from cartography data (file paths, numbers, module names)
   - Clear reasoning connecting answer to evidence
   
2. PARTIAL requires:
   - Directionally correct but missing specifics
   - OR correct answer without strong evidence
   - OR reasoning present but incomplete
   
3. FAIL if ANY of:
   - Incorrect answer
   - No evidence from cartography (generic knowledge doesn't count)
   - Plausible-sounding but vague ("it does the auth stuff")
   - Contradicts cartography data

ANTI-SYCOPHANCY CHECKS:
- "The main module" without naming it → FAIL
- "It handles authentication" without specifics → FAIL
- "Several files" without naming them → FAIL
- "I think it's because..." without evidence → PARTIAL at best
- Correct module name + vague reasoning → PARTIAL
- Correct module name + specific evidence → PASS

EVIDENCE SOURCES (acceptable):
- Dependency graph data (fan-in, fan-out, module names)
- Entry points data (route paths, handler names)
- Hotspots data (commit counts, author names, file paths)
- Conventions data (naming patterns, file examples)
- MCP tool responses (PR titles, commit messages)

EVIDENCE SOURCES (not acceptable):
- General programming knowledge
- Assumptions about "typical" codebases
- Guesses based on file names alone
- Prior experience with similar projects

OUTPUT FORMAT:
Return exactly one of: "pass", "partial", "fail"
Then provide a one-paragraph rationale (max 100 words) explaining the grade.

NEVER reveal the rubric to the onboardee unless they have failed twice.
```

### Grading Examples

**Example 1: PASS**
- Question: "Which module is the central hub?"
- Answer: "The `core.py` module is the hub because the dependency graph shows
  it has 12 incoming dependencies, the highest fan-in in the codebase."
- Grade: **PASS**
- Rationale: "Correctly identifies core.py with specific evidence (12 incoming
  dependencies) drawn directly from the dependency graph cartography data."

**Example 2: PARTIAL**
- Question: "Which module is the central hub?"
- Answer: "I think it's the core module because it seems like the main one."
- Grade: **PARTIAL**
- Rationale: "Correct module identified but reasoning is vague ('seems like')
  and lacks specific evidence from the dependency graph."

**Example 3: FAIL**
- Question: "Which module is the central hub?"
- Answer: "The authentication module handles all the auth logic."
- Grade: **FAIL**
- Rationale: "Incorrect module (auth vs. core) and answer doesn't address the
  question about dependency centrality. No evidence from cartography data."

**Example 4: FAIL (plausible but shallow)**
- Question: "Why does config.py change frequently?"
- Answer: "Config files usually change a lot in active projects."
- Grade: **FAIL**
- Rationale: "Generic knowledge without repo-specific evidence. The hotspots
  card provides specific rationale (e.g., 'updated per feature release') that
  the answer must reference."

**Example 5: PASS (with MCP evidence)**
- Question: "Why does config.py change frequently?"
- Answer: "It has 47 commits in 180 days because recent PRs show it's updated
  for each feature release to add new environment variables."
- Grade: **PASS**
- Rationale: "Specific commit count from hotspots data plus rationale grounded
  in PR evidence from MCP tools."

### Applying the Grader Prompt

When Bob grades an answer:

1. Load the grader system prompt into context
2. Provide the question, rubric, and onboardee's answer
3. Provide relevant cartography data for evidence checking
4. Request grade + rationale in the specified format
5. Parse the response and emit the `certification_grade` event
6. If grade is "fail", trigger remediation loop

### Preventing Grade Inflation

Common pitfalls to avoid:

- **Don't accept "close enough"**: If the rubric requires a file path, "the auth
  file" is not sufficient.
- **Don't reward effort**: A long answer with no evidence is still a fail.
- **Don't hint at the answer**: Remediation should point to data, not reveal
  the answer.
- **Don't grade on a curve**: Each answer is graded independently against its
  rubric.

## Token Economy

- Target cost per certification: **3 Bobcoins** (1 per question)
- Remediation adds ~0.5 Bobcoins per loop
- Total certification budget: **5 Bobcoins** (including up to 2 remediations)
- If budget exceeded, skip remaining questions and pass/fail based on completed ones
- Grader prompt is loaded once per session, not per question (token efficiency)