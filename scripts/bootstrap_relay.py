#!/usr/bin/env python3
"""
OnboardOps Bootstrap Event Relay - T4.8
Dev 4 - Infra / Bob Shell

Tails bootstrap stdout, transforms JSON events to canonical WS format,
and POSTs to Dev 2's emit_event MCP tool for dashboard display.
"""

import sys
import json
import time
import requests
from pathlib import Path
from typing import Dict, Optional
import subprocess
import threading

# Configuration
MCP_SERVER_URL = "http://localhost:3001"  # Dev 2's MCP server
EMIT_EVENT_ENDPOINT = f"{MCP_SERVER_URL}/mcp/emit_event"
BOOTSTRAP_SCRIPT = Path(__file__).parent / "bootstrap.sh"

# ANSI Colors
CYAN = '\033[0;36m'
GREEN = '\033[0;32m'
YELLOW = '\033[1;33m'
RED = '\033[0;31m'
NC = '\033[0m'


class BootstrapRelay:
    """Relays bootstrap events to the dashboard via WebSocket bridge."""
    
    def __init__(self, session_id: Optional[str] = None):
        self.session_id = session_id or f"bootstrap-{int(time.time())}"
        self.event_count = 0
        
    def transform_event(self, bootstrap_event: Dict) -> Dict:
        """Transform bootstrap JSON event to canonical WS event format."""
        
        # Extract fields from bootstrap event
        stage = bootstrap_event.get('stage', 'unknown')
        status = bootstrap_event.get('status', 'info')
        message = bootstrap_event.get('message', '')
        duration_ms = bootstrap_event.get('duration_ms', 0)
        timestamp = bootstrap_event.get('timestamp', time.strftime('%Y-%m-%dT%H:%M:%SZ', time.gmtime()))
        details = bootstrap_event.get('details', {})
        
        # Use severity from event if present, otherwise map from status
        if 'severity' in bootstrap_event:
            severity = bootstrap_event['severity']
        else:
            # Map status to severity (legacy support)
            severity_map = {
                'start': 'info',
                'info': 'info',
                'warning': 'warn',
                'warn': 'warn',
                'error': 'error',
                'complete': 'info',
                'success': 'info',
                'recovery': 'recovery',
                'recovering': 'recovery'
            }
            severity = severity_map.get(status, 'info')
        
        # Map bootstrap stages to dashboard event types
        event_type_map = {
            'detect': 'BootstrapDetect',
            'install': 'BootstrapInstall',
            'migrate': 'BootstrapMigrate',
            'seed': 'BootstrapSeed',
            'healthcheck': 'BootstrapHealthCheck',
            'recovery': 'BootstrapRecovery',
            'bootstrap': 'BootstrapStatus'
        }
        
        event_type = event_type_map.get(stage, 'BootstrapEvent')
        
        # Build canonical event with enhanced payload
        canonical_event = {
            'type': event_type,
            'session_id': self.session_id,
            'timestamp': timestamp,
            'data': {
                'stage': stage,
                'status': status,
                'message': message,
                'duration_ms': duration_ms,
                'severity': severity
            }
        }
        
        # Add details if present
        if details:
            canonical_event['data']['details'] = details
        
        return canonical_event
    
    def emit_event(self, event: Dict) -> bool:
        """POST event to MCP server's emit_event endpoint."""
        try:
            response = requests.post(
                EMIT_EVENT_ENDPOINT,
                json=event,
                timeout=5
            )
            
            if response.status_code == 200:
                self.event_count += 1
                return True
            else:
                print(f"{YELLOW}Warning: emit_event returned {response.status_code}{NC}", file=sys.stderr)
                return False
                
        except requests.exceptions.ConnectionError:
            print(f"{YELLOW}Warning: Cannot connect to MCP server at {MCP_SERVER_URL}{NC}", file=sys.stderr)
            print(f"{YELLOW}Events will not be displayed on dashboard{NC}", file=sys.stderr)
            return False
        except Exception as e:
            print(f"{RED}Error emitting event: {e}{NC}", file=sys.stderr)
            return False
    
    def process_line(self, line: str) -> None:
        """Process a single line of bootstrap output."""
        line = line.strip()
        if not line:
            return
        
        # Try to parse as JSON
        try:
            bootstrap_event = json.loads(line)
            
            # Transform to canonical format
            canonical_event = self.transform_event(bootstrap_event)
            
            # Emit to dashboard
            success = self.emit_event(canonical_event)
            
            if success:
                print(f"{GREEN}✓{NC} Relayed: {canonical_event['type']} - {canonical_event['data']['message']}")
            
        except json.JSONDecodeError:
            # Not JSON, just regular output - ignore
            pass
        except Exception as e:
            print(f"{RED}Error processing line: {e}{NC}", file=sys.stderr)
    
    def relay_bootstrap(self, *args) -> int:
        """Run bootstrap and relay events in real-time."""
        print(f"{CYAN}=== Bootstrap Event Relay ==={NC}")
        print(f"Session ID: {self.session_id}")
        print(f"MCP Server: {MCP_SERVER_URL}")
        print()
        
        # Emit session start event
        start_event = {
            'type': 'BootstrapStart',
            'session_id': self.session_id,
            'timestamp': time.strftime('%Y-%m-%dT%H:%M:%SZ', time.gmtime()),
            'data': {
                'stage': 'bootstrap',
                'status': 'start',
                'message': 'Bootstrap session started',
                'severity': 'info'
            }
        }
        self.emit_event(start_event)
        
        # Run bootstrap and capture output
        try:
            cmd = [str(BOOTSTRAP_SCRIPT)] + list(args)
            
            process = subprocess.Popen(
                cmd,
                stdout=subprocess.PIPE,
                stderr=subprocess.STDOUT,
                text=True,
                bufsize=1,
                universal_newlines=True
            )
            
            # Process output line by line
            for line in process.stdout:
                print(line, end='')  # Echo to console
                self.process_line(line)
            
            # Wait for completion
            exit_code = process.wait()
            
            # Emit session end event
            end_event = {
                'type': 'BootstrapEnd',
                'session_id': self.session_id,
                'timestamp': time.strftime('%Y-%m-%dT%H:%M:%SZ', time.gmtime()),
                'data': {
                    'stage': 'bootstrap',
                    'status': 'complete' if exit_code == 0 else 'error',
                    'message': f'Bootstrap completed with exit code {exit_code}',
                    'severity': 'success' if exit_code == 0 else 'error',
                    'exit_code': exit_code,
                    'events_relayed': self.event_count
                }
            }
            self.emit_event(end_event)
            
            print()
            print(f"{CYAN}=== Relay Summary ==={NC}")
            print(f"Events relayed: {self.event_count}")
            print(f"Exit code: {exit_code}")
            
            return exit_code
            
        except Exception as e:
            print(f"{RED}Error running bootstrap: {e}{NC}", file=sys.stderr)
            return 1


def main():
    """Main entry point."""
    import argparse
    
    parser = argparse.ArgumentParser(
        description="Relay bootstrap events to dashboard via WebSocket bridge"
    )
    parser.add_argument(
        '--session-id',
        help="Custom session ID (default: auto-generated)"
    )
    parser.add_argument(
        '--mcp-url',
        default=MCP_SERVER_URL,
        help=f"MCP server URL (default: {MCP_SERVER_URL})"
    )
    parser.add_argument(
        'bootstrap_args',
        nargs='*',
        help="Arguments to pass to bootstrap.sh"
    )
    
    args = parser.parse_args()
    
    # Update MCP URL if provided
    global MCP_SERVER_URL, EMIT_EVENT_ENDPOINT
    if args.mcp_url:
        MCP_SERVER_URL = args.mcp_url
        EMIT_EVENT_ENDPOINT = f"{MCP_SERVER_URL}/mcp/emit_event"
    
    relay = BootstrapRelay(session_id=args.session_id)
    exit_code = relay.relay_bootstrap(*args.bootstrap_args)
    
    sys.exit(exit_code)


if __name__ == "__main__":
    main()

# Made with Bob
