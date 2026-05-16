#!/bin/bash

# reset-demo-machine.sh - T4.8 Demo Machine Reset Script
# Resets demo machine to clean state for fresh bootstrap testing

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

echo -e "${CYAN}╔═══════════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║  Demo Machine Reset - Return to Clean State          ║${NC}"
echo -e "${CYAN}╚═══════════════════════════════════════════════════════╝${NC}"
echo ""

START_TIME=$(date +%s)

# Common ports used by dev servers
COMMON_PORTS=(3000 3001 5000 5001 8000 8080 8081 9000)

echo -e "${BLUE}Step 1: Stop all dev servers${NC}"
echo "Checking for processes on common ports..."

for PORT in "${COMMON_PORTS[@]}"; do
    PIDS=$(lsof -ti :$PORT 2>/dev/null || true)
    if [ ! -z "$PIDS" ]; then
        echo -e "${YELLOW}  Killing process(es) on port $PORT: $PIDS${NC}"
        kill -9 $PIDS 2>/dev/null || true
        sleep 0.5
    fi
done

# Also check for common dev server process names
echo "Stopping common dev server processes..."
pkill -f "npm.*start" 2>/dev/null || true
pkill -f "node.*server" 2>/dev/null || true
pkill -f "python.*manage.py.*runserver" 2>/dev/null || true
pkill -f "flask.*run" 2>/dev/null || true
pkill -f "uvicorn" 2>/dev/null || true

echo -e "${GREEN}✓ Dev servers stopped${NC}"
echo ""

echo -e "${BLUE}Step 2: Stop and remove Docker containers${NC}"
cd "$PROJECT_ROOT"

if [ -f "docker-compose.yml" ] || [ -f "docker-compose.yaml" ]; then
    echo "Found docker-compose file, stopping services..."
    docker compose down -v 2>/dev/null || docker-compose down -v 2>/dev/null || true
    echo -e "${GREEN}✓ Docker services stopped${NC}"
else
    echo "No docker-compose file found, skipping..."
fi
echo ""

echo -e "${BLUE}Step 3: Drop and recreate database${NC}"

# Try to detect database type and reset it
if command -v psql &> /dev/null; then
    echo "PostgreSQL detected, attempting to reset database..."
    
    # Try to find database name from environment or config
    DB_NAME="demo_db"
    if [ -f ".env" ]; then
        DB_FROM_ENV=$(grep -oP 'DATABASE_URL=.*\/\K[^?]+' .env 2>/dev/null || true)
        if [ ! -z "$DB_FROM_ENV" ]; then
            DB_NAME="$DB_FROM_ENV"
        fi
    fi
    
    echo "  Dropping database: $DB_NAME"
    psql -h localhost -U postgres -c "DROP DATABASE IF EXISTS $DB_NAME;" 2>/dev/null || true
    
    echo "  Creating database: $DB_NAME"
    psql -h localhost -U postgres -c "CREATE DATABASE $DB_NAME;" 2>/dev/null || true
    
    echo -e "${GREEN}✓ PostgreSQL database reset${NC}"
elif command -v mysql &> /dev/null; then
    echo "MySQL detected, attempting to reset database..."
    
    DB_NAME="demo_db"
    if [ -f ".env" ]; then
        DB_FROM_ENV=$(grep -oP 'DATABASE_URL=.*\/\K[^?]+' .env 2>/dev/null || true)
        if [ ! -z "$DB_FROM_ENV" ]; then
            DB_NAME="$DB_FROM_ENV"
        fi
    fi
    
    echo "  Dropping database: $DB_NAME"
    mysql -u root -e "DROP DATABASE IF EXISTS $DB_NAME;" 2>/dev/null || true
    
    echo "  Creating database: $DB_NAME"
    mysql -u root -e "CREATE DATABASE $DB_NAME;" 2>/dev/null || true
    
    echo -e "${GREEN}✓ MySQL database reset${NC}"
else
    echo -e "${YELLOW}No database CLI found, skipping database reset${NC}"
fi
echo ""

