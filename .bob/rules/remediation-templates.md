# Remediation Templates

Load these templates once per session to reduce token consumption. Bob fills in placeholders rather than generating remediation text from scratch.

## Template Structure

Each template is exactly 80 words and follows this pattern:
1. Point to the relevant card
2. Explain what to look for
3. Provide a hint about the correct answer
4. Encourage review of specific data

## Stage 1: Dependency Graph

### Template: Highest Fan-In

The dependency graph card shows fan-in values for each module. Fan-in represents how many other modules import this one. Look for the module with the highest number in the fan-in column. This module is the hub because many other parts of the codebase depend on it. Review the graph visualization or the nodes list to find the maximum fan-in value. The hub module is central to the architecture.

**Placeholders:** None (generic template)

## Stage 2: Entry Points

### Template: Route Handler

The Entry Points card lists all HTTP routes discovered in the codebase. Each route shows the HTTP method (GET, POST, etc.), the path pattern, and the handler function. Look for the route that matches the path `{PATH}` with method {METHOD}. The handler function name or file location will tell you which code handles this request. Review the routes list in the card.

**Placeholders:**
- `{PATH}`: Actual route path (e.g., `/api/users`)
- `{METHOD}`: HTTP method (e.g., `GET`)

### Template: CLI Entry Point

The Entry Points card shows CLI entry points with their script names and entry functions. Look for the script that matches `{SCRIPT_NAME}` or the entry point in `{FILE}`. CLI entry points are typically marked by `if __name__ == "__main__":` blocks or CLI framework decorators. Review the CLI section of the card to find the correct entry function.

**Placeholders:**
- `{SCRIPT_NAME}`: Script name (e.g., `manage.py`)
- `{FILE}`: File path (e.g., `src/cli.py`)

## Stage 3: Change Hotspots

### Template: Top Hotspot

The Change Hotspots card ranks files by commit frequency over the last 180 days. The top hotspot has the highest commit count. Each file also has a rationale explaining why it changes frequently—this might reference its role (config, auth, core logic), recent PR activity, or the number of contributors. Review the hotspots table and look for the file with the most commits, then read its rationale.

**Placeholders:** None (generic template)

### Template: Hotspot Rationale

The hotspot `{FILE}` has `{COUNT}` commits in 180 days. The rationale field explains why: it might be a configuration file updated per feature, an authentication module with frequent security patches, or a core business logic file touched by many developers. Review the rationale in the hotspots card to understand the change pattern. The rationale is grounded in PR titles and author data.

**Placeholders:**
- `{FILE}`: File path (e.g., `src/config.py`)
- `{COUNT}`: Commit count (e.g., `47`)

## Stage 4: Project Conventions

### Template: Naming Convention

The Project Conventions card lists detected patterns in the codebase, each with evidence from specific files. Look for the naming convention entry—it will show the pattern (e.g., snake_case, camelCase) and provide an example from a real file. The evidence field shows the file path and a sample function or class name. Review the conventions list to find the naming pattern for `{ENTITY_TYPE}`.

**Placeholders:**
- `{ENTITY_TYPE}`: Entity type (e.g., `functions`, `classes`, `files`)

### Template: Error Handling

The Project Conventions card shows how the codebase handles errors. Look for the error handling convention—it will specify whether the code raises exceptions, returns error codes, or uses Result types. The evidence field provides an example from a real file showing the pattern in action. Review the conventions list to find the error handling approach used in `{FILE}`.

**Placeholders:**
- `{FILE}`: File path (e.g., `src/api/routes.py`)

### Template: Test Layout

The Project Conventions card indicates where tests are located. Look for the test layout convention—it will show whether tests are co-located with source files or in a separate `tests/` directory. The evidence field provides examples of test file paths and naming patterns. Review the conventions list to determine where a test for `{MODULE}` should be placed.

**Placeholders:**
- `{MODULE}`: Module name (e.g., `user_service`)

## Certification Questions

### Template: Dependency + Entry Point Integration

The dependency graph shows `{MODULE}` as the central hub. The entry points card lists routes in `{FILE}`. To add a new endpoint using `{MODULE}`, you would modify `{FILE}` and import from `{MODULE}`. Review both cards to see how routes connect to core modules. The import statement would be `from {MODULE_PATH} import {FUNCTION}`.

**Placeholders:**
- `{MODULE}`: Module name (e.g., `core`)
- `{FILE}`: Route file (e.g., `src/api/routes.py`)
- `{MODULE_PATH}`: Import path (e.g., `src.core`)
- `{FUNCTION}`: Function name (e.g., `process_request`)

### Template: Hotspot + Convention Integration

The hotspot `{FILE}` changes frequently. To refactor it, follow the project's conventions: `{CONVENTION}`. The conventions card shows examples of how to split modules following `{PATTERN}`. Review both the hotspots rationale and the conventions evidence to plan a refactor that reduces change frequency while maintaining project standards.

**Placeholders:**
- `{FILE}`: Hotspot file (e.g., `src/auth.py`)
- `{CONVENTION}`: Convention name (e.g., `single responsibility`)
- `{PATTERN}`: Pattern name (e.g., `snake_case naming`)

## Usage Instructions

1. Load this file once at the start of cartography or certification
2. When remediation is needed, select the appropriate template
3. Fill in placeholders with actual data from cartography
4. Emit the filled template as the remediation text
5. Do not generate new remediation text from scratch

## Token Savings

- Without templates: ~150 tokens per remediation (generated from scratch)
- With templates: ~90 tokens per remediation (fill placeholders)
- Savings: ~40% per remediation loop
- Total savings: ~0.5 Bobcoins per session (assuming 2-3 remediations)