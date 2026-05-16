#!/usr/bin/env python3
"""
OnboardOps Bob Session Export Pipeline

Automates the process of:
1. Collecting raw Bob session exports from each dev
2. Running PII scrubber on each export
3. Renaming with canonical NN_title.md format
4. Collecting Bobcoin consumption screenshots
5. Generating bob_sessions/README.md index

Usage:
    python scripts/export_bob_sessions.py
    make export-bob-sessions

Dependencies: None (stdlib only)
"""

import re
import subprocess
import sys
from pathlib import Path
from typing import List, Dict, Tuple

# Project root
PROJECT_ROOT = Path(__file__).parent.parent
BOB_SESSIONS_DIR = PROJECT_ROOT / "bob_sessions"
SCRUBBER_SCRIPT = PROJECT_ROOT / "scripts" / "scrub.py"

# Dev directories
DEVS = ["dev1", "dev2", "dev3", "dev4", "dev5"]

# Dev focus areas (from Phase 1 doc)
DEV_FOCUS = {
    "dev1": "Bob Architect - .bob/ configuration, modes, skills",
    "dev2": "Backend / MCP - Institutional Knowledge server, WebSocket bridge",
    "dev3": "Frontend / Dashboard - Next.js dashboard, real-time UI",
    "dev4": "Infra / Bob Shell - Bootstrap engine, auto-recovery, demo machine",
    "dev5": "Integration Engineer - PR generator, AGENTS.md builder, telemetry",
}


def ensure_directories():
    """Ensure all required directories exist."""
    for dev in DEVS:
        dev_dir = BOB_SESSIONS_DIR / dev
        raw_dir = dev_dir / "raw"
        raw_dir.mkdir(parents=True, exist_ok=True)
        print(f"✓ Ensured {raw_dir} exists")


def prompt_for_exports(dev: str) -> List[Path]:
    """Prompt developer to place exports in raw/ directory."""
    dev_dir = BOB_SESSIONS_DIR / dev
    raw_dir = dev_dir / "raw"

    print(f"\n{'='*70}")
    print(f"📦 {dev.upper()} - {DEV_FOCUS.get(dev, 'Developer')}")
    print(f"{'='*70}")
    print("\nPlease place your Bob task exports in:")
    print(f"  {raw_dir}/")
    print("\nExport format:")
    print("  - Markdown files (.md) from Bob IDE task exports")
    print("  - One file per task (e.g., T1.1-verify-bob.md)")
    print("  - Include Bobcoin consumption screenshot (PNG/JPG)")
    print(f"\nPress ENTER when ready to process {dev}'s exports...")
    input()

    # Find all markdown files in raw/
    md_files = list(raw_dir.glob("*.md"))

    if not md_files:
        print(f"⚠️  No markdown files found in {raw_dir}/")
        print(f"   Skipping {dev}...")
        return []

    print(f"✓ Found {len(md_files)} export(s) for {dev}")
    for f in md_files:
        print(f"  - {f.name}")

    return md_files


def extract_title_from_export(file_path: Path) -> str:
    """Extract a clean title from the Bob export markdown."""
    try:
        with open(file_path, "r", encoding="utf-8") as f:
            content = f.read(500)  # Read first 500 chars

        # Try to find a title in the first few lines
        lines = content.split("\n")
        for line in lines[:10]:
            line = line.strip()
            # Look for markdown heading
            if line.startswith("# "):
                title = line[2:].strip()
                # Clean up the title
                title = re.sub(r"[^\w\s-]", "", title)
                title = re.sub(r"\s+", "-", title)
                return title.lower()[:50]  # Max 50 chars

        # Fallback: use filename without extension
        return file_path.stem

    except Exception as e:
        print(f"⚠️  Error extracting title from {file_path.name}: {e}")
        return file_path.stem


def scrub_and_rename(raw_file: Path, dev: str, sequence: int) -> Tuple[Path, bool]:
    """
    Scrub a raw export and rename with canonical format.

    Returns: (output_path, success)
    """
    dev_dir = BOB_SESSIONS_DIR / dev

    # Extract title
    title = extract_title_from_export(raw_file)

    # Generate canonical name: NN_title.md
    canonical_name = f"{sequence:02d}_{title}.md"
    output_path = dev_dir / canonical_name

    print(f"\n  Processing: {raw_file.name}")
    print(f"  → {canonical_name}")

    # Run scrubber
    try:
        result = subprocess.run(
            [sys.executable, str(SCRUBBER_SCRIPT), str(raw_file), str(output_path)],
            capture_output=True,
            text=True,
            check=True,
        )

        # Parse scrubber output for stats
        if "Secrets removed:" in result.stdout:
            print(f"  {result.stdout.strip()}")

        print(f"  ✓ Scrubbed and saved to {output_path.relative_to(PROJECT_ROOT)}")
        return output_path, True

    except subprocess.CalledProcessError as e:
        print(f"  ❌ Scrubber failed: {e.stderr}")
        return output_path, False


