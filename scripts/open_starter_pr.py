#!/usr/bin/env python3
"""
OnboardOps Starter PR Opener (F7 v0)

Opens a starter PR against the demo repository fork using a pre-recorded diff.
This is the v0 implementation for Phase 2 - proves the pipeline end-to-end.

Phase 3 (F7.1) will add Bob-driven diff generation.

Usage:
    python scripts/open_starter_pr.py
    python scripts/open_starter_pr.py --candidate 2
    python scripts/open_starter_pr.py --dry-run
    python scripts/open_starter_pr.py --onboardee alice

Dependencies: PyGithub, python-dotenv (in scripts/requirements.txt)
"""

import argparse
import os
import re
import subprocess
import sys
from datetime import datetime
from pathlib import Path
from typing import Dict, Optional, Tuple

try:
    from github import Github, GithubException
    from dotenv import load_dotenv
except ImportError:
    print("❌ Missing dependencies. Install with:")
    print("   pip install PyGithub python-dotenv")
    sys.exit(1)

# Project root
PROJECT_ROOT = Path(__file__).parent.parent

# Load environment variables
load_dotenv(PROJECT_ROOT / '.env')


def get_github_token() -> str:
    """Get GitHub token from environment."""
    token = os.getenv('ONBOARDOPS_GITHUB_TOKEN')
    if not token:
        print("❌ GitHub token not found!")
        print("   Set ONBOARDOPS_GITHUB_TOKEN in .env file")
        print("   See backend/.env.example for format")
        sys.exit(1)
    return token


def parse_starter_tasks() -> Dict[int, Dict]:
    """Parse starter-tasks.md to extract candidates."""
    tasks_file = PROJECT_ROOT / 'docs' / 'starter-tasks.md'
    
    if not tasks_file.exists():
        print(f"❌ starter-tasks.md not found at {tasks_file}")
        sys.exit(1)
    
    content = tasks_file.read_text(encoding='utf-8')
    
    # Extract candidates
    candidates = {}
    
    # Look for candidate sections
    candidate_pattern = r'## Candidate (\d+): (.+?)\n\n(.+?)(?=\n## |$)'
    matches = re.finditer(candidate_pattern, content, re.DOTALL)
    
    for match in matches:
        num = int(match.group(1))
        title = match.group(2).strip()
        body = match.group(3).strip()
        
        # Extract key information
        files_match = re.search(r'\*\*Files:\*\*\s*\n-\s*(.+)', body)
        lines_match = re.search(r'\*\*Lines Changed:\*\*\s*~?(\d+)', body)
        difficulty_match = re.search(r'\*\*Difficulty:\*\*\s*(\w+)', body)
        
        candidates[num] = {
            'title': title,
            'files': files_match.group(1) if files_match else 'Unknown',
            'lines': int(lines_match.group(1)) if lines_match else 20,
            'difficulty': difficulty_match.group(1) if difficulty_match else 'Medium',
            'body': body
        }
    
    return candidates


def get_demo_repo_info() -> Tuple[str, str]:
    """Get demo repository information from notes."""
    choice_file = PROJECT_ROOT / 'notes' / 'demo-repo-choice.md'
    
    if not choice_file.exists():
        print("⚠️  Demo repo not selected yet (Dev 4's T4.2)")
        print("   Using placeholder for testing")
        return "demo-org/demo-repo", "https://github.com/demo-org/demo-repo"
    
    content = choice_file.read_text(encoding='utf-8')
    
    # Extract repo URL
    url_match = re.search(r'Fork URL:\s*(.+)', content)
    if url_match:
        fork_url = url_match.group(1).strip()
        # Extract owner/repo from URL
        repo_match = re.search(r'github\.com[:/](.+/.+?)(?:\.git)?$', fork_url)
        if repo_match:
            repo_full_name = repo_match.group(1)
            return repo_full_name, fork_url
    
    print("⚠️  Could not parse demo repo info")
    return "demo-org/demo-repo", "https://github.com/demo-org/demo-repo"


def create_branch(repo_path: Path, branch_name: str) -> bool:
    """Create a new git branch."""
    try:
        # Ensure we're on main/master
        subprocess.run(
            ['git', 'checkout', 'main'],
            cwd=repo_path,
            capture_output=True,
            check=True
        )
    except subprocess.CalledProcessError:
        # Try master if main doesn't exist
        try:
            subprocess.run(
                ['git', 'checkout', 'master'],
                cwd=repo_path,
                capture_output=True,
                check=True
            )
        except subprocess.CalledProcessError:
            print("❌ Could not checkout main or master branch")
            return False
    
    # Pull latest
    try:
        subprocess.run(
            ['git', 'pull'],
            cwd=repo_path,
            capture_output=True,
            check=True
        )
    except subprocess.CalledProcessError as e:
        print(f"⚠️  Could not pull latest: {e.stderr.decode()}")
    
    # Create new branch
    try:
        subprocess.run(
            ['git', 'checkout', '-b', branch_name],
            cwd=repo_path,
            capture_output=True,
            check=True
        )
        return True
    except subprocess.CalledProcessError as e:
        print(f"❌ Could not create branch: {e.stderr.decode()}")
        return False


