# Auto-Recovery Patterns - T4.4

**Task Owner:** Dev 4 (Infra / Bob Shell)  
**Date:** 2026-05-15  
**Source:** Friction points identified in T4.3 (Naive Onboarding Audit)

---

## Overview

This document defines five distinct auto-recovery patterns that the OnboardOps bootstrap engine (F3) will implement. Each pattern includes:
- **Detection Signal:** How to identify the failure mode
- **Recovery Action:** Step-by-step automated fix
- **Verification:** How to confirm recovery succeeded
- **Priority:** P0 (critical), P1 (high), P2 (medium)

These patterns are derived from the most common and frustrating onboarding friction points identified in the demo repository audit.

---

## Pattern 1: Docker Daemon Not Running

### Detection Signal
```bash
# Primary detection
docker ps 2>&1
# Exit code: non-zero
# Stderr contains: "Cannot connect to the Docker daemon"
# OR: "Is the docker daemon running?"
```

**Regex Pattern:**
```regex
(Cannot connect to the Docker daemon|docker daemon.*not running|connection refused.*docker)
```

### Recovery Action

**Step 1: Detect Docker Installation**
```bash
if ! command -v docker &> /dev/null; then
    echo "ERROR: Docker not installed"
    exit 1
fi
```

**Step 2: Start Docker Desktop (macOS)**
```bash
# Check if Docker Desktop is installed
if [ -d "/Applications/Docker.app" ]; then
    echo "Starting Docker Desktop..."
    open -a Docker
else
    echo "ERROR: Docker Desktop not found"
    exit 1
fi
```

**Step 3: Wait for Docker to be Ready**
```bash
MAX_WAIT=60
ELAPSED=0
while [ $ELAPSED -lt $MAX_WAIT ]; do
    if docker ps &> /dev/null; then
        echo "Docker is ready"
        break
    fi
    sleep 2
    ELAPSED=$((ELAPSED + 2))
done

if [ $ELAPSED -ge $MAX_WAIT ]; then
    echo "ERROR: Docker failed to start within ${MAX_WAIT}s"
    exit 1
fi
```

**Step 4: Verify Docker is Functional**
```bash
docker ps > /dev/null 2>&1
if [ $? -eq 0 ]; then
    echo "Docker verification successful"
else
    echo "ERROR: Docker started but not functional"
    exit 1
fi
```

### Verification
- `docker ps` returns exit code 0
- No error messages in stderr
- Can list running containers (even if empty)

### Priority
**P0 (Critical)** - Blocks all Docker-based workflows

### Estimated Recovery Time
30-60 seconds (Docker startup time)

### User Feedback
```
🔧 Auto-Recovery: Docker daemon not running
   ⏳ Starting Docker Desktop...
   ⏳ Waiting for Docker to be ready...
   ✅ Docker is now running
   ⏱️  Recovery completed in 45s
```

---

## Pattern 2: Missing Environment Configuration File

### Detection Signal
```bash
# Check for .env file
if [ ! -f ".env" ] && [ -f ".env.example" ]; then
    # Missing .env but template exists
fi

# OR detect from application errors
# Stderr contains: "environment variable.*not set"
# OR: "KeyError.*env"
# OR: "Missing required environment variable"
```

**Regex Pattern:**
```regex
(environment variable.*not (set|found)|KeyError.*env|\.env.*not found|Missing.*environment)
```

### Recovery Action

**Step 1: Verify Template Exists**
```bash
if [ ! -f ".env.example" ]; then
    echo "ERROR: No .env.example template found"
    exit 1
fi
```

**Step 2: Copy Template to .env**
```bash
echo "Creating .env from .env.example..."
cp .env.example .env
```

