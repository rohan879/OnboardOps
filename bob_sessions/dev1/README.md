# Dev 1 (Bob Architect) - Bob Session Exports

This directory contains exported Bob task sessions from Dev 1's Phase 2 work.

## Naming Convention

Sessions are named: `NN_task-title.md` where:
- `NN` = Sequential number (01, 02, 03, etc.)
- `task-title` = Descriptive title in kebab-case
- `.md` = Markdown export from Bob IDE

Each session should have an accompanying screenshot:
- `NN_task-title.png` = Bobcoin consumption summary

## Sessions

### Phase 2 Sessions

| # | Session | Description | Bobcoins | Status |
|---|---------|-------------|----------|--------|
| 01 | `01_vertical-slice.md` | T1.3 - First integration test of `/onboard` command | ~2.5 | Pending |
| 02 | `02_bobcoin-optimization.md` | T1.4 - Cartography prompt compression | ~1.5 | Pending |
| 03 | `03_phase2-gate-demo.md` | T1.10 - Final Phase 2 gate demonstration | ~2.0 | Pending |

**Total Projected**: ~6 Bobcoins (60% of Dev 1's 10 Bobcoin budget)

### Session Export Checklist

For each session, ensure:
- [ ] Markdown export includes full conversation history
- [ ] Screenshot shows Bobcoin consumption breakdown
- [ ] Session metadata recorded (date, time, duration)
- [ ] Key learnings documented in session notes
- [ ] Any errors or issues noted for future reference

### Curation Guidelines

**Include sessions that demonstrate**:
- Successful end-to-end flows
- Interesting debugging or problem-solving
- Bobcoin optimization techniques
- Novel use of Bob features (modes, skills, MCP tools)

**Exclude sessions that are**:
- Purely exploratory with no concrete outcome
- Duplicates of better sessions
- Failed attempts with no learning value
- Trivial configuration changes

### Judging Criteria

Hackathon judges will evaluate these sessions based on:
1. **Originality**: Novel use of Bob's extensibility features
2. **Technical Depth**: Complexity of Bob configuration
3. **Bobcoin Economy**: Efficient use of inference budget
4. **Documentation Quality**: Clear explanation of approach
5. **Reproducibility**: Can judges recreate the results?

### Export Instructions

**From Bob IDE**:
1. Open Task History panel
2. Select the task to export
3. Click "Export Session" button
4. Choose "Markdown" format
5. Save to this directory with naming convention
6. Take screenshot of Bobcoin consumption
7. Save screenshot with same base name

**Manual Export** (if Bob IDE export unavailable):
1. Copy full conversation from Bob chat panel
2. Format as markdown with timestamps
3. Include tool calls and responses
4. Add metadata header (date, duration, Bobcoins)
5. Save to this directory

### Session Metadata Template

Each session markdown should start with:

```markdown
# Session: [Title]

**Date**: YYYY-MM-DD  
**Duration**: MM minutes  
**Bobcoins Consumed**: X.X  
**Phase**: Phase 2  
**Task**: T1.X - [Task Name]  
**Status**: Success / Partial / Failed

## Objective

[What you were trying to accomplish]

## Approach

[How you approached the problem]

## Key Learnings

- [Learning 1]
- [Learning 2]
- [Learning 3]

## Bobcoin Breakdown

| Operation | Bobcoins | Notes |
|-----------|----------|-------|
| [Op 1] | X.X | [Note] |
| [Op 2] | X.X | [Note] |
| **Total** | **X.X** | |

## Conversation

[Full Bob conversation history]
```

### Phase 2 Focus Areas

Dev 1's sessions should showcase:
- **Custom Mode Development**: The `/onboard` mode from scratch
- **Skill Engineering**: Cartography skill with 4 stages
- **MCP Integration**: Calling institutional-knowledge tools
- **Token Economy**: Achieving ≤2 Bobcoins per cartography stage
- **Socratic Prompting**: Question-answer-remediation loops
- **Rule Files**: Using `.bob/rules/` for persistent context

### Post-Hackathon Use

These sessions serve as:
- **Reference Material**: For future OnboardOps development
- **Training Data**: For onboarding new team members
- **Case Studies**: For Bob platform documentation
- **Portfolio Pieces**: Demonstrating Bob expertise

---

**Last Updated**: 2026-05-15  
**Curator**: Dev 1 (Bob Architect)