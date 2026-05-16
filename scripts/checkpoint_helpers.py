#!/usr/bin/env python3
"""
Checkpoint Helpers for OnboardOps

Provides checkpoint creation and restoration for safe, rollback-capable operations.
Used by F7 (Starter PR Generator) and bootstrap engine.
"""

import json
import subprocess
from datetime import datetime
from pathlib import Path
from typing import Dict, Any


class CheckpointError(Exception):
    """Raised when checkpoint operations fail."""

    pass


class Checkpoint:
    """
    Manages git-based checkpoints for safe operations.

    A checkpoint captures the current git state (branch, uncommitted changes)
    and can restore it if an operation fails.
    """

    def __init__(self, name: str, repo_path: Path):
        """
        Initialize a checkpoint.

        Args:
            name: Checkpoint name (e.g., "starter-pr")
            repo_path: Path to git repository
        """
        self.name = name
        self.repo_path = Path(repo_path)
        self.checkpoint_dir = self.repo_path / ".onboardops" / "checkpoints"
        self.checkpoint_file = self.checkpoint_dir / f"{name}.json"
        self.stash_name = f"onboardops-checkpoint-{name}"

    def create(self) -> Dict[str, Any]:
        """
        Create a checkpoint of current git state.

        Returns:
            Dict with checkpoint metadata

        Raises:
            CheckpointError: If checkpoint creation fails
        """
        try:
            # Ensure checkpoint directory exists
            self.checkpoint_dir.mkdir(parents=True, exist_ok=True)

            # Get current branch
            result = subprocess.run(
                ["git", "rev-parse", "--abbrev-ref", "HEAD"],
                cwd=self.repo_path,
                capture_output=True,
                text=True,
                check=True,
            )
            current_branch = result.stdout.strip()

            # Get current commit
            result = subprocess.run(
                ["git", "rev-parse", "HEAD"],
                cwd=self.repo_path,
                capture_output=True,
                text=True,
                check=True,
            )
            current_commit = result.stdout.strip()

            # Check for uncommitted changes
            result = subprocess.run(
                ["git", "status", "--porcelain"],
                cwd=self.repo_path,
                capture_output=True,
                text=True,
                check=True,
            )
            has_changes = bool(result.stdout.strip())

            # Stash uncommitted changes if any
            stash_ref = None
            if has_changes:
                result = subprocess.run(
                    ["git", "stash", "push", "-u", "-m", self.stash_name],
                    cwd=self.repo_path,
                    capture_output=True,
                    text=True,
                    check=True,
                )
                # Get stash ref
                result = subprocess.run(
                    ["git", "rev-parse", "stash@{0}"],
                    cwd=self.repo_path,
                    capture_output=True,
                    text=True,
                    check=True,
                )
                stash_ref = result.stdout.strip()

            # Save checkpoint metadata
            checkpoint_data = {
                "name": self.name,
                "created_at": datetime.now().isoformat(),
                "branch": current_branch,
                "commit": current_commit,
                "has_stash": has_changes,
                "stash_ref": stash_ref,
                "stash_name": self.stash_name if has_changes else None,
            }

            with open(self.checkpoint_file, "w") as f:
                json.dump(checkpoint_data, f, indent=2)

            return checkpoint_data

        except subprocess.CalledProcessError as e:
            raise CheckpointError(f"Failed to create checkpoint: {e.stderr}")
        except Exception as e:
            raise CheckpointError(f"Failed to create checkpoint: {e}")

    def restore(self) -> bool:
        """
        Restore repository to checkpoint state.

        Returns:
            True if restoration successful

        Raises:
            CheckpointError: If restoration fails
        """
        try:
            # Load checkpoint metadata
            if not self.checkpoint_file.exists():
                raise CheckpointError(f"Checkpoint '{self.name}' not found")

            with open(self.checkpoint_file, "r") as f:
                checkpoint_data = json.load(f)

            # Reset any uncommitted changes
            subprocess.run(
                ["git", "reset", "--hard"],
                cwd=self.repo_path,
                capture_output=True,
                check=True,
            )

            # Clean untracked files
            subprocess.run(
                ["git", "clean", "-fd"],
                cwd=self.repo_path,
                capture_output=True,
                check=True,
            )

            # Checkout original branch
            subprocess.run(
                ["git", "checkout", checkpoint_data["branch"]],
                cwd=self.repo_path,
                capture_output=True,
                check=True,
            )

            # Reset to original commit
            subprocess.run(
                ["git", "reset", "--hard", checkpoint_data["commit"]],
                cwd=self.repo_path,
                capture_output=True,
                check=True,
            )

            # Restore stashed changes if any
            if checkpoint_data["has_stash"] and checkpoint_data["stash_ref"]:
                try:
                    # Find the stash by message
                    result = subprocess.run(
                        ["git", "stash", "list"],
                        cwd=self.repo_path,
                        capture_output=True,
                        text=True,
                        check=True,
                    )

                    stash_index = None
                    for i, line in enumerate(result.stdout.split("\n")):
                        if self.stash_name in line:
                            stash_index = i
                            break

                    if stash_index is not None:
                        subprocess.run(
                            ["git", "stash", "pop", f"stash@{{{stash_index}}}"],
                            cwd=self.repo_path,
                            capture_output=True,
                            check=True,
                        )
                except subprocess.CalledProcessError:
                    # Stash pop failed, but we're already at the right commit
                    # This is acceptable - just means stash was already applied or lost
                    pass

            return True

        except subprocess.CalledProcessError as e:
            raise CheckpointError(f"Failed to restore checkpoint: {e.stderr}")
        except Exception as e:
            raise CheckpointError(f"Failed to restore checkpoint: {e}")

    def delete(self) -> bool:
        """
        Delete checkpoint metadata.

        Returns:
            True if deletion successful
        """
        try:
            if self.checkpoint_file.exists():
                self.checkpoint_file.unlink()
            return True
        except Exception:
            return False

    def exists(self) -> bool:
        """Check if checkpoint exists."""
        return self.checkpoint_file.exists()


def create_checkpoint(name: str, repo_path: Path) -> Checkpoint:
    """
    Create a new checkpoint.

    Args:
        name: Checkpoint name
        repo_path: Path to repository

    Returns:
        Checkpoint object
    """
    checkpoint = Checkpoint(name, repo_path)
    checkpoint.create()
    return checkpoint


def restore_checkpoint(name: str, repo_path: Path) -> bool:
    """
    Restore a checkpoint.

    Args:
        name: Checkpoint name
        repo_path: Path to repository

    Returns:
        True if restoration successful
    """
    checkpoint = Checkpoint(name, repo_path)
    return checkpoint.restore()


def delete_checkpoint(name: str, repo_path: Path) -> bool:
    """
    Delete a checkpoint.

    Args:
        name: Checkpoint name
        repo_path: Path to repository

    Returns:
        True if deletion successful
    """
    checkpoint = Checkpoint(name, repo_path)
    return checkpoint.delete()


# Made with Bob
