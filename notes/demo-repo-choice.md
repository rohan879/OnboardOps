# Demo Repository Selection - T4.2

**Selected Repository:** tiangolo/full-stack-fastapi-template ⭐  
**Original URL:** https://github.com/tiangolo/full-stack-fastapi-template  
**Fork URL:** [TO BE FILLED - Your team's fork URL]  
**Selected By:** Dev 4 (Infra / Bob Shell)  
**Date:** 2026-05-15  

---

## Selection Rationale

The **full-stack-fastapi-template** was selected as the optimal demo repository for OnboardOps based on three critical factors:

1. **Maximum Drama Potential:** This repository contains multiple realistic onboarding traps that developers commonly encounter in production environments. Unlike toy projects or overly-documented repositories, this template has the complexity that makes OnboardOps' auto-recovery capabilities shine.

2. **Real-World Relevance:** Full-stack applications with Docker, databases, and frontend/backend coordination represent the actual onboarding challenges developers face daily. Demonstrating OnboardOps on this type of project proves its value in real scenarios, not just academic examples.

3. **Perfect Complexity Balance:** With approximately 25 key source files, comprehensive test coverage, and multiple services to coordinate, this repository is complex enough to be impressive but not so overwhelming that judges lose track during a 60-second demo.

The repository's Docker-based architecture, environment variable requirements, and multi-service coordination create natural friction points that OnboardOps can detect and automatically resolve, making for a compelling demonstration of the product's core value proposition.

---

## Repository Characteristics

- **Size:** ~25-30 source files (Python backend + TypeScript frontend)
- **Language(s):** Python (FastAPI), TypeScript (React), SQL
- **Framework:** FastAPI + React + PostgreSQL + Docker Compose
- **Test Suite:** Yes - comprehensive test coverage for both backend and frontend
- **Documentation Quality:** Good (but with intentional gaps that create traps)
- **Maintenance Status:** Actively maintained by Sebastián Ramírez (FastAPI creator)
- **Community:** Large, active community with real-world usage

---

## Identified Onboarding Traps

### Trap 1: Docker Desktop Not Running
- **Description:** The project requires Docker Compose, but many developers don't have Docker Desktop running when they start
- **Detection Signal:** `docker ps` returns "Cannot connect to the Docker daemon" or similar error
- **Recovery Action:** 
  1. Detect Docker is not running
  2. Prompt to start Docker Desktop (or start automatically on macOS)
  3. Wait for Docker daemon to be ready
  4. Retry the setup
- **Demo Value:** HIGH - This is an extremely common real-world issue that frustrates developers

### Trap 2: Missing or Incomplete .env File
- **Description:** The project requires specific environment variables but .env file must be created from .env.example
- **Detection Signal:** Import errors, configuration errors, or "environment variable not set" messages
- **Recovery Action:**
  1. Detect missing .env file
  2. Copy from .env.example
  3. Populate with sensible defaults (localhost, default ports, etc.)
  4. Prompt for any required secrets
- **Demo Value:** HIGH - Environment configuration is a universal pain point

### Trap 3: Port 8000 Already in Use
- **Description:** FastAPI default port (8000) may be occupied by another service
- **Detection Signal:** "Address already in use" error when starting uvicorn
- **Recovery Action:**
  1. Detect port conflict
  2. Identify process using port 8000
  3. Either kill the process (with confirmation) or use alternative port
  4. Update configuration to use new port
- **Demo Value:** MEDIUM - Common issue, impressive auto-resolution

### Trap 4: Database Not Initialized
- **Description:** PostgreSQL container starts but database schema not created
- **Detection Signal:** "relation does not exist" or "table not found" errors
- **Recovery Action:**
  1. Detect database connection but missing schema
  2. Run Alembic migrations automatically
  3. Seed initial data if needed
  4. Verify database is ready
- **Demo Value:** HIGH - Database initialization is notoriously tricky

### Trap 5: Node Version Mismatch (Frontend)
- **Description:** Frontend requires specific Node.js version not currently active
- **Detection Signal:** Package.json engines check fails or npm install errors
- **Recovery Action:**
  1. Detect Node version mismatch
  2. Check if nvm is installed
  3. Switch to required Node version via nvm
  4. Retry npm install
- **Demo Value:** MEDIUM - Version management is a common frustration

### Trap 6: Docker Compose Service Dependencies
- **Description:** Services must start in specific order (database before backend)
- **Detection Signal:** Backend fails to connect to database on first attempt
- **Recovery Action:**
  1. Detect service dependency failure
  2. Implement retry logic with exponential backoff
  3. Wait for dependent services to be healthy
  4. Proceed once all dependencies ready
- **Demo Value:** MEDIUM - Demonstrates understanding of service orchestration

---

## Expected Demo Flow (60 seconds)

**[0:00-0:10] Setup**
- Clone the fork
- Show the README (briefly)
- Narrator: "Let's onboard to this full-stack FastAPI template"

**[0:10-0:20] First Trap - Docker**
- Attempt to run `docker-compose up`
- ❌ Error: Docker not running
- ✅ OnboardOps detects, starts Docker, retries
- Narrator: "OnboardOps detected Docker wasn't running and fixed it"

**[0:20-0:35] Second Trap - Environment**
- Backend starts but crashes
- ❌ Error: Missing .env file
- ✅ OnboardOps creates .env from template, populates defaults
- Narrator: "Environment variables configured automatically"

**[0:35-0:45] Third Trap - Port Conflict**
- Backend tries to start
- ❌ Error: Port 8000 in use
- ✅ OnboardOps kills conflicting process, retries
- Narrator: "Port conflict resolved"

**[0:45-0:55] Success**
- All services running
- Show dashboard with real-time progress
- Show certification quiz appearing
- Narrator: "Fully onboarded in under 10 minutes, with zero manual intervention"

**[0:55-1:00] Closing**
- Show the generated AGENTS.md
- Show the starter PR
- Narrator: "OnboardOps: The 10-Minute Repo Whisperer"

---

## Alternative Repositories Considered

### Option 2: encode/starlette
- **Rejected because:** Too well-documented, minimal onboarding friction
- **Trap potential:** LOW - Setup is straightforward
- **Demo value:** Would not showcase auto-recovery capabilities effectively

### Option 3: tiangolo/sqlmodel
- **Rejected because:** Good documentation reduces trap potential
- **Trap potential:** MEDIUM - Some complexity but fewer dramatic moments
- **Demo value:** Solid but less impressive than full-stack template

---

## Repository Statistics

```bash
# To be filled after forking:
# Source files: find . -name "*.py" -o -name "*.ts" -o -name "*.tsx" | wc -l
# Test files: find . -name "test_*.py" -o -name "*.test.ts" | wc -l
# Lines of code: cloc . --exclude-dir=node_modules,.venv
```

**Estimated:**
- Python files: ~15-20
- TypeScript files: ~10-15
- Test files: ~10-15
- Total LOC: ~3,000-5,000 (excluding dependencies)

---

## Manual Steps Completed

- [x] Evaluated three candidate repositories
- [x] Selected full-stack-fastapi-template based on rubric
- [ ] **TODO:** Fork repository to team organization
- [ ] **TODO:** Update fork URL above
- [ ] **TODO:** Share fork URL in team channel
- [ ] **TODO:** Clone fork locally for T4.3

---

## Next Steps

1. **Immediate (T4.2 completion):**
   - Fork the repository to your team organization
   - Update the "Fork URL" field above
   - Share the fork URL in your team channel
   - Commit this file

2. **Next Task (T4.3):**
   - Clone the fork locally
   - Conduct naive onboarding audit
   - Document every friction point with timestamps

3. **Future Tasks:**
   - T4.4: Convert these traps into auto-recovery patterns
   - T5.7: Identify starter PR candidates from this repo
   - Phase 2-4: Use this fork for all demo development

---

## Integration Points

### Provides for Other Tasks:
- **T4.3** (Naive Onboarding Audit) - Uses this fork
- **T4.4** (Auto-Recovery Targets) - Based on traps identified here
- **T4.5** (Bootstrap Script) - Will handle these traps
- **T5.7** (Starter PR Candidates) - Will analyze this codebase
- **Phase 2** (MCP Tools) - Will extract data from this repo
- **Phase 3** (Auto-Recovery) - Will demonstrate on this repo
- **Phase 4** (Demo Recording) - This is the star of the show

### Dependencies:
- None - This task is independent

---

## Team Communication Template

```
🎯 Demo Repository Selected - T4.2 Complete

Repository: tiangolo/full-stack-fastapi-template
Fork URL: [your-fork-url]

Why this repo:
✅ Perfect size (~25 files)
✅ Real test suite
✅ 6 identified onboarding traps (Docker, env vars, ports, database, Node version, service deps)
✅ Maximum demo drama potential

Key traps for auto-recovery:
1. Docker not running
2. Missing .env file
3. Port conflicts
4. Database initialization
5. Node version mismatch
6. Service dependencies

See notes/demo-repo-choice.md for full rationale.

Next: T4.3 - Naive onboarding audit
```

---

## References

- **Original Repository:** https://github.com/tiangolo/full-stack-fastapi-template
- **FastAPI Documentation:** https://fastapi.tiangolo.com/
- **Phase 1 Task Doc:** `docs/onboardops_phase1.tex` (lines 499-511)
- **Selection Guide:** `docs/T4.2-demo-repo-selection-guide.md`

---

## Notes

- This selection prioritizes **demo drama** over ease of setup
- The traps are realistic and common in production environments
- Each trap has a clear detection signal and recovery action
- The repository is actively maintained, reducing risk of breaking changes
- The full-stack nature demonstrates OnboardOps' versatility across languages and services