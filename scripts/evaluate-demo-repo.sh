#!/bin/bash
# =====================================================================
# Demo Repository Evaluation Script for T4.2
# Dev 4 - Infra / Bob Shell
# =====================================================================

set -e

REPO_URL="${1:-}"

if [ -z "$REPO_URL" ]; then
    echo "Usage: $0 <github-repo-url>"
    echo ""
    echo "Example:"
    echo "  $0 https://github.com/tiangolo/full-stack-fastapi-template"
    echo ""
    exit 1
fi

echo "=========================================="
echo "Demo Repository Evaluation - T4.2"
echo "=========================================="
echo ""
echo "Repository: $REPO_URL"
echo ""

# Extract repo name from URL
REPO_NAME=$(basename "$REPO_URL" .git)
TEMP_DIR="/tmp/onboardops-eval-$REPO_NAME"

# Clean up any previous evaluation
if [ -d "$TEMP_DIR" ]; then
    echo "Cleaning up previous evaluation..."
    rm -rf "$TEMP_DIR"
fi

echo "Step 1: Cloning repository for evaluation..."
git clone --depth 1 "$REPO_URL" "$TEMP_DIR" 2>&1 | grep -v "Cloning into" || true
cd "$TEMP_DIR"
echo "✅ Repository cloned"
echo ""

echo "Step 2: Analyzing repository structure..."
echo ""

# Count source files
echo "📊 File Statistics:"
PYTHON_FILES=$(find . -name "*.py" -not -path "*/\.*" -not -path "*/node_modules/*" -not -path "*/.venv/*" | wc -l | tr -d ' ')
JS_TS_FILES=$(find . \( -name "*.js" -o -name "*.ts" -o -name "*.tsx" -o -name "*.jsx" \) -not -path "*/\.*" -not -path "*/node_modules/*" | wc -l | tr -d ' ')
TEST_FILES=$(find . \( -name "test_*.py" -o -name "*_test.py" -o -name "*.test.ts" -o -name "*.test.js" -o -name "*.spec.ts" -o -name "*.spec.js" \) -not -path "*/\.*" -not -path "*/node_modules/*" | wc -l | tr -d ' ')

echo "  Python files: $PYTHON_FILES"
echo "  JS/TS files: $JS_TS_FILES"
echo "  Test files: $TEST_FILES"
TOTAL_SOURCE=$((PYTHON_FILES + JS_TS_FILES))
echo "  Total source files: $TOTAL_SOURCE"
echo ""

# Check for test suite
if [ "$TEST_FILES" -gt 0 ]; then
    echo "✅ Test suite present ($TEST_FILES test files)"
else
    echo "❌ No test suite found"
fi
echo ""

# Check size criteria
if [ "$TOTAL_SOURCE" -ge 10 ] && [ "$TOTAL_SOURCE" -le 30 ]; then
    echo "✅ Size criteria met (10-30 files): $TOTAL_SOURCE files"
elif [ "$TOTAL_SOURCE" -lt 10 ]; then
    echo "⚠️  Repository may be too small: $TOTAL_SOURCE files (target: 10-30)"
else
    echo "⚠️  Repository may be too large: $TOTAL_SOURCE files (target: 10-30)"
fi
echo ""

echo "Step 3: Identifying potential onboarding traps..."
echo ""

TRAP_COUNT=0

# Check for Docker
if [ -f "docker-compose.yml" ] || [ -f "docker-compose.yaml" ] || [ -f "Dockerfile" ]; then
    echo "🔥 Trap 1: Docker requirement detected"
    echo "   Files: $(ls docker-compose.y*ml Dockerfile 2>/dev/null | tr '\n' ' ')"
    TRAP_COUNT=$((TRAP_COUNT + 1))
fi