**Step 3: Populate with Sensible Defaults**
```bash
# Replace common placeholders with defaults
sed -i.bak 's/DATABASE_URL=.*/DATABASE_URL=postgresql:\/\/localhost:5432\/app/' .env
sed -i.bak 's/REDIS_URL=.*/REDIS_URL=redis:\/\/localhost:6379/' .env
sed -i.bak 's/SECRET_KEY=.*/SECRET_KEY=dev-secret-key-change-in-production/' .env
sed -i.bak 's/DEBUG=.*/DEBUG=true/' .env
sed -i.bak 's/PORT=.*/PORT=8000/' .env

# Remove backup file
rm -f .env.bak
```

**Step 4: Prompt for Required Secrets (if any)**
```bash
# Check for variables that must be user-provided
REQUIRED_VARS=("API_KEY" "GITHUB_TOKEN")
for VAR in "${REQUIRED_VARS[@]}"; do
    if grep -q "^${VAR}=$" .env; then
        echo "⚠️  ${VAR} requires manual configuration"
        echo "   Edit .env and set ${VAR} before proceeding"
    fi
done
```

### Verification
- `.env` file exists
- File is readable
- Contains expected variable names
- No empty required variables

### Priority
**P0 (Critical)** - Blocks application startup

### Estimated Recovery Time
1-2 seconds (instant for defaults, longer if user input needed)

### User Feedback
```
🔧 Auto-Recovery: Missing .env file
   ✅ Created .env from .env.example
   ✅ Populated with development defaults
   ⚠️  GITHUB_TOKEN requires manual configuration
   ⏱️  Recovery completed in 1s
```

---

## Pattern 3: Port Already in Use

### Detection Signal
```bash
# Application startup fails with port conflict
# Stderr contains: "Address already in use"
# OR: "port.*already.*use"
# OR: "bind.*failed.*address"
```

**Regex Pattern:**
```regex
(Address already in use|port \d+ .*already|bind.*failed.*EADDRINUSE|Cannot bind to port)
```

**Extract Port Number:**
```regex
port (\d+)|:(\d+)
```

### Recovery Action

**Step 1: Extract Port from Error**
```bash
PORT=$(echo "$ERROR_MESSAGE" | grep -oE 'port [0-9]+|:[0-9]+' | grep -oE '[0-9]+' | head -1)
if [ -z "$PORT" ]; then
    echo "ERROR: Could not extract port number from error"
    exit 1
fi
```

**Step 2: Identify Process Using Port**
```bash
echo "Port $PORT is in use. Identifying process..."
PROCESS_INFO=$(lsof -i :$PORT -t 2>/dev/null)

if [ -z "$PROCESS_INFO" ]; then
    echo "ERROR: No process found on port $PORT"
    exit 1
fi

PID=$(echo "$PROCESS_INFO" | head -1)
PROCESS_NAME=$(ps -p $PID -o comm= 2>/dev/null)
```

**Step 3: Kill Process (with confirmation in interactive mode)**
```bash
echo "Process using port $PORT: $PROCESS_NAME (PID: $PID)"

# In automated mode, kill immediately
# In interactive mode, prompt user
if [ "$AUTO_MODE" = "true" ]; then
    echo "Killing process $PID..."
    kill $PID
    sleep 1
    
    # Force kill if still running
    if ps -p $PID > /dev/null 2>&1; then
        kill -9 $PID
    fi
else
    read -p "Kill process $PID? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        kill $PID
    else
        echo "User declined. Suggesting alternative port..."
        ALT_PORT=$((PORT + 1))
        echo "Try using port $ALT_PORT instead"
        exit 1
    fi
fi
```

**Step 4: Verify Port is Now Available**
```bash
sleep 1
if lsof -i :$PORT > /dev/null 2>&1; then
    echo "ERROR: Port $PORT still in use after kill attempt"
    exit 1
fi
echo "Port $PORT is now available"
```

### Verification
- `lsof -i :PORT` returns no results
- Port is bindable
- Original process is terminated

### Priority
**P1 (High)** - Common issue, blocks startup

### Estimated Recovery Time
2-3 seconds

