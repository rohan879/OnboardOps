#!/usr/bin/env python3
"""
OnboardOps AGENTS.md Generator (F8 Full Implementation)

Generates a personalized AGENTS.md file for the target repository using:
1. All four cartography stages (dependency graph, entry points, hotspots, conventions)
2. Certification results from session telemetry
3. Bob Shell with agents-md-recipe skill for composition

This is the full F8 implementation for Phase 3 (FR-8.1).

Usage:
    python scripts/generate_agents_md.py /path/to/demo/repo
    python scripts/generate_agents_md.py /path/to/demo/repo --output custom-agents.md
    python scripts/generate_agents_md.py /path/to/demo/repo --session-file path/to/session.jsonl

Dependencies: None (stdlib only, calls bob shell)
"""

import argparse
import json
import os
import subprocess
import sys
from datetime import datetime
from pathlib import Path
from typing import Dict, Optional, Any

# Project root
PROJECT_ROOT = Path(__file__).parent.parent

# User-edited section markers
USER_EDIT_START = "<!-- USER-EDITED -->"
USER_EDIT_END = "<!-- END USER-EDITED -->"


def extract_user_edited_sections(content: str) -> Dict[str, str]:
    """Extract user-edited sections from existing AGENTS.md."""
    sections = {}
    lines = content.split("\n")

    in_user_section = False
    current_section_name = None
    current_section_lines = []

    for line in lines:
        if USER_EDIT_START in line:
            in_user_section = True
            current_section_lines = [line]
            # Try to extract section name from previous line (usually a heading)
            continue

        if in_user_section:
            current_section_lines.append(line)

            if USER_EDIT_END in line:
                # End of user section
                section_content = "\n".join(current_section_lines)

                # Try to find section name from the content
                for section_line in current_section_lines:
                    if section_line.startswith("#"):
                        # Extract heading as section name
                        current_section_name = section_line.strip("#").strip()
                        break

                if current_section_name:
                    sections[current_section_name] = section_content

                in_user_section = False
                current_section_name = None
                current_section_lines = []

    return sections


def merge_user_sections(new_content: str, user_sections: Dict[str, str]) -> str:
    """Merge user-edited sections back into new content."""
    if not user_sections:
        return new_content

    # For each user section, try to find the corresponding section in new content
    # and replace it with the user-edited version
    merged_content = new_content

    for section_name, user_content in user_sections.items():
        # Look for the section heading in new content
        lines = merged_content.split("\n")
        section_start = -1
        section_end = -1

        for i, line in enumerate(lines):
            if line.startswith("#") and section_name.lower() in line.lower():
                section_start = i
                # Find the next section or end of file
                for j in range(i + 1, len(lines)):
                    if lines[j].startswith("#") and not lines[j].startswith("####"):
                        section_end = j
                        break
                if section_end == -1:
                    section_end = len(lines)
                break

        if section_start != -1:
            # Replace the section with user-edited version
            lines = (
                lines[:section_start] + user_content.split("\n") + lines[section_end:]
            )
            merged_content = "\n".join(lines)

    return merged_content


def backup_existing_file(file_path: Path) -> Optional[Path]:
    """Backup existing file to .bak if it exists."""
    if not file_path.exists():
        return None

    backup_path = file_path.with_suffix(file_path.suffix + ".bak")

    try:
        # Read existing content
        existing_content = file_path.read_text(encoding="utf-8")
        # Write to backup
        backup_path.write_text(existing_content, encoding="utf-8")
        return backup_path
    except Exception as e:
        print(f"⚠️  Warning: Could not create backup: {e}")
        return None


def load_cartography_data(session_file: Optional[Path] = None) -> Dict[str, Any]:
    """Load cartography data from session JSONL file."""
    cartography = {
        "stage1": None,  # Dependency graph
        "stage2": None,  # Entry points
        "stage3": None,  # Hotspots
        "stage4": None,  # Conventions
    }

    if not session_file:
        # Try to find most recent session file
        sessions_dir = PROJECT_ROOT / ".onboardops" / "sessions"
        if sessions_dir.exists():
            session_files = sorted(
                sessions_dir.glob("*.jsonl"),
                key=lambda p: p.stat().st_mtime,
                reverse=True,
            )
            if session_files:
                session_file = session_files[0]

    if not session_file or not session_file.exists():
        return cartography

    print(f"📊 Loading cartography data from {session_file.name}...")

    try:
        with open(session_file, "r", encoding="utf-8") as f:
            for line in f:
                try:
                    event = json.loads(line.strip())
                    if event.get("event_type") == "CardEmit":
                        data = event.get("event_data", {})
                        card_type = data.get("card_type", "")

                        if card_type == "dependency_graph":
                            cartography["stage1"] = data
                        elif card_type == "entry_points":
                            cartography["stage2"] = data
                        elif card_type == "hotspots":
                            cartography["stage3"] = data
                        elif card_type == "conventions":
                            cartography["stage4"] = data
                except json.JSONDecodeError:
                    continue

        stages_found = sum(1 for v in cartography.values() if v is not None)
        print(f"   Found {stages_found}/4 cartography stages")

    except Exception as e:
        print(f"   ⚠️  Error loading session file: {e}")

    return cartography