# Check for environment variables
if [ -f ".env.example" ] || [ -f ".env.template" ] || grep -r "os.getenv\|process.env" . --include="*.py" --include="*.js" --include="*.ts" 2>/dev/null | head -1 > /dev/null; then
    echo "🔥 Trap 2: Environment variable configuration required"
    if [ -f ".env.example" ]; then
        echo "   Found: .env.example"
    fi
    TRAP_COUNT=$((TRAP_COUNT + 1))
fi

# Check for database
if grep -r "postgresql\|mysql\|mongodb\|redis" . --include="*.py" --include="*.js" --include="*.ts" --include="*.yml" --include="*.yaml" 2>/dev/null | head -1 > /dev/null; then
    echo "🔥 Trap 3: Database dependency detected"
    TRAP_COUNT=$((TRAP_COUNT + 1))
fi

# Check for specific port usage
if grep -r "8000\|3000\|5000\|8080" . --include="*.py" --include="*.js" --include="*.ts" --include="*.json" 2>/dev/null | head -1 > /dev/null; then
    echo "🔥 Trap 4: Specific port requirements (potential conflicts)"
    TRAP_COUNT=$((TRAP_COUNT + 1))
fi

# Check for Node version requirements
if [ -f "package.json" ] && grep -q "engines" package.json 2>/dev/null; then
    echo "🔥 Trap 5: Node version requirement specified"
    grep -A 2 "engines" package.json | head -3
    TRAP_COUNT=$((TRAP_COUNT + 1))
fi

# Check for Python version requirements
if [ -f "pyproject.toml" ] && grep -q "python" pyproject.toml 2>/dev/null; then
    echo "🔥 Trap 6: Python version requirement specified"
    grep "python" pyproject.toml | head -1
    TRAP_COUNT=$((TRAP_COUNT + 1))
fi

echo ""
echo "Total potential traps identified: $TRAP_COUNT"
echo ""

echo "Step 4: README complexity analysis..."
if [ -f "README.md" ]; then
    README_LINES=$(wc -l < README.md | tr -d ' ')
    SETUP_SECTIONS=$(grep -i "install\|setup\|getting started\|quick start" README.md | wc -l | tr -d ' ')
    echo "  README length: $README_LINES lines"
    echo "  Setup sections: $SETUP_SECTIONS"
    
    if [ "$README_LINES" -gt 200 ]; then
        echo "  ⚠️  Long README may indicate complex setup"
    fi
else
    echo "  ❌ No README.md found"
fi
echo ""

echo "=========================================="
echo "Evaluation Summary"
echo "=========================================="
echo ""
echo "Repository: $REPO_NAME"
echo "Source files: $TOTAL_SOURCE"
echo "Test files: $TEST_FILES"
echo "Potential traps: $TRAP_COUNT"
echo ""

# Scoring
SCORE=0
if [ "$TOTAL_SOURCE" -ge 10 ] && [ "$TOTAL_SOURCE" -le 30 ]; then
    SCORE=$((SCORE + 30))
fi
if [ "$TEST_FILES" -gt 0 ]; then
    SCORE=$((SCORE + 30))
fi
SCORE=$((SCORE + TRAP_COUNT * 8))

echo "Demo Suitability Score: $SCORE/100"
echo ""

if [ "$SCORE" -ge 70 ]; then
    echo "✅ RECOMMENDED - Excellent demo candidate"
elif [ "$SCORE" -ge 50 ]; then
    echo "⚠️  ACCEPTABLE - Good demo candidate with some limitations"
else
    echo "❌ NOT RECOMMENDED - Consider alternative repository"
fi
echo ""

echo "Next steps:"
echo "1. Review the identified traps"
echo "2. Fork the repository if suitable"
echo "3. Document your choice in notes/demo-repo-choice.md"
echo "4. Proceed to T4.3 (Naive Onboarding Audit)"
echo ""

# Cleanup
cd - > /dev/null
echo "Cleaning up temporary clone..."
rm -rf "$TEMP_DIR"
echo "✅ Cleanup complete"
echo ""
echo "=========================================="

# Made with Bob
