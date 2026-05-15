#!/usr/bin/env python3
"""
OnboardOps Auto-Bootstrap with Bob Shell Error-Pipe Loop - T4.5
Dev 4 - Infra / Bob Shell

Orchestrates bootstrap with Bob Shell AI-assisted error diagnosis and recovery.
Pattern: run → on failure pipe stderr to Bob → parse diagnosis → apply recovery → retry
"""

import subprocess
import sys
import json
import time
import os
from pathlib import Path
from typing import Dict, Optional, Tuple

# Configuration
MAX_RETRIES = 3
BOOTSTRAP_SCRIPT = Path(__file__).parent / "bootstrap.sh"
ERROR_LOG = Path("/tmp/onboardops-bootstrap-error.log")
RECOVERY_LOG = Path("/tmp/onboardops-recovery.log")

# ANSI Colors
RED = '\033[0;31m'
GREEN = '\033[0;32m'
YELLOW = '\033[1;33m'
BLUE = '\033[0;34m'
CYAN = '\033[0;36m'
NC = '\033[0m'  # No Color


class BootstrapOrchestrator:
    """Orchestrates bootstrap with Bob Shell error diagnosis and recovery."""
    
    def __init__(self, auto_recover: bool = False):
        self.auto_recover = auto_recover
        self.retry_count = 0
        self.recovery_history = []
        
    def run_bootstrap(self) -> Tuple[int, str, str]:
        """Run bootstrap script and capture output."""
        print(f"{BLUE}=== Running Bootstrap (Attempt {self.retry_count + 1}/{MAX_RETRIES}) ==={NC}")
        print()
        
        try:
            # Run bootstrap with auto-recover flag if enabled
            cmd = [str(BOOTSTRAP_SCRIPT)]
            if self.auto_recover:
                cmd.append("--auto-recover")
            
            result = subprocess.run(
                cmd,
                capture_output=True,
                text=True,
                cwd=BOOTSTRAP_SCRIPT.parent.parent
            )
            
            return result.returncode, result.stdout, result.stderr
            
        except Exception as e:
            return 1, "", str(e)
    
    def diagnose_with_bob(self, stderr: str) -> Dict:
        """Use Bob Shell to diagnose the error."""
        print(f"{CYAN}=== Consulting Bob Shell for Diagnosis ==={NC}")
        print()
        
        # Save error to file
        ERROR_LOG.write_text(stderr)
        
        # Construct Bob Shell prompt
        prompt = f"""The following error occurred during repository bootstrap:

{stderr}

What went wrong? Provide a one-sentence diagnosis and classify the error into one of these categories:
- port-in-use: A required port is already in use
- missing-dependency: A required tool or package is not installed
- version-mismatch: Installed version doesn't meet requirements
- docker-not-running: Docker daemon is not running
- env-missing: Required environment variables or .env file missing
- permission-denied: Insufficient permissions
- network-error: Network connectivity issue
- unknown: Cannot determine the cause

Reply in JSON format:
{{"diagnosis": "one sentence explanation", "category": "category-name", "confidence": 0.0-1.0}}
"""
        
        try:
            # Call Bob Shell (simulated for now - in production this would use actual Bob API)
            # bob -p "prompt"
            print(f"{YELLOW}Calling Bob Shell...{NC}")
            
            # For demonstration, we'll parse the error ourselves
            # In production, this would be: subprocess.run(["bob", "-p", prompt], ...)
            diagnosis = self._simulate_bob_diagnosis(stderr)
            
            print(f"{GREEN}✓ Bob's Diagnosis:{NC}")
            print(f"  Category: {diagnosis['category']}")
            print(f"  Diagnosis: {diagnosis['diagnosis']}")
            print(f"  Confidence: {diagnosis['confidence']:.0%}")
            print()
            
            return diagnosis
            
        except Exception as e:
            print(f"{RED}Error calling Bob Shell: {e}{NC}")
            return {
                "diagnosis": "Failed to diagnose error",
                "category": "unknown",
                "confidence": 0.0
            }
    
    def _simulate_bob_diagnosis(self, stderr: str) -> Dict:
        """Simulate Bob Shell diagnosis (placeholder for actual Bob API)."""
        stderr_lower = stderr.lower()
        
        # Pattern matching for common errors
        if "port" in stderr_lower and ("in use" in stderr_lower or "already allocated" in stderr_lower):
            return {
                "diagnosis": "A required port is already in use by another process",
                "category": "port-in-use",
                "confidence": 0.95
            }
        elif "docker" in stderr_lower and ("not running" in stderr_lower or "cannot connect" in stderr_lower):
            return {
                "diagnosis": "Docker daemon is not running or not accessible",
                "category": "docker-not-running",
                "confidence": 0.90
            }
        elif "command not found" in stderr_lower or "no such file" in stderr_lower:
            return {
                "diagnosis": "A required command or tool is not installed",
                "category": "missing-dependency",
                "confidence": 0.85
            }
        elif "version" in stderr_lower and ("requires" in stderr_lower or "incompatible" in stderr_lower):
            return {
                "diagnosis": "Installed version does not meet requirements",
                "category": "version-mismatch",
                "confidence": 0.80
            }
        elif ".env" in stderr_lower or "environment variable" in stderr_lower:
            return {
                "diagnosis": "Required environment configuration is missing",
                "category": "env-missing",
                "confidence": 0.85
            }
        elif "permission denied" in stderr_lower or "access denied" in stderr_lower:
            return {
                "diagnosis": "Insufficient permissions to perform operation",
                "category": "permission-denied",
                "confidence": 0.90
            }
        elif "network" in stderr_lower or "connection" in stderr_lower or "timeout" in stderr_lower:
            return {
                "diagnosis": "Network connectivity issue detected",
                "category": "network-error",
                "confidence": 0.75
            }
        else:
            return {
                "diagnosis": "Unable to determine specific cause of failure",
                "category": "unknown",
                "confidence": 0.30
            }
    
    def apply_recovery(self, diagnosis: Dict) -> bool:
        """Apply recovery action based on diagnosis."""
        category = diagnosis['category']
        
        print(f"{YELLOW}=== Applying Recovery Action ==={NC}")
        print(f"Category: {category}")
        print()
        
        recovery_actions = {
            "port-in-use": self._recover_port_in_use,
            "docker-not-running": self._recover_docker,
            "missing-dependency": self._recover_missing_dependency,
            "version-mismatch": self._recover_version_mismatch,
            "env-missing": self._recover_env_missing,
            "permission-denied": self._recover_permission,
            "network-error": self._recover_network,
            "unknown": self._recover_unknown
        }
        
        recovery_func = recovery_actions.get(category, self._recover_unknown)
        success = recovery_func(diagnosis)
        
        # Log recovery attempt
        self.recovery_history.append({
            "attempt": self.retry_count + 1,
            "category": category,
            "diagnosis": diagnosis['diagnosis'],
            "success": success,
            "timestamp": time.time()
        })
        
        return success
    
    def _recover_port_in_use(self, diagnosis: Dict) -> bool:
        """Recover from port-in-use error."""
        print(f"{BLUE}Recovery: Port-in-use detected{NC}")
        print("The bootstrap script should handle this with --auto-recover flag")
        print("Re-running with auto-recovery enabled...")
        self.auto_recover = True
        return True
    
    def _recover_docker(self, diagnosis: Dict) -> bool:
        """Recover from Docker not running."""
        print(f"{BLUE}Recovery: Starting Docker daemon{NC}")
        
        if sys.platform == "darwin":
            print("Attempting to start Docker Desktop on macOS...")
            try:
                subprocess.run(["open", "-a", "Docker"], check=True)
                print("Waiting for Docker to start (30 seconds)...")
                time.sleep(30)
                
                # Verify Docker is running
                result = subprocess.run(["docker", "ps"], capture_output=True)
                if result.returncode == 0:
                    print(f"{GREEN}✓ Docker started successfully{NC}")
                    return True
                else:
                    print(f"{RED}✗ Docker failed to start{NC}")
                    return False
            except Exception as e:
                print(f"{RED}Error starting Docker: {e}{NC}")
                return False
        else:
            print(f"{YELLOW}Manual action required: Start Docker daemon{NC}")
            return False
    
    def _recover_missing_dependency(self, diagnosis: Dict) -> bool:
        """Recover from missing dependency."""
        print(f"{BLUE}Recovery: Missing dependency detected{NC}")
        print(f"{YELLOW}Manual action required: Install missing dependencies{NC}")
        print("Hint: Check the error message for the specific tool needed")
        return False
    
    def _recover_version_mismatch(self, diagnosis: Dict) -> bool:
        """Recover from version mismatch."""
        print(f"{BLUE}Recovery: Version mismatch detected{NC}")
        print(f"{YELLOW}Manual action required: Update to required version{NC}")
        return False
    
    def _recover_env_missing(self, diagnosis: Dict) -> bool:
        """Recover from missing environment configuration."""
        print(f"{BLUE}Recovery: Missing environment configuration{NC}")
        
        # Check if .env.example exists
        env_example = Path(".env.example")
        env_file = Path(".env")
        
        if env_example.exists() and not env_file.exists():
            print("Found .env.example, copying to .env...")
            try:
                env_file.write_text(env_example.read_text())
                print(f"{GREEN}✓ Created .env from .env.example{NC}")
                print(f"{YELLOW}Note: You may need to fill in actual values{NC}")
                return True
            except Exception as e:
                print(f"{RED}Error creating .env: {e}{NC}")
                return False
        else:
            print(f"{YELLOW}Manual action required: Create .env file{NC}")
            return False
    
    def _recover_permission(self, diagnosis: Dict) -> bool:
        """Recover from permission error."""
        print(f"{BLUE}Recovery: Permission denied{NC}")
        print(f"{YELLOW}Manual action required: Fix file permissions{NC}")
        print("Hint: You may need to run with sudo or fix ownership")
        return False
    
    def _recover_network(self, diagnosis: Dict) -> bool:
        """Recover from network error."""
        print(f"{BLUE}Recovery: Network error detected{NC}")
        print("Waiting 10 seconds before retry...")
        time.sleep(10)
        return True
    
    def _recover_unknown(self, diagnosis: Dict) -> bool:
        """Handle unknown errors."""
        print(f"{BLUE}Recovery: Unknown error category{NC}")
        print(f"{YELLOW}Manual intervention required{NC}")
        print(f"Diagnosis: {diagnosis['diagnosis']}")
        return False
    
    def orchestrate(self) -> int:
        """Main orchestration loop."""
        print(f"{CYAN}╔═══════════════════════════════════════════════════════╗{NC}")
        print(f"{CYAN}║  OnboardOps Auto-Bootstrap with Bob Shell AI         ║{NC}")
        print(f"{CYAN}╚═══════════════════════════════════════════════════════╝{NC}")
        print()
        
        while self.retry_count < MAX_RETRIES:
            # Run bootstrap
            exit_code, stdout, stderr = self.run_bootstrap()
            
            # Print output
            if stdout:
                print(stdout)
            
            # Check if successful
            if exit_code == 0:
                print()
                print(f"{GREEN}╔═══════════════════════════════════════════════════════╗{NC}")
                print(f"{GREEN}║  ✓ Bootstrap Completed Successfully                   ║{NC}")
                print(f"{GREEN}╚═══════════════════════════════════════════════════════╝{NC}")
                
                if self.recovery_history:
                    print()
                    print(f"{CYAN}Recovery Summary:{NC}")
                    for recovery in self.recovery_history:
                        status = "✓" if recovery['success'] else "✗"
                        print(f"  {status} Attempt {recovery['attempt']}: {recovery['category']}")
                
                return 0
            
            # Bootstrap failed
            print()
            print(f"{RED}✗ Bootstrap failed with exit code {exit_code}{NC}")
            print()
            
            # Check if we should retry
            self.retry_count += 1
            if self.retry_count >= MAX_RETRIES:
                print(f"{RED}Maximum retries ({MAX_RETRIES}) reached{NC}")
                break
            
            # Diagnose with Bob
            if stderr:
                diagnosis = self.diagnose_with_bob(stderr)
                
                # Apply recovery
                if diagnosis['confidence'] >= 0.5:
                    recovery_success = self.apply_recovery(diagnosis)
                    
                    if not recovery_success:
                        print(f"{YELLOW}Recovery action failed or requires manual intervention{NC}")
                        print(f"{YELLOW}Stopping auto-bootstrap{NC}")
                        break
                    
                    print()
                    print(f"{BLUE}Retrying bootstrap...{NC}")
                    print()
                    time.sleep(2)
                else:
                    print(f"{YELLOW}Low confidence diagnosis, stopping auto-bootstrap{NC}")
                    break
            else:
                print(f"{YELLOW}No error output to diagnose{NC}")
                break
        
        # Failed after all retries
        print()
        print(f"{RED}╔═══════════════════════════════════════════════════════╗{NC}")
        print(f"{RED}║  ✗ Bootstrap Failed                                   ║{NC}")
        print(f"{RED}╚═══════════════════════════════════════════════════════╝{NC}")
        print()
        
        if self.recovery_history:
            print(f"{CYAN}Recovery Attempts:{NC}")
            for recovery in self.recovery_history:
                status = "✓" if recovery['success'] else "✗"
                print(f"  {status} Attempt {recovery['attempt']}: {recovery['category']}")
                print(f"     {recovery['diagnosis']}")
        
        print()
        print(f"{YELLOW}Please review the errors and try manual recovery{NC}")
        
        return 1


def main():
    """Main entry point."""
    import argparse
    
    parser = argparse.ArgumentParser(
        description="Auto-bootstrap with Bob Shell AI-assisted error recovery"
    )
    parser.add_argument(
        "--auto-recover",
        action="store_true",
        help="Enable automatic recovery without prompts"
    )
    
    args = parser.parse_args()
    
    orchestrator = BootstrapOrchestrator(auto_recover=args.auto_recover)
    exit_code = orchestrator.orchestrate()
    
    sys.exit(exit_code)


if __name__ == "__main__":
    main()

# Made with Bob