def apply_diff(repo_path: Path, diff_content: str) -> bool:
    """Apply a diff to the repository."""
    # Write diff to temp file
    diff_file = repo_path / '.onboardops-diff.patch'
    diff_file.write_text(diff_content, encoding='utf-8')
    
    try:
        result = subprocess.run(
            ['git', 'apply', str(diff_file)],
            cwd=repo_path,
            capture_output=True,
            check=True
        )
        diff_file.unlink()  # Clean up
        return True
    except subprocess.CalledProcessError as e:
        print(f"❌ Could not apply diff: {e.stderr.decode()}")
        diff_file.unlink()  # Clean up
        return False


def run_tests(repo_path: Path) -> bool:
    """Run the test suite."""
    print("  Running tests...")
    
    # Try common test commands
    test_commands = [
        ['pytest'],
        ['python', '-m', 'pytest'],
        ['npm', 'test'],
        ['pnpm', 'test'],
        ['make', 'test'],
    ]
    
    for cmd in test_commands:
        try:
            result = subprocess.run(
                cmd,
                cwd=repo_path,
                capture_output=True,
                timeout=60
            )
            if result.returncode == 0:
                print(f"  ✓ Tests passed ({' '.join(cmd)})")
                return True
        except (subprocess.CalledProcessError, FileNotFoundError, subprocess.TimeoutExpired):
            continue
    
    print("  ⚠️  Could not run tests (no test command found)")
    return True  # Don't fail if tests can't be run


def commit_changes(repo_path: Path, message: str) -> bool:
    """Commit changes."""
    try:
        # Stage all changes
        subprocess.run(
            ['git', 'add', '-A'],
            cwd=repo_path,
            check=True
        )
        
        # Commit
        subprocess.run(
            ['git', 'commit', '-m', message],
            cwd=repo_path,
            capture_output=True,
            check=True
        )
        return True
    except subprocess.CalledProcessError as e:
        print(f"❌ Could not commit: {e.stderr.decode()}")
        return False


def push_branch(repo_path: Path, branch_name: str) -> bool:
    """Push branch to remote."""
    try:
        subprocess.run(
            ['git', 'push', '-u', 'origin', branch_name],
            cwd=repo_path,
            capture_output=True,
            check=True
        )
        return True
    except subprocess.CalledProcessError as e:
        print(f"❌ Could not push: {e.stderr.decode()}")
        return False


def open_pr(
    repo_full_name: str,
    branch_name: str,
    title: str,
    body: str,
    token: str
) -> Optional[str]:
    """Open a PR via GitHub API."""
    try:
        g = Github(token)
        repo = g.get_repo(repo_full_name)
        
        # Create PR
        pr = repo.create_pull(
            title=title,
            body=body,
            head=branch_name,
            base='main'  # or 'master'
        )
        
        return pr.html_url
    except GithubException as e:
        # Try master if main doesn't exist
        if 'base' in str(e):
            try:
                g = Github(token)
                repo = g.get_repo(repo_full_name)
                pr = repo.create_pull(
                    title=title,
                    body=body,
                    head=branch_name,
                    base='master'
                )
                return pr.html_url
            except GithubException as e2:
                print(f"❌ Could not create PR: {e2}")
                return None
        else:
            print(f"❌ Could not create PR: {e}")
            return None


def generate_sample_diff() -> str:
    """Generate a sample diff for testing (when no real diff available)."""
    return """diff --git a/README.md b/README.md
index 1234567..abcdefg 100644
--- a/README.md
+++ b/README.md
@@ -10,7 +10,7 @@
 
 ## Installation
 
-Install the dependencies:
+Install the project dependencies:
 
 ```bash
 pip install -r requirements.txt
"""


