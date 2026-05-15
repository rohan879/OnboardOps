#!/bin/bash
# =====================================================================
# OnboardOps Bootstrap Script - T4.5
# Dev 4 - Infra / Bob Shell
# 
# Five-stage bootstrap process with structured JSON logging
# Stages: detect, install, migrate, seed, healthcheck
# =====================================================================

set -e

# Configuration
SCRIPT_VERSION="1.0.0"
START_TIME=$(date +%s)
LOG_FILE="${LOG_FILE:-/tmp/onboardops-bootstrap.log}"

# Colors for output (optional, can be disabled)
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# =====================================================================
# Logging Functions
# =====================================================================

# Emit structured JSON log line
log_json() {
    local stage="$1"
    local status="$2"
    local message="$3"
    local duration="${4:-0}"
    local timestamp=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
    
    cat <<EOF
{"timestamp":"$timestamp","stage":"$stage","status":"$status","message":"$message","duration_ms":$duration,"version":"$SCRIPT_VERSION"}
EOF
}

# Log to both stdout (JSON) and log file (human-readable)
log_stage() {
    local stage="$1"
    local status="$2"
    local message="$3"
    local duration="${4:-0}"
    
    # JSON to stdout
    log_json "$stage" "$status" "$message" "$duration"
    
    # Human-readable to log file
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] [$stage] $status: $message" >> "$LOG_FILE"
}

# =====================================================================
# Stage 1: DETECT
# =====================================================================

stage_detect() {
    local stage_start=$(date +%s)
    local stage="detect"
    
    log_stage "$stage" "start" "Beginning environment detection"
    
    # Detect operating system
    if [[ "$OSTYPE" == "darwin"* ]]; then
        OS="macos"
    elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
        OS="linux"
    else
        OS="unknown"
    fi
    log_stage "$stage" "info" "Operating system: $OS"
    
    # Detect Docker
    if command -v docker &> /dev/null; then
        DOCKER_VERSION=$(docker --version 2>/dev/null | grep -oE '[0-9]+\.[0-9]+\.[0-9]+' | head -1)
        log_stage "$stage" "info" "Docker detected: $DOCKER_VERSION"
        
        # Check if Docker daemon is running
        if docker ps &> /dev/null; then
            log_stage "$stage" "info" "Docker daemon is running"
            DOCKER_RUNNING=true
        else
            log_stage "$stage" "warning" "Docker installed but daemon not running"
            DOCKER_RUNNING=false
        fi
    else
        log_stage "$stage" "warning" "Docker not found"
        DOCKER_RUNNING=false
    fi
    
    # Detect Node.js
    if command -v node &> /dev/null; then
        NODE_VERSION=$(node --version 2>/dev/null)
        log_stage "$stage" "info" "Node.js detected: $NODE_VERSION"
    else
        log_stage "$stage" "warning" "Node.js not found"
    fi
    
    # Detect Python
    if command -v python3 &> /dev/null; then
        PYTHON_VERSION=$(python3 --version 2>/dev/null | grep -oE '[0-9]+\.[0-9]+\.[0-9]+')
        log_stage "$stage" "info" "Python detected: $PYTHON_VERSION"
    else
        log_stage "$stage" "warning" "Python not found"
    fi
    
    # Detect package managers
    if command -v npm &> /dev/null; then
        log_stage "$stage" "info" "npm detected: $(npm --version)"
    fi
    if command -v pnpm &> /dev/null; then
        log_stage "$stage" "info" "pnpm detected: $(pnpm --version)"
    fi
    if command -v pip3 &> /dev/null; then
        log_stage "$stage" "info" "pip detected: $(pip3 --version | grep -oE '[0-9]+\.[0-9]+\.[0-9]+')"
    fi
    
    # Detect project type
    if [ -f "package.json" ]; then
        log_stage "$stage" "info" "Node.js project detected (package.json)"
        PROJECT_TYPE="node"
    fi
    if [ -f "requirements.txt" ] || [ -f "pyproject.toml" ]; then
        log_stage "$stage" "info" "Python project detected"
        PROJECT_TYPE="${PROJECT_TYPE:+$PROJECT_TYPE,}python"
    fi
    if [ -f "docker-compose.yml" ] || [ -f "docker-compose.yaml" ]; then
        log_stage "$stage" "info" "Docker Compose project detected"
        PROJECT_TYPE="${PROJECT_TYPE:+$PROJECT_TYPE,}docker"
    fi
    
    local stage_end=$(date +%s)
    local duration=$(((stage_end - stage_start) * 1000))
    log_stage "$stage" "complete" "Environment detection complete" "$duration"
    
    return 0
}

