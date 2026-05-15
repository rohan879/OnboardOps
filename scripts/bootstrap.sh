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
# Auto-Recovery Functions
# =====================================================================

# Auto-recover from port-in-use error
# Usage: auto_recover_port <port> [--auto-recover]
auto_recover_port() {
    local port="$1"
    local auto_recover="${2:-false}"
    
    # Check if port is in use
    if ! lsof -i ":$port" > /dev/null 2>&1; then
        return 0  # Port is free, no recovery needed
    fi
    
    # Port is in use, identify the process
    local pid=$(lsof -ti ":$port" 2>/dev/null | head -1)
    local process_name=$(ps -p "$pid" -o comm= 2>/dev/null || echo "unknown")
    
    log_stage "recovery" "warning" "Port $port is in use by process $pid ($process_name)"
    
    # Emit structured recovery event
    local recovery_event=$(cat <<EOF
{"timestamp":"$(date -u +"%Y-%m-%dT%H:%M:%SZ")","event":"recovery","type":"port-in-use","port":$port,"pid":$pid,"process":"$process_name","action":"terminate"}
EOF
)
    echo "$recovery_event"
    
    # Prompt or auto-recover
    if [ "$auto_recover" = "--auto-recover" ]; then
        log_stage "recovery" "info" "Auto-recovery enabled, terminating process $pid"
        kill "$pid" 2>/dev/null || {
            log_stage "recovery" "warning" "Failed to terminate process $pid, trying SIGKILL"
            kill -9 "$pid" 2>/dev/null || {
                log_stage "recovery" "error" "Failed to terminate process $pid"
                return 1
            }
        }
        
        # Wait for port to be released
        local retries=0
        while lsof -i ":$port" > /dev/null 2>&1 && [ $retries -lt 10 ]; do
            sleep 0.5
            retries=$((retries + 1))
        done
        
        if lsof -i ":$port" > /dev/null 2>&1; then
            log_stage "recovery" "error" "Port $port still in use after termination"
            return 1
        fi
        
        log_stage "recovery" "success" "Port $port recovered successfully"
        return 0
    else
        # Interactive prompt
        echo ""
        echo "Port $port is in use by process $pid ($process_name)"
        read -p "Terminate this process? (y/n): " -n 1 -r
        echo ""
        
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            kill "$pid" 2>/dev/null || {
                log_stage "recovery" "warning" "Failed to terminate process $pid, trying SIGKILL"
                kill -9 "$pid" 2>/dev/null || {
                    log_stage "recovery" "error" "Failed to terminate process $pid"
                    return 1
                }
            }
            
            # Wait for port to be released
            local retries=0
            while lsof -i ":$port" > /dev/null 2>&1 && [ $retries -lt 10 ]; do
                sleep 0.5
                retries=$((retries + 1))
            done
            
            if lsof -i ":$port" > /dev/null 2>&1; then
                log_stage "recovery" "error" "Port $port still in use after termination"
                return 1
            fi
            
            log_stage "recovery" "success" "Port $port recovered successfully"
            return 0
        else
            log_stage "recovery" "info" "User declined to terminate process"
            return 1
        fi
    fi
}


# =====================================================================
# Stage 1: DETECT
# =====================================================================

