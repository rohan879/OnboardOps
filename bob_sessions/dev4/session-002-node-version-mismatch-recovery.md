# Bob Shell Session: Node Version Mismatch Auto-Recovery

**Date:** 2026-05-16  
**Duration:** 2 minutes  
**Bobcoins Used:** 0.5  
**Outcome:** Success  
**Recovery Pattern:** version-mismatch

## Context

Bootstrap detected that Node.js version 16.14.0 was installed, but the project requires Node.js 18+. The auto-recovery system used nvm to install and activate the correct version.

## Key Moments

1. **Error Detection** (00:15)
   - Toolchain detection failed: Node version mismatch
   - Required: >=18.0.0, Found: 16.14.0

2. **Bob's Diagnosis** (00:25)
   - Category: version-mismatch
   - Confidence: 90%
   - Recommended: Install Node 18 via nvm

3. **Recovery Action** (00:25-01:45)
   - Executed: `nvm install 18 && nvm use 18`
   - Node 18.16.0 installed successfully
   - Recovery time: 80 seconds

4. **Retry Success** (01:45-02:00)
   - Bootstrap completed successfully
   - All stages passed with correct Node version

## Event Payloads

```json
{
  "timestamp": "2026-05-16T03:00:25Z",
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

## Bobcoin Breakdown

- Bob Shell diagnosis: 0.5 Bobcoins
- **Total: 0.5 Bobcoins**

## Lessons Learned

1. **Longer Recovery:** Version installation takes ~80s (downloading + installing)
2. **nvm Required:** Recovery only works if nvm is installed
3. **High Confidence:** 90% confidence from Bob Shell
4. **One-Time Cost:** Subsequent runs use cached version

## Demo Value

Shows recovery for environment mismatches, common in team settings.

---

**Session ID:** session-002  
**Exported:** 2026-05-16  
**Phase:** 3 T4.11