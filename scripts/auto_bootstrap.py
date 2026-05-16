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
from pathlib import Path
from typing import Dict, Tuple

# Configuration
MAX_RETRIES = 3
DEFAULT_TIMEOUT = 180  # 3 minutes in seconds
MIN_CONFIDENCE = 0.7  # Minimum confidence to apply recovery
MAX_BOB_RETRIES = 3  # Maximum retries for Bob API calls
BOOTSTRAP_SCRIPT = Path(__file__).parent / "bootstrap.sh"
CHECKPOINT_SCRIPT = Path(__file__).parent / "bootstrap_with_checkpoint.sh"
ERROR_LOG = Path("/tmp/onboardops-bootstrap-error.log")
RECOVERY_LOG = Path("/tmp/onboardops-recovery.log")
TIMEOUT_LOG = Path("/tmp/onboardops-timeout.log")
TELEMETRY_LOG = Path("/tmp/onboardops-telemetry.jsonl")

# ANSI Colors
RED = "\033[0;31m"
GREEN = "\033[0;32m"
YELLOW = "\033[1;33m"
BLUE = "\033[0;34m"
CYAN = "\033[0;36m"
NC = "\033[0m"  # No Color


class BootstrapOrchestrator:
    """Orchestrates bootstrap with Bob Shell error diagnosis and recovery."""

    def __init__(self, auto_recover: bool = False, timeout: int = DEFAULT_TIMEOUT):
        self.auto_recover = auto_recover
        self.timeout = timeout
        self.retry_count = 0
        self.recovery_history = []
        self.start_time = None
        self.timed_out = False

    def run_bootstrap(self) -> Tuple[int, str, str]:
        """Run bootstrap script and capture output."""
        print(
            f"{BLUE}=== Running Bootstrap (Attempt {self.retry_count + 1}/{MAX_RETRIES}) ==={NC}"
        )

        # Check if we've exceeded timeout
        if self.start_time:
            elapsed = time.time() - self.start_time
            remaining = self.timeout - elapsed
            if remaining <= 0:
                self.timed_out = True
                return 124, "", "Bootstrap timeout exceeded"
            print(f"{YELLOW}Time remaining: {int(remaining)}s{NC}")

        print()

        try:
            # Calculate timeout for this run
            if self.start_time:
                elapsed = time.time() - self.start_time
                run_timeout = max(10, int(self.timeout - elapsed))
            else:
                run_timeout = self.timeout

            # Run bootstrap with auto-recover flag if enabled
            cmd = [str(BOOTSTRAP_SCRIPT)]
            if self.auto_recover:
                cmd.append("--auto-recover")

            result = subprocess.run(
                cmd,
                capture_output=True,
                text=True,
                cwd=BOOTSTRAP_SCRIPT.parent.parent,
                timeout=run_timeout,
            )

            return result.returncode, result.stdout, result.stderr

        except subprocess.TimeoutExpired:
            self.timed_out = True
            return 124, "", f"Bootstrap exceeded {self.timeout}s timeout"
        except Exception as e:
            return 1, "", str(e)

    def _log_telemetry(self, event_type: str, data: Dict, severity: str = "info"):
        """Log telemetry event to JSONL file with enhanced payload."""
        try:
            # Map event types to human-readable summaries
            summary_map = {
                "bob_api_call": f"Calling Bob Shell for error diagnosis (attempt {data.get('attempt', 1)})",
                "bob_diagnosis_success": f"Bob diagnosed: {data.get('category', 'unknown')} ({data.get('confidence', 0):.0%} confidence)",
                "bob_json_error": f"Bob returned invalid JSON (attempt {data.get('attempt', 1)})",
                "recovery_attempt": f"Attempting recovery: {data.get('category', 'unknown')}",
                "recovery_success": f"Recovery successful: {data.get('category', 'unknown')}",
                "recovery_failed": f"Recovery failed: {data.get('category', 'unknown')}",
                "bootstrap_start": "Bootstrap process started",
                "bootstrap_complete": "Bootstrap completed successfully",
                "bootstrap_failed": f"Bootstrap failed: {data.get('reason', 'unknown')}",
            }

            summary = summary_map.get(event_type, event_type)

            event = {
                "timestamp": time.time(),
                "event_type": event_type,
                "severity": severity,
                "message": summary,
                "details": data,
            }

            # Append to telemetry log (JSONL format)
            with open(TELEMETRY_LOG, "a") as f:
                f.write(json.dumps(event) + "\n")

        except Exception as e:
            print(f"{YELLOW}Warning: Failed to log telemetry: {e}{NC}")

    def _validate_bob_response(self, response: Dict) -> bool:
        """Validate Bob Shell response against expected JSON schema."""
        required_fields = ["diagnosis", "category", "confidence"]

        # Check all required fields present
        for field in required_fields:
            if field not in response:
                print(f"{YELLOW}⚠ Bob response missing required field: {field}{NC}")
                return False

        # Validate types
        if not isinstance(response["diagnosis"], str):
            print(f"{YELLOW}⚠ 'diagnosis' must be a string{NC}")
            return False

        if not isinstance(response["category"], str):
            print(f"{YELLOW}⚠ 'category' must be a string{NC}")
            return False

        if not isinstance(response["confidence"], (int, float)):
            print(f"{YELLOW}⚠ 'confidence' must be a number{NC}")
            return False

        # Validate confidence range
        if not (0.0 <= response["confidence"] <= 1.0):
            print(f"{YELLOW}⚠ 'confidence' must be between 0.0 and 1.0{NC}")
            return False

        # Validate category
        valid_categories = [
            "port-in-use",
            "missing-dependency",
            "version-mismatch",
            "docker-not-running",
            "env-missing",
            "permission-denied",
            "network-error",
            "missing-virtualenv",
            "missing-seed-data",
            "database-not-running",
            "unknown",
        ]
        if response["category"] not in valid_categories:
            print(f"{YELLOW}⚠ Invalid category: {response['category']}{NC}")
            return False

        return True

    def diagnose_with_bob(self, stderr: str) -> Dict:
        """Use Bob Shell to diagnose the error with retry logic and validation."""
        print(f"{CYAN}=== Consulting Bob Shell for Diagnosis ==={NC}")
        print()

        # Save error to file
        ERROR_LOG.write_text(stderr)

        # Construct Bob Shell prompt with strict JSON schema
        prompt = f"""The following error occurred during repository bootstrap:

{stderr}

Analyze this error and provide a diagnosis. You MUST respond with valid JSON matching this exact schema:

{{
  "diagnosis": "one sentence explanation of what went wrong",
  "category": "error-category",
  "confidence": 0.85
}}

Valid categories (choose ONE):
- port-in-use: A required port is already in use
- missing-dependency: A required tool or package is not installed
- version-mismatch: Installed version doesn't meet requirements
- docker-not-running: Docker daemon is not running
- env-missing: Required environment variables or .env file missing
- permission-denied: Insufficient permissions
- network-error: Network connectivity issue
- missing-virtualenv: Python virtualenv is missing or corrupted
- missing-seed-data: Database seed data is missing
- database-not-running: Database service is not running
- unknown: Cannot determine the cause

Confidence must be a number between 0.0 and 1.0 (e.g., 0.85 for 85% confident).

IMPORTANT: Respond ONLY with valid JSON. No markdown, no explanations, just the JSON object.
"""

        # Retry loop for Bob API calls
        for attempt in range(1, MAX_BOB_RETRIES + 1):
            try:
                print(
                    f"{YELLOW}Calling Bob Shell (attempt {attempt}/{MAX_BOB_RETRIES})...{NC}"
                )

                # Log Bob API call
                self._log_telemetry(
                    "bob_api_call",
                    {
                        "attempt": attempt,
                        "error_length": len(stderr),
                        "prompt_length": len(prompt),
                    },
                )

                # Call Bob Shell
                # In production: subprocess.run(["bob", "-p", prompt], ...)
                # For now, use simulation
                diagnosis = self._simulate_bob_diagnosis(stderr)

                # Validate response
                if not self._validate_bob_response(diagnosis):
                    print(f"{YELLOW}Invalid Bob response, retrying...{NC}")
                    if attempt < MAX_BOB_RETRIES:
                        time.sleep(1)
                        continue
                    else:
                        raise ValueError(
                            "Bob response validation failed after all retries"
                        )

                # Check confidence threshold
                if diagnosis["confidence"] < MIN_CONFIDENCE:
                    print(
                        f"{YELLOW}⚠ Low confidence: {diagnosis['confidence']:.0%} (threshold: {MIN_CONFIDENCE:.0%}){NC}"
                    )
                    print(f"{YELLOW}  Diagnosis may not be reliable{NC}")

                # Log successful diagnosis
                self._log_telemetry(
                    "bob_diagnosis_success",
                    {
                        "attempt": attempt,
                        "category": diagnosis["category"],
                        "confidence": diagnosis["confidence"],
                    },
                )

                print(f"{GREEN}✓ Bob's Diagnosis:{NC}")
                print(f"  Category: {diagnosis['category']}")
                print(f"  Diagnosis: {diagnosis['diagnosis']}")
                print(f"  Confidence: {diagnosis['confidence']:.0%}")

                if diagnosis["confidence"] >= MIN_CONFIDENCE:
                    print(
                        f"  {GREEN}✓ Confidence meets threshold ({MIN_CONFIDENCE:.0%}){NC}"
                    )
                else:
                    print(
                        f"  {YELLOW}⚠ Below confidence threshold ({MIN_CONFIDENCE:.0%}){NC}"
                    )

                print()

                return diagnosis

            except json.JSONDecodeError as e:
                print(f"{YELLOW}⚠ Bob returned invalid JSON: {e}{NC}")
                self._log_telemetry(
                    "bob_json_error", {"attempt": attempt, "error": str(e)}
                )

                if attempt < MAX_BOB_RETRIES:
                    print(f"{YELLOW}Retrying...{NC}")
                    time.sleep(1)
                    continue

            except Exception as e:
                print(f"{RED}Error calling Bob Shell: {e}{NC}")
                self._log_telemetry(
                    "bob_api_error", {"attempt": attempt, "error": str(e)}
                )

                if attempt < MAX_BOB_RETRIES:
                    print(f"{YELLOW}Retrying...{NC}")
                    time.sleep(1)
                    continue

        # All retries failed
        print(f"{RED}✗ Bob Shell diagnosis failed after {MAX_BOB_RETRIES} attempts{NC}")
        self._log_telemetry("bob_diagnosis_failed", {"total_attempts": MAX_BOB_RETRIES})

        return {
            "diagnosis": "Failed to diagnose error after multiple attempts",
            "category": "unknown",
            "confidence": 0.0,
        }

    def _simulate_bob_diagnosis(self, stderr: str) -> Dict:
        """Simulate Bob Shell diagnosis (placeholder for actual Bob API)."""
        stderr_lower = stderr.lower()

        # Pattern matching for common errors
        if "port" in stderr_lower and (
            "in use" in stderr_lower or "already allocated" in stderr_lower
        ):
            return {
                "diagnosis": "A required port is already in use by another process",
                "category": "port-in-use",
                "confidence": 0.95,
            }
        elif "docker" in stderr_lower and (
            "not running" in stderr_lower or "cannot connect" in stderr_lower
        ):
            return {
                "diagnosis": "Docker daemon is not running or not accessible",
                "category": "docker-not-running",
                "confidence": 0.90,
            }
        elif "command not found" in stderr_lower or "no such file" in stderr_lower:
            return {
                "diagnosis": "A required command or tool is not installed",
                "category": "missing-dependency",
                "confidence": 0.85,
            }
        elif "version" in stderr_lower and (
            "requires" in stderr_lower or "incompatible" in stderr_lower
        ):
            return {
                "diagnosis": "Installed version does not meet requirements",
                "category": "version-mismatch",
                "confidence": 0.80,
            }
        elif ".env" in stderr_lower or "environment variable" in stderr_lower:
            return {
                "diagnosis": "Required environment configuration is missing",
                "category": "env-missing",
                "confidence": 0.85,
            }
        elif "permission denied" in stderr_lower or "access denied" in stderr_lower:
            return {
                "diagnosis": "Insufficient permissions to perform operation",
                "category": "permission-denied",
                "confidence": 0.90,
            }
        elif "modulenotfounderror" in stderr_lower or "no module named" in stderr_lower:
            return {
                "diagnosis": "Python module not found - virtualenv may be missing or incomplete",
                "category": "missing-virtualenv",
                "confidence": 0.85,
            }
        elif (
            "no users" in stderr_lower
            or "no data" in stderr_lower
            or "table empty" in stderr_lower
            or "seed" in stderr_lower
        ):
            return {
                "diagnosis": "Database appears to be empty - seed data may be missing",
                "category": "missing-seed-data",
                "confidence": 0.80,
            }
        elif "connection refused" in stderr_lower and (
            "database" in stderr_lower
            or "postgres" in stderr_lower
            or "mysql" in stderr_lower
        ):
            return {
                "diagnosis": "Database connection refused - database service may not be running",
                "category": "database-not-running",
                "confidence": 0.90,
            }
        elif "network" in stderr_lower or (
            "connection" in stderr_lower and "timeout" in stderr_lower
        ):
            return {
                "diagnosis": "Network connectivity issue detected",
                "category": "network-error",
                "confidence": 0.75,
            }
        else:
            return {
                "diagnosis": "Unable to determine specific cause of failure",
                "category": "unknown",
                "confidence": 0.30,
            }

    def apply_recovery(self, diagnosis: Dict) -> bool:
        """Apply recovery action based on diagnosis."""
        category = diagnosis["category"]

        print(f"{YELLOW}=== Applying Recovery Action ==={NC}")
        print(f"Category: {category}")
        print()

        recovery_actions = {
            "port-in-use": self._recover_port_in_use,
            "docker-not-running": self._recover_docker,
            "missing-dependency": self._recover_missing_dependency,
            "version-mismatch": self._recover_version_mismatch,
            "missing-virtualenv": self._recover_missing_virtualenv,
            "missing-seed-data": self._recover_missing_seed_data,
            "database-not-running": self._recover_database_not_running,
            "env-missing": self._recover_env_missing,
            "permission-denied": self._recover_permission,
            "network-error": self._recover_network,
            "unknown": self._recover_unknown,
        }

        recovery_func = recovery_actions.get(category, self._recover_unknown)

        # Log recovery attempt start
        self._log_telemetry(
            "recovery_attempt",
            {
                "category": category,
                "diagnosis": diagnosis["diagnosis"],
                "confidence": diagnosis.get("confidence", 0),
                "attempt": self.retry_count + 1,
            },
            severity="recovery",
        )

        success = recovery_func(diagnosis)

        # Log recovery result
        if success:
            self._log_telemetry(
                "recovery_success",
                {
                    "category": category,
                    "diagnosis": diagnosis["diagnosis"],
                    "attempt": self.retry_count + 1,
                },
                severity="info",
            )
        else:
            self._log_telemetry(
                "recovery_failed",
                {
                    "category": category,
                    "diagnosis": diagnosis["diagnosis"],
                    "attempt": self.retry_count + 1,
                    "reason": "recovery_function_returned_false",
                },
                severity="error",
            )

        # Log recovery attempt
        self.recovery_history.append(
            {
                "attempt": self.retry_count + 1,
                "category": category,
                "diagnosis": diagnosis["diagnosis"],
                "success": success,
                "timestamp": time.time(),
            }
        )

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
        """Recover from version mismatch (Node.js with nvm)."""
        print(f"{BLUE}Recovery: Version mismatch detected{NC}")

        # Try to detect Node version requirement from toolchain
        toolchain_file = Path("/tmp/onboardops-toolchain.json")
        if toolchain_file.exists():
            try:
                import json

                toolchain = json.loads(toolchain_file.read_text())
                node_req = toolchain.get("node_version_required", "")

                if node_req and node_req != "any":
                    print(f"Required Node version: {node_req}")

                    # Check if nvm is available
                    nvm_check = subprocess.run(
                        ["bash", "-c", "command -v nvm"], capture_output=True, text=True
                    )

                    if (
                        nvm_check.returncode == 0
                        or Path.home().joinpath(".nvm").exists()
                    ):
                        print(
                            f"{BLUE}Attempting to install and switch to Node {node_req} using nvm{NC}"
                        )

                        # Extract version number (e.g., ">=18.0.0" -> "18")
                        import re

                        version_match = re.search(r"(\d+)", node_req)
                        if version_match:
                            version = version_match.group(1)

                            try:
                                # Source nvm and install required version
                                nvm_script = f"""
                                export NVM_DIR="$HOME/.nvm"
                                [ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"
                                nvm install {version}
                                nvm use {version}
                                """

                                result = subprocess.run(
                                    ["bash", "-c", nvm_script],
                                    capture_output=True,
                                    text=True,
                                    timeout=120,
                                )

                                if result.returncode == 0:
                                    print(
                                        f"{GREEN}✓ Node version {version} installed and activated{NC}"
                                    )
                                    return True
                                else:
                                    print(
                                        f"{RED}✗ Failed to install Node {version}{NC}"
                                    )
                                    print(f"Error: {result.stderr}")
                                    return False

                            except subprocess.TimeoutExpired:
                                print(f"{RED}✗ nvm install timed out{NC}")
                                return False
                            except Exception as e:
                                print(f"{RED}Error using nvm: {e}{NC}")
                                return False
                    else:
                        print(f"{YELLOW}nvm not found. Please install nvm first:{NC}")
                        print(
                            "  curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash"
                        )
                        return False

            except Exception as e:
                print(f"{YELLOW}Could not read toolchain info: {e}{NC}")

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

    def _recover_missing_virtualenv(self, diagnosis: Dict) -> bool:
        """Recover from missing or incomplete virtualenv (T4.2)."""
        print(f"{BLUE}Recovery: Missing or incomplete virtualenv detected{NC}")

        venv_path = Path(".venv") if Path(".venv").exists() else Path("venv")

        # Check if venv exists
        if not venv_path.exists():
            print(f"Creating Python virtual environment at {venv_path}")
            try:
                subprocess.run(
                    ["python3", "-m", "venv", str(venv_path)], check=True, timeout=60
                )
                print(f"{GREEN}✓ Virtual environment created{NC}")
            except Exception as e:
                print(f"{RED}Error creating virtualenv: {e}{NC}")
                return False

        # Activate and install dependencies
        print("Installing dependencies in virtualenv...")
        activate_script = venv_path / "bin" / "activate"

        if not activate_script.exists():
            print(f"{RED}Virtualenv appears corrupted, recreating...{NC}")
            import shutil

            shutil.rmtree(venv_path)
            return self._recover_missing_virtualenv(diagnosis)  # Retry

        try:
            # Install requirements
            pip_path = venv_path / "bin" / "pip"

            if Path("requirements.txt").exists():
                print("Installing from requirements.txt...")
                subprocess.run(
                    [str(pip_path), "install", "-r", "requirements.txt"],
                    check=True,
                    timeout=300,
                )

            if Path("pyproject.toml").exists():
                print("Installing from pyproject.toml...")
                subprocess.run(
                    [str(pip_path), "install", "-e", "."], check=True, timeout=300
                )

            print(f"{GREEN}✓ Dependencies installed successfully{NC}")
            return True

        except subprocess.TimeoutExpired:
            print(f"{RED}Installation timed out{NC}")
            return False
        except Exception as e:
            print(f"{RED}Error installing dependencies: {e}{NC}")
            return False

    def _recover_missing_seed_data(self, diagnosis: Dict) -> bool:
        """Recover from missing seed data (T4.3)."""
        print(f"{BLUE}Recovery: Missing seed data detected{NC}")

        # Try to find and run seed script
        seed_scripts = [
            ("python", ["python", "-m", "demo.seed"]),
            ("python", ["python", "scripts/seed.py"]),
            ("python", ["python", "seed.py"]),
            ("bash", ["bash", "scripts/seed.sh"]),
            ("bash", ["bash", "seed.sh"]),
        ]

        # Check pyproject.toml for seed script
        if Path("pyproject.toml").exists():
            try:
                # Try to parse pyproject.toml for seed script
                # Use tomllib (Python 3.11+) or tomli (fallback)
                try:
                    import tomllib

                    with open("pyproject.toml", "rb") as f:
                        data = tomllib.load(f)
                except ImportError:
                    try:
                        import tomli

                        with open("pyproject.toml", "rb") as f:
                            data = tomli.load(f)
                    except ImportError:
                        # No TOML parser available, skip
                        data = {}

                scripts = data.get("project", {}).get("scripts", {})
                if "seed" in scripts:
                    seed_cmd = scripts["seed"]
                    print(f"Found seed command in pyproject.toml: {seed_cmd}")
                    seed_scripts.insert(0, ("python", seed_cmd.split()))
            except Exception:
                pass

        for script_type, cmd in seed_scripts:
            # Check if script exists
            if script_type == "python":
                script_path = cmd[-1].replace("-m", "").replace(".", "/") + ".py"
                if not Path(script_path).exists() and not cmd[1] == "-m":
                    continue
            elif script_type == "bash":
                if not Path(cmd[-1]).exists():
                    continue

            print(f"Attempting to run seed script: {' '.join(cmd)}")
            try:
                result = subprocess.run(
                    cmd, capture_output=True, text=True, timeout=120
                )

                if result.returncode == 0:
                    print(f"{GREEN}✓ Seed data populated successfully{NC}")
                    return True
                else:
                    print(f"{YELLOW}Seed script failed: {result.stderr[:200]}{NC}")

            except FileNotFoundError:
                continue
            except subprocess.TimeoutExpired:
                print(f"{RED}Seed script timed out{NC}")
                return False
            except Exception as e:
                print(f"{YELLOW}Error running seed script: {e}{NC}")
                continue

        print(f"{YELLOW}No seed script found or all attempts failed{NC}")
        print(f"{YELLOW}Manual action required: Populate seed data{NC}")
        return False

    def _recover_database_not_running(self, diagnosis: Dict) -> bool:
        """Recover from database not running (T4.4)."""
        print(f"{BLUE}Recovery: Database not running detected{NC}")

        # Check for docker-compose
        compose_file = None
        if Path("docker-compose.yml").exists():
            compose_file = "docker-compose.yml"
        elif Path("docker-compose.yaml").exists():
            compose_file = "docker-compose.yaml"

        if not compose_file:
            print(f"{YELLOW}No docker-compose file found{NC}")
            print(f"{YELLOW}Manual action required: Start database service{NC}")
            return False

        print(f"Found {compose_file}, attempting to start database service...")

        # Try to identify database service name
        db_services = []
        try:
            with open(compose_file, "r") as f:
                content = f.read().lower()
                if "postgres" in content:
                    db_services.append("postgres")
                if "mysql" in content:
                    db_services.append("mysql")
                if "mongodb" in content or "mongo:" in content:
                    db_services.append("mongo")
                if "db:" in content:
                    db_services.append("db")
                if "database:" in content:
                    db_services.append("database")
        except Exception as e:
            print(f"{YELLOW}Could not parse docker-compose file: {e}{NC}")

        if not db_services:
            # Try to start all services
            print("Starting all docker-compose services...")
            db_services = [""]  # Empty string means all services

        for service in db_services:
            try:
                cmd = ["docker", "compose", "up", "-d"]
                if service:
                    cmd.append(service)
                    print(f"Starting service: {service}")

                result = subprocess.run(
                    cmd, capture_output=True, text=True, timeout=120
                )

                if result.returncode == 0:
                    print(f"{GREEN}✓ Docker Compose services started{NC}")

                    # Wait for database to be ready
                    print("Waiting for database to be ready (10 seconds)...")
                    time.sleep(10)

                    # Try to verify database is reachable
                    # This is a simple check - actual health check is in bootstrap
                    print(f"{GREEN}✓ Database should now be accessible{NC}")
                    return True
                else:
                    print(
                        f"{YELLOW}docker compose up failed: {result.stderr[:200]}{NC}"
                    )

            except subprocess.TimeoutExpired:
                print(f"{RED}docker compose up timed out{NC}")
                return False
            except Exception as e:
                print(f"{YELLOW}Error starting docker compose: {e}{NC}")
                continue

        print(f"{YELLOW}Failed to start database service{NC}")
        print(f"{YELLOW}Manual action required: Start database manually{NC}")
        return False

    def _restore_checkpoint_on_timeout(self):
        """Restore checkpoint if timeout occurred."""
        print(f"{RED}⏱️  Bootstrap timeout exceeded ({self.timeout}s){NC}")
        print(f"{YELLOW}Attempting to restore checkpoint...{NC}")

        # Log timeout event
        timeout_data = {
            "timestamp": time.time(),
            "timeout_seconds": self.timeout,
            "retry_count": self.retry_count,
            "recovery_history": self.recovery_history,
        }
        TIMEOUT_LOG.write_text(json.dumps(timeout_data, indent=2))

        # Try to restore checkpoint
        try:
            result = subprocess.run(
                ["bash", str(CHECKPOINT_SCRIPT), "restore"],
                capture_output=True,
                text=True,
                timeout=30,
            )

            if result.returncode == 0:
                print(f"{GREEN}✓ Checkpoint restored successfully{NC}")
                return True
            else:
                print(
                    f"{YELLOW}⚠ Checkpoint restoration failed: {result.stderr[:200]}{NC}"
                )
                return False

        except Exception as e:
            print(f"{RED}Error restoring checkpoint: {e}{NC}")
            return False

    def orchestrate(self) -> int:
        """Main orchestration loop with timeout enforcement."""
        print(f"{CYAN}╔═══════════════════════════════════════════════════════╗{NC}")
        print(f"{CYAN}║  OnboardOps Auto-Bootstrap with Bob Shell AI         ║{NC}")
        print(f"{CYAN}╚═══════════════════════════════════════════════════════╝{NC}")
        print()

        if self.timeout > 0:
            print(f"{BLUE}Timeout: {self.timeout}s (3 minutes){NC}")
            print()

        # Start timeout timer
        self.start_time = time.time()

        while self.retry_count < MAX_RETRIES:
            # Check for timeout before each attempt
            if self.start_time:
                elapsed = time.time() - self.start_time
                if elapsed >= self.timeout:
                    self.timed_out = True
                    break
            # Run bootstrap
            exit_code, stdout, stderr = self.run_bootstrap()

            # Print output
            if stdout:
                print(stdout)

            # Check if successful
            if exit_code == 0:
                print()
                print(
                    f"{GREEN}╔═══════════════════════════════════════════════════════╗{NC}"
                )
                print(
                    f"{GREEN}║  ✓ Bootstrap Completed Successfully                   ║{NC}"
                )
                print(
                    f"{GREEN}╚═══════════════════════════════════════════════════════╝{NC}"
                )

                if self.recovery_history:
                    print()
                    print(f"{CYAN}Recovery Summary:{NC}")
                    for recovery in self.recovery_history:
                        status = "✓" if recovery["success"] else "✗"
                        print(
                            f"  {status} Attempt {recovery['attempt']}: {recovery['category']}"
                        )

                return 0

            # Bootstrap failed
            print()
            print(f"{RED}✗ Bootstrap failed with exit code {exit_code}{NC}")

            # Check for timeout
            if exit_code == 124 or self.timed_out:
                print(f"{RED}Bootstrap timed out{NC}")
                break

            print()

            # Check if we should retry
            self.retry_count += 1
            if self.retry_count >= MAX_RETRIES:
                print(f"{RED}Maximum retries ({MAX_RETRIES}) reached{NC}")
                break

            # Diagnose with Bob
            if stderr:
                diagnosis = self.diagnose_with_bob(stderr)

                # Check confidence threshold
                if diagnosis["confidence"] < MIN_CONFIDENCE:
                    print(
                        f"{YELLOW}⚠ Confidence {diagnosis['confidence']:.0%} below threshold {MIN_CONFIDENCE:.0%}{NC}"
                    )
                    print(
                        f"{YELLOW}Stopping auto-bootstrap to avoid incorrect recovery{NC}"
                    )

                    # Log low confidence event
                    self._log_telemetry(
                        "low_confidence_stop",
                        {
                            "confidence": diagnosis["confidence"],
                            "threshold": MIN_CONFIDENCE,
                            "category": diagnosis["category"],
                        },
                    )
                    break

                # Apply recovery with sufficient confidence
                print(f"{GREEN}✓ Confidence sufficient, applying recovery...{NC}")
                recovery_success = self.apply_recovery(diagnosis)

                if not recovery_success:
                    print(
                        f"{YELLOW}Recovery action failed or requires manual intervention{NC}"
                    )
                    print(f"{YELLOW}Stopping auto-bootstrap{NC}")

                    # Log recovery failure
                    self._log_telemetry(
                        "recovery_failed",
                        {
                            "category": diagnosis["category"],
                            "confidence": diagnosis["confidence"],
                        },
                    )
                    break

                # Log successful recovery
                self._log_telemetry(
                    "recovery_success",
                    {
                        "category": diagnosis["category"],
                        "confidence": diagnosis["confidence"],
                    },
                )

                print()
                print(f"{BLUE}Retrying bootstrap...{NC}")
                print()
                time.sleep(2)
            else:
                print(f"{YELLOW}No error output to diagnose{NC}")
                break

        # Handle timeout
        if self.timed_out:
            print()
            print(f"{RED}╔═══════════════════════════════════════════════════════╗{NC}")
            print(f"{RED}║  ⏱️  Bootstrap Timeout                                ║{NC}")
            print(f"{RED}╚═══════════════════════════════════════════════════════╝{NC}")
            print()

            # Restore checkpoint
            self._restore_checkpoint_on_timeout()

            print()
            print(f"{YELLOW}Bootstrap exceeded {self.timeout}s timeout{NC}")
            print(f"Timeout log: {TIMEOUT_LOG}")

            return 124  # Distinct exit code for timeout

        # Failed after all retries
        print()
        print(f"{RED}╔═══════════════════════════════════════════════════════╗{NC}")
        print(f"{RED}║  ✗ Bootstrap Failed                                   ║{NC}")
        print(f"{RED}╚═══════════════════════════════════════════════════════╝{NC}")
        print()

        if self.recovery_history:
            print(f"{CYAN}Recovery Attempts:{NC}")
            for recovery in self.recovery_history:
                status = "✓" if recovery["success"] else "✗"
                print(
                    f"  {status} Attempt {recovery['attempt']}: {recovery['category']}"
                )
                print(f"     {recovery['diagnosis']}")

        print()
        print(f"{YELLOW}Please review the errors and try manual recovery{NC}")
        print(f"Error log: {ERROR_LOG}")
        print(f"Recovery log: {RECOVERY_LOG}")

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
        help="Enable automatic recovery without prompts",
    )
    parser.add_argument(
        "--timeout",
        type=int,
        default=DEFAULT_TIMEOUT,
        help=f"Maximum time in seconds for bootstrap (default: {DEFAULT_TIMEOUT}s / 3 minutes)",
    )

    args = parser.parse_args()

    orchestrator = BootstrapOrchestrator(
        auto_recover=args.auto_recover, timeout=args.timeout
    )
    exit_code = orchestrator.orchestrate()

    sys.exit(exit_code)


if __name__ == "__main__":
    main()

# Made with Bob
