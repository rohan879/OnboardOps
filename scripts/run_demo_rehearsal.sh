#!/bin/bash
# Demo Recording Rehearsal Script - T5.9
# Executes the full 60-second demo with timing checks and defect detection
# Owner: Dev 5 (Integration Engineer)

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
DEMO_MACHINE_DOC="docs/demo-machine.md"
STORYBOARD_DOC="docs/demo-storyboard.md"
DEFECTS_DOC="docs/demo-defects.md"
RECORDING_DIR="docs/recordings/phase3"
RECORDING_FILE="onboardops-rehearsal-02.mp4"

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}OnboardOps Demo Rehearsal - Phase 3${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Function to check if a command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to check if a port is in use
port_in_use() {
    lsof -i :"$1" >/dev/null 2>&1
}

# Function to wait for service
wait_for_service() {
    local url=$1
    local max_attempts=30
    local attempt=0
    
    echo -n "Waiting for $url..."
    while [ $attempt -lt $max_attempts ]; do
        if curl -s "$url" >/dev/null 2>&1; then
            echo -e " ${GREEN}✓${NC}"
            return 0
        fi
        echo -n "."
        sleep 1
        ((attempt++))
    done
    echo -e " ${RED}✗${NC}"
    return 1
}

# Step 1: Pre-flight checks
echo -e "${YELLOW}Step 1: Pre-flight Checks${NC}"
echo "---"

# Check if demo machine doc exists
if [ ! -f "$DEMO_MACHINE_DOC" ]; then
    echo -e "${RED}✗ Demo machine doc not found: $DEMO_MACHINE_DOC${NC}"
    exit 1
fi
echo -e "${GREEN}✓${NC} Demo machine doc exists"

# Check if storyboard exists
if [ ! -f "$STORYBOARD_DOC" ]; then
    echo -e "${RED}✗ Storyboard not found: $STORYBOARD_DOC${NC}"
    exit 1
fi
echo -e "${GREEN}✓${NC} Storyboard exists"

# Check if defects doc exists
if [ ! -f "$DEFECTS_DOC" ]; then
    echo -e "${RED}✗ Defects catalog not found: $DEFECTS_DOC${NC}"
    exit 1
fi
echo -e "${GREEN}✓${NC} Defects catalog exists"

# Check recording directory
mkdir -p "$RECORDING_DIR"
echo -e "${GREEN}✓${NC} Recording directory ready: $RECORDING_DIR"

# Check required tools
echo ""
echo "Checking required tools..."
MISSING_TOOLS=0

if ! command_exists curl; then
    echo -e "${RED}✗ curl not installed${NC}"
    ((MISSING_TOOLS++))
else
    echo -e "${GREEN}✓${NC} curl installed"
fi

if ! command_exists lsof; then
    echo -e "${RED}✗ lsof not installed${NC}"
    ((MISSING_TOOLS++))
else
    echo -e "${GREEN}✓${NC} lsof installed"
fi

if ! command_exists bob; then
    echo -e "${YELLOW}⚠${NC} Bob Shell not installed (optional for this rehearsal)"
else
    echo -e "${GREEN}✓${NC} Bob Shell installed"
fi

if [ $MISSING_TOOLS -gt 0 ]; then
    echo -e "${RED}Missing $MISSING_TOOLS required tool(s). Please install them first.${NC}"
    exit 1
fi

echo ""

# Step 2: Environment check
echo -e "${YELLOW}Step 2: Environment Check${NC}"
echo "---"

# Check if backend is running
if port_in_use 8765; then
    echo -e "${GREEN}✓${NC} Backend port 8765 is in use"
    if wait_for_service "http://localhost:8765/health"; then
        echo -e "${GREEN}✓${NC} Backend health check passed"
    else
        echo -e "${RED}✗ Backend not responding to health check${NC}"
        echo -e "${YELLOW}  Try: cd backend && uvicorn app:app --port 8765${NC}"
        exit 1
    fi
else
    echo -e "${RED}✗ Backend not running on port 8765${NC}"
    echo -e "${YELLOW}  Try: make dev${NC}"
    exit 1
fi

# Check if frontend is running
if port_in_use 3000; then
    echo -e "${GREEN}✓${NC} Frontend port 3000 is in use"
    if wait_for_service "http://localhost:3000"; then
        echo -e "${GREEN}✓${NC} Frontend responding"
    else
        echo -e "${YELLOW}⚠${NC} Frontend port in use but not responding (may be normal)"
    fi
else
    echo -e "${RED}✗ Frontend not running on port 3000${NC}"
    echo -e "${YELLOW}  Try: make dev${NC}"
    exit 1
fi

echo ""

# Step 3: Demo machine readiness
echo -e "${YELLOW}Step 3: Demo Machine Readiness${NC}"
echo "---"

# Check for desktop clutter
echo "Checking environment..."
if pgrep -x "Slack" >/dev/null; then
    echo -e "${YELLOW}⚠${NC} Slack is running (consider closing for demo)"
fi

if pgrep -x "Discord" >/dev/null; then
    echo -e "${YELLOW}⚠${NC} Discord is running (consider closing for demo)"
fi

# Check screen resolution
if command_exists system_profiler; then
    RESOLUTION=$(system_profiler SPDisplaysDataType 2>/dev/null | grep Resolution | head -1)
    echo "Screen resolution: $RESOLUTION"
fi

echo -e "${GREEN}✓${NC} Environment check complete"
echo ""

# Step 4: Recording setup check
echo -e "${YELLOW}Step 4: Recording Setup Check${NC}"
echo "---"

echo "Recording software options:"
if command_exists obs; then
    echo -e "${GREEN}✓${NC} OBS Studio installed"
    OBS_AVAILABLE=1
else
    echo -e "${YELLOW}⚠${NC} OBS Studio not found"
    OBS_AVAILABLE=0
fi

if [ "$(uname)" = "Darwin" ]; then
    if [ -d "/Applications/QuickTime Player.app" ]; then
        echo -e "${GREEN}✓${NC} QuickTime Player available (macOS)"
    fi
fi

if [ $OBS_AVAILABLE -eq 0 ] && [ "$(uname)" != "Darwin" ]; then
    echo -e "${RED}✗ No recording software detected${NC}"
    echo -e "${YELLOW}  Install OBS Studio: https://obsproject.com/${NC}"
    exit 1
fi

echo ""

# Step 5: Storyboard review
echo -e "${YELLOW}Step 5: Storyboard Review${NC}"
echo "---"
echo "The demo follows this 60-second structure:"
echo ""
echo "  Beat 1 (0:00-0:03): The Cold Start"
echo "  Beat 2 (0:03-0:08): OnboardOps Activation"
echo "  Beat 3 (0:08-0:15): First Cartography Card"
echo "  Beat 4 (0:15-0:25): Cards 2-4 Stream In"
echo "  Beat 5 (0:25-0:35): Bootstrap Auto-Recovery"
echo "  Beat 6 (0:35-0:48): Certification Quiz"
echo "  Beat 7 (0:48-0:55): Starter PR Generation"
echo "  Beat 8 (0:55-1:00): The Payoff"
echo ""
echo "Full storyboard: $STORYBOARD_DOC"
echo ""

# Step 6: Ready to record
echo -e "${YELLOW}Step 6: Ready to Record${NC}"
echo "---"
echo ""
echo -e "${GREEN}✓ All pre-flight checks passed!${NC}"
echo ""
echo "Before you start recording:"
echo "  1. Enable Do Not Disturb mode"
echo "  2. Close unnecessary applications"
echo "  3. Clear terminal history: history -c"
echo "  4. Position windows according to storyboard"
echo "  5. Have storyboard visible on second screen or printed"
echo "  6. Start your recording software"
echo ""
echo "Recording will be saved to:"
echo "  $RECORDING_DIR/$RECORDING_FILE"
echo ""
echo "After recording:"
echo "  1. Watch the full playback"
echo "  2. Time each beat with a stopwatch"
echo "  3. Fill out defects in: $DEFECTS_DOC"
echo "  4. Commit the updated defects doc"
echo ""

# Prompt to continue
read -p "Press Enter to see the beat-by-beat checklist, or Ctrl+C to exit..."
echo ""

# Step 7: Beat-by-beat checklist
echo -e "${YELLOW}Step 7: Beat-by-Beat Execution Checklist${NC}"
echo "---"
echo ""

echo -e "${BLUE}Beat 1: The Cold Start (0:00-0:03)${NC}"
echo "  [ ] Terminal shows git clone completing"
echo "  [ ] Bob IDE chat window empty"
echo "  [ ] Repository name visible"
echo "  [ ] Narrator: 'New repository. 10,000 lines. Zero context. The clock starts now.'"
echo ""

echo -e "${BLUE}Beat 2: OnboardOps Activation (0:03-0:08)${NC}"
echo "  [ ] Type /onboard in Bob IDE"
echo "  [ ] Dashboard appears on second monitor"
echo "  [ ] Stopwatch starts at 00:00.0"
echo "  [ ] Custom mode indicator shows 'Onboard Mode'"
echo "  [ ] Narrator: 'One command. /onboard. Your AI copilot takes over.'"
echo ""

echo -e "${BLUE}Beat 3: First Cartography Card (0:08-0:15)${NC}"
echo "  [ ] Bob's greeting message renders"
echo "  [ ] Card 1 animates in: Dependency Graph"
echo "  [ ] Event stream shows: ToolCall: git_blame_summary"
echo "  [ ] MCP server indicator lights green"
echo "  [ ] Narrator: 'Bob maps the codebase in real-time...'"
echo ""

echo -e "${BLUE}Beat 4: Cards 2-4 Stream In (0:15-0:25)${NC}"
echo "  [ ] Card 2: Entry Points"
echo "  [ ] Card 3: Change Hotspots"
echo "  [ ] Card 4: Project Conventions"
echo "  [ ] Event stream shows 3 more tool calls"
echo "  [ ] Narrator: 'Four cards. Thirty seconds...'"
echo ""

echo -e "${BLUE}Beat 5: Bootstrap Auto-Recovery (0:25-0:35)${NC}"
echo "  [ ] Terminal shows bootstrap script running"
echo "  [ ] Error appears: Port 8000 already in use"
echo "  [ ] Auto-recovery kicks in"
echo "  [ ] Green checkmark: Health check passed"
echo "  [ ] Dashboard shows 'Bootstrap: Complete'"
echo "  [ ] Narrator: 'Setup fails? OnboardOps auto-recovers...'"
echo ""

echo -e "${BLUE}Beat 6: Certification Quiz (0:35-0:48)${NC}"
echo "  [ ] Certification panel slides in"
echo "  [ ] Question 1: What ORM? → SQLAlchemy → ✓"
echo "  [ ] Question 2: Where are routes? → app/api/routes/ → ✓"
echo "  [ ] Question 3: Migration tool? → Alembic → ✓"
echo "  [ ] Score: 3/3 (100%)"
echo "  [ ] Panel turns green with 'Certified' badge"
echo "  [ ] Narrator: 'Socratic certification. Three questions...'"
echo ""

echo -e "${BLUE}Beat 7: Starter PR Generation (0:48-0:55)${NC}"
echo "  [ ] Bob message: 'Generating your first contribution...'"
echo "  [ ] Terminal: Running tests... ✓ All tests pass"
echo "  [ ] GitHub PR URL appears"
echo "  [ ] PR title visible"
echo "  [ ] PR description shows onboarding time"
echo "  [ ] Narrator: 'Your first PR. Generated, tested...'"
echo ""

echo -e "${BLUE}Beat 8: The Payoff (0:55-1:00)${NC}"
echo "  [ ] GitHub PR page loads"
echo "  [ ] Stopwatch shows: 09:12.4"
echo "  [ ] Camera pulls back to show both monitors"
echo "  [ ] Cut to OnboardOps wordmark"
echo "  [ ] Narrator: 'Six months of onboarding, compressed...'"
echo ""

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}Ready to record!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo "Good luck with the rehearsal!"
echo ""
echo "After recording, run:"
echo "  vim $DEFECTS_DOC"
echo ""

# Made with Bob