echo -e "${BLUE}Step 4: Clean build artifacts and caches${NC}"

# Remove common build artifacts
echo "Removing build artifacts..."
rm -rf node_modules/.cache 2>/dev/null || true
rm -rf .next 2>/dev/null || true
rm -rf dist 2>/dev/null || true
rm -rf build 2>/dev/null || true
rm -rf __pycache__ 2>/dev/null || true
find . -type d -name "__pycache__" -exec rm -rf {} + 2>/dev/null || true
find . -type f -name "*.pyc" -delete 2>/dev/null || true

# Remove Python virtualenv (will be recreated by bootstrap)
if [ -d ".venv" ]; then
    echo "Removing Python virtualenv..."
    rm -rf .venv
fi
if [ -d "venv" ]; then
    echo "Removing Python virtualenv..."
    rm -rf venv
fi

echo -e "${GREEN}✓ Build artifacts cleaned${NC}"
echo ""

echo -e "${BLUE}Step 5: Reset git repository${NC}"

# Stash any uncommitted changes
if ! git diff-index --quiet HEAD -- 2>/dev/null; then
    echo "Stashing uncommitted changes..."
    git stash push -m "reset-demo-machine-$(date +%s)" 2>/dev/null || true
fi

# Clean untracked files (except .env)
echo "Cleaning untracked files..."
git clean -fdx -e .env -e .env.local 2>/dev/null || true

# Reset to HEAD
echo "Resetting to HEAD..."
git reset --hard HEAD 2>/dev/null || true

echo -e "${GREEN}✓ Git repository reset${NC}"
echo ""

echo -e "${BLUE}Step 6: Clean temporary files${NC}"

# Remove OnboardOps temporary files
rm -f /tmp/onboardops-*.log 2>/dev/null || true
rm -f /tmp/onboardops-*.json 2>/dev/null || true
rm -f /tmp/onboardops-*.jsonl 2>/dev/null || true
rm -f /tmp/idempotence-results.json 2>/dev/null || true

echo -e "${GREEN}✓ Temporary files cleaned${NC}"
echo ""

echo -e "${BLUE}Step 7: Verify clean state${NC}"

# Check no processes on common ports
ACTIVE_PORTS=0
for PORT in "${COMMON_PORTS[@]}"; do
    if lsof -ti :$PORT &>/dev/null; then
        echo -e "${YELLOW}  ⚠ Port $PORT still in use${NC}"
        ACTIVE_PORTS=$((ACTIVE_PORTS + 1))
    fi
done

if [ $ACTIVE_PORTS -eq 0 ]; then
    echo -e "${GREEN}✓ All common ports are free${NC}"
else
    echo -e "${YELLOW}⚠ $ACTIVE_PORTS port(s) still in use${NC}"
fi

# Check git status
if git diff-index --quiet HEAD -- 2>/dev/null; then
    echo -e "${GREEN}✓ Git working directory is clean${NC}"
else
    echo -e "${YELLOW}⚠ Git working directory has changes${NC}"
fi

# Check no virtualenv
if [ ! -d ".venv" ] && [ ! -d "venv" ]; then
    echo -e "${GREEN}✓ No Python virtualenv present${NC}"
else
    echo -e "${YELLOW}⚠ Python virtualenv still exists${NC}"
fi

echo ""

END_TIME=$(date +%s)
DURATION=$((END_TIME - START_TIME))

echo -e "${GREEN}╔═══════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║  ✓ Demo Machine Reset Complete                       ║${NC}"
echo -e "${GREEN}╚═══════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${CYAN}Reset completed in ${DURATION}s${NC}"
echo ""
echo -e "${BLUE}Next steps:${NC}"
echo "  1. Run bootstrap to set up environment:"
echo "     ./scripts/bootstrap.sh"
echo ""
echo "  2. Or run auto-bootstrap with AI recovery:"
echo "     python3 scripts/auto_bootstrap.py --auto-recover"
echo ""
echo -e "${YELLOW}Note: .env file was preserved (if it existed)${NC}"
echo ""

exit 0

# Made with Bob
