#!/usr/bin/env python3
"""
OnboardOps Session Telemetry Capture Service

Subscribes to the WebSocket /events stream and appends every event to
.onboardops/sessions/<session-id>.jsonl. One file per session.
Auto-rotates at session-close.

Usage:
    python scripts/telemetry.py [--ws-url WS_URL] [--output-dir OUTPUT_DIR]

Dependencies: websockets, python-dotenv
"""

import asyncio
import json
import logging
import os
import sys
from datetime import datetime
from pathlib import Path
from typing import Dict

try:
    import websockets
except ImportError:
    print("Error: websockets library not installed", file=sys.stderr)
    print("Install with: pip install websockets", file=sys.stderr)
    sys.exit(1)

# Configure logging
logging.basicConfig(
    level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger("telemetry")


class TelemetryCapture:
    """Captures WebSocket events to JSONL session files."""

    def __init__(
        self,
        ws_url: str = "ws://localhost:8765/events",
        output_dir: str = ".onboardops/sessions",
    ):
        self.ws_url = ws_url
        self.output_dir = Path(output_dir)
        self.output_dir.mkdir(parents=True, exist_ok=True)

        # Track active sessions and their file handles
        self.sessions: Dict[str, dict] = {}
        self.event_count = 0

        logger.info("Telemetry capture initialized")
        logger.info(f"WebSocket URL: {self.ws_url}")
        logger.info(f"Output directory: {self.output_dir}")

    def get_session_file_path(self, session_id: str) -> Path:
        """Get the JSONL file path for a session."""
        return self.output_dir / f"{session_id}.jsonl"

    def open_session(self, session_id: str) -> None:
        """Open a new session file for writing."""
        if session_id in self.sessions:
            logger.warning(f"Session {session_id} already open")
            return

        file_path = self.get_session_file_path(session_id)
        file_handle = open(file_path, "a", encoding="utf-8")

        self.sessions[session_id] = {
            "file": file_handle,
            "path": file_path,
            "event_count": 0,
            "started_at": datetime.utcnow().isoformat(),
        }

        logger.info(f"Opened session {session_id} -> {file_path}")

    def close_session(self, session_id: str) -> None:
        """Close a session file."""
        if session_id not in self.sessions:
            logger.warning(f"Session {session_id} not found")
            return

        session = self.sessions[session_id]
        session["file"].close()

        logger.info(
            f"Closed session {session_id}: "
            f"{session['event_count']} events written to {session['path']}"
        )

        del self.sessions[session_id]

    def write_event(self, session_id: str, event: dict) -> None:
        """Write an event to the session file."""
        # Ensure session is open
        if session_id not in self.sessions:
            self.open_session(session_id)

        session = self.sessions[session_id]

        # Add metadata
        event_with_meta = {
            **event,
            "_captured_at": datetime.utcnow().isoformat(),
            "_session_id": session_id,
        }

        # Write as JSONL (one JSON object per line)
        json_line = json.dumps(event_with_meta, ensure_ascii=False)
        session["file"].write(json_line + "\n")
        session["file"].flush()  # Ensure immediate write

        session["event_count"] += 1
        self.event_count += 1

    def handle_event(self, event: dict) -> None:
        """Process an incoming event."""
        try:
            # Extract session ID from event
            session_id = event.get("session_id") or event.get("sessionId")

            if not session_id:
                # Try to infer from event type
                if event.get("type") == "SessionStart":
                    session_id = (
                        event.get("id") or f"session-{datetime.utcnow().timestamp()}"
                    )
                else:
                    logger.warning(f"Event missing session_id: {event.get('type')}")
                    session_id = "unknown"

            # Handle session lifecycle events
            event_type = event.get("type")

            if event_type == "SessionStart":
                self.open_session(session_id)
            elif event_type in ("SessionEnd", "SessionClose", "CertificationComplete"):
                self.write_event(session_id, event)
                self.close_session(session_id)
                return

            # Write event to session file
            self.write_event(session_id, event)

            # Log progress every 10 events
            if self.event_count % 10 == 0:
                logger.info(
                    f"Captured {self.event_count} events across {len(self.sessions)} active sessions"
                )

        except Exception as e:
            logger.error(f"Error handling event: {e}", exc_info=True)

    async def run(self) -> None:
        """Main event loop - connect to WebSocket and capture events."""
        retry_delay = 1
        max_retry_delay = 30

        while True:
            try:
                logger.info(f"Connecting to {self.ws_url}...")

                async with websockets.connect(self.ws_url) as websocket:
                    logger.info("Connected to WebSocket")
                    retry_delay = 1  # Reset retry delay on successful connection

                    async for message in websocket:
                        try:
                            event = json.loads(message)
                            self.handle_event(event)
                        except json.JSONDecodeError as e:
                            logger.error(f"Invalid JSON received: {e}")
                        except Exception as e:
                            logger.error(
                                f"Error processing message: {e}", exc_info=True
                            )

            except websockets.exceptions.WebSocketException as e:
                logger.warning(f"WebSocket error: {e}")
            except ConnectionRefusedError:
                logger.warning(f"Connection refused to {self.ws_url}")
            except Exception as e:
                logger.error(f"Unexpected error: {e}", exc_info=True)

            # Close any open sessions on disconnect
            for session_id in list(self.sessions.keys()):
                self.close_session(session_id)

            # Exponential backoff
            logger.info(f"Reconnecting in {retry_delay}s...")
            await asyncio.sleep(retry_delay)
            retry_delay = min(retry_delay * 2, max_retry_delay)

    def cleanup(self) -> None:
        """Clean up resources."""
        logger.info("Cleaning up...")
        for session_id in list(self.sessions.keys()):
            self.close_session(session_id)


async def main():
    """Main entry point."""
    import argparse

    parser = argparse.ArgumentParser(
        description="OnboardOps Session Telemetry Capture Service"
    )
    parser.add_argument(
        "--ws-url",
        default=os.getenv("ONBOARDOPS_WS_URL", "ws://localhost:8765/events"),
        help="WebSocket URL (default: ws://localhost:8765/events)",
    )
    parser.add_argument(
        "--output-dir",
        default=os.getenv("ONBOARDOPS_SESSION_DIR", ".onboardops/sessions"),
        help="Output directory for session files (default: .onboardops/sessions)",
    )
    parser.add_argument("--verbose", action="store_true", help="Enable verbose logging")

    args = parser.parse_args()

    if args.verbose:
        logging.getLogger().setLevel(logging.DEBUG)

    capture = TelemetryCapture(ws_url=args.ws_url, output_dir=args.output_dir)

    try:
        await capture.run()
    except KeyboardInterrupt:
        logger.info("Received interrupt signal")
    finally:
        capture.cleanup()


if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("\nTelemetry capture stopped")
        sys.exit(0)

# Made with Bob
