# Dev 4 - Infrastructure / Bob Shell Sessions

**Developer:** Dev 4  
**Role:** Infrastructure / Bob Shell Engineer  
**Primary Ownership:** Bootstrap engine, auto-recovery, checkpoint orchestration, demo machine setup

## Focus Areas

### Phase 1 (H+0 to H+2)
- Bob Shell installation and verification
- Demo repository selection and forking
- Naive onboarding friction audit
- Auto-recovery pattern identification
- Bootstrap script skeleton
- Bob Shell piping verification
- Reference demo machine documentation
- E2E smoke test harness

### Phase 2 (H+10 to H+20)
- Bootstrap engine implementation
- 5 auto-recovery patterns (port conflicts, missing deps, etc.)
- Checkpoint creation and restoration
- Bob Shell integration for auto-recovery loop

### Phase 3 (H+20 to H+32)
- Production hardening of bootstrap
- Cross-platform compatibility testing
- Performance optimization
- Demo rehearsal and timing

## Session Exports

### Phase 1 Sessions
1. `01_bob-shell-install.md` - Installing and authenticating Bob Shell
2. `02_demo-repo-selection.md` - Evaluating and forking demo repository
3. `03_friction-audit.md` - Documenting onboarding pain points
4. `04_auto-recovery-patterns.md` - Identifying 5 failure modes
5. `05_bootstrap-skeleton.md` - Creating structured bootstrap script
6. `06_bob-shell-piping.md` - Testing non-interactive Bob invocation
7. `07_demo-machine-setup.md` - Documenting reference environment
8. `08_e2e-harness.md` - Building smoke test orchestration

### Phase 2+ Sessions
(To be added as development progresses)

## Key Deliverables

- `scripts/bootstrap.sh` - 5-stage bootstrap with auto-recovery
- `scripts/e2e-smoke.sh` - End-to-end smoke test harness
- `docs/auto-recovery-patterns.md` - Detection signals and recovery actions
- `docs/demo-machine.md` - Reference environment specification
- `notes/demo-repo-choice.md` - Repository selection rationale
- `notes/demo-repo-friction.md` - Friction audit with timestamps

## Auto-Recovery Patterns

1. **Port Conflict** - Detect: `Address already in use`, Recover: Kill process and retry
2. **Node Version Mismatch** - Detect: `Unsupported engine`, Recover: Switch via nvm
3. **Missing Virtualenv** - Detect: `No module named`, Recover: Create venv and reinstall
4. **Missing Seed Data** - Detect: `Database empty`, Recover: Run seed script
5. **Service Not Running** - Detect: `Connection refused`, Recover: Start service

## Bootstrap Stages

1. **Detect** - Identify environment and requirements
2. **Install** - Install dependencies (with auto-recovery)
3. **Migrate** - Run database migrations if needed
4. **Seed** - Populate initial data
5. **Healthcheck** - Verify all services are running

## Demo Repository

**Selected:** `tiangolo/full-stack-fastapi-template` (or as decided at H+1)

**Selection Criteria:**
- 10-30 source files (manageable scope)
- Real test suite (demonstrates testing patterns)
- Onboarding "traps" (makes demo dramatic)

## Notes

- Bob Shell runs in non-interactive mode via piping
- Each bootstrap stage emits structured JSON logs
- Auto-recovery loop has max 3 retry attempts
- Demo machine is reset to baseline before each test run
- E2E harness uses `trap` for cleanup on exit