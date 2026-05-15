#!/usr/bin/env python3
"""
OnboardOps AGENTS.md Generator (F8 v0)

Generates a personalized AGENTS.md file for the target repository using:
1. Repository structure analysis
2. Stage 1 cartography data (dependency graph)
3. Bob Shell with agents-md-recipe skill

This is the v0 implementation for Phase 2. Full personalization with all
four cartography stages will be implemented in Phase 3 (F8.1).

Usage:
    python scripts/generate_agents_md.py /path/to/demo/repo
    python scripts/generate_agents_md.py /path/to/demo/repo --output custom-agents.md

Dependencies: None (stdlib only, calls bob shell)
"""

import argparse
import json
import os
import subprocess
import sys
from pathlib import Path
from typing import Dict, List, Optional

# Project root
PROJECT_ROOT = Path(__file__).parent.parent


def detect_repo_name(repo_path: Path) -> str:
    """Detect repository name from directory or git remote."""
    # Try git remote first
    try:
        result = subprocess.run(
            ['git', 'remote', 'get-url', 'origin'],
            cwd=repo_path,
            capture_output=True,
            text=True,
            check=True
        )
        remote_url = result.stdout.strip()
        # Extract repo name from URL (e.g., github.com/user/repo.git -> repo)
        repo_name = remote_url.split('/')[-1].replace('.git', '')
        return repo_name
    except (subprocess.CalledProcessError, FileNotFoundError):
        pass
    
    # Fallback to directory name
    return repo_path.name


def analyze_directory_structure(repo_path: Path) -> Dict[str, any]:
    """Analyze repository structure to build a simple dependency graph."""
    structure = {
        'files': [],
        'directories': [],
        'languages': set(),
        'entry_points': [],
    }
    
    # Common entry point patterns
    entry_patterns = {
        'main.py': 'Python CLI',
        '__main__.py': 'Python package entry',
        'app.py': 'Python web app',
        'server.py': 'Python server',
        'index.js': 'JavaScript entry',
        'main.js': 'JavaScript entry',
        'index.ts': 'TypeScript entry',
        'main.ts': 'TypeScript entry',
    }
    
    # Walk the repository
    for root, dirs, files in os.walk(repo_path):
        # Skip common ignore patterns
        dirs[:] = [d for d in dirs if d not in {'.git', 'node_modules', '__pycache__', '.venv', 'venv', 'dist', 'build'}]
        
        rel_root = Path(root).relative_to(repo_path)
        
        for file in files:
            file_path = rel_root / file
            structure['files'].append(str(file_path))
            
            # Detect language
            ext = Path(file).suffix
            if ext in {'.py', '.pyi'}:
                structure['languages'].add('Python')
            elif ext in {'.js', '.jsx'}:
                structure['languages'].add('JavaScript')
            elif ext in {'.ts', '.tsx'}:
                structure['languages'].add('TypeScript')
            elif ext in {'.java'}:
                structure['languages'].add('Java')
            elif ext in {'.go'}:
                structure['languages'].add('Go')
            elif ext in {'.rs'}:
                structure['languages'].add('Rust')
            
            # Detect entry points
            if file in entry_patterns:
                structure['entry_points'].append({
                    'file': str(file_path),
                    'type': entry_patterns[file]
                })
    
    structure['languages'] = list(structure['languages'])
    return structure


def build_simple_dependency_graph(repo_path: Path, structure: Dict) -> str:
    """Build a simple text-based dependency graph from file structure."""
    # For v0, we'll create a simple hierarchical view
    # In Phase 3, this will use actual import analysis
    
    lines = []
    lines.append("```")
    
    # Group files by top-level directory
    files_by_dir = {}
    for file in structure['files'][:20]:  # Limit to first 20 files
        parts = Path(file).parts
        if len(parts) > 1:
            top_dir = parts[0]
            if top_dir not in files_by_dir:
                files_by_dir[top_dir] = []
            files_by_dir[top_dir].append(file)
        else:
            if 'root' not in files_by_dir:
                files_by_dir['root'] = []
            files_by_dir['root'].append(file)
    
    # Render as tree
    for dir_name, files in sorted(files_by_dir.items()):
        if dir_name == 'root':
            for file in files[:5]:
                lines.append(f"{file}")
        else:
            lines.append(f"{dir_name}/")
            for file in files[:5]:
                lines.append(f"  ├── {Path(file).name}")
            if len(files) > 5:
                lines.append(f"  └── ... ({len(files) - 5} more files)")
    
    lines.append("```")
    return '\n'.join(lines)


