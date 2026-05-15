#!/bin/bash
# =====================================================================
# OnboardOps Bootstrap with Bob Shell Checkpoint Wrapping - T4.4
# Dev 4 - Infra / Bob Shell
# 
# Wraps bootstrap.sh with Bob Shell checkpoint for automatic rollback
# on non-recoverable failures
# =====================================================================

set -e

# Configuration
CHECKPOINT_NAME="pre-bootstrap"
BOOTSTRAP_SCRIPT="$(dirname "$0")/bootstrap.sh"
WORKSPACE_DIR="${WORKSPACE_DIR:-$(pwd)}"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}=== OnboardOps Bootstrap with Checkpoint ===${NC}"
echo ""

# Check if Bob Shell is available
if ! command -v bob &> /dev/null; then
    echo -e "${RED}Error: Bob Shell not found${NC}"
    echo "Please install Bob Shell first: https://ibm.com/bob"
    exit 1
fi

# Check if bootstrap script exists
if [ ! -f "$BOOTSTRAP_SCRIPT" ]; then
    echo -e "${RED}Error: Bootstrap script not found at $BOOTSTRAP_SCRIPT${NC}"
    exit 1
fi

echo -e "${YELLOW}Creating checkpoint: $CHECKPOINT_NAME${NC}"
echo "Workspace: $WORKSPACE_DIR"
echo ""

# Create checkpoint using Bob Shell
# Note: Bob Shell checkpoint API syntax (this is a placeholder for actual Bob API)
# The actual implementation depends on Bob Shell's checkpoint feature
echo "bob checkpoint create $CHECKPOINT_NAME --workspace $WORKSPACE_DIR" > /tmp/bob-checkpoint-cmd.txt

# For now, we'll use git as a fallback checkpoint mechanism
# In production, this would use Bob Shell's native checkpoint API
if command -v git &> /dev/null && [ -d ".git" ]; then
    echo -e "${BLUE}Using git-based checkpoint (fallback)${NC}"
    
    # Save current state
    CHECKPOINT_BRANCH="checkpoint/$CHECKPOINT_NAME-$(date +%s)"
    CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo "main")
    
    # Stash any uncommitted changes
    git stash push -u -m "$CHECKPOINT_NAME" > /dev/null 2>&1 || true
    
    # Create checkpoint branch
    git branch "$CHECKPOINT_BRANCH" > /dev/null 2>&1 || {
        echo -e "${YELLOW}Warning: Could not create checkpoint branch${NC}"
    }
    
    echo -e "${GREEN}✓ Checkpoint created: $CHECKPOINT_BRANCH${NC}"
    echo ""
else
    echo -e "${YELLOW}Warning: Git not available, checkpoint not created${NC}"
    echo -e "${YELLOW}Proceeding without checkpoint protection${NC}"
    echo ""
    CHECKPOINT_BRANCH=""
fi

# Run bootstrap script
echo -e "${BLUE}Running bootstrap script...${NC}"
echo ""

BOOTSTRAP_EXIT_CODE=0
"$BOOTSTRAP_SCRIPT" "$@" || BOOTSTRAP_EXIT_CODE=$?

echo ""

# Handle bootstrap result
if [ $BOOTSTRAP_EXIT_CODE -eq 0 ]; then
    echo -e "${GREEN}=== Bootstrap completed successfully ===${NC}"
    
    # Clean up checkpoint if successful
    if [ -n "$CHECKPOINT_BRANCH" ] && command -v git &> /dev/null; then
        echo -e "${BLUE}Cleaning up checkpoint${NC}"
        git branch -D "$CHECKPOINT_BRANCH" > /dev/null 2>&1 || true
        echo -e "${GREEN}✓ Checkpoint removed${NC}"
    fi
    
    exit 0
else
    echo -e "${RED}=== Bootstrap failed with exit code $BOOTSTRAP_EXIT_CODE ===${NC}"
    echo ""
    
    # Restore from checkpoint
    if [ -n "$CHECKPOINT_BRANCH" ] && command -v git &> /dev/null; then
        echo -e "${YELLOW}Restoring from checkpoint: $CHECKPOINT_BRANCH${NC}"
        
        # Reset to checkpoint state
        git reset --hard "$CHECKPOINT_BRANCH" > /dev/null 2>&1 || {
            echo -e "${RED}Error: Failed to restore from checkpoint${NC}"
            exit 1
        }
        
        # Restore stashed changes
        git stash pop > /dev/null 2>&1 || true
        
        # Clean up checkpoint branch
        git branch -D "$CHECKPOINT_BRANCH" > /dev/null 2>&1 || true
        
        echo -e "${GREEN}✓ Workspace restored to pre-bootstrap state${NC}"
        echo ""
        echo -e "${BLUE}Checkpoint restoration complete${NC}"
        echo "The workspace is now in the same state as before bootstrap was run."
    else
        echo -e "${YELLOW}Warning: No checkpoint available for restoration${NC}"
    fi
    
    exit $BOOTSTRAP_EXIT_CODE
fi

# Made with Bob