def load_certification_results(session_file: Optional[Path] = None) -> Dict[str, Any]:
    """Load certification results from session JSONL file."""
    certification = {
        "questions": [],
        "passed": 0,
        "failed": 0,
        "partial": 0,
    }

    if not session_file:
        sessions_dir = PROJECT_ROOT / ".onboardops" / "sessions"
        if sessions_dir.exists():
            session_files = sorted(
                sessions_dir.glob("*.jsonl"),
                key=lambda p: p.stat().st_mtime,
                reverse=True,
            )
            if session_files:
                session_file = session_files[0]

    if not session_file or not session_file.exists():
        return certification

    print(f"📝 Loading certification results from {session_file.name}...")

    try:
        with open(session_file, "r", encoding="utf-8") as f:
            for line in f:
                try:
                    event = json.loads(line.strip())
                    if event.get("event_type") == "CertificationGrade":
                        data = event.get("event_data", {})
                        result = data.get("result", "fail")

                        certification["questions"].append(
                            {
                                "question": data.get("question", ""),
                                "answer": data.get("answer", ""),
                                "result": result,
                                "feedback": data.get("feedback", ""),
                            }
                        )

                        if result == "pass":
                            certification["passed"] += 1
                        elif result == "partial":
                            certification["partial"] += 1
                        else:
                            certification["failed"] += 1

                except json.JSONDecodeError:
                    continue

        total = len(certification["questions"])
        if total > 0:
            print(
                f"   Found {total} certification questions ({certification['passed']} passed)"
            )

    except Exception as e:
        print(f"   ⚠️  Error loading certification: {e}")

    return certification


def detect_repo_name(repo_path: Path) -> str:
    """Detect repository name from directory or git remote."""
    # Try git remote first
    try:
        result = subprocess.run(
            ["git", "remote", "get-url", "origin"],
            cwd=repo_path,
            capture_output=True,
            text=True,
            check=True,
        )
        remote_url = result.stdout.strip()
        # Extract repo name from URL (e.g., github.com/user/repo.git -> repo)
        repo_name = remote_url.split("/")[-1].replace(".git", "")
        return repo_name
    except (subprocess.CalledProcessError, FileNotFoundError):
        pass

    # Fallback to directory name
    return repo_path.name


def analyze_directory_structure(repo_path: Path) -> Dict[str, Any]:
    """Analyze repository structure to build a simple dependency graph."""
    structure = {
        "files": [],
        "directories": [],
        "languages": set(),
        "entry_points": [],
    }

    # Common entry point patterns
    entry_patterns = {
        "main.py": "Python CLI",
        "__main__.py": "Python package entry",
        "app.py": "Python web app",
        "server.py": "Python server",
        "index.js": "JavaScript entry",
        "main.js": "JavaScript entry",
        "index.ts": "TypeScript entry",
        "main.ts": "TypeScript entry",
    }

    # Walk the repository
    for root, dirs, files in os.walk(repo_path):
        # Skip common ignore patterns
        dirs[:] = [
            d
            for d in dirs
            if d
            not in {
                ".git",
                "node_modules",
                "__pycache__",
                ".venv",
                "venv",
                "dist",
                "build",
            }
        ]

        rel_root = Path(root).relative_to(repo_path)

        for file in files:
            file_path = rel_root / file
            structure["files"].append(str(file_path))

            # Detect language
            ext = Path(file).suffix
            if ext in {".py", ".pyi"}:
                structure["languages"].add("Python")
            elif ext in {".js", ".jsx"}:
                structure["languages"].add("JavaScript")
            elif ext in {".ts", ".tsx"}:
                structure["languages"].add("TypeScript")
            elif ext in {".java"}:
                structure["languages"].add("Java")
            elif ext in {".go"}:
                structure["languages"].add("Go")
            elif ext in {".rs"}:
                structure["languages"].add("Rust")

            # Detect entry points
            if file in entry_patterns:
                structure["entry_points"].append(
                    {"file": str(file_path), "type": entry_patterns[file]}
                )

    structure["languages"] = list(structure["languages"])
    return structure