def generate_agents_md_with_bob(
    repo_path: Path,
    repo_name: str,
    structure: Dict,
    dependency_graph: str
) -> str:
    """Use Bob Shell to generate AGENTS.md content."""
    
    # Prepare context for Bob
    context = f"""Repository: {repo_name}
Path: {repo_path}
Languages: {', '.join(structure['languages'])}
Total files: {len(structure['files'])}

Entry points detected:
{chr(10).join(f"- {ep['file']} ({ep['type']})" for ep in structure['entry_points'])}

Dependency Graph (Stage 1):
{dependency_graph}

Using the agents-md-recipe skill, generate a complete AGENTS.md file for this repository.
Include:
1. One-line repository summary
2. The dependency graph shown above
3. Key modules (infer from file structure)
4. Entry points listed above
5. Open Questions section

Output ONLY the markdown content, no explanations."""
    
    # Write context to temp file
    context_file = PROJECT_ROOT / '.onboardops' / 'agents-context.txt'
    context_file.parent.mkdir(parents=True, exist_ok=True)
    context_file.write_text(context, encoding='utf-8')
    
    print(f"📝 Calling Bob Shell to generate AGENTS.md...")
    print(f"   Context: {len(context)} characters")
    print(f"   Skill: agents-md-recipe")
    
    try:
        # Call Bob Shell
        result = subprocess.run(
            ['bob', '-p', context],
            capture_output=True,
            text=True,
            timeout=60
        )
        
        if result.returncode != 0:
            print(f"❌ Bob Shell failed: {result.stderr}")
            return generate_fallback_agents_md(repo_name, structure, dependency_graph)
        
        output = result.stdout.strip()
        
        # Extract markdown content (Bob may add explanations)
        # Look for markdown starting with # or ```
        if '```markdown' in output:
            start = output.index('```markdown') + len('```markdown')
            end = output.rindex('```')
            output = output[start:end].strip()
        elif output.startswith('#'):
            # Already markdown
            pass
        else:
            # Fallback
            print("⚠️  Bob output doesn't look like markdown, using fallback")
            return generate_fallback_agents_md(repo_name, structure, dependency_graph)
        
        return output
    
    except (subprocess.TimeoutExpired, FileNotFoundError) as e:
        print(f"⚠️  Bob Shell not available or timed out: {e}")
        print(f"   Using fallback generator...")
        return generate_fallback_agents_md(repo_name, structure, dependency_graph)


def generate_fallback_agents_md(
    repo_name: str,
    structure: Dict,
    dependency_graph: str
) -> str:
    """Generate AGENTS.md without Bob (fallback)."""
    
    # Infer summary from languages and structure
    lang_str = ', '.join(structure['languages']) if structure['languages'] else 'Unknown'
    summary = f"A {lang_str} project with {len(structure['files'])} files"
    
    # Build key modules list
    key_modules = []
    for ep in structure['entry_points'][:3]:
        key_modules.append(f"- `{ep['file']}` - {ep['type']}")
    
    content = f"""# {repo_name}

{summary}

## Architecture Overview

### Dependency Graph (Stage 1 Cartography)

{dependency_graph}

**Key modules:**
{chr(10).join(key_modules) if key_modules else '- (Entry points not detected)'}

**Module relationships:**
- Analysis pending (requires full cartography run)

## Entry Points

{chr(10).join(f"- {ep['type']}: `{ep['file']}`" for ep in structure['entry_points']) if structure['entry_points'] else '- None detected'}

## Open Questions

The following questions remain for deeper exploration:

1. What are the main data models and their relationships?
2. How is error handling implemented across the codebase?
3. What testing patterns are used?
4. Are there any known technical debt areas?
5. What deployment or build processes exist?

## Next Steps for AI Agents

When working on this repository:
1. Review the dependency graph to understand module boundaries
2. Check entry points before adding new routes or commands
3. Follow existing patterns discovered in Stage 4 (conventions)
4. Consult change hotspots (Stage 3) for frequently modified areas

---

*Generated by OnboardOps cartography on {subprocess.run(['date', '+%Y-%m-%d'], capture_output=True, text=True).stdout.strip()}*
*This file should be updated as the repository evolves*
"""
    
    return content


