#!/usr/bin/env python3
"""
OnboardOps PII Scrubber and Secret Scanner

Removes sensitive information from session JSONL files before committing:
- API keys (various patterns)
- Email addresses (except team allow-list)
- Absolute paths with usernames (replaced with $HOME)
- GitHub tokens
- AWS credentials
- Other secrets

Usage:
    python scripts/scrub.py input.jsonl output.jsonl
    python scripts/scrub.py --dir .onboardops/sessions --output bob_sessions/
    python scripts/scrub.py --check bob_sessions/  # CI mode

Dependencies: None (stdlib only)
"""

import argparse
import json
import os
import re
import sys
from pathlib import Path
from typing import Any, Dict, List, Set

# Team email allow-list (these won't be scrubbed)
TEAM_EMAILS = {
    'dev1@example.com',
    'dev2@example.com',
    'dev3@example.com',
    'dev4@example.com',
    'dev5@example.com',
    # Add actual team emails here
}

# Regex patterns for secrets
SECRET_PATTERNS = [
    # API Keys
    (r'sk-[a-zA-Z0-9]{32,}', '[REDACTED_API_KEY]'),
    (r'api[_-]?key["\s:=]+[a-zA-Z0-9]{20,}', '[REDACTED_API_KEY]'),
    
    # GitHub tokens
    (r'gh[ps]_[a-zA-Z0-9]{36,}', '[REDACTED_GITHUB_TOKEN]'),
    (r'github_pat_[a-zA-Z0-9_]{82}', '[REDACTED_GITHUB_PAT]'),
    
    # AWS credentials
    (r'AKIA[0-9A-Z]{16}', '[REDACTED_AWS_KEY]'),
    (r'aws_secret_access_key["\s:=]+[a-zA-Z0-9/+]{40}', '[REDACTED_AWS_SECRET]'),
    
    # Generic secrets
    (r'secret["\s:=]+[a-zA-Z0-9]{20,}', '[REDACTED_SECRET]'),
    (r'password["\s:=]+[^\s"]{8,}', '[REDACTED_PASSWORD]'),
    (r'token["\s:=]+[a-zA-Z0-9]{20,}', '[REDACTED_TOKEN]'),
    
    # Private keys
    (r'-----BEGIN [A-Z ]+PRIVATE KEY-----[\s\S]+?-----END [A-Z ]+PRIVATE KEY-----', '[REDACTED_PRIVATE_KEY]'),
    
    # JWT tokens
    (r'eyJ[a-zA-Z0-9_-]+\.eyJ[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+', '[REDACTED_JWT]'),
]

# Email pattern (will be scrubbed unless in allow-list)
EMAIL_PATTERN = r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b'

# Absolute path patterns (will be replaced with $HOME)
PATH_PATTERNS = [
    (r'/home/[^/\s]+', '$HOME'),
    (r'/Users/[^/\s]+', '$HOME'),
    (r'C:\\Users\\[^\\]+', '$HOME'),
]


