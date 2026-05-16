#!/bin/bash

# verify-idempotence.sh - T4.5 Idempotence Verification
# Verifies that bootstrap completes in <5s on healthy environment with zero mutations

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

echo -e "${BLUE}=== Bootstrap Idempotence Verification ===${NC}"
echo "Testing that bootstrap is idempotent on healthy environment"
echo ""

# Configuration
NUM_RUNS=5
MAX_TIME_SECONDS=5
RESULTS_FILE="/tmp/idempotence-results.json"

# Initialize results
echo "{\"runs\": [], \"summary\": {}}" > "$RESULTS_FILE"

# Function to capture git status
capture_git_status() {
    cd "$PROJECT_ROOT"
    git status --porcelain
}

# Function to compute file checksums
compute_checksums() {
    cd "$PROJECT_ROOT"
    find . -type f \
        -not -path "./.git/*" \
        -not -path "./node_modules/*" \
        -not -path "./.venv/*" \
        -not -path "./venv/*" \
        -not -path "*/__pycache__/*" \
        -not -path "*.pyc" \
        -not -path "/tmp/*" \
        -exec md5 {} \; 2>/dev/null | sort
}

echo -e "${BLUE}Step 1: Capture baseline state${NC}"
BASELINE_GIT=$(capture_git_status)
BASELINE_CHECKSUMS=$(compute_checksums)
echo "✓ Baseline captured"
echo ""

# Run bootstrap multiple times
echo -e "${BLUE}Step 2: Run bootstrap $NUM_RUNS times${NC}"
TOTAL_TIME=0
MAX_RUN_TIME=0
MIN_RUN_TIME=999999
ALL_PASSED=true

for i in $(seq 1 $NUM_RUNS); do
    echo -e "${YELLOW}Run $i/$NUM_RUNS${NC}"
    
    # Measure execution time
    START_TIME=$(date +%s.%N)
    
    # Run bootstrap (suppress output for cleaner display)
    if cd "$PROJECT_ROOT" && ./scripts/bootstrap.sh > /tmp/bootstrap-run-$i.log 2>&1; then
        END_TIME=$(date +%s.%N)
        DURATION=$(echo "$END_TIME - $START_TIME" | bc)
        
        # Check if under time limit
        TIME_CHECK=$(echo "$DURATION < $MAX_TIME_SECONDS" | bc)
        
        if [ "$TIME_CHECK" -eq 1 ]; then
            echo -e "  ${GREEN}✓ Completed in ${DURATION}s (under ${MAX_TIME_SECONDS}s limit)${NC}"
        else
            echo -e "  ${RED}✗ Completed in ${DURATION}s (exceeded ${MAX_TIME_SECONDS}s limit)${NC}"
            ALL_PASSED=false
        fi
        
        # Update statistics
        TOTAL_TIME=$(echo "$TOTAL_TIME + $DURATION" | bc)
        
        # Update max/min
        if (( $(echo "$DURATION > $MAX_RUN_TIME" | bc -l) )); then
            MAX_RUN_TIME=$DURATION
        fi
        if (( $(echo "$DURATION < $MIN_RUN_TIME" | bc -l) )); then
            MIN_RUN_TIME=$DURATION
        fi
        
        # Check for file mutations
        CURRENT_GIT=$(capture_git_status)
        if [ "$CURRENT_GIT" != "$BASELINE_GIT" ]; then
            echo -e "  ${RED}✗ Git status changed (file mutations detected)${NC}"
            echo "$CURRENT_GIT" | head -5
            ALL_PASSED=false
        else
            echo -e "  ${GREEN}✓ No git status changes${NC}"
        fi
        
        # Record result
        jq ".runs += [{
            \"run\": $i,
            \"duration\": $DURATION,
            \"passed\": $([ "$TIME_CHECK" -eq 1 ] && [ "$CURRENT_GIT" = "$BASELINE_GIT" ] && echo "true" || echo "false"),
            \"under_time_limit\": $([ "$TIME_CHECK" -eq 1 ] && echo "true" || echo "false"),
            \"no_mutations\": $([ "$CURRENT_GIT" = "$BASELINE_GIT" ] && echo "true" || echo "false")
        }]" "$RESULTS_FILE" > /tmp/results-temp.json && mv /tmp/results-temp.json "$RESULTS_FILE"
        
    else
        echo -e "  ${RED}✗ Bootstrap failed${NC}"
        ALL_PASSED=false
        
        # Record failure
        jq ".runs += [{
            \"run\": $i,
            \"duration\": 0,
            \"passed\": false,
            \"error\": \"bootstrap_failed\"
        }]" "$RESULTS_FILE" > /tmp/results-temp.json && mv /tmp/results-temp.json "$RESULTS_FILE"
    fi
    
    echo ""
done

# Calculate statistics
MEAN_TIME=$(echo "scale=3; $TOTAL_TIME / $NUM_RUNS" | bc)

echo -e "${BLUE}Step 3: Verify final state${NC}"
FINAL_GIT=$(capture_git_status)
FINAL_CHECKSUMS=$(compute_checksums)

if [ "$FINAL_GIT" = "$BASELINE_GIT" ]; then
    echo -e "${GREEN}✓ Git status unchanged after all runs${NC}"
else
    echo -e "${RED}✗ Git status changed${NC}"
    echo "Changed files:"
    echo "$FINAL_GIT"
    ALL_PASSED=false
fi

if [ "$FINAL_CHECKSUMS" = "$BASELINE_CHECKSUMS" ]; then
    echo -e "${GREEN}✓ File checksums unchanged${NC}"
else
    echo -e "${YELLOW}⚠ Some file checksums changed (may be timestamps/logs)${NC}"
fi

echo ""

# Summary
echo -e "${BLUE}=== Summary ===${NC}"
echo "Total runs: $NUM_RUNS"
echo "Mean time: ${MEAN_TIME}s"
echo "Min time: ${MIN_RUN_TIME}s"
echo "Max time: ${MAX_RUN_TIME}s"
echo "Time limit: ${MAX_TIME_SECONDS}s"

# Update summary in results file
jq ".summary = {
    \"total_runs\": $NUM_RUNS,
    \"mean_time\": $MEAN_TIME,
    \"min_time\": $MIN_RUN_TIME,
    \"max_time\": $MAX_RUN_TIME,
    \"time_limit\": $MAX_TIME_SECONDS,
    \"all_passed\": $ALL_PASSED
}" "$RESULTS_FILE" > /tmp/results-temp.json && mv /tmp/results-temp.json "$RESULTS_FILE"

echo ""
if [ "$ALL_PASSED" = true ]; then
    echo -e "${GREEN}✓ IDEMPOTENCE VERIFIED${NC}"
    echo "Bootstrap is idempotent: completes quickly with no mutations"
    exit 0
else
    echo -e "${RED}✗ IDEMPOTENCE VERIFICATION FAILED${NC}"
    echo "Bootstrap either exceeded time limit or caused file mutations"
    echo ""
    echo "Results saved to: $RESULTS_FILE"
    exit 1
fi

# Made with Bob