def main():
    parser = argparse.ArgumentParser(
        description='Generate personalized AGENTS.md for a repository'
    )
    parser.add_argument(
        'repo_path',
        type=Path,
        help='Path to the target repository'
    )
    parser.add_argument(
        '--output',
        type=Path,
        default=None,
        help='Output file path (default: <repo>/AGENTS.md)'
    )
    parser.add_argument(
        '--no-bob',
        action='store_true',
        help='Skip Bob Shell and use fallback generator'
    )
    
    args = parser.parse_args()
    
    # Validate repo path
    if not args.repo_path.exists():
        print(f"❌ Repository path does not exist: {args.repo_path}")
        sys.exit(1)
    
    if not args.repo_path.is_dir():
        print(f"❌ Repository path is not a directory: {args.repo_path}")
        sys.exit(1)
    
    # Determine output path
    output_path = args.output or (args.repo_path / 'AGENTS.md')
    
    print("=" * 70)
    print("OnboardOps AGENTS.md Generator (F8 v0)")
    print("=" * 70)
    print(f"Repository: {args.repo_path}")
    print(f"Output: {output_path}")
    print()
    
    # Step 1: Detect repo name
    print("📂 Detecting repository name...")
    repo_name = detect_repo_name(args.repo_path)
    print(f"   Name: {repo_name}")
    print()
    
    # Step 2: Analyze structure
    print("🔍 Analyzing repository structure...")
    structure = analyze_directory_structure(args.repo_path)
    print(f"   Files: {len(structure['files'])}")
    print(f"   Languages: {', '.join(structure['languages']) or 'Unknown'}")
    print(f"   Entry points: {len(structure['entry_points'])}")
    print()
    
    # Step 3: Build dependency graph
    print("📊 Building dependency graph...")
    dependency_graph = build_simple_dependency_graph(args.repo_path, structure)
    print(f"   Graph: {len(dependency_graph)} characters")
    print()
    
    # Step 4: Generate AGENTS.md
    if args.no_bob:
        print("⚙️  Using fallback generator (--no-bob specified)...")
        content = generate_fallback_agents_md(repo_name, structure, dependency_graph)
    else:
        content = generate_agents_md_with_bob(
            args.repo_path,
            repo_name,
            structure,
            dependency_graph
        )
    
    print()
    
    # Step 5: Write output
    print(f"💾 Writing AGENTS.md to {output_path}...")
    output_path.write_text(content, encoding='utf-8')
    print(f"   Size: {len(content)} characters")
    print()
    
    print("=" * 70)
    print("✅ AGENTS.md generated successfully!")
    print("=" * 70)
    print(f"\nNext steps:")
    print(f"  1. Review {output_path}")
    print(f"  2. Commit to repository: git add AGENTS.md && git commit -m 'docs: Add AGENTS.md'")
    print(f"  3. Update as repository evolves")


if __name__ == '__main__':
    try:
        main()
    except KeyboardInterrupt:
        print("\n\n⚠️  Generation cancelled by user")
        sys.exit(1)
    except Exception as e:
        print(f"\n❌ Error: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

# Made with Bob
