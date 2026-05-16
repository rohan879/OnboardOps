"""
WebSocket Handler for OnboardOps
Manages WebSocket connections and broadcasts events to connected clients
"""

import asyncio
import json
from typing import Dict, Set, Optional
from fastapi import WebSocket, WebSocketDisconnect
from ws.events import EventType, EventEnvelope


class ConnectionManager:
    """
    Manages WebSocket connections with per-session topic routing

    Supports:
    - Multiple concurrent sessions
    - Per-session event broadcasting
    - Graceful connection handling
    - Connection registry
    """

    def __init__(self):
        # Active connections: session_id -> Set[WebSocket]
        self.active_connections: Dict[str, Set[WebSocket]] = {}
        # Global connections (receive all events)
        self.global_connections: Set[WebSocket] = set()
        # Lock for thread-safe operations
        self._lock = asyncio.Lock()

    async def connect(self, websocket: WebSocket, session_id: Optional[str] = None):
        """
        Accept a new WebSocket connection

        Args:
            websocket: The WebSocket connection
            session_id: Optional session ID for session-specific routing
                       If None, connection receives all events (global)
        """
        await websocket.accept()

        async with self._lock:
            if session_id:
                if session_id not in self.active_connections:
                    self.active_connections[session_id] = set()
                self.active_connections[session_id].add(websocket)
                print(f"[WS] Client connected to session: {session_id}")
            else:
                self.global_connections.add(websocket)
                print("[WS] Client connected globally")

    async def disconnect(self, websocket: WebSocket, session_id: Optional[str] = None):
        """
        Remove a WebSocket connection

        Args:
            websocket: The WebSocket connection to remove
            session_id: Session ID if this was a session-specific connection
        """
        async with self._lock:
            if session_id and session_id in self.active_connections:
                self.active_connections[session_id].discard(websocket)
                if not self.active_connections[session_id]:
                    # Clean up empty session
                    del self.active_connections[session_id]
                print(f"[WS] Client disconnected from session: {session_id}")
            else:
                self.global_connections.discard(websocket)
                print("[WS] Client disconnected globally")

    async def broadcast_to_session(self, session_id: str, event: EventType):
        """
        Broadcast an event to all connections subscribed to a specific session

        Args:
            session_id: The session ID to broadcast to
            event: The event to broadcast
        """
        # Wrap event in envelope
        envelope = EventEnvelope(event=event)
        message = envelope.model_dump_json()

        # Get connections for this session
        connections = self.active_connections.get(session_id, set()).copy()

        # Also send to global connections
        connections.update(self.global_connections)

        if not connections:
            print(f"[WS] No connections for session {session_id}, event not sent")
            return

        # Broadcast to all connections
        disconnected = []
        for connection in connections:
            try:
                await connection.send_text(message)
            except WebSocketDisconnect:
                disconnected.append(connection)
            except Exception as e:
                print(f"[WS] Error sending to connection: {e}")
                disconnected.append(connection)

        # Clean up disconnected connections
        for connection in disconnected:
            await self.disconnect(connection, session_id)

    async def broadcast_global(self, event: EventType):
        """
        Broadcast an event to all global connections

        Args:
            event: The event to broadcast
        """
        envelope = EventEnvelope(event=event)
        message = envelope.model_dump_json()

        connections = self.global_connections.copy()

        if not connections:
            print("[WS] No global connections, event not sent")
            return

        disconnected = []
        for connection in connections:
            try:
                await connection.send_text(message)
            except WebSocketDisconnect:
                disconnected.append(connection)
            except Exception as e:
                print(f"[WS] Error sending to global connection: {e}")
                disconnected.append(connection)

        # Clean up disconnected connections
        for connection in disconnected:
            await self.disconnect(connection)

    def get_connection_count(self, session_id: Optional[str] = None) -> int:
        """Get the number of active connections for a session or globally"""
        if session_id:
            return len(self.active_connections.get(session_id, set()))
        return len(self.global_connections)

    def get_active_sessions(self) -> list[str]:
        """Get list of active session IDs"""
        return list(self.active_connections.keys())


# Global connection manager instance
manager = ConnectionManager()


async def websocket_handler(websocket: WebSocket, session_id: Optional[str] = None):
    """
    Handle a WebSocket connection

    Args:
        websocket: The WebSocket connection
        session_id: Optional session ID for session-specific routing
    """
    await manager.connect(websocket, session_id)

    try:
        while True:
            # Keep connection alive and handle any incoming messages
            data = await websocket.receive_text()

            if data == "ping":
                await websocket.send_text(json.dumps({"type": "pong"}))

    except WebSocketDisconnect:
        await manager.disconnect(websocket, session_id)
    except Exception as e:
        print(f"[WS] Error in websocket handler: {e}")
        await manager.disconnect(websocket, session_id)


# Made with Bob