### User Feedback
```
🔧 Auto-Recovery: Port 8000 already in use
   🔍 Found process: node (PID: 12345)
   ⏳ Terminating process...
   ✅ Port 8000 is now available
   ⏱️  Recovery completed in 2s
```

---

## Pattern 4: Database Not Initialized

### Detection Signal
```bash
# Application connects to database but schema missing
# Stderr contains: "relation.*does not exist"
# OR: "table.*not found"
# OR: "no such table"
# OR: "Unknown database"
```

**Regex Pattern:**
```regex
(relation.*does not exist|table.*not found|no such table|Unknown database|schema.*not found)
```

### Recovery Action

**Step 1: Verify Database Connection**
```bash
# For PostgreSQL
if command -v psql &> /dev/null; then
    psql -h localhost -U postgres -c "SELECT 1" > /dev/null 2>&1
    if [ $? -ne 0 ]; then
        echo "ERROR: Cannot connect to database"
        exit 1
    fi
fi
```

**Step 2: Check for Migration Tool**
```bash
# Check for Alembic (Python)
if [ -f "alembic.ini" ]; then
    MIGRATION_TOOL="alembic"
    MIGRATION_CMD="alembic upgrade head"
# Check for Prisma (Node)
elif [ -f "prisma/schema.prisma" ]; then
    MIGRATION_TOOL="prisma"
    MIGRATION_CMD="npx prisma migrate deploy"
# Check for Django
elif [ -f "manage.py" ]; then
    MIGRATION_TOOL="django"
    MIGRATION_CMD="python manage.py migrate"
else
    echo "ERROR: No migration tool detected"
    exit 1
fi
```

**Step 3: Run Migrations**
```bash
echo "Running database migrations with $MIGRATION_TOOL..."
eval $MIGRATION_CMD

if [ $? -ne 0 ]; then
    echo "ERROR: Migration failed"
    exit 1
fi
```

**Step 4: Seed Initial Data (if seed script exists)**
```bash
if [ -f "scripts/seed.sh" ]; then
    echo "Seeding initial data..."
    ./scripts/seed.sh
elif [ -f "scripts/seed.py" ]; then
    python scripts/seed.py
fi
```

### Verification
- Migrations complete successfully
- Database schema exists
- Can query tables without errors

### Priority
**P0 (Critical)** - Blocks application functionality

### Estimated Recovery Time
10-30 seconds (depends on migration complexity)

### User Feedback
```
🔧 Auto-Recovery: Database schema not initialized
   🔍 Detected migration tool: alembic
   ⏳ Running migrations...
   ✅ Applied 5 migrations
   ⏳ Seeding initial data...
   ✅ Database initialized successfully
   ⏱️  Recovery completed in 15s
```

---

## Pattern 5: Node/Python Version Mismatch

### Detection Signal
```bash
# Package manager fails due to version mismatch
# Stderr contains: "requires node.*but you have"
# OR: "requires python.*but you have"
# OR: "engine.*not compatible"
```

**Regex Pattern:**
```regex
(requires (node|python) [0-9.]+|engine.*not compatible|version.*not supported|unsupported.*version)
```

### Recovery Action

**Step 1: Detect Required Version**
```bash
# For Node (from package.json)
if [ -f "package.json" ]; then
    REQUIRED_NODE=$(jq -r '.engines.node // empty' package.json)
    CURRENT_NODE=$(node --version 2>/dev/null | sed 's/v//')
fi

# For Python (from pyproject.toml or .python-version)
if [ -f "pyproject.toml" ]; then
    REQUIRED_PYTHON=$(grep -oP 'python = "\^?\K[0-9.]+' pyproject.toml | head -1)
    CURRENT_PYTHON=$(python3 --version 2>/dev/null | grep -oP '[0-9.]+')
elif [ -f ".python-version" ]; then
    REQUIRED_PYTHON=$(cat .python-version)
    CURRENT_PYTHON=$(python3 --version 2>/dev/null | grep -oP '[0-9.]+')
fi
```

