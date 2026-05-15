# OnboardOps Scripts Directory

This directory contains automation scripts for the OnboardOps project.

## Phase 1 Scripts

### verify-bob-shell.sh
**Owner:** Dev 4 (Infra / Bob Shell)  
**Task:** T4.1 - Install and Verify Bob Shell

Verifies Bob Shell installation, authentication, and basic functionality.

**Usage:**
```bash
./scripts/verify-bob-shell.sh
```

**Prerequisites:**
- Bob Shell installed
- Authenticated with hackathon team (ibm-coding-challenge-xxx)

**Output:**
- Console verification report
- Log file: `notes/bob-shell-verification.log`

---

### bootstrap.sh
**Owner:** Dev 4 (Infra / Bob Shell)  
**Task:** T4.5 - Author Bootstrap Script Skeleton

Bootstrap script for demo repository setup with auto-recovery capabilities.

**Usage:**
```bash
./scripts/bootstrap.sh
```

**Stages:**
1. detect - Environment detection
2. install - Dependency installation
3. migrate - Database migrations
4. seed - Seed data
5. healthcheck - Service health verification

---

### e2e-smoke.sh
**Owner:** Dev 4 (Infra / Bob Shell)  
**Task:** T4.8 - Build the E2E Smoke Harness

End-to-end smoke test orchestration for backend and frontend.

**Usage:**
```bash
./scripts/e2e-smoke.sh
```

**Tests:**
- Backend health check (port 8765)
- Frontend health check (port 3000)
- WebSocket connectivity
- MCP endpoint verification

---

## Script Conventions

- All scripts use `#!/bin/bash` shebang
- Exit code 0 = success, non-zero = failure
- Structured JSON logging for machine-readable output
- Cleanup via `trap` for resource management
- Executable permissions set via `chmod +x`

## Development Guidelines

1. **Error Handling:** Use `set -e` for fail-fast behavior
2. **Logging:** Emit structured logs for automation
3. **Idempotency:** Scripts should be safe to run multiple times
4. **Documentation:** Include usage comments at script top
5. **Testing:** Test on clean environment before committing

## Future Scripts (Phase 2+)

- `auto-recovery.sh` - Auto-recovery loop implementation
- `checkpoint.sh` - Checkpoint creation and restoration
- `demo-reset.sh` - Demo machine reset automation
- `export-sessions.sh` - Bob session export automation