# =====================================================================
# Stage 2: INSTALL
# =====================================================================

stage_install() {
    local stage_start=$(date +%s)
    local stage="install"
    
    log_stage "$stage" "start" "Beginning dependency installation"
    
    # This is a skeleton - actual installation logic will be added in Phase 2
    # For now, just verify that dependencies can be installed
    
    if [ -f "package.json" ]; then
        log_stage "$stage" "info" "Node.js dependencies detected"
        # Actual: npm install or pnpm install
        log_stage "$stage" "info" "Would run: npm install (skipped in skeleton)"
    fi
    
    if [ -f "requirements.txt" ]; then
        log_stage "$stage" "info" "Python dependencies detected"
        # Actual: pip install -r requirements.txt
        log_stage "$stage" "info" "Would run: pip install -r requirements.txt (skipped in skeleton)"
    fi
    
    if [ -f "pyproject.toml" ]; then
        log_stage "$stage" "info" "Python project with pyproject.toml detected"
        # Actual: pip install -e .
        log_stage "$stage" "info" "Would run: pip install -e . (skipped in skeleton)"
    fi
    
    local stage_end=$(date +%s)
    local duration=$(((stage_end - stage_start) * 1000))
    log_stage "$stage" "complete" "Dependency installation complete" "$duration"
    
    return 0
}

# =====================================================================
# Stage 3: MIGRATE
# =====================================================================

stage_migrate() {
    local stage_start=$(date +%s)
    local stage="migrate"
    
    log_stage "$stage" "start" "Beginning database migrations"
    
    # This is a skeleton - actual migration logic will be added in Phase 2
    
    if [ -f "alembic.ini" ]; then
        log_stage "$stage" "info" "Alembic migrations detected"
        # Actual: alembic upgrade head
        log_stage "$stage" "info" "Would run: alembic upgrade head (skipped in skeleton)"
    fi
    
    if [ -f "prisma/schema.prisma" ]; then
        log_stage "$stage" "info" "Prisma migrations detected"
        # Actual: npx prisma migrate deploy
        log_stage "$stage" "info" "Would run: npx prisma migrate deploy (skipped in skeleton)"
    fi
    
    if [ -f "manage.py" ]; then
        log_stage "$stage" "info" "Django migrations detected"
        # Actual: python manage.py migrate
        log_stage "$stage" "info" "Would run: python manage.py migrate (skipped in skeleton)"
    fi
    
    if [ ! -f "alembic.ini" ] && [ ! -f "prisma/schema.prisma" ] && [ ! -f "manage.py" ]; then
        log_stage "$stage" "info" "No migration tool detected, skipping"
    fi
    
    local stage_end=$(date +%s)
    local duration=$(((stage_end - stage_start) * 1000))
    log_stage "$stage" "complete" "Database migrations complete" "$duration"
    
    return 0
}

# =====================================================================
# Stage 4: SEED
# =====================================================================

