# Cartography Output Format Rules

Load these rules once per session to reduce token consumption. All cartography stages follow these formatting conventions.

## Card Emission Format (All Stages)

Every cartography stage follows this pattern:

1. **Call emit_event** with structured JSON data
2. **Narrate in chat** with 1 sentence (≤25 words)
3. **Ask Socratic question** with 1 sentence (≤20 words)
4. **No redundancy** - Don't repeat card data in narration

## JSON Structure Template

```json
{
  "event_type": "card_emit",
  "event_data": {
    "card_type": "[TYPE]",
    "title": "[TITLE]",
    "body_markdown": "[ONE SENTENCE SUMMARY]",
    "data": {
      [STAGE-SPECIFIC DATA FIELDS]
    },
    "summary": "[ONE SENTENCE SUMMARY]"
  }
}
```

**Valid card_type values:**
- `dependency_graph`
- `entry_points`
- `hotspots`
- `conventions`

## Narration Templates

Use these concise templates for chat narration:

### Stage 1: Dependency Graph
- **Hub pattern**: "`[module]` is the hub with `[n]` incoming dependencies."
- **Flat pattern**: "The graph is flat across `[n]` loosely coupled modules."
- **Cycle pattern**: "`[n]` circular dependencies indicate tight coupling."

### Stage 2: Entry Points
- **Routes only**: "Found `[n]` HTTP routes across `[m]` files."
- **CLI only**: "Found `[n]` CLI entry points."
- **Jobs only**: "Found `[n]` scheduled jobs."
- **Mixed**: "Entry points span `[n]` routes, `[m]` CLI commands, and `[p]` jobs."

### Stage 3: Change Hotspots
- **Single hotspot**: "`[file]` has `[n]` commits in 180 days due to `[reason]`."
- **Multiple hotspots**: "Top hotspots: `[file1]` (`[n1]` commits), `[file2]` (`[n2]` commits)."
- **No hotspots**: "No high-churn files detected in the last 180 days."

### Stage 4: Project Conventions
- **Single convention**: "Codebase follows `[pattern]` for `[entity]`."
- **Multiple conventions**: "Detected `[n]` conventions: `[pattern1]`, `[pattern2]`, `[pattern3]`."
- **Mixed conventions**: "Conventions vary: `[pattern1]` for `[entity1]`, `[pattern2]` for `[entity2]`."

## Data Field Specifications

### Stage 1: Dependency Graph

```json
"data": {
  "nodes": [
    {
      "id": "module_name",
      "label": "module_name",
      "fan_in": 8,
      "fan_out": 2,
      "is_hub": true
    }
  ],
  "edges": [
    {
      "source": "module_a",
      "target": "module_b"
    }
  ],
  "circular_dependencies": [
    {
      "cycle": ["module_x", "module_y", "module_x"]
    }
  ]
}
```

### Stage 2: Entry Points

```json
"data": {
  "routes": [
    {
      "path": "/api/users",
      "method": "GET",
      "handler": "get_users",
      "file": "src/api/routes.py"
    }
  ],
  "cli": [
    {
      "name": "manage.py",
      "entry_point": "main",
      "file": "manage.py"
    }
  ],
  "jobs": [
    {
      "name": "cleanup_task",
      "schedule": "daily",
      "file": "src/tasks.py"
    }
  ],
  "consumers": [
    {
      "topic": "user_events",
      "handler": "process_event",
      "file": "src/consumers.py"
    }
  ]
}
```

### Stage 3: Change Hotspots

```json
"data": {
  "files": [
    {
      "path": "src/auth.py",
      "commit_count": 47,
      "distinct_authors": 2,
      "top_author": "Full Name From recent_authors",
      "authors": ["Full Name From recent_authors"],
      "last_pr": "#123",
      "rationale": "Authentication module with frequent security patches",
      "commit_frequency": [1, 2, 4, 3, 5, 6, 4, 7, 8, 6, 5, 9]
    }
  ]
}
```

### Stage 4: Project Conventions

```json
"data": {
  "conventions": [
    {
      "name": "Naming Convention",
      "pattern": "snake_case for functions",
      "evidence": "src/utils.py: def process_data()"
    }
  ]
}
```

## Error Handling Format

When emitting placeholder cards due to errors:

```json
{
  "event_type": "card_emit",
  "event_data": {
    "card_type": "[TYPE]",
    "title": "[TITLE] (Data Unavailable)",
    "body_markdown": "Data unavailable due to [ERROR_TYPE]",
    "data": {
      "error": true,
      "message": "[ERROR_DESCRIPTION]"
    },
    "summary": "Data unavailable"
  }
}
```

## Token Economy Guidelines

- **Narration**: 1 sentence only, no elaboration
- **Data**: Structured JSON, no prose in data fields
- **Questions**: 1 sentence, directly checkable from card data
- **Remediation**: Use templates from remediation-templates.md
- **Examples**: Reference schema, don't repeat full JSON

## Consistency Rules

1. **Always emit card before narrating** - Dashboard needs data first
2. **Always ask question after narrating** - Maintains flow
3. **Always use template narration** - Saves tokens, ensures consistency
4. **Never repeat card data in chat** - Redundant, wastes tokens
5. **Never generate remediation from scratch** - Use templates

## Integration with Other Rules

- **cartography-style.md**: Tone, voice, forbidden phrases
- **remediation-templates.md**: Pre-written remediation text
- **certification-grading.md**: Grading rubrics and anti-sycophancy

Load all three rules files once at session start for maximum token efficiency.
