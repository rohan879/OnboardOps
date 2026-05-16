# Bootstrap Event Payload Specification

**Phase 3 T4.9 - Bootstrap Event Payload Polish**  
**Dev 4 - Infra / Bob Shell**

## Overview

This document specifies the enhanced event payload format for bootstrap events. These events power the auto-recovery banner on the dashboard and provide rich telemetry for debugging and monitoring.

## Event Structure

All bootstrap events follow this JSON structure:

```json
{
  "timestamp": "2026-05-16T03:00:00Z",
  "stage": "recovery",
  "status": "success",
  "message": "Port 3000 recovered successfully",
  "duration_ms": 2500,
  "severity": "info",
  "details": {
    "port": 3000,
    "pid": 12345,
    "process": "node",
    "result": "success",
    "recovery_time_ms": 2500
  },
  "version": "1.0.0"
}
```

## Field Specifications

### Required Fields

- **`timestamp`** (string, ISO 8601): Event timestamp in UTC
- **`stage`** (string): Bootstrap stage identifier
- **`status`** (string): Event status
- **`message`** (string): Human-readable summary of the event
- **`severity`** (string): Event severity level
- **`version`** (string): Bootstrap script version

### Optional Fields

- **`duration_ms`** (number): Duration in milliseconds (default: 0)
- **`details`** (object): Technical details for debugging and display

## Severity Levels

Events use four severity levels that map to dashboard display styles:

| Severity | Description | Dashboard Display |
|----------|-------------|-------------------|
| `info` | Normal operation, informational | Blue banner, neutral tone |
| `warn` | Warning condition, attention needed | Yellow banner, caution tone |
| `recovery` | Auto-recovery in progress | Orange banner, action tone |
| `error` | Error condition, failure | Red banner, alert tone |

## Bootstrap Stages

### 1. Detect Stage

**Purpose:** Toolchain detection and validation

```json
{
  "stage": "detect",
  "status": "start",
  "message": "Detecting toolchain requirements",
  "severity": "info"
}
```

### 2. Install Stage

**Purpose:** Dependency installation

```json
{
  "stage": "install",
  "status": "complete",
  "message": "Dependencies installed successfully",
  "duration_ms": 15000,
  "severity": "info"
}
```

### 3. Migrate Stage

**Purpose:** Database migrations

```json
{
  "stage": "migrate",
  "status": "complete",
  "message": "Database migrations applied",
  "duration_ms": 3000,
  "severity": "info"
}
```

### 4. Seed Stage

**Purpose:** Database seeding

```json
{
  "stage": "seed",
  "status": "complete",
  "message": "Database seeded with initial data",
  "duration_ms": 2000,
  "severity": "info"
}
```

### 5. Healthcheck Stage

**Purpose:** Service health verification

```json
{
  "stage": "healthcheck",
  "status": "success",
  "message": "All services healthy",
  "severity": "info"
}
```

### 6. Recovery Stage

**Purpose:** Auto-recovery actions

```json
{
  "stage": "recovery",
  "status": "success",
  "message": "Port 3000 recovered successfully",
  "severity": "info",
  "details": {
    "port": 3000,
    "pid": 12345,
    "process": "node",
    "recovery_pattern": "port-in-use",
    "result": "success"
  }
}
```

## Recovery Event Details

Recovery events include rich `details` objects for dashboard display:

### Port-in-Use Recovery

```json
{
  "details": {
    "port": 3000,
    "pid": 12345,
    "process": "node",
    "action": "terminate",
    "recovery_pattern": "port-in-use",
    "result": "success",
    "recovery_time_ms": 2500
  }
}
```

### Node Version Mismatch Recovery

```json
{
  "details": {
    "required_version": "18",
    "current_version": "16.14.0",
    "recovery_pattern": "version-mismatch",
    "action": "nvm_install",
    "result": "success"
  }
}
```

### Missing Virtualenv Recovery

```json
{
  "details": {
    "venv_path": ".venv",
    "python_version": "3.11",
    "recovery_pattern": "missing-virtualenv",
    "action": "create_venv",
    "result": "success"
  }
}
```