def build_simple_dependency_graph(repo_path: Path, structure: Dict) -> str:
    """Build a simple text-based dependency graph from file structure."""
    # For v0, we'll create a simple hierarchical view
    # In Phase 3, this will use actual import analysis

    lines = []
    lines.append("```")

    # Group files by top-level directory
    files_by_dir = {}
    for file in structure["files"][:20]:  # Limit to first 20 files
        parts = Path(file).parts
        if len(parts) > 1:
            top_dir = parts[0]
            if top_dir not in files_by_dir:
                files_by_dir[top_dir] = []
            files_by_dir[top_dir].append(file)
        else:
            if "root" not in files_by_dir:
                files_by_dir["root"] = []
            files_by_dir["root"].append(file)

    # Render as tree
    for dir_name, files in sorted(files_by_dir.items()):
        if dir_name == "root":
            for file in files[:5]:
                lines.append(f"{file}")
        else:
            lines.append(f"{dir_name}/")
            for file in files[:5]:
                lines.append(f"  ├── {Path(file).name}")
            if len(files) > 5:
                lines.append(f"  └── ... ({len(files) - 5} more files)")

    lines.append("```")
    return "\n".join(lines)


def generate_agents_md_with_bob(
    repo_path: Path,
    repo_name: str,
    structure: Dict[str, Any],
    cartography: Dict[str, Any],
    certification: Dict[str, Any],
) -> str:
    """Use Bob Shell to generate AGENTS.md content with all 5 sections."""

    # Build comprehensive context for Bob
    context_parts = [
        f"Repository: {repo_name}",
        f"Path: {repo_path}",
        f"Languages: {', '.join(structure['languages'])}",
        f"Total files: {len(structure['files'])}",
        "",
        "=== CARTOGRAPHY DATA ===",
        "",
    ]

    # Section 1: Dependency Graph (Stage 1)
    if cartography["stage1"]:
        stage1 = cartography["stage1"]
        context_parts.append("Stage 1 - Dependency Graph:")
        context_parts.append(json.dumps(stage1.get("data", {}), indent=2))
        context_parts.append("")

    # Section 2: Entry Points (Stage 2)
    if cartography["stage2"]:
        stage2 = cartography["stage2"]
        context_parts.append("Stage 2 - Entry Points:")
        context_parts.append(json.dumps(stage2.get("data", {}), indent=2))
        context_parts.append("")

    # Section 3: Hotspots (Stage 3)
    if cartography["stage3"]:
        stage3 = cartography["stage3"]
        context_parts.append("Stage 3 - Change Hotspots:")
        context_parts.append(json.dumps(stage3.get("data", {}), indent=2))
        context_parts.append("")

    # Section 4: Conventions (Stage 4)
    if cartography["stage4"]:
        stage4 = cartography["stage4"]
        context_parts.append("Stage 4 - Project Conventions:")
        context_parts.append(json.dumps(stage4.get("data", {}), indent=2))
        context_parts.append("")

    # Section 5: Certification Results
    if certification["questions"]:
        context_parts.append("=== CERTIFICATION RESULTS ===")
        context_parts.append(f"Passed: {certification['passed']}")
        context_parts.append(f"Partial: {certification['partial']}")
        context_parts.append(f"Failed: {certification['failed']}")
        context_parts.append("")
        context_parts.append("Failed/Partial Questions (for Open Questions section):")
        for q in certification["questions"]:
            if q["result"] in ["fail", "partial"]:
                context_parts.append(f"- {q['question']} ({q['result']})")
        context_parts.append("")

    context_parts.append("=== TASK ===")
    context_parts.append("")
    context_parts.append(
        "Using the agents-md-recipe skill, generate a complete AGENTS.md file with ALL FIVE sections:"
    )
    context_parts.append(
        "1. Repo Cartography Summary - assembled from all four cartography stages above"
    )
    context_parts.append("2. Hotspots and Their Owners - from Stage 3 data")
    context_parts.append("3. Project Conventions - from Stage 4 data")
    context_parts.append(
        "4. Open Questions - include failed/partial certification questions"
    )
    context_parts.append(
        "5. Recommended Next Reading - Bob-curated from cartography output"
    )
    context_parts.append("")
    context_parts.append("Target: ≤4000 tokens total")
    context_parts.append("Output ONLY the markdown content, no explanations.")

    context = "\n".join(context_parts)

    # Write context to temp file
    context_file = PROJECT_ROOT / ".onboardops" / "agents-context.txt"
    context_file.parent.mkdir(parents=True, exist_ok=True)
    context_file.write_text(context, encoding="utf-8")

    print("📝 Calling Bob Shell to generate AGENTS.md...")
    print(f"   Context: {len(context)} characters")
    print("   Skill: agents-md-recipe")

    try:
        # Call Bob Shell
        result = subprocess.run(
            ["bob", "-p", context], capture_output=True, text=True, timeout=60
        )

        if result.returncode != 0:
            print(f"❌ Bob Shell failed: {result.stderr}")
            return generate_fallback_agents_md(
                repo_name, structure, cartography, certification
            )

        output = result.stdout.strip()

        # Extract markdown content (Bob may add explanations)
        # Look for markdown starting with # or ```
        if "```markdown" in output:
            start = output.index("```markdown") + len("```markdown")
            end = output.rindex("```")
            output = output[start:end].strip()
        elif output.startswith("#"):
            # Already markdown
            pass
        else:
            # Fallback
            print("⚠️  Bob output doesn't look like markdown, using fallback")
            return generate_fallback_agents_md(
                repo_name, structure, cartography, certification
            )

        return output

    except (subprocess.TimeoutExpired, FileNotFoundError) as e:
        print(f"⚠️  Bob Shell not available or timed out: {e}")
        print("   Using fallback generator...")
        return generate_fallback_agents_md(
            repo_name, structure, cartography, certification
        )