**Step 2: Check if Version Manager is Installed**
```bash
# For Node
if [ ! -z "$REQUIRED_NODE" ]; then
    if command -v nvm &> /dev/null; then
        VERSION_MANAGER="nvm"
    elif command -v fnm &> /dev/null; then
        VERSION_MANAGER="fnm"
    else
        echo "ERROR: No Node version manager found (nvm/fnm)"
        exit 1
    fi
fi

# For Python
if [ ! -z "$REQUIRED_PYTHON" ]; then
    if command -v pyenv &> /dev/null; then
        VERSION_MANAGER="pyenv"
    else
        echo "ERROR: pyenv not found"
        exit 1
    fi
fi
```

**Step 3: Switch to Required Version**
```bash
# For Node with nvm
if [ "$VERSION_MANAGER" = "nvm" ]; then
    echo "Switching to Node $REQUIRED_NODE..."
    nvm use $REQUIRED_NODE || nvm install $REQUIRED_NODE
    nvm use $REQUIRED_NODE
fi

# For Python with pyenv
if [ "$VERSION_MANAGER" = "pyenv" ]; then
    echo "Switching to Python $REQUIRED_PYTHON..."
    pyenv install -s $REQUIRED_PYTHON
    pyenv local $REQUIRED_PYTHON
fi
```

**Step 4: Verify Version Switch**
```bash
if [ ! -z "$REQUIRED_NODE" ]; then
    NEW_NODE=$(node --version | sed 's/v//')
    if [[ "$NEW_NODE" == "$REQUIRED_NODE"* ]]; then
        echo "Node version switched successfully: $NEW_NODE"
    else
        echo "ERROR: Version switch failed"
        exit 1
    fi
fi
```

### Verification
- Correct version is now active
- Package manager commands succeed
- Version check passes

### Priority
**P1 (High)** - Common issue, blocks dependency installation

### Estimated Recovery Time
5-60 seconds (depends on whether version needs to be downloaded)

### User Feedback
```
🔧 Auto-Recovery: Node version mismatch
   📋 Required: Node 20.x
   📋 Current: Node 18.x
   ⏳ Switching to Node 20 via nvm...
   ✅ Now using Node 20.11.0
   ⏱️  Recovery completed in 8s
```

---

## Pattern Priority Summary

| Pattern | Priority | Frequency | Impact | Recovery Time |
|---------|----------|-----------|--------|---------------|
| 1. Docker Not Running | P0 | High | Critical | 30-60s |
| 2. Missing .env | P0 | Very High | Critical | 1-2s |
| 3. Port Conflict | P1 | Medium | High | 2-3s |
| 4. Database Not Initialized | P0 | High | Critical | 10-30s |
| 5. Version Mismatch | P1 | Medium | High | 5-60s |

---

## Implementation Notes

### Error Detection Strategy
1. **Proactive Checks:** Run pre-flight checks before attempting operations
2. **Reactive Recovery:** Parse stderr for known error patterns
3. **Retry Logic:** Implement exponential backoff for transient failures

### User Experience Principles
1. **Clear Feedback:** Show what's being detected and fixed
2. **Progress Indicators:** Display time estimates and progress
3. **Transparency:** Log all actions for debugging
4. **Safety:** Confirm destructive actions in interactive mode

### Testing Strategy
1. **Unit Tests:** Test each detection regex independently
2. **Integration Tests:** Test full recovery flow for each pattern
3. **Chaos Testing:** Intentionally trigger each failure mode
4. **Performance:** Measure recovery time for each pattern

---

---

## Phase 3 Additional Patterns

### Pattern 6: Missing or Incomplete Virtualenv (T4.2)

**Detection Signal:**
```regex
(ModuleNotFoundError|No module named|ImportError.*site-packages|virtualenv.*not found)
```

**Recovery Action:**
1. Check if `.venv/` or `venv/` directory exists
2. If missing, create: `python3 -m venv venv`
3. If corrupted, remove and recreate
4. Activate virtualenv and install dependencies from `requirements.txt` or `pyproject.toml`
5. Verify: `pip list` shows expected packages