stage_detect() {
    local stage_start=$(date +%s)
    local stage="detect"
    
    log_stage "$stage" "start" "Beginning environment detection"
    
    # Initialize detection results
    declare -A TOOLCHAIN
    TOOLCHAIN[languages]=""
    TOOLCHAIN[package_managers]=""
    TOOLCHAIN[python_version_required]=""
    TOOLCHAIN[node_version_required]=""
    TOOLCHAIN[services]=""
    
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
    
    # ===== PHASE 2: Parse manifest files for toolchain details =====
    
    # Parse pyproject.toml for Python requirements
    if [ -f "pyproject.toml" ]; then
        log_stage "$stage" "info" "Parsing pyproject.toml"
        TOOLCHAIN[languages]="${TOOLCHAIN[languages]:+${TOOLCHAIN[languages]},}python"
        TOOLCHAIN[package_managers]="${TOOLCHAIN[package_managers]:+${TOOLCHAIN[package_managers]},}pip"
        
        # Extract Python version requirement
        if command -v python3 &> /dev/null; then
            local py_req=$(python3 -c "
import tomli
try:
    with open('pyproject.toml', 'rb') as f:
        data = tomli.load(f)
        req = data.get('project', {}).get('requires-python', '')
        if not req:
            req = data.get('tool', {}).get('poetry', {}).get('dependencies', {}).get('python', '')
        print(req)
except:
    print('')
" 2>/dev/null || echo "")
            if [ -n "$py_req" ]; then
                TOOLCHAIN[python_version_required]="$py_req"
                log_stage "$stage" "info" "Python version requirement: $py_req"
            fi
        fi
    fi
    
    # Parse requirements.txt for Python
    if [ -f "requirements.txt" ]; then
        log_stage "$stage" "info" "Parsing requirements.txt"
        if [[ "${TOOLCHAIN[languages]}" != *"python"* ]]; then
            TOOLCHAIN[languages]="${TOOLCHAIN[languages]:+${TOOLCHAIN[languages]},}python"
        fi
        if [[ "${TOOLCHAIN[package_managers]}" != *"pip"* ]]; then
            TOOLCHAIN[package_managers]="${TOOLCHAIN[package_managers]:+${TOOLCHAIN[package_managers]},}pip"
        fi
    fi
    
    # Parse package.json for Node.js requirements
    if [ -f "package.json" ]; then
        log_stage "$stage" "info" "Parsing package.json"
        TOOLCHAIN[languages]="${TOOLCHAIN[languages]:+${TOOLCHAIN[languages]},}javascript"
        
        # Detect package manager from lockfiles
        if [ -f "pnpm-lock.yaml" ]; then
            TOOLCHAIN[package_managers]="${TOOLCHAIN[package_managers]:+${TOOLCHAIN[package_managers]},}pnpm"
            log_stage "$stage" "info" "Package manager: pnpm (detected from pnpm-lock.yaml)"
        elif [ -f "yarn.lock" ]; then
            TOOLCHAIN[package_managers]="${TOOLCHAIN[package_managers]:+${TOOLCHAIN[package_managers]},}yarn"
            log_stage "$stage" "info" "Package manager: yarn (detected from yarn.lock)"
        elif [ -f "package-lock.json" ]; then
            TOOLCHAIN[package_managers]="${TOOLCHAIN[package_managers]:+${TOOLCHAIN[package_managers]},}npm"
            log_stage "$stage" "info" "Package manager: npm (detected from package-lock.json)"
        else
            TOOLCHAIN[package_managers]="${TOOLCHAIN[package_managers]:+${TOOLCHAIN[package_managers]},}npm"
            log_stage "$stage" "info" "Package manager: npm (default)"
        fi
        
        # Extract Node version requirement
        if command -v node &> /dev/null; then
            local node_req=$(node -e "
try {
    const pkg = require('./package.json');
    const engines = pkg.engines || {};
    console.log(engines.node || '');
} catch(e) {
    console.log('');
}
" 2>/dev/null || echo "")
            if [ -n "$node_req" ]; then
                TOOLCHAIN[node_version_required]="$node_req"
                log_stage "$stage" "info" "Node version requirement: $node_req"
            fi
        fi
    fi
    
    # Parse docker-compose.yml for services
    if [ -f "docker-compose.yml" ] || [ -f "docker-compose.yaml" ]; then
        local compose_file="docker-compose.yml"
        [ -f "docker-compose.yaml" ] && compose_file="docker-compose.yaml"
        
        log_stage "$stage" "info" "Parsing $compose_file"
        TOOLCHAIN[languages]="${TOOLCHAIN[languages]:+${TOOLCHAIN[languages]},}docker"
        
        # Extract service names
        local services=$(grep -E '^\s+[a-zA-Z0-9_-]+:' "$compose_file" | sed 's/://g' | tr -d ' ' | tr '\n' ',' | sed 's/,$//')
        if [ -n "$services" ]; then
            TOOLCHAIN[services]="$services"
            log_stage "$stage" "info" "Docker services detected: $services"
        fi
        
        # Detect common service types
        if grep -q "postgres\|postgresql" "$compose_file"; then
            log_stage "$stage" "info" "PostgreSQL database detected"
        fi
        if grep -q "redis" "$compose_file"; then
            log_stage "$stage" "info" "Redis cache detected"
        fi
        if grep -q "mongo" "$compose_file"; then
            log_stage "$stage" "info" "MongoDB database detected"
        fi
    fi
    
    # Emit structured JSON toolchain description
    local toolchain_json=$(cat <<EOF
{
  "languages": "${TOOLCHAIN[languages]:-unknown}",
  "package_managers": "${TOOLCHAIN[package_managers]:-unknown}",
  "python_version_required": "${TOOLCHAIN[python_version_required]:-any}",
  "node_version_required": "${TOOLCHAIN[node_version_required]:-any}",
  "services": "${TOOLCHAIN[services]:-none}",
  "os": "$OS",
  "docker_available": $DOCKER_RUNNING,
  "python_installed": "$(command -v python3 &> /dev/null && echo true || echo false)",
  "node_installed": "$(command -v node &> /dev/null && echo true || echo false)"
}
EOF
)
    
    echo "$toolchain_json" > /tmp/onboardops-toolchain.json
    log_stage "$stage" "info" "Toolchain description: $toolchain_json"
    
    # Store for use in other stages
    PROJECT_TYPE="${TOOLCHAIN[languages]}"
    
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
    
    # Check if already installed (idempotency check)
    local already_installed=false
    
    # ===== PYTHON INSTALLATION =====
    if [ -f "pyproject.toml" ] || [ -f "requirements.txt" ]; then
        log_stage "$stage" "info" "Python project detected"
        
        # Check if virtualenv already exists and is complete
        if [ -d "venv" ] && [ -f "venv/bin/activate" ]; then
            log_stage "$stage" "info" "Virtual environment already exists"
            
            # Quick check if dependencies are installed
            source venv/bin/activate
            if [ -f "requirements.txt" ]; then
                local req_count=$(grep -v '^#' requirements.txt | grep -v '^$' | wc -l | tr -d ' ')
                local installed_count=$(pip list --format=freeze 2>/dev/null | wc -l | tr -d ' ')
                if [ "$installed_count" -ge "$req_count" ]; then
                    log_stage "$stage" "info" "Dependencies appear to be installed (idempotent check passed)"
                    already_installed=true
                fi
            else
                already_installed=true
            fi
            deactivate 2>/dev/null || true
        fi
        
        if [ "$already_installed" = false ]; then
            # Create virtual environment
            if [ ! -d "venv" ]; then
                log_stage "$stage" "info" "Creating Python virtual environment"
                python3 -m venv venv || {
                    log_stage "$stage" "error" "Failed to create virtual environment"
                    return 1
                }
            fi
            
            # Activate virtual environment
            source venv/bin/activate || {
                log_stage "$stage" "error" "Failed to activate virtual environment"
                return 1
            }
            
            # Upgrade pip
            log_stage "$stage" "info" "Upgrading pip"
            pip install --upgrade pip --quiet || {
                log_stage "$stage" "warning" "Failed to upgrade pip, continuing"
            }
            
            # Install from requirements.txt
            if [ -f "requirements.txt" ]; then
                log_stage "$stage" "info" "Installing from requirements.txt"
                pip install -r requirements.txt || {
                    log_stage "$stage" "error" "Failed to install requirements.txt"
                    deactivate
                    return 1
                }
            fi
            
            # Install from pyproject.toml
            if [ -f "pyproject.toml" ]; then
                log_stage "$stage" "info" "Installing from pyproject.toml"
                pip install -e . || {
                    log_stage "$stage" "error" "Failed to install pyproject.toml"
                    deactivate
                    return 1
                }
            fi
            
            # Install dev dependencies if present
            if [ -f "requirements-dev.txt" ]; then
                log_stage "$stage" "info" "Installing dev dependencies"
                pip install -r requirements-dev.txt || {
                    log_stage "$stage" "warning" "Failed to install dev dependencies, continuing"
                }
            fi
            
            deactivate
            log_stage "$stage" "info" "Python dependencies installed successfully"
        fi
    fi
    
    # ===== NODE.JS INSTALLATION =====
    if [ -f "package.json" ]; then
        log_stage "$stage" "info" "Node.js project detected"
        
        # Determine package manager
        local pkg_manager="npm"
        if [ -f "pnpm-lock.yaml" ]; then
            pkg_manager="pnpm"
        elif [ -f "yarn.lock" ]; then
            pkg_manager="yarn"
        fi
        
        # Check if already installed
        if [ -d "node_modules" ] && [ -f "node_modules/.package-lock.json" -o -f "node_modules/.pnpm-lock.yaml" -o -f "node_modules/.yarn-integrity" ]; then
            log_stage "$stage" "info" "Node modules already installed (idempotent check passed)"
            already_installed=true
        else
            already_installed=false
        fi
        
        if [ "$already_installed" = false ]; then
            log_stage "$stage" "info" "Installing Node.js dependencies with $pkg_manager"
            
            case "$pkg_manager" in
                pnpm)
                    if ! command -v pnpm &> /dev/null; then
                        log_stage "$stage" "info" "Installing pnpm"
                        npm install -g pnpm || {
                            log_stage "$stage" "error" "Failed to install pnpm"
                            return 1
                        }
                    fi
                    pnpm install || {
                        log_stage "$stage" "error" "Failed to run pnpm install"
                        return 1
                    }
                    ;;
                yarn)
                    if ! command -v yarn &> /dev/null; then
                        log_stage "$stage" "info" "Installing yarn"
                        npm install -g yarn || {
                            log_stage "$stage" "error" "Failed to install yarn"
                            return 1
                        }
                    fi
                    yarn install || {
                        log_stage "$stage" "error" "Failed to run yarn install"
                        return 1
                    }
                    ;;
                npm)
                    npm install || {
                        log_stage "$stage" "error" "Failed to run npm install"
                        return 1
                    }
                    ;;
            esac
            
            log_stage "$stage" "info" "Node.js dependencies installed successfully"
        fi
    fi
    
    # ===== DOCKER COMPOSE SETUP =====
    if [ -f "docker-compose.yml" ] || [ -f "docker-compose.yaml" ]; then
        log_stage "$stage" "info" "Docker Compose configuration detected"
        
        if [ "$DOCKER_RUNNING" = true ]; then
            log_stage "$stage" "info" "Pulling Docker images"
            docker-compose pull || {
                log_stage "$stage" "warning" "Failed to pull Docker images, continuing"
            }
        else
            log_stage "$stage" "warning" "Docker not running, skipping image pull"
        fi
    fi
    
    local stage_end=$(date +%s)
    local duration=$(((stage_end - stage_start) * 1000))
    
    if [ "$already_installed" = true ]; then
        log_stage "$stage" "complete" "Dependency installation complete (idempotent, <5s)" "$duration"
    else
        log_stage "$stage" "complete" "Dependency installation complete" "$duration"
    fi
    
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