class PIIScrubber:
    """Scrubs PII and secrets from session data."""
    
    def __init__(self, team_emails: Set[str] = None):
        self.team_emails = team_emails or TEAM_EMAILS
        self.secrets_found = 0
        self.emails_scrubbed = 0
        self.paths_scrubbed = 0
    
    def scrub_string(self, text: str) -> str:
        """Scrub a single string value."""
        if not isinstance(text, str):
            return text
        
        original = text
        
        # Scrub secrets
        for pattern, replacement in SECRET_PATTERNS:
            matches = re.findall(pattern, text, re.IGNORECASE)
            if matches:
                self.secrets_found += len(matches)
                text = re.sub(pattern, replacement, text, flags=re.IGNORECASE)
        
        # Scrub emails (except team)
        emails = re.findall(EMAIL_PATTERN, text)
        for email in emails:
            if email.lower() not in {e.lower() for e in self.team_emails}:
                self.emails_scrubbed += 1
                text = text.replace(email, '[REDACTED_EMAIL]')
        
        # Scrub absolute paths
        for pattern, replacement in PATH_PATTERNS:
            matches = re.findall(pattern, text)
            if matches:
                self.paths_scrubbed += len(matches)
                text = re.sub(pattern, replacement, text)
        
        return text
    
    def scrub_dict(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Recursively scrub a dictionary."""
        scrubbed = {}
        for key, value in data.items():
            if isinstance(value, str):
                scrubbed[key] = self.scrub_string(value)
            elif isinstance(value, dict):
                scrubbed[key] = self.scrub_dict(value)
            elif isinstance(value, list):
                scrubbed[key] = self.scrub_list(value)
            else:
                scrubbed[key] = value
        return scrubbed
    
    def scrub_list(self, data: List[Any]) -> List[Any]:
        """Recursively scrub a list."""
        scrubbed = []
        for item in data:
            if isinstance(item, str):
                scrubbed.append(self.scrub_string(item))
            elif isinstance(item, dict):
                scrubbed.append(self.scrub_dict(item))
            elif isinstance(item, list):
                scrubbed.append(self.scrub_list(item))
            else:
                scrubbed.append(item)
        return scrubbed
    
    def scrub_event(self, event: Dict[str, Any]) -> Dict[str, Any]:
        """Scrub a single event."""
        return self.scrub_dict(event)
    
    def scrub_file(self, input_path: Path, output_path: Path) -> bool:
        """Scrub a file (supports both JSONL and plain text/markdown)."""
        try:
            # Detect file type by extension
            is_jsonl = str(input_path).endswith('.jsonl')
            
            with open(input_path, 'r', encoding='utf-8') as f_in:
                lines = f_in.readlines()
            
            scrubbed_lines = []
            for line_num, line in enumerate(lines, 1):
                if is_jsonl:
                    # JSONL mode: parse as JSON
                    line = line.strip()
                    if not line:
                        continue
                    
                    try:
                        event = json.loads(line)
                        scrubbed_event = self.scrub_event(event)
                        scrubbed_lines.append(json.dumps(scrubbed_event, ensure_ascii=False))
                    except json.JSONDecodeError as e:
                        print(f"Warning: Invalid JSON on line {line_num}: {e}", file=sys.stderr)
                        continue
                else:
                    # Plain text/markdown mode: scrub line by line
                    scrubbed_line = self.scrub_string(line)
                    scrubbed_lines.append(scrubbed_line.rstrip('\n'))
            
            # Write scrubbed output
            output_path.parent.mkdir(parents=True, exist_ok=True)
            with open(output_path, 'w', encoding='utf-8') as f_out:
                for line in scrubbed_lines:
                    f_out.write(line + '\n')
            
            return True
        
        except Exception as e:
            print(f"Error scrubbing {input_path}: {e}", file=sys.stderr)
            return False
    
    def check_file(self, file_path: Path) -> List[str]:
        """Check a file for unscrubbed secrets (CI mode)."""
        violations = []
        
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()
            
            # Check for secrets
            for pattern, _ in SECRET_PATTERNS:
                matches = re.findall(pattern, content, re.IGNORECASE)
                if matches:
                    violations.append(f"Found {len(matches)} secret(s) matching pattern: {pattern}")
            
            # Check for non-team emails
            emails = re.findall(EMAIL_PATTERN, content)
            non_team_emails = [e for e in emails if e.lower() not in {e.lower() for e in self.team_emails}]
            if non_team_emails:
                violations.append(f"Found {len(non_team_emails)} non-team email(s): {non_team_emails[:3]}")
            
            # Check for absolute paths
            for pattern, _ in PATH_PATTERNS:
                matches = re.findall(pattern, content)
                if matches:
                    violations.append(f"Found {len(matches)} absolute path(s): {matches[:3]}")
        
        except Exception as e:
            violations.append(f"Error reading file: {e}")
        
        return violations


def scrub_single_file(input_path: str, output_path: str, team_emails: Set[str]) -> int:
    """Scrub a single file."""
    scrubber = PIIScrubber(team_emails)
    
    input_file = Path(input_path)
    output_file = Path(output_path)
    
    if not input_file.exists():
        print(f"Error: Input file not found: {input_path}", file=sys.stderr)
        return 1
    
    print(f"Scrubbing {input_path} -> {output_path}")
    
    if scrubber.scrub_file(input_file, output_file):
        print(f"✓ Scrubbed successfully")
        print(f"  Secrets removed: {scrubber.secrets_found}")
        print(f"  Emails scrubbed: {scrubber.emails_scrubbed}")
        print(f"  Paths scrubbed: {scrubber.paths_scrubbed}")
        return 0
    else:
        print(f"✗ Scrubbing failed", file=sys.stderr)
        return 1


def scrub_directory(input_dir: str, output_dir: str, team_emails: Set[str]) -> int:
    """Scrub all JSONL files in a directory."""
    scrubber = PIIScrubber(team_emails)
    
    input_path = Path(input_dir)
    output_path = Path(output_dir)
    
    if not input_path.exists():
        print(f"Error: Input directory not found: {input_dir}", file=sys.stderr)
        return 1
    
    # Find all JSONL files
    jsonl_files = list(input_path.glob('**/*.jsonl'))
    
    if not jsonl_files:
        print(f"No JSONL files found in {input_dir}")
        return 0
    
    print(f"Found {len(jsonl_files)} JSONL file(s) to scrub")
    
    success_count = 0
    for input_file in jsonl_files:
        # Preserve directory structure
        rel_path = input_file.relative_to(input_path)
        output_file = output_path / rel_path
        
        print(f"\nScrubbing {rel_path}...")
        if scrubber.scrub_file(input_file, output_file):
            success_count += 1
    
    print(f"\n✓ Scrubbed {success_count}/{len(jsonl_files)} files")
    print(f"  Total secrets removed: {scrubber.secrets_found}")
    print(f"  Total emails scrubbed: {scrubber.emails_scrubbed}")
    print(f"  Total paths scrubbed: {scrubber.paths_scrubbed}")
    
    return 0 if success_count == len(jsonl_files) else 1


def check_directory(check_dir: str, team_emails: Set[str]) -> int:
    """Check directory for unscrubbed secrets (CI mode)."""
    scrubber = PIIScrubber(team_emails)
    
    check_path = Path(check_dir)
    
    if not check_path.exists():
        print(f"Error: Directory not found: {check_dir}", file=sys.stderr)
        return 1
    
    # Find all files (not just JSONL)
    files = [f for f in check_path.rglob('*') if f.is_file() and not f.name.startswith('.')]
    
    if not files:
        print(f"No files found in {check_dir}")
        return 0
    
    print(f"Checking {len(files)} file(s) for secrets...")
    
    violations_found = False
    for file_path in files:
        violations = scrubber.check_file(file_path)
        if violations:
            violations_found = True
            print(f"\n✗ {file_path.relative_to(check_path)}:")
            for violation in violations:
                print(f"  - {violation}")
    
    if violations_found:
        print(f"\n✗ FAIL: Unscrubbed secrets found!")
        print(f"Run: python scripts/scrub.py --dir {check_dir} --output {check_dir}")
        return 1
    else:
        print(f"\n✓ PASS: No secrets found")
        return 0


def main():
    parser = argparse.ArgumentParser(
        description='Scrub PII and secrets from OnboardOps session files'
    )
    
    # Mode selection
    mode_group = parser.add_mutually_exclusive_group(required=True)
    mode_group.add_argument(
        'input',
        nargs='?',
        help='Input JSONL file'
    )
    mode_group.add_argument(
        '--dir',
        help='Input directory (scrub all JSONL files)'
    )
    mode_group.add_argument(
        '--check',
        metavar='DIR',
        help='Check directory for unscrubbed secrets (CI mode)'
    )
    
    # Output
    parser.add_argument(
        'output',
        nargs='?',
        help='Output JSONL file or directory'
    )
    parser.add_argument(
        '--output',
        dest='output_dir',
        help='Output directory (for --dir mode)'
    )
    
    # Options
    parser.add_argument(
        '--team-emails',
        nargs='+',
        help='Team email addresses to preserve (space-separated)'
    )
    
    args = parser.parse_args()
    
    # Build team emails set
    team_emails = TEAM_EMAILS.copy()
    if args.team_emails:
        team_emails.update(args.team_emails)
    
    # Check mode
    if args.check:
        return check_directory(args.check, team_emails)
    
    # Directory mode
    if args.dir:
        if not args.output_dir and not args.output:
            parser.error("--dir requires --output")
        output = args.output_dir or args.output
        return scrub_directory(args.dir, output, team_emails)
    
    # Single file mode
    if not args.output:
        parser.error("Output file required")
    return scrub_single_file(args.input, args.output, team_emails)


if __name__ == '__main__':
    sys.exit(main())

# Made with Bob