def collect_screenshots(dev: str) -> List[Path]:
    """Collect Bobcoin consumption screenshots."""
    dev_dir = BOB_SESSIONS_DIR / dev
    raw_dir = dev_dir / "raw"

    # Find image files
    screenshots = []
    for ext in ["*.png", "*.jpg", "*.jpeg"]:
        screenshots.extend(raw_dir.glob(ext))

    if screenshots:
        print(f"\n  Found {len(screenshots)} screenshot(s):")
        for img in screenshots:
            # Copy to dev directory
            dest = dev_dir / img.name
            dest.write_bytes(img.read_bytes())
            print(f"  ✓ Copied {img.name}")
    else:
        print(f"\n  ⚠️  No screenshots found in {raw_dir}/")
        print("     Please add Bobcoin consumption screenshot manually")

    return screenshots


def generate_index_readme(processed_sessions: Dict[str, List[Path]]):
    """Generate bob_sessions/README.md with index of all sessions."""
    readme_path = BOB_SESSIONS_DIR / "README.md"

    content = [
        "# Bob Session Exports",
        "",
        "This directory contains exported Bob IDE task sessions from all five developers.",
        "Each session has been scrubbed of PII and secrets before committing.",
        "",
        "## Purpose",
        "",
        "These exports serve as:",
        "1. **Judging artifacts** - Demonstrate Bob IDE usage and Bobcoin efficiency",
        "2. **Replay sources** - Can be loaded into dashboard replay mode",
        "3. **Documentation** - Show how each feature was built with Bob's assistance",
        "",
        "## Structure",
        "",
        "```",
        "bob_sessions/",
        "├── dev1/  # Bob Architect",
        "├── dev2/  # Backend / MCP",
        "├── dev3/  # Frontend / Dashboard",
        "├── dev4/  # Infra / Bob Shell",
        "└── dev5/  # Integration Engineer",
        "```",
        "",
        "## Sessions by Developer",
        "",
    ]

    total_sessions = 0

    for dev in DEVS:
        sessions = processed_sessions.get(dev, [])
        total_sessions += len(sessions)

        content.append(f"### {dev.upper()} - {DEV_FOCUS.get(dev, 'Developer')}")
        content.append("")

        if sessions:
            content.append(f"**{len(sessions)} session(s):**")
            content.append("")
            for session in sorted(sessions):
                # Extract sequence number and title from filename
                match = re.match(r"(\d+)_(.+)\.md", session.name)
                if match:
                    seq, title = match.groups()
                    title_display = title.replace("-", " ").title()
                    content.append(
                        f"- [{seq}. {title_display}](./{dev}/{session.name})"
                    )
                else:
                    content.append(f"- [{session.name}](./{dev}/{session.name})")
            content.append("")
        else:
            content.append("*No sessions exported yet*")
            content.append("")

    content.extend(
        [
            "---",
            "",
            f"**Total Sessions:** {total_sessions}",
            "",
            "## Naming Convention",
            "",
            "Files follow the format: `NN_task-title.md`",
            "- `NN` = Two-digit sequence number (01, 02, ...)",
            "- `task-title` = Descriptive slug from the task",
            "",
            "## Scrubbing",
            "",
            "All exports have been processed through `scripts/scrub.py` to remove:",
            "- API keys and tokens",
            "- Email addresses (except team allow-list)",
            "- Absolute file paths (replaced with $HOME)",
            "- Other PII",
            "",
            "## Bobcoin Tracking",
            "",
            "Each developer's directory may include:",
            "- `bobcoin-consumption.png` - Screenshot of Bobcoin usage",
            "- Individual task Bobcoin costs noted in session exports",
            "",
            "---",
            "",
            "*Generated by `make export-bob-sessions`*",
        ]
    )

    readme_path.write_text("\n".join(content), encoding="utf-8")
    print(f"\n✓ Generated {readme_path.relative_to(PROJECT_ROOT)}")
    print(f"  Total sessions indexed: {total_sessions}")


def main():
    """Main export pipeline."""
    print("=" * 70)
    print("OnboardOps Bob Session Export Pipeline")
    print("=" * 70)

    # Ensure directory structure
    ensure_directories()

    # Process each developer
    processed_sessions = {}

    for dev in DEVS:
        # Prompt for exports
        raw_files = prompt_for_exports(dev)

        if not raw_files:
            processed_sessions[dev] = []
            continue

        # Scrub and rename each export
        dev_sessions = []
        for i, raw_file in enumerate(sorted(raw_files), start=1):
            output_path, success = scrub_and_rename(raw_file, dev, i)
            if success:
                dev_sessions.append(output_path)

        # Collect screenshots
        collect_screenshots(dev)

        processed_sessions[dev] = dev_sessions

        print(f"\n✓ Completed {dev}: {len(dev_sessions)} session(s) processed")

    # Generate index README
    print("\n" + "=" * 70)
    print("Generating Index")
    print("=" * 70)
    generate_index_readme(processed_sessions)

    # Summary
    total = sum(len(sessions) for sessions in processed_sessions.values())
    print("\n" + "=" * 70)
    print("Export Complete!")
    print("=" * 70)
    print(f"✓ Total sessions exported: {total}")
    print("✓ Index generated: bob_sessions/README.md")
    print("\nNext steps:")
    print("  1. Review scrubbed exports in bob_sessions/devN/")
    print(
        "  2. Commit and push: git add bob_sessions/ && git commit -m 'docs: Add Bob session exports'"
    )
    print("  3. Verify CI passes (pii-check job)")


if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\n\n⚠️  Export cancelled by user")
        sys.exit(1)
    except Exception as e:
        print(f"\n❌ Error: {e}")
        import traceback

        traceback.print_exc()
        sys.exit(1)

# Made with Bob