stage_seed() {
    local stage_start=$(date +%s)
    local stage="seed"
    
    log_stage "$stage" "start" "Beginning data seeding"
    
    # This is a skeleton - actual seeding logic will be added in Phase 2
    
    if [ -f "scripts/seed.sh" ]; then
        log_stage "$stage" "info" "Seed script detected: scripts/seed.sh"
        # Actual: ./scripts/seed.sh
        log_stage "$stage" "info" "Would run: ./scripts/seed.sh (skipped in skeleton)"
    fi
    
    if [ -f "scripts/seed.py" ]; then
        log_stage "$stage" "info" "Seed script detected: scripts/seed.py"
        # Actual: python scripts/seed.py
        log_stage "$stage" "info" "Would run: python scripts/seed.py (skipped in skeleton)"
    fi
    
    if [ -f "prisma/seed.ts" ]; then
        log_stage "$stage" "info" "Prisma seed detected"
        # Actual: npx prisma db seed
        log_stage "$stage" "info" "Would run: npx prisma db seed (skipped in skeleton)"
    fi
    
    if [ ! -f "scripts/seed.sh" ] && [ ! -f "scripts/seed.py" ] && [ ! -f "prisma/seed.ts" ]; then
        log_stage "$stage" "info" "No seed script detected, skipping"
    fi
    
    local stage_end=$(date +%s)
    local duration=$(((stage_end - stage_start) * 1000))
    log_stage "$stage" "complete" "Data seeding complete" "$duration"
    
    return 0
}

# =====================================================================
# Stage 5: HEALTHCHECK
# =====================================================================

stage_healthcheck() {
    local stage_start=$(date +%s)
    local stage="healthcheck"
    
    log_stage "$stage" "start" "Beginning health checks"
    
    # This is a skeleton - actual health check logic will be added in Phase 2
    
    # Check if Docker is running (if required)
    if [ "$DOCKER_RUNNING" = true ]; then
        log_stage "$stage" "info" "Docker daemon health: OK"
    elif [ -f "docker-compose.yml" ] || [ -f "docker-compose.yaml" ]; then
        log_stage "$stage" "warning" "Docker Compose file present but Docker not running"
    fi
    
    # Check if common ports are available
    for PORT in 8000 3000 5432 6379; do
        if lsof -i :$PORT > /dev/null 2>&1; then
            log_stage "$stage" "info" "Port $PORT is in use"
        else
            log_stage "$stage" "info" "Port $PORT is available"
        fi
    done
    
    # Check if .env file exists
    if [ -f ".env" ]; then
        log_stage "$stage" "info" "Environment configuration: OK (.env exists)"
    elif [ -f ".env.example" ]; then
        log_stage "$stage" "warning" ".env missing but .env.example exists"
    fi
    
    local stage_end=$(date +%s)
    local duration=$(((stage_end - stage_start) * 1000))
    log_stage "$stage" "complete" "Health checks complete" "$duration"
    
    return 0
}

# =====================================================================
# Main Execution
# =====================================================================

main() {
    local total_start=$(date +%s)
    
    # Initialize log file
    echo "OnboardOps Bootstrap Log - $(date)" > "$LOG_FILE"
    echo "Version: $SCRIPT_VERSION" >> "$LOG_FILE"
    echo "========================================" >> "$LOG_FILE"
    
    log_stage "bootstrap" "start" "Bootstrap process initiated"
    
    # Execute all five stages in sequence
    stage_detect || {
        log_stage "bootstrap" "error" "Detection stage failed"
        exit 1
    }
    
    stage_install || {
        log_stage "bootstrap" "error" "Installation stage failed"
        exit 2
    }
    
    stage_migrate || {
        log_stage "bootstrap" "error" "Migration stage failed"
        exit 3
    }
    
    stage_seed || {
        log_stage "bootstrap" "error" "Seeding stage failed"
        exit 4
    }
    
    stage_healthcheck || {
        log_stage "bootstrap" "error" "Health check stage failed"
        exit 5
    }
    
    local total_end=$(date +%s)
    local total_duration=$(((total_end - total_start) * 1000))
    
    log_stage "bootstrap" "complete" "Bootstrap process completed successfully" "$total_duration"
    
    # Summary
    echo "" >> "$LOG_FILE"
    echo "========================================" >> "$LOG_FILE"
    echo "Bootstrap completed in ${total_duration}ms" >> "$LOG_FILE"
    echo "Log file: $LOG_FILE" >> "$LOG_FILE"
    
    exit 0
}

# Run main function
main "$@"

# Made with Bob