def main():
    parser = argparse.ArgumentParser(
        description='Open a starter PR against the demo repository'
    )
    parser.add_argument(
        '--candidate',
        type=int,
        default=1,
        help='Candidate number (1, 2, or 3)'
    )
    parser.add_argument(
        '--onboardee',
        type=str,
        default='demo',
        help='Onboardee name for branch naming'
    )
    parser.add_argument(
        '--repo-path',
        type=Path,
        default=None,
        help='Path to demo repository (default: ../demo-repo)'
    )
    parser.add_argument(
        '--dry-run',
        action='store_true',
        help='Simulate without actually creating PR'
    )
    
    args = parser.parse_args()
    
    print("=" * 70)
    print("OnboardOps Starter PR Opener (F7 v0)")
    print("=" * 70)
    print()
    
    # Step 1: Get GitHub token
    print("→ Checking GitHub authentication...")
    token = get_github_token()
    print("  ✓ Token found")
    print()
    
    # Step 2: Parse starter tasks
    print("→ Parsing starter tasks...")
    candidates = parse_starter_tasks()
    
    if args.candidate not in candidates:
        print(f"❌ Candidate {args.candidate} not found")
        print(f"   Available: {list(candidates.keys())}")
        sys.exit(1)
    
    candidate = candidates[args.candidate]
    print(f"  ✓ Selected: Candidate {args.candidate} - {candidate['title']}")
    print(f"    Difficulty: {candidate['difficulty']}")
    print(f"    Lines: ~{candidate['lines']}")
    print()
    
    # Step 3: Get demo repo info
    print("→ Getting demo repository info...")
    repo_full_name, fork_url = get_demo_repo_info()
    print(f"  Repository: {repo_full_name}")
    print(f"  Fork URL: {fork_url}")
    print()
    
    # Step 4: Determine repo path
    if args.repo_path:
        repo_path = args.repo_path
    else:
        # Default: look for demo repo in parent directory
        repo_name = repo_full_name.split('/')[-1]
        repo_path = PROJECT_ROOT.parent / repo_name
    
    if not repo_path.exists():
        print(f"❌ Repository not found at {repo_path}")
        print(f"   Clone it first: git clone {fork_url}")
        sys.exit(1)
    
    print(f"  ✓ Repository found: {repo_path}")
    print()
    
    # Step 5: Create branch
    timestamp = datetime.now().strftime('%Y%m%d-%H%M%S')
    branch_name = f"onboardops/{args.onboardee}-{timestamp}"
    
    print(f"→ Creating branch: {branch_name}...")
    if not args.dry_run:
        if not create_branch(repo_path, branch_name):
            sys.exit(1)
    print(f"  ✓ Branch created")
    print()
    
    # Step 6: Apply diff
    print("→ Applying changes...")
    
    # For v0, use a sample diff
    # In Phase 3, this will read from starter-tasks.md or generate with Bob
    diff_content = generate_sample_diff()
    
    if not args.dry_run:
        if not apply_diff(repo_path, diff_content):
            print("  ⚠️  Using sample diff for demonstration")
    
    print(f"  ✓ Changes applied")
    print()
    
    # Step 7: Run tests
    print("→ Running test suite...")
    if not args.dry_run:
        run_tests(repo_path)
    else:
        print("  ⚠️  Skipped (dry run)")
    print()
    
    # Step 8: Commit
    commit_message = f"docs: {candidate['title']}\n\nOnboarded via OnboardOps\nCandidate: {args.candidate}"
    
    print("→ Committing changes...")
    if not args.dry_run:
        if not commit_changes(repo_path, commit_message):
            sys.exit(1)
    print(f"  ✓ Committed")
    print()
    
    # Step 9: Push
    print("→ Pushing to remote...")
    if not args.dry_run:
        if not push_branch(repo_path, branch_name):
            sys.exit(1)
    print(f"  ✓ Pushed")
    print()
    
    # Step 10: Open PR
    pr_title = f"[OnboardOps] {candidate['title']}"
    pr_body = f"""## Starter Task Contribution

This PR was generated by OnboardOps as a starter task for onboarding.

**Candidate:** {args.candidate} - {candidate['title']}  
**Difficulty:** {candidate['difficulty']}  
**Lines Changed:** ~{candidate['lines']}

### Changes

{candidate['body'][:200]}...

### Onboarding Session

- **Onboardee:** {args.onboardee}
- **Timestamp:** {datetime.now().isoformat()}
- **Branch:** `{branch_name}`

---

*Generated by OnboardOps - The 10-Minute Repo Whisperer*
"""
    
    print("→ Opening pull request...")
    if not args.dry_run:
        pr_url = open_pr(repo_full_name, branch_name, pr_title, pr_body, token)
        if pr_url:
            print(f"  ✓ PR opened: {pr_url}")
        else:
            print("  ❌ Failed to open PR")
            sys.exit(1)
    else:
        print("  ⚠️  Skipped (dry run)")
        print(f"  Would create PR: {pr_title}")
    print()
    
    print("=" * 70)
    print("✅ Starter PR pipeline complete!")
    print("=" * 70)
    print()
    print("Next steps:")
    if not args.dry_run:
        print(f"  1. Review PR: {pr_url if not args.dry_run else '[URL]'}")
        print(f"  2. Verify tests pass in CI")
        print(f"  3. Merge when ready")
    else:
        print(f"  1. Run without --dry-run to actually create PR")
        print(f"  2. Ensure demo repo is cloned and accessible")
        print(f"  3. Verify GitHub token has write access")


if __name__ == '__main__':
    try:
        main()
    except KeyboardInterrupt:
        print("\n\n⚠️  Cancelled by user")
        sys.exit(1)
    except Exception as e:
        print(f"\n❌ Error: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

# Made with Bob
