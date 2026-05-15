#!/bin/bash
# =====================================================================
# Naive Onboarding Audit Script for T4.3
# Dev 4 - Infra / Bob Shell
# =====================================================================

set +e  # Don't exit on errors - we want to document them!

# Configuration
FORK_URL="${1:-https://github.com/YOUR_TEAM_ORG/onboardops-demo}"
AUDIT_DIR="/tmp/onboardops-audit-$(date +%s)"
AUDIT_LOG="notes/demo-repo-friction.md"
START_TIME=$(date +"%H:%M:%S")
START_EPOCH=$(date +%s)

echo "=========================================="
echo "Naive Onboarding Audit - T4.3"
echo "=========================================="
echo ""
echo "Fork URL: $FORK_URL"
echo "Audit Directory: $AUDIT_DIR"
echo "Start Time: $START_TIME"
echo ""

# Initialize audit log
mkdir -p notes
cat > "$AUDIT_LOG" <<EOF
# Naive Onboarding Audit - Demo Repository

**Auditor:** Dev 4 (Infra / Bob Shell)  
**Date:** $(date +"%Y-%m-%d")  
**Start Time:** $START_TIME  
**Repository:** onboardops-demo (fork of tiangolo/full-stack-fastapi-template)  
**Audit Directory:** $AUDIT_DIR

---

## Audit Methodology

This audit simulates a "naive" developer onboarding experience:
- No prior knowledge of the repository
- Attempting obvious commands first
- Documenting every error encountered
- Recording time spent on each fix
- Identifying patterns for auto-recovery

---

## Summary

- **Total Friction Points:** [TO BE FILLED]
- **Time to First Run:** [TO BE FILLED]
- **Most Frustrating:** [TO BE FILLED]
- **Easiest to Fix:** [TO BE FILLED]
- **Auto-Recovery Candidates:** [TO BE FILLED]

---

## Friction Points (Chronological Order)

EOF

FRICTION_COUNT=0

