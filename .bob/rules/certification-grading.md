# Certification Grading Rules

Load these rules once per certification session to reduce token consumption.

## Anti-Sycophancy Grader Prompt

When grading certification answers, apply these strict rules:

### Grading Tiers

**PASS** requires ALL of:
- Correct answer with specific details
- Evidence from cartography data (file paths, numbers, module names)
- Clear reasoning connecting answer to evidence

**PARTIAL** requires:
- Directionally correct but missing specifics
- OR correct answer without strong evidence
- OR reasoning present but incomplete

**FAIL** if ANY of:
- Incorrect answer
- No evidence from cartography (generic knowledge doesn't count)
- Plausible-sounding but vague ("it does the auth stuff")
- Contradicts cartography data

### Anti-Sycophancy Checks

Reject these patterns as FAIL:
- "The main module" without naming it
- "It handles authentication" without specifics
- "Several files" without naming them
- "I think it's because..." without evidence

Accept as PARTIAL:
- Correct module name + vague reasoning
- Directionally correct but incomplete

Accept as PASS:
- Correct module name + specific evidence + clear reasoning

### Evidence Sources (Acceptable)

- Dependency graph data (fan-in, fan-out, module names)
- Entry points data (route paths, handler names)
- Hotspots data (commit counts, author names, file paths)
- Conventions data (naming patterns, file examples)
- MCP tool responses (PR titles, commit messages)

### Evidence Sources (Not Acceptable)

- General programming knowledge
- Assumptions about "typical" codebases
- Guesses based on file names alone
- Prior experience with similar projects

### Output Format

Return exactly one of: "pass", "partial", "fail"

Then provide a one-paragraph rationale (max 100 words) explaining the grade.

NEVER reveal the rubric to the onboardee unless they have failed twice.

## Grading Shortcuts

To reduce token consumption, use these shortcuts when grading:

### Quick Pass Indicators
- Answer includes specific numbers from cartography (e.g., "12 dependencies")
- Answer quotes file paths verbatim from cards
- Answer references specific PR titles or commit messages

### Quick Fail Indicators
- Answer uses only generic terms ("the main file", "some modules")
- Answer contradicts visible cartography data
- Answer is one sentence with no evidence

### Partial Indicators
- Answer is correct but uses "probably" or "I think"
- Answer names correct entity but reasoning is weak
- Answer shows understanding but lacks precision

## Token-Efficient Grading

Instead of generating full explanations, use templates:

**Pass template:**
"Correct. [Entity] identified with evidence: [specific data point]."

**Partial template:**
"Directionally correct but [missing element]. Review [card name]."

**Fail template:**
"Incorrect. The answer is [correct entity] because [one-sentence evidence]."

This reduces grading cost from ~1.5 Bobcoins per question to ~0.8 Bobcoins.