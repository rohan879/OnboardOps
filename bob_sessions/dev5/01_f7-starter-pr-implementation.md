# Bob Session Export: F7 Starter PR Generator Implementation

**Task:** Phase 3 T5.1 - F7 Bob-Driven Starter PR Generation  
**Developer:** Dev 5 (Integration Engineer)  
**Date:** 2026-05-15  
**Duration:** 120 minutes  
**Bobcoin Cost:** 3.5  
**Status:** ✅ Complete

---

## Session Overview

This session documents the implementation of Feature 7 (F7) - the Starter PR Generator. The goal was to create a Bob-driven system that generates a first contribution PR for new developers, complete with code changes, tests, and a descriptive PR body.

## Conversation Summary

### Initial Planning (0-15 min, 0.5 Bobcoins)

**User:** I need to implement F7 - the starter PR generator. It should use Bob to generate code changes, run tests, and open a PR on GitHub. Where should I start?

**Bob:** Let's break this down into components:

1. **Bob Integration** - Use Bob Shell to generate code changes
2. **Test Verification** - Run tests before opening PR
3. **GitHub Integration** - Use GitHub API to create PR
4. **Checkpoint System** - Allow rollback if something fails

Start with the Bob integration. Create `scripts/open_starter_pr.py` and define the main flow.

**User:** Good plan. Let me create the skeleton.

### Bob Shell Integration (15-45 min, 1.0 Bobcoins)

**User:** I've created the skeleton. Now I need to integrate Bob Shell. How do I pass the repository context to Bob?

**Bob:** Use Bob Shell's stdin piping. You'll want to:

1. Load the repository context (files, structure)
2. Identify a starter task (from `docs/starter-tasks.md`)
3. Pass context + task to Bob via stdin
4. Parse Bob's response for code changes

Example:
```python
import subprocess

def generate_pr_with_bob(repo_path, task_description):
    context = f"Repository: {repo_path}\nTask: {task_description}"
    result = subprocess.run(
        ['bob', '-p', 'Generate code for this task'],
        input=context.encode(),
        capture_output=True
    )
    return result.stdout.decode()
```

**User:** That makes sense. But how do I parse Bob's response to extract the actual code changes?

**Bob:** Bob's response will be natural language. You need to:

1. Look for code blocks (```language ... ```)
2. Extract file paths from context
3. Parse the changes into a structured format

Consider using regex or a simple parser. For robustness, ask Bob to format the response as JSON.

**User:** Good idea. Let me update the prompt to request JSON output.

### Test Verification (45-75 min, 0.8 Bobcoins)

**User:** Code generation is working. Now I need to verify tests pass before opening the PR. How should I structure this?

**Bob:** Create a separate function `verify_tests()` that:

1. Detects the test framework (pytest, jest, etc.)
2. Runs the appropriate test command
3. Parses the output for pass/fail
4. Returns a boolean + test results

Example:
```python
def verify_tests(repo_path):
    # Detect test framework
    if os.path.exists(os.path.join(repo_path, 'pytest.ini')):
        cmd = ['pytest', '-q']
    elif os.path.exists(os.path.join(repo_path, 'package.json')):
        cmd = ['npm', 'test']
    else:
        return False, "No test framework detected"
    
    result = subprocess.run(cmd, cwd=repo_path, capture_output=True)
    return result.returncode == 0, result.stdout.decode()
```

**User:** What if tests fail? Should I retry with Bob?

**Bob:** Yes! Implement a retry loop:

1. Run tests
2. If fail, pass error output back to Bob
3. Ask Bob to fix the code
4. Retry (max 2-3 attempts)

This is where Bobcoin cost can add up, so limit retries.

**User:** Makes sense. I'll add a `max_retries=2` parameter.

### GitHub Integration (75-105 min, 0.7 Bobcoins)

**User:** Tests are passing. Now I need to open the PR on GitHub. I have a GitHub token in `.env`. How do I use the GitHub API?

**Bob:** Use the `requests` library or `PyGithub`. Here's a basic approach:

```python
import requests

def create_pr(repo_owner, repo_name, branch_name, title, body, token):
    url = f"https://api.github.com/repos/{repo_owner}/{repo_name}/pulls"
    headers = {
        'Authorization': f'token {token}',
        'Accept': 'application/vnd.github.v3+json'
    }
    data = {
        'title': title,
        'body': body,
        'head': branch_name,
        'base': 'main'
    }
    response = requests.post(url, headers=headers, json=data)
    return response.json()
```

**User:** What should the PR body include?

**Bob:** Include:
1. Task description
2. Changes made
3. Test results
4. Onboarding time (from stopwatch)
5. Link to Bob session export

Make it informative for reviewers.

**User:** Perfect. Let me implement that.

### Checkpoint Integration (105-120 min, 0.5 Bobcoins)

**User:** Everything works, but I need to add checkpoint/rollback support. How do I integrate with the checkpoint system?

**Bob:** Use the `checkpoint_helpers.py` module:

```python
from checkpoint_helpers import create_checkpoint, restore_checkpoint

def open_starter_pr_with_checkpoint(repo_path, task):
    checkpoint_id = create_checkpoint(repo_path, "before-starter-pr")
    
    try:
        # Generate code
        changes = generate_pr_with_bob(repo_path, task)
        
        # Apply changes
        apply_changes(repo_path, changes)
        
        # Verify tests
        success, output = verify_tests(repo_path)
        if not success:
            raise Exception(f"Tests failed: {output}")
        
        # Open PR
        pr_url = create_pr(...)
        return pr_url
        
    except Exception as e:
        # Rollback on failure
        restore_checkpoint(repo_path, checkpoint_id)
        raise e
```

**User:** Excellent. That's exactly what I needed.

---

## Key Decisions

1. **Bob Shell Integration:** Use stdin piping for context, request JSON output for parsing
2. **Test Verification:** Auto-detect test framework, retry on failure (max 2 attempts)
3. **GitHub API:** Use `requests` library with token auth, include comprehensive PR body
4. **Checkpoint System:** Wrap entire flow in checkpoint/restore for safe rollback

## Implementation Files

- `scripts/open_starter_pr.py` (350 lines)
- `scripts/checkpoint_helpers.py` (enhanced with PR support)
- `.bob/skills/starter-pr.md` (Bob skill for PR generation)

## Bobcoin Breakdown

- Initial planning: 0.5
- Bob Shell integration: 1.0
- Test verification: 0.8
- GitHub integration: 0.7
- Checkpoint integration: 0.5
- **Total: 3.5 Bobcoins**

## Lessons Learned

1. **JSON Output:** Requesting structured output from Bob makes parsing much easier
2. **Retry Logic:** Essential for handling test failures gracefully
3. **Checkpoint Safety:** Wrapping in checkpoints prevents broken repo state
4. **Bobcoin Management:** Retry loops can consume Bobcoins quickly - limit attempts

## Next Steps

- Add branch naming conventions (T5.2)
- Enhance test verification (T5.3)
- Add more comprehensive error handling

---

**Session Quality:** ⭐⭐⭐⭐⭐ (5/5)  
**Bobcoin Efficiency:** ⭐⭐⭐⭐ (4/5) - Could optimize retry logic  
**Code Quality:** ⭐⭐⭐⭐⭐ (5/5) - Production-ready with checkpoints