# Function to log friction point
log_friction() {
    local title="$1"
    local command="$2"
    local error_file="$3"
    local fix_description="$4"
    local time_to_fix="$5"
    local detection="$6"
    local recovery="$7"
    local priority="$8"
    
    FRICTION_COUNT=$((FRICTION_COUNT + 1))
    TIMESTAMP=$(date +"%H:%M:%S")
    
    cat >> "$AUDIT_LOG" <<EOF

### Friction Point $FRICTION_COUNT: $title

**Timestamp:** $TIMESTAMP  
**Command Executed:** \`$command\`  
**Error Message:**
\`\`\`
$(cat "$error_file" 2>/dev/null || echo "See console output above")
\`\`\`

**Root Cause:** [TO BE FILLED - Describe why this happened]

**Manual Fix Required:**
$fix_description

**Time to Fix:** $time_to_fix

**Detection Signal:**
$detection

**Auto-Recovery Action:**
$recovery

**Frustration Level:** 🔥🔥 Medium (adjust as needed)  
**Auto-Recovery Priority:** $priority

---

EOF
}

echo "Step 1: Cloning repository..."
CLONE_START=$(date +"%H:%M:%S")
git clone "$FORK_URL" "$AUDIT_DIR" > /tmp/clone-output.txt 2>&1
CLONE_EXIT=$?

if [ $CLONE_EXIT -ne 0 ]; then
    echo "❌ Clone failed!"
    cat /tmp/clone-output.txt
    log_friction \
        "Repository Clone Failed" \
        "git clone $FORK_URL" \
        "/tmp/clone-output.txt" \
        "1. Check repository URL\n2. Verify GitHub authentication\n3. Check network connectivity" \
        "1-2 minutes" \
        "- Git clone exit code != 0\n- Error message contains 'fatal'" \
        "1. Verify URL format\n2. Check gh auth status\n3. Retry with authentication" \
        "P0"
    exit 1
fi

cd "$AUDIT_DIR" || exit 1
echo "✅ Repository cloned to $AUDIT_DIR"
echo ""

echo "Step 2: Initial inspection..."
echo "Directory structure:"
ls -la | head -20
echo ""
echo "README preview:"
head -20 README.md 2>/dev/null || echo "No README.md found"
echo ""

echo "Step 3: Attempting naive startup (docker-compose up)..."
ATTEMPT1_TIME=$(date +"%H:%M:%S")
timeout 10 docker-compose up > /tmp/attempt1-output.txt 2>&1
ATTEMPT1_EXIT=$?

if [ $ATTEMPT1_EXIT -ne 0 ]; then
    echo "❌ First attempt failed (expected)"
    head -30 /tmp/attempt1-output.txt
    
    # Check if Docker is the issue
    if grep -q "Cannot connect to the Docker daemon" /tmp/attempt1-output.txt; then
        log_friction \
            "Docker Not Running" \
            "docker-compose up" \
            "/tmp/attempt1-output.txt" \
            "1. Open Docker Desktop application\n2. Wait ~30 seconds for Docker to start\n3. Verify with \`docker ps\`\n4. Retry \`docker-compose up\`" \
            "2 minutes" \
            "- Exit code from \`docker ps\` is non-zero\n- Error message contains 'Cannot connect to the Docker daemon'" \
            "1. Detect: Run \`docker ps\`, check exit code\n2. Recover: Execute \`open -a Docker\` (macOS) or equivalent\n3. Wait: Poll \`docker ps\` until successful (max 60s)\n4. Verify: \`docker ps\` returns 0\n5. Retry: Original command" \
            "P0"
    fi
fi
echo ""

echo "Step 4: Checking for .env file..."
if [ ! -f ".env" ]; then
    echo "❌ .env file missing"
    log_friction \
        "Missing .env File" \
        "docker-compose up (implicit .env check)" \
        "/dev/null" \
        "1. Check if .env.example exists\n2. Copy .env.example to .env\n3. Review and populate required variables\n4. Retry startup" \
        "1-2 minutes" \
        "- File .env does not exist\n- .env.example exists\n- Error messages about missing environment variables" \
        "1. Detect: Check if .env exists, .env.example exists\n2. Recover: Copy .env.example to .env\n3. Populate: Set sensible defaults for common variables\n4. Verify: .env file exists and is readable" \
        "P0"
else
    echo "✅ .env file exists"
fi
echo ""

echo "Step 5: Checking Docker status..."
docker ps > /tmp/docker-check.txt 2>&1
DOCKER_EXIT=$?
if [ $DOCKER_EXIT -ne 0 ]; then
    echo "❌ Docker is not running"
    cat /tmp/docker-check.txt
else
    echo "✅ Docker is running"
fi
echo ""

echo "Step 6: Checking for port conflicts..."
for PORT in 8000 3000 5432 6379; do
    if lsof -i :$PORT > /dev/null 2>&1; then
        echo "⚠️  Port $PORT is in use"
        lsof -i :$PORT | head -5
        log_friction \
            "Port $PORT Already in Use" \
            "docker-compose up (port binding)" \
            "/dev/null" \
            "1. Identify process using port: \`lsof -i :$PORT\`\n2. Kill process or use alternative port\n3. Update configuration if needed\n4. Retry startup" \
            "2-3 minutes" \
            "- Error message contains 'Address already in use'\n- Error message contains 'port $PORT'\n- \`lsof -i :$PORT\` returns results" \
            "1. Detect: Parse error for port number\n2. Identify: Run \`lsof -i :PORT\` to find process\n3. Recover: Kill process (with confirmation) or use alt port\n4. Update: Modify config to use new port if needed\n5. Verify: Port is now available" \
            "P1"
    else
        echo "✅ Port $PORT is available"
    fi
done
echo ""

echo "Step 7: Checking Python/Node versions..."
if [ -f "pyproject.toml" ] || [ -f "requirements.txt" ]; then
    echo "Python version:"
    python3 --version 2>&1
    if [ -f "pyproject.toml" ]; then
        echo "Required Python version (from pyproject.toml):"
        grep -A 2 "python" pyproject.toml | head -3
    fi
fi

if [ -f "package.json" ]; then
    echo "Node version:"
    node --version 2>&1
    echo "Required Node version (from package.json):"
    grep -A 2 "engines" package.json | head -3 || echo "No engine requirements specified"
fi
echo ""

echo "=========================================="
echo "Audit Phase 1 Complete"
echo "=========================================="
echo ""
echo "Friction points documented: $FRICTION_COUNT"
echo "Audit log: $AUDIT_LOG"
echo ""
echo "Next steps:"
echo "1. Review the audit log at: $AUDIT_LOG"
echo "2. Fill in [TO BE FILLED] sections based on your experience"
echo "3. Add any additional friction points you encountered"
echo "4. Update the summary section with totals"
echo "5. Commit the friction document"
echo "6. Proceed to T4.4 (Identify Five Auto-Recovery Targets)"
echo ""
echo "Audit directory preserved at: $AUDIT_DIR"
echo "You can continue manual testing there if needed"
echo ""

# Append footer to audit log
cat >> "$AUDIT_LOG" <<EOF

## Patterns Identified

[TO BE FILLED - Identify common patterns across friction points]

1. **Service Dependencies:** [Description]
2. **Configuration Files:** [Description]
3. **Version Requirements:** [Description]
4. **Port Management:** [Description]

---

## Recommendations for Auto-Recovery

[TO BE FILLED - Based on patterns identified]

1. **Pre-flight Checks:** [Description]
2. **Smart Defaults:** [Description]
3. **Retry Logic:** [Description]
4. **Clear Feedback:** [Description]

---

## Time Breakdown

- Clone: [X] minutes
- First attempt: [X] minutes
- Fixing Docker: [X] minutes
- Fixing .env: [X] minutes
- Fixing database: [X] minutes
- Fixing ports: [X] minutes
- Final success: [X] minutes
- **Total:** [X] minutes

---

## Next Steps

- [ ] Fill in all [TO BE FILLED] sections
- [ ] Add any additional friction points encountered
- [ ] Update summary with final counts
- [ ] Commit this document
- [ ] Proceed to T4.4 (Identify Five Auto-Recovery Targets)

---

**Audit completed at:** $(date +"%H:%M:%S")  
**Total friction points documented:** $FRICTION_COUNT  
**Audit directory:** $AUDIT_DIR
EOF

echo "✅ Audit log created at: $AUDIT_LOG"
echo ""

# Made with Bob