**Priority:** P0 (Critical) - Blocks Python application startup

**Estimated Recovery Time:** 30-120 seconds (depends on dependency count)

---

### Pattern 7: Missing Seed Data (T4.3)

**Detection Signal:**
```regex
(no data found|empty database|seed.*required|initial data.*missing)
```

**Recovery Action:**
1. Check for seed script in common locations:
   - `python -m demo.seed`
   - `python scripts/seed.py`
   - `bash scripts/seed.sh`
2. Check `pyproject.toml` for seed command in `[project.scripts]`
3. Run seed script with timeout (120s)
4. Verify: Health check passes after seed

**Priority:** P1 (High) - Blocks application functionality but not startup

**Estimated Recovery Time:** 10-60 seconds (depends on seed data size)

---

### Pattern 8: Database Not Running (T4.4)

**Detection Signal:**
```regex
(connection refused.*database|could not connect.*postgres|database.*not running|ECONNREFUSED.*5432)
```

**Recovery Action:**
1. Check for `docker-compose.yml` or `docker-compose.yaml`
2. Identify database service name (postgres, mysql, mongo, db, database)
3. Run: `docker compose up -d <service-name>`
4. Wait 10 seconds for database to be ready
5. Verify: Connection succeeds

**Priority:** P0 (Critical) - Blocks all database operations

**Estimated Recovery Time:** 15-30 seconds (Docker startup time)

---

## Pattern Priority Summary (Updated)

| Pattern | Priority | Frequency | Impact | Recovery Time |
|---------|----------|-----------|--------|---------------|
| 1. Docker Not Running | P0 | High | Critical | 30-60s |
| 2. Missing .env | P0 | Very High | Critical | 1-2s |
| 3. Port Conflict | P1 | Medium | High | 2-3s |
| 4. Database Not Initialized | P0 | High | Critical | 10-30s |
| 5. Version Mismatch | P1 | Medium | High | 5-60s |
| 6. Missing Virtualenv | P0 | High | Critical | 30-120s |
| 7. Missing Seed Data | P1 | Medium | High | 10-60s |
| 8. Database Not Running | P0 | High | Critical | 15-30s |

---

## Implementation Status

### Phase 1 (Complete)
- ✅ Pattern documentation
- ✅ Detection regex patterns
- ✅ Recovery action specifications

### Phase 2 (Complete)
- ✅ Port-in-use auto-recovery (Pattern 3)
- ✅ AI-assisted error-pipe loop
- ✅ Bootstrap with checkpoint API

### Phase 3 (In Progress)
- ✅ Node version mismatch auto-recovery (Pattern 5 / T4.1)
- ✅ Missing virtualenv auto-recovery (Pattern 6 / T4.2)
- ✅ Missing seed data auto-recovery (Pattern 7 / T4.3)
- ✅ Database not running auto-recovery (Pattern 8 / T4.4)
- ⏳ Idempotence verification (T4.5)
- ⏳ Three-minute timeout enforcement (T4.6)
- ⏳ Robust Bob Shell prompting (T4.7)
- ⏳ Demo machine reset script (T4.8)
- ⏳ Event payload polish (T4.9)
- ⏳ Full stress test (T4.10)
- ⏳ Session export + handoff (T4.11)

---

## Next Steps

1. **T4.5:** Verify bootstrap idempotence (<5s on healthy environment)
2. **T4.6:** Add 3-minute hard timeout with checkpoint rollback
3. **T4.7:** Enhance Bob Shell prompting with JSON schema constraints
4. **T4.8:** Create demo machine reset script
5. **T4.9:** Polish WebSocket event payloads for dashboard
6. **T4.10:** Run full stress test (10 iterations, all patterns)
7. **T4.11:** Export curated Bob sessions and hand off to Phase 4

---

**Document Version:** 2.0
**Last Updated:** 2026-05-16
**Owner:** Dev 4 (Infra / Bob Shell)