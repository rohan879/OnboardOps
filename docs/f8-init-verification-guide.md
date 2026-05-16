# F8 /init Compatibility Verification Guide (T5.7)

## Overview
This guide explains how to verify that generated AGENTS.md files are compatible with Bob's `/init` mechanism and that Bob demonstrates awareness of the repository context (FR-8.4).

## What is /init Compatibility?

Bob's `/init` mechanism allows loading a context file at the start of a session. A compatible AGENTS.md should:
1. Be readable and parseable by Bob
2. Provide sufficient context for Bob to understand the repository
3. Enable Bob to reference specific details from the context in responses

## Verification Script

### Location
`scripts/verify_agents_init.py`

### Purpose
Tests Bob's context awareness by:
1. Loading the AGENTS.md content
2. Extracting key context markers (repo name, languages, sections)
3. Asking Bob a question that requires context awareness
4. Analyzing Bob's response for references to the context
5. Scoring Bob's awareness (0-5 scale)

### Usage

#### Basic Test
```bash
python scripts/verify_agents_init.py /path/to/demo/repo/AGENTS.md
```

#### Custom Question
```bash
python scripts/verify_agents_init.py /path/to/demo/repo/AGENTS.md \
  --test-question "What are the main hotspots in this repository?"
```

#### Save Results to JSON
```bash
python scripts/verify_agents_init.py /path/to/demo/repo/AGENTS.md \
  --output-json results.json
```

## Example Output

### Successful Test (High Awareness)
```
======================================================================
OnboardOps AGENTS.md /init Compatibility Verifier
======================================================================
AGENTS.md: /path/to/demo-repo/AGENTS.md

✓ Bob Shell available

📝 Testing Bob's context awareness...
   Question: Based on the repository context you have, what are the key areas I should focus on first?
   Context size: 3847 characters

======================================================================
✅ Test PASSED
======================================================================

📊 Context Awareness Score: 4/5

🔍 Awareness Checks:
   ✓ repo_name
   ✓ cartography
   ✓ hotspots
   ✓ conventions
   ✗ specific_files

💬 Bob's Response:
----------------------------------------------------------------------
Based on the repository context, I recommend focusing on these key areas first:

1. **Authentication Module (auth.py)** - This is identified as a hotspot with 47 changes. The cartography shows it's a hub module with high fan-in, suggesting it's central to the application.

2. **Database Layer (database.py)** - Another hotspot with frequent modifications. Understanding the data models here will help you grasp the application's core functionality.

3. **Project Conventions** - The codebase follows specific patterns for error handling and API responses. Reviewing these conventions will help you write consistent code.

Start with the dependency graph to understand how these modules relate, then dive into the hotspots to see where active development is happening.
----------------------------------------------------------------------

✅ Bob demonstrates good context awareness
   The generated AGENTS.md is suitable for /init use
```

### Partial Awareness
```
📊 Context Awareness Score: 2/5

🔍 Awareness Checks:
   ✓ repo_name
   ✓ cartography
   ✗ hotspots
   ✗ conventions
   ✗ specific_files

⚠️  Bob shows partial context awareness
   Consider enriching the AGENTS.md with more specific details
```

### Failed Test
```
❌ Test FAILED

Error: Bob Shell not found
```

## Awareness Scoring

The script checks for 5 types of context awareness:

| Check | Description | What Bob Should Reference |
|-------|-------------|---------------------------|
| **repo_name** | Repository name mentioned | The actual repo name from AGENTS.md heading |
| **cartography** | Architecture understanding | Terms like "dependency", "module", "architecture" |
| **hotspots** | Change frequency awareness | Terms like "hotspot", "frequently changed", "churn" |
| **conventions** | Project patterns | Terms like "convention", "pattern", "style" |
| **specific_files** | Concrete file references | Actual file names or languages from the repo |

### Score Interpretation

- **5/5** - Excellent: Bob references all context types
- **4/5** - Good: Bob demonstrates strong awareness
- **3/5** - Acceptable: Bob shows adequate context understanding
- **2/5** - Partial: Bob needs more detailed AGENTS.md
- **1/5** - Minimal: AGENTS.md may be too generic
- **0/5** - None: AGENTS.md not providing useful context

## Testing Strategy (T5.7 Acceptance Criteria)

The task requires testing with **three different AGENTS.md files**. Here's the recommended approach:

