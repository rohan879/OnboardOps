# Bob Shell Session: Database Not Running Auto-Recovery

**Date:** 2026-05-16  
**Duration:** 2.5 minutes  
**Bobcoins Used:** 0.5  
**Outcome:** Success  
**Recovery Pattern:** database-not-running

## Context

PostgreSQL database was not running, causing migration and seed stages to fail. The auto-recovery system detected this and started the database using docker-compose.

## Key Moments

1. **Error Detection** (00:10)
   - Migration stage failed: Connection refused
   - PostgreSQL not accepting connections on port 5432

2. **Bob's Diagnosis** (00:20)
   - Category: database-not-running
   - Confidence: 92%
   - Recommended: Start database service

3. **Recovery Action** (00:20-01:50)
   - Executed: `docker-compose up -d db`
   - PostgreSQL container started
   - Waited for database to be ready
   - Recovery time: 90 seconds

4. **Retry Success** (01:50-02:30)
   - Bootstrap completed successfully
   - Migrations applied, seed data loaded
   - All services healthy

## Event Payloads

```json
{
  "timestamp": "2026-05-16T03:00:20Z",
  "stage": "recovery",
  "status": "recovery",
  "message": "Starting PostgreSQL database service",
  "severity": "recovery",
  "details": {
    "database": "postgresql",
    "recovery_pattern": "database-not-running",
    "action": "start_service",
    "method": "docker_compose"
  }
}
```

## Bobcoin Breakdown

- Bob Shell diagnosis: 0.5 Bobcoins
- **Total: 0.5 Bobcoins**

## Lessons Learned

1. **Longest Recovery:** ~90s for database startup
2. **High Confidence:** 92% confidence from Bob Shell
3. **Docker Required:** Assumes docker-compose setup
4. **Health Check:** Waits for database to be ready before retry

## Demo Value

Shows recovery for infrastructure issues, demonstrates patience and proper health checking.

---

**Session ID:** session-005  
**Exported:** 2026-05-16  
**Phase:** 3 T4.11