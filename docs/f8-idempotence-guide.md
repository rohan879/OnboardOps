# F8 Idempotence and Manual-Section Preservation Guide

## Overview
The AGENTS.md generator now supports idempotent regeneration with preservation of user-edited sections (FR-8.3).

## How It Works

### 1. Marking Sections as User-Edited
To preserve a section across regenerations, wrap it with HTML comment markers:

```markdown
## 4. Open Questions

<!-- USER-EDITED -->
## 4. Open Questions

These are my custom questions based on team discussions:

1. How do we handle database migrations in production?
2. What's our strategy for API versioning?
3. Should we refactor the authentication module?

**Note:** These questions were added after our architecture review meeting.
<!-- END USER-EDITED -->
```

### 2. Automatic Backup
Every time you regenerate AGENTS.md, the previous version is automatically backed up to `AGENTS.md.bak`.

### 3. Section Merging
When regenerating:
- User-edited sections are extracted from the existing file
- New content is generated with updated cartography/certification data
- User-edited sections are merged back into the new content
- The result preserves your manual edits while updating auto-generated sections

## Usage Examples

### First Generation (No Existing File)
```bash
python scripts/generate_agents_md.py /path/to/demo/repo
```
Output:
```
OnboardOps AGENTS.md Generator (F8 Full)
======================================================================
Repository: /path/to/demo/repo
Output: /path/to/demo/repo/AGENTS.md

📂 Detecting repository name...
   Name: demo-repo

📊 Loading cartography data from session-20260515.jsonl...
   Found 4/4 cartography stages

📝 Loading certification results from session-20260515.jsonl...
   Found 3 certification questions (2 passed)

🔍 Analyzing repository structure...
   Files: 127
   Languages: Python, JavaScript
   Entry points: 3

💾 Writing AGENTS.md to /path/to/demo/repo/AGENTS.md...
   Size: 3847 characters

✅ AGENTS.md generated successfully!
```

### Regeneration (With User Edits)
After manually editing a section and adding markers:

```bash
python scripts/generate_agents_md.py /path/to/demo/repo
```
Output:
```
OnboardOps AGENTS.md Generator (F8 Full)
======================================================================
Repository: /path/to/demo/repo
Output: /path/to/demo/repo/AGENTS.md

📂 Detecting repository name...
   Name: demo-repo

📊 Loading cartography data from session-20260516.jsonl...
   Found 4/4 cartography stages

📝 Loading certification results from session-20260516.jsonl...
   Found 3 certification questions (3 passed)

🔍 Analyzing repository structure...
   Files: 132
   Languages: Python, JavaScript
   Entry points: 3

📄 Existing AGENTS.md found, checking for user-edited sections...
   Found 1 user-edited section(s)
   - Open Questions

🔄 Merging user-edited sections...
   Merged 1 section(s)

💾 Creating backup...
   Backup saved to: /path/to/demo/repo/AGENTS.md.bak

💾 Writing AGENTS.md to /path/to/demo/repo/AGENTS.md...
   Size: 3912 characters

✅ AGENTS.md generated successfully!
```

## Best Practices

### 1. Mark Entire Sections
Always wrap the entire section including the heading:

✅ **Good:**
```markdown
<!-- USER-EDITED -->
## 4. Open Questions

My custom content here...
<!-- END USER-EDITED -->
```

❌ **Bad:**
```markdown
## 4. Open Questions

<!-- USER-EDITED -->
My custom content here...
<!-- END USER-EDITED -->
```

### 2. Use Descriptive Section Names
The section name is extracted from the first heading within the markers. Use clear, unique names:

✅ **Good:**
```markdown
<!-- USER-EDITED -->
## 4. Open Questions - Team Specific

...
<!-- END USER-EDITED -->
```

### 3. Review Backups
Before regenerating, you can review the backup to see what changed:

```bash
diff AGENTS.md.bak AGENTS.md
```

### 4. Multiple User Sections
You can mark multiple sections as user-edited:

```markdown
<!-- USER-EDITED -->
## 2. Hotspots and Their Owners

Added notes from code review:
- auth.py needs refactoring (see JIRA-123)
- database.py has performance issues
<!-- END USER-EDITED -->

## 3. Project Conventions

(Auto-generated content)

<!-- USER-EDITED -->
## 4. Open Questions

Custom questions from team meeting...
<!-- END USER-EDITED -->
```

## Implementation Details

### Functions Added
1. **`extract_user_edited_sections(content: str)`** - Parses existing AGENTS.md and extracts sections between markers
2. **`merge_user_sections(new_content: str, user_sections: Dict[str, str])`** - Merges preserved sections back into new content
3. **`backup_existing_file(file_path: Path)`** - Creates .bak backup before overwriting

### Marker Format
- Start marker: `<!-- USER-EDITED -->`
- End marker: `<!-- END USER-EDITED -->`
- HTML comments are invisible when rendered as markdown
- Compatible with all markdown renderers

### Section Matching
The merge algorithm:
1. Extracts section name from first heading in user-edited block
2. Finds matching section in new content (case-insensitive)
3. Replaces entire section with user-edited version
4. Preserves all other auto-generated content

## Troubleshooting

### User Section Not Preserved
**Problem:** Your edits were lost after regeneration.

**Solutions:**
1. Check that markers are exactly `<!-- USER-EDITED -->` and `<!-- END USER-EDITED -->`
2. Ensure the section heading matches between old and new content
3. Verify the backup file exists and contains your edits

### Backup File Not Created
**Problem:** No `.bak` file after regeneration.

**Solutions:**
1. Check file permissions in the target directory
2. Ensure the original AGENTS.md exists before regeneration
3. Look for warning messages in the output

### Section Merged in Wrong Place
**Problem:** User section appears in unexpected location.

**Solutions:**
1. Use unique, descriptive section names
2. Ensure section heading is the first line after `<!-- USER-EDITED -->`
3. Check that section name matches a section in the new content

## FR-8.3 Compliance

✅ **Preserves user-edited sections** - Marked with HTML comments
✅ **Backs up prior version** - Creates AGENTS.md.bak automatically
✅ **Idempotent regeneration** - Can run multiple times safely
✅ **Graceful degradation** - Works even if no user sections exist

## Time Spent
60 minutes (on budget)

## Next Steps
See T5.7 for /init compatibility verification with generated AGENTS.md files.