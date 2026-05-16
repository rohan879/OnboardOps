#!/usr/bin/env python3
"""
Relay bootstrap script events into the OnboardOps MCP WebSocket bridge.

The bootstrap script emits JSON lines. This adapter converts those lines into
the canonical emit_event MCP contract so the dashboard can show setup progress
and auto-recovery attempts without a bespoke WebSocket client.
"""

import argparse
import json
import subprocess
import sys
import time
from pathlib import Path
from typing import Any, Dict, Optional

import requests

MCP_SERVER_URL = "http://127.0.0.1:8765"
EMIT_EVENT_ENDPOINT = f"{MCP_SERVER_URL}/mcp/invoke"
BOOTSTRAP_SCRIPT = Path(__file__).parent / "bootstrap.sh"

CYAN = "\033[0;36m"
GREEN = "\033[0;32m"
YELLOW = "\033[1;33m"
RED = "\033[0;31m"
NC = "\033[0m"

RECOVERY_PATTERNS = {
    "port-in-use",
    "node-version",
    "missing-venv",
    "missing-seed",
    "db-not-running",
}


class BootstrapRelay:
    """Relays bootstrap events to the dashboard through the MCP server."""

    def __init__(self, session_id: Optional[str] = None):
        self.session_id = session_id or f"bootstrap-{int(time.time())}"
        self.event_count = 0

    def transform_event(self, bootstrap_event: Dict[str, Any]) -> Dict[str, Any]:
        """Transform one bootstrap JSON object into an emit_event tool call."""
        stage = bootstrap_event.get("stage", "bootstrap")
        status = bootstrap_event.get("status", "info")
        message = bootstrap_event.get("message", "")
        duration_ms = int(bootstrap_event.get("duration_ms", 0) or 0)
        details = bootstrap_event.get("details", {}) or {}
        severity = bootstrap_event.get("severity") or self._severity_from_status(status)

        if stage == "recovery" or status in {"recovery", "recovering"}:
            pattern = details.get("pattern") or bootstrap_event.get("pattern")
            if pattern not in RECOVERY_PATTERNS:
                pattern = "missing-venv"

            event_type = "bootstrap_recovery"
            event_data = {
                "pattern": pattern,
                "action": message
                or details.get("action", "Bootstrap recovery in progress"),
                "details": details.get("details", ""),
                "status": self._recovery_status(status),
            }
        else:
            event_type = "bootstrap_status"
            event_data = {
                "stage": stage,
                "status": status,
                "message": message,
                "duration_ms": duration_ms,
                "severity": severity,
            }
            if details:
                event_data["details"] = details

        return self._emit_payload(event_type, event_data)

    def emit_event(self, payload: Dict[str, Any]) -> bool:
        """POST an emit_event invocation to the MCP server."""
        try:
            response = requests.post(EMIT_EVENT_ENDPOINT, json=payload, timeout=5)

            if response.status_code == 200:
                body = response.json()
                if body.get("error"):
                    print(
                        f"{YELLOW}Warning: emit_event failed: {body['error']}{NC}",
                        file=sys.stderr,
                    )
                    return False

                self.event_count += 1
                return True

            print(
                f"{YELLOW}Warning: emit_event returned {response.status_code}{NC}",
                file=sys.stderr,
            )
            return False
        except requests.exceptions.ConnectionError:
            print(
                f"{YELLOW}Warning: cannot connect to MCP server at {MCP_SERVER_URL}{NC}",
                file=sys.stderr,
            )
            return False
        except Exception as exc:
            print(f"{RED}Error emitting event: {exc}{NC}", file=sys.stderr)
            return False

    def process_line(self, line: str) -> None:
        """Process one line of bootstrap output."""
        line = line.strip()
        if not line:
            return

        try:
            bootstrap_event = json.loads(line)
        except json.JSONDecodeError:
            return

        try:
            payload = self.transform_event(bootstrap_event)
            if self.emit_event(payload):
                arguments = payload["arguments"]
                event_type = arguments["event_type"]
                event_data = arguments["event_data"]
                label = event_data.get("message") or event_data.get("action") or "event"
                print(f"{GREEN}[OK]{NC} Relayed: {event_type} - {label}")
        except Exception as exc:
            print(f"{RED}Error processing line: {exc}{NC}", file=sys.stderr)

    def relay_bootstrap(self, *args: str) -> int:
        """Run bootstrap.sh and relay JSON events in real time."""
        print(f"{CYAN}=== Bootstrap Event Relay ==={NC}")
        print(f"Session ID: {self.session_id}")
        print(f"MCP Server: {MCP_SERVER_URL}")
        print()

        self.emit_event(
            self._emit_payload(
                "bootstrap_status",
                {
                    "stage": "bootstrap",
                    "status": "start",
                    "message": "Bootstrap session started",
                    "severity": "info",
                },
            )
        )

        try:
            process = subprocess.Popen(
                [str(BOOTSTRAP_SCRIPT), *args],
                stdout=subprocess.PIPE,
                stderr=subprocess.STDOUT,
                text=True,
                bufsize=1,
            )

            if process.stdout:
                for line in process.stdout:
                    print(line, end="")
                    self.process_line(line)

            exit_code = process.wait()

            self.emit_event(
                self._emit_payload(
                    "bootstrap_status",
                    {
                        "stage": "bootstrap",
                        "status": "complete" if exit_code == 0 else "error",
                        "message": f"Bootstrap completed with exit code {exit_code}",
                        "severity": "success" if exit_code == 0 else "error",
                        "details": {
                            "exit_code": exit_code,
                            "events_relayed": self.event_count,
                        },
                    },
                )
            )

            print()
            print(f"{CYAN}=== Relay Summary ==={NC}")
            print(f"Events relayed: {self.event_count}")
            print(f"Exit code: {exit_code}")
            return exit_code
        except Exception as exc:
            print(f"{RED}Error running bootstrap: {exc}{NC}", file=sys.stderr)
            return 1

    def _emit_payload(
        self, event_type: str, event_data: Dict[str, Any]
    ) -> Dict[str, Any]:
        return {
            "tool_name": "emit_event",
            "arguments": {
                "event_type": event_type,
                "event_data": event_data,
                "session_id": self.session_id,
            },
        }

    @staticmethod
    def _severity_from_status(status: str) -> str:
        return {
            "start": "info",
            "info": "info",
            "warning": "warn",
            "warn": "warn",
            "error": "error",
            "failed": "error",
            "complete": "success",
            "success": "success",
            "recovery": "recovery",
            "recovering": "recovery",
        }.get(status, "info")

    @staticmethod
    def _recovery_status(status: str) -> str:
        if status in {"complete", "success"}:
            return "success"
        if status in {"error", "failed", "failure"}:
            return "failed"
        return "in-progress"


def main() -> None:
    """Parse CLI arguments and run the relay."""
    global MCP_SERVER_URL, EMIT_EVENT_ENDPOINT

    parser = argparse.ArgumentParser(
        description="Relay bootstrap events to the OnboardOps dashboard"
    )
    parser.add_argument("--session-id", help="Custom session ID")
    parser.add_argument(
        "--mcp-url",
        default=MCP_SERVER_URL,
        help=f"MCP server URL (default: {MCP_SERVER_URL})",
    )
    parser.add_argument("bootstrap_args", nargs="*", help="Arguments for bootstrap.sh")

    args = parser.parse_args()

    if args.mcp_url:
        MCP_SERVER_URL = args.mcp_url
        EMIT_EVENT_ENDPOINT = f"{MCP_SERVER_URL}/mcp/invoke"

    relay = BootstrapRelay(session_id=args.session_id)
    sys.exit(relay.relay_bootstrap(*args.bootstrap_args))


if __name__ == "__main__":
    main()