### Missing Seed Data Recovery

```json
{
  "details": {
    "seed_file": "seed.sql",
    "recovery_pattern": "missing-seed-data",
    "action": "apply_seed",
    "result": "success"
  }
}
```

### Database Not Running Recovery

```json
{
  "details": {
    "database": "postgresql",
    "recovery_pattern": "database-not-running",
    "action": "start_service",
    "method": "docker_compose",
    "result": "success"
  }
}
```

## Dashboard Integration

The dashboard consumes these events via WebSocket and displays them in the auto-recovery banner:

### Event Flow

1. **Bootstrap script** emits JSON events to stdout
2. **bootstrap_relay.py** transforms events to canonical WS format
3. **MCP server** broadcasts events via WebSocket
4. **Dashboard** receives events and updates UI

### Banner Display Logic

```typescript
// Severity determines banner color and icon
const bannerStyles = {
  info: { color: 'blue', icon: 'ℹ️' },
  warn: { color: 'yellow', icon: '⚠️' },
  recovery: { color: 'orange', icon: '🔄' },
  error: { color: 'red', icon: '❌' }
};

// Message is displayed prominently
<Banner severity={event.severity}>
  {event.message}
</Banner>

// Details are shown in expandable section
{event.details && (
  <Details>
    {JSON.stringify(event.details, null, 2)}
  </Details>
)}
```

## Example Recovery Scenarios

### Scenario 1: Port Blocked by Stale Process

```json
{
  "timestamp": "2026-05-16T03:00:00Z",
  "stage": "recovery",
  "status": "warn",
  "message": "Port 3000 blocked by node (PID 12345)",
  "severity": "warn",
  "details": {
    "port": 3000,
    "pid": 12345,
    "process": "node",
    "recovery_pattern": "port-in-use"
  }
}
```

Followed by:

```json
{
  "timestamp": "2026-05-16T03:00:02Z",
  "stage": "recovery",
  "status": "success",
  "message": "Port 3000 recovered successfully",
  "severity": "info",
  "details": {
    "port": 3000,
    "pid": 12345,
    "process": "node",
    "result": "success",
    "recovery_time_ms": 2500
  }
}
```

### Scenario 2: Wrong Node Version

```json
{
  "timestamp": "2026-05-16T03:00:00Z",
  "stage": "recovery",
  "status": "warn",
  "message": "Node version mismatch: need 18, have 16.14.0",
  "severity": "warn",
  "details": {
    "required_version": "18",
    "current_version": "16.14.0",
    "recovery_pattern": "version-mismatch"
  }
}
```

Followed by:

```json
{
  "timestamp": "2026-05-16T03:00:45Z",
  "stage": "recovery",
  "status": "success",
  "message": "Node version 18 installed and activated",
  "severity": "info",
  "details": {
    "required_version": "18",
    "installed_version": "18.16.0",
    "result": "success",
    "method": "nvm"
  }
}
```

## Testing

To test event payloads:

```bash
# Run bootstrap and capture events
./scripts/bootstrap.sh 2>&1 | grep '^{' | jq .

# Test specific recovery pattern
./scripts/bootstrap.sh --auto-recover 2>&1 | grep '"stage":"recovery"' | jq .

# Verify event relay
python3 ./scripts/bootstrap_relay.py
```

## Coordination with Dev 3

Dev 3 (Frontend) needs these fields for optimal banner display:

1. **`message`**: Primary text shown in banner
2. **`severity`**: Determines banner color/style
3. **`details.recovery_pattern`**: Identifies which recovery pattern fired
4. **`details.result`**: Shows success/failure
5. **`details`**: Full object for expandable details view

## Version History

- **v1.0.0** (Phase 3 T4.9): Initial enhanced payload specification
  - Added `severity` field
  - Added `details` object
  - Standardized message format
  - Added recovery pattern identification

## References

- Phase 3 T4.9 task specification
- `scripts/bootstrap.sh` - Event emission
- `scripts/bootstrap_relay.py` - Event transformation
- `scripts/auto_bootstrap.py` - Recovery telemetry
- Dev 3 T3.5 - Auto-recovery banner implementation