def generate_fallback_agents_md(
    repo_name: str,
    structure: Dict[str, Any],
    cartography: Dict[str, Any],
    certification: Dict[str, Any],
) -> str:
    """Generate AGENTS.md without Bob (fallback) - all 5 sections."""

    # Infer summary from languages and structure
    lang_str = (
        ", ".join(structure["languages"]) if structure["languages"] else "Unknown"
    )
    summary = f"A {lang_str} project with {len(structure['files'])} files"

    # Section 1: Repo Cartography Summary
    cartography_summary = "## 1. Repo Cartography Summary\n\n"
    if cartography["stage1"]:
        cartography_summary += "### Dependency Graph\n\n"
        stage1_data = cartography["stage1"].get("data", {})
        nodes = stage1_data.get("nodes", [])
        if nodes:
            cartography_summary += f"- **Modules analyzed**: {len(nodes)}\n"
            hubs = [n for n in nodes if n.get("is_hub", False)]
            if hubs:
                cartography_summary += f"- **Hub modules**: {', '.join(h.get('label', '') for h in hubs[:3])}\n"
        cartography_summary += "\n"
    else:
        cartography_summary += "Dependency graph data not available.\n\n"

    # Section 2: Hotspots and Their Owners
    hotspots_section = "## 2. Hotspots and Their Owners\n\n"
    if cartography["stage3"]:
        stage3_data = cartography["stage3"].get("data", {})
        hotspots = stage3_data.get("hotspots", [])
        if hotspots:
            hotspots_section += "Files with frequent changes:\n\n"
            for hs in hotspots[:5]:
                hotspots_section += (
                    f"- `{hs.get('file', '')}` - {hs.get('churn', 0)} changes\n"
                )
        else:
            hotspots_section += "No hotspot data available.\n"
    else:
        hotspots_section += "Hotspot analysis pending (requires Stage 3 cartography).\n"
    hotspots_section += "\n"

    # Section 3: Project Conventions
    conventions_section = "## 3. Project Conventions\n\n"
    if cartography["stage4"]:
        stage4_data = cartography["stage4"].get("data", {})
        conventions = stage4_data.get("conventions", [])
        if conventions:
            for conv in conventions[:5]:
                conventions_section += (
                    f"- **{conv.get('name', '')}**: {conv.get('description', '')}\n"
                )
        else:
            conventions_section += "No conventions detected.\n"
    else:
        conventions_section += (
            "Convention analysis pending (requires Stage 4 cartography).\n"
        )
    conventions_section += "\n"

    # Section 4: Open Questions
    open_questions = "## 4. Open Questions\n\n"
    if certification["questions"]:
        failed_questions = [
            q for q in certification["questions"] if q["result"] in ["fail", "partial"]
        ]
        if failed_questions:
            open_questions += (
                "Questions from certification that need deeper exploration:\n\n"
            )
            for i, q in enumerate(failed_questions[:5], 1):
                open_questions += f"{i}. {q['question']}\n"
        else:
            open_questions += "All certification questions passed!\n"
    else:
        open_questions += "Standard questions for exploration:\n\n"
        open_questions += "1. What are the main data models and their relationships?\n"
        open_questions += "2. How is error handling implemented?\n"
        open_questions += "3. What testing patterns are used?\n"
    open_questions += "\n"

    # Section 5: Recommended Next Reading
    next_reading = "## 5. Recommended Next Reading\n\n"
    if structure["entry_points"]:
        next_reading += "Start with these entry points:\n\n"
        for ep in structure["entry_points"][:3]:
            next_reading += f"- `{ep['file']}` - {ep['type']}\n"
    else:
        next_reading += "- Review the dependency graph to identify core modules\n"
        next_reading += "- Check the hotspots for frequently modified areas\n"
    next_reading += "\n"

    # Assemble final content
    content = f"""# {repo_name}

{summary}

{cartography_summary}{hotspots_section}{conventions_section}{open_questions}{next_reading}---

*Generated by OnboardOps on {datetime.now().strftime('%Y-%m-%d')}*
*This file should be updated as the repository evolves*
"""

    return content