### Test 1: Minimal Cartography
Generate AGENTS.md with only Stage 1 data:
```bash
# Generate with minimal data
python scripts/generate_agents_md.py /path/to/demo/repo --no-bob

# Verify
python scripts/verify_agents_init.py /path/to/demo/repo/AGENTS.md
```
**Expected:** Score 2-3/5 (basic awareness)

### Test 2: Full Cartography
Generate AGENTS.md with all 4 stages:
```bash
# Generate with full session data
python scripts/generate_agents_md.py /path/to/demo/repo \
  --session-file .onboardops/sessions/full-session.jsonl

# Verify
python scripts/verify_agents_init.py /path/to/demo/repo/AGENTS.md
```
**Expected:** Score 4-5/5 (strong awareness)

### Test 3: With Certification Data
Generate AGENTS.md including certification results:
```bash
# Generate with certification data
python scripts/generate_agents_md.py /path/to/demo/repo \
  --session-file .onboardops/sessions/certified-session.jsonl

# Verify with custom question about open questions
python scripts/verify_agents_init.py /path/to/demo/repo/AGENTS.md \
  --test-question "What questions remain unanswered about this repository?"
```
**Expected:** Score 4-5/5 (references certification questions)

## Troubleshooting

### Bob Shell Not Available
**Problem:** Script reports "Bob Shell not available"

**Solutions:**
1. Install Bob Shell: Follow official IBM Bob documentation
2. Authenticate: Run `bob --version` to trigger auth flow
3. Check team: Ensure you're on the hackathon team

### Low Awareness Score
**Problem:** Bob scores 0-2/5 consistently

**Solutions:**
1. **Enrich AGENTS.md:** Add more specific details to each section
2. **Include examples:** Add code snippets or file paths
3. **Add context:** Include more cartography data
4. **Check formatting:** Ensure sections are clearly marked

### Bob Doesn't Reference Context
**Problem:** Bob's response is generic, doesn't use AGENTS.md

**Solutions:**
1. **Check prompt:** The script includes AGENTS.md in the prompt
2. **Verify content:** Ensure AGENTS.md has substantive content
3. **Test manually:** Try asking Bob directly with the context
4. **Check token limit:** Very large AGENTS.md may be truncated

### Timeout Errors
**Problem:** Script times out after 60 seconds

**Solutions:**
1. **Reduce AGENTS.md size:** Target ≤4000 tokens (FR-8.2)
2. **Simplify question:** Use shorter, more direct questions
3. **Check network:** Ensure stable connection to Bob service

## Implementation Details

### Context Extraction
The script extracts these markers from AGENTS.md:
- Repository name (from `# Heading`)
- Languages (from summary or conventions)
- Section presence (all 5 required sections)
- Entry points (from section 5)

### Awareness Analysis
Bob's response is analyzed for:
- Exact repo name match (case-insensitive)
- Architecture terminology
- Hotspot terminology
- Convention terminology
- Specific file or language references

### Exit Codes
- **0** - Success: Test passed with score ≥3/5
- **1** - Failure: Test failed or score <3/5

## FR-8.4 Compliance

✅ **Loads as /init input** - AGENTS.md provided as context to Bob
✅ **Demonstrates awareness** - Bob's response analyzed for context references
✅ **Verifiable** - Automated scoring system
✅ **Repeatable** - Can test multiple AGENTS.md files

## Integration with Workflow

### During Development
```bash
# Generate AGENTS.md
python scripts/generate_agents_md.py /path/to/repo

# Immediately verify
python scripts/verify_agents_init.py /path/to/repo/AGENTS.md
```

### In CI/CD
```yaml
- name: Verify AGENTS.md Quality
  run: |
    python scripts/generate_agents_md.py ./demo-repo
    python scripts/verify_agents_init.py ./demo-repo/AGENTS.md
```

### Before Demo
```bash
# Test all three scenarios
for session in minimal full certified; do
  python scripts/generate_agents_md.py ./demo-repo \
    --session-file .onboardops/sessions/${session}.jsonl
  python scripts/verify_agents_init.py ./demo-repo/AGENTS.md \
    --output-json results-${session}.json
done
```

## Time Spent
45 minutes (on budget)

## Bobcoin Cost
~1 Bobcoin per verification (one Bob Shell call)

## Next Steps
See T5.8 for full session report curation across all developers.