def main():
    parser = argparse.ArgumentParser(
        description="Generate personalized AGENTS.md for a repository"
    )
    parser.add_argument("repo_path", type=Path, help="Path to the target repository")
    parser.add_argument(
        "--output",
        type=Path,
        default=None,
        help="Output file path (default: <repo>/AGENTS.md)",
    )
    parser.add_argument(
        "--no-bob",
        action="store_true",
        help="Skip Bob Shell and use fallback generator",
    )
    parser.add_argument(
        "--session-file",
        type=Path,
        default=None,
        help="Path to session JSONL file (default: most recent in .onboardops/sessions/)",
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
    output_path = args.output or (args.repo_path / "AGENTS.md")

    print("=" * 70)
    print("OnboardOps AGENTS.md Generator (F8 Full)")
    print("=" * 70)
    print(f"Repository: {args.repo_path}")
    print(f"Output: {output_path}")
    print()

    # Step 1: Detect repo name
    print("📂 Detecting repository name...")
    repo_name = detect_repo_name(args.repo_path)
    print(f"   Name: {repo_name}")
    print()

    # Step 2: Load cartography data
    cartography = load_cartography_data(args.session_file)
    print()

    # Step 3: Load certification results
    certification = load_certification_results(args.session_file)
    print()

    # Step 4: Analyze structure (fallback if no cartography)
    print("🔍 Analyzing repository structure...")
    structure = analyze_directory_structure(args.repo_path)
    print(f"   Files: {len(structure['files'])}")
    print(f"   Languages: {', '.join(structure['languages']) or 'Unknown'}")
    print(f"   Entry points: {len(structure['entry_points'])}")
    print()

    # Step 5: Check for existing AGENTS.md and extract user sections
    user_sections = {}
    if output_path.exists():
        print("📄 Existing AGENTS.md found, checking for user-edited sections...")
        try:
            existing_content = output_path.read_text(encoding="utf-8")
            user_sections = extract_user_edited_sections(existing_content)
            if user_sections:
                print(f"   Found {len(user_sections)} user-edited section(s)")
                for section_name in user_sections.keys():
                    print(f"   - {section_name}")
            else:
                print("   No user-edited sections found")
        except Exception as e:
            print(f"   ⚠️  Could not read existing file: {e}")
        print()

    # Step 6: Generate new AGENTS.md content
    if args.no_bob:
        print("⚙️  Using fallback generator (--no-bob specified)...")
        content = generate_fallback_agents_md(
            repo_name, structure, cartography, certification
        )
    else:
        content = generate_agents_md_with_bob(
            args.repo_path, repo_name, structure, cartography, certification
        )

    print()

    # Step 7: Merge user-edited sections back in
    if user_sections:
        print("🔄 Merging user-edited sections...")
        content = merge_user_sections(content, user_sections)
        print(f"   Merged {len(user_sections)} section(s)")
        print()

    # Step 8: Backup existing file
    if output_path.exists():
        print("💾 Creating backup...")
        backup_path = backup_existing_file(output_path)
        if backup_path:
            print(f"   Backup saved to: {backup_path}")
        print()

    # Step 9: Write output
    print(f"💾 Writing AGENTS.md to {output_path}...")
    output_path.write_text(content, encoding="utf-8")
    print(f"   Size: {len(content)} characters")
    print()

    print("=" * 70)
    print("✅ AGENTS.md generated successfully!")
    print("=" * 70)
    print("\nNext steps:")
    print(f"  1. Review {output_path}")
    print(
        "  2. Commit to repository: git add AGENTS.md && git commit -m 'docs: Add AGENTS.md'"
    )
    print("  3. Update as repository evolves")


if __name__ == "__main__":
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
