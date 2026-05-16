#!/bin/bash
# =====================================================================
# OnboardOps Bootstrap Stress Test - Phase 3 T4.10
# Dev 4 - Infra / Bob Shell
# 
# Runs bootstrap 10 times sequentially with alternating failure modes:
# 1. clean, 2. port-blocked, 3. no-venv, 4. no-seed, 5. no-db,
# 6. wrong-Node, 7. clean, 8. port-blocked, 9. no-venv, 10. no-seed
# 
# Acceptance: All 10 runs succeed, mean time < 2 min, worst < 3 min
# =====================================================================

set -e

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
BOOTSTRAP_SCRIPT="$SCRIPT_DIR/bootstrap.sh"
RESULTS_FILE="/tmp/onboardops-stress-test-results.json"
LOG_DIR="/tmp/onboardops-stress-test-logs"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

# Test scenarios
declare -a SCENARIOS=(
    "clean"
    "port-blocked"
    "no-venv"
    "no-seed"
    "no-db"
    "wrong-node"
    "clean"
    "port-blocked"
    "no-venv"
    "no-seed"
)

# Results tracking
declare -a RESULTS=()
TOTAL_RUNS=10
SUCCESSFUL_RUNS=0
FAILED_RUNS=0
TOTAL_TIME=0

# =====================================================================
# Helper Functions
# =====================================================================

log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

# =====================================================================
# Scenario Setup Functions
# =====================================================================

setup_clean() {
    log_info "Setting up clean environment..."
    # Ensure everything is in good state
    return 0
}

setup_port_blocked() {
    log_info "Setting up port-blocked scenario..."
    # Start a dummy process on port 3000
    if ! lsof -i :3000 > /dev/null 2>&1; then
        python3 -m http.server 3000 > /dev/null 2>&1 &
        DUMMY_PID=$!
        sleep 2
        log_info "Started dummy process on port 3000 (PID: $DUMMY_PID)"
    else
        log_info "Port 3000 already in use"
    fi
}

setup_no_venv() {
    log_info "Setting up no-venv scenario..."
    # Remove virtualenv if it exists
    if [ -d "$PROJECT_ROOT/.venv" ]; then
        rm -rf "$PROJECT_ROOT/.venv"
        log_info "Removed .venv directory"
    fi
    if [ -d "$PROJECT_ROOT/venv" ]; then
        rm -rf "$PROJECT_ROOT/venv"
        log_info "Removed venv directory"
    fi
}

setup_no_seed() {
    log_info "Setting up no-seed scenario..."
    # This would require database manipulation
    # For now, we'll simulate by removing seed marker
    rm -f /tmp/onboardops-seed-applied 2>/dev/null || true
    log_info "Removed seed marker"
}

setup_no_db() {
    log_info "Setting up no-db scenario..."
    # Stop database if running
    if command -v docker-compose > /dev/null 2>&1; then
        cd "$PROJECT_ROOT" && docker-compose down > /dev/null 2>&1 || true
        log_info "Stopped database containers"
    fi
}

setup_wrong_node() {
    log_info "Setting up wrong-node scenario..."
    # This would require nvm manipulation
    # For now, we'll create a marker file to simulate
    echo "14.0.0" > /tmp/onboardops-wrong-node-version
    log_info "Simulated wrong Node version"
}

# =====================================================================
# Cleanup Functions
# =====================================================================

cleanup_scenario() {
    local scenario="$1"
    
    case "$scenario" in
        "port-blocked")
            # Kill dummy process on port 3000
            if [ -n "$DUMMY_PID" ]; then
                kill "$DUMMY_PID" 2>/dev/null || true
                log_info "Killed dummy process (PID: $DUMMY_PID)"
            fi
            # Also kill any other processes on port 3000
            lsof -ti :3000 2>/dev/null | xargs kill -9 2>/dev/null || true
            ;;
        "wrong-node")
            rm -f /tmp/onboardops-wrong-node-version 2>/dev/null || true
            ;;
    esac
}

# =====================================================================
# Test Execution
# =====================================================================

run_bootstrap_test() {
    local run_number=$1
    local scenario=$2
    local log_file="$LOG_DIR/run-${run_number}-${scenario}.log"
    
    echo ""
    echo -e "${CYAN}╔═══════════════════════════════════════════════════════╗${NC}"
    echo -e "${CYAN}║  Run #${run_number}/10: ${scenario}${NC}"
    echo -e "${CYAN}╚═══════════════════════════════════════════════════════╝${NC}"
    echo ""
    
    # Setup scenario
    case "$scenario" in
        "clean") setup_clean ;;
        "port-blocked") setup_port_blocked ;;
        "no-venv") setup_no_venv ;;
        "no-seed") setup_no_seed ;;
        "no-db") setup_no_db ;;
        "wrong-node") setup_wrong_node ;;
    esac
    
    # Run bootstrap with timing
    local start_time=$(date +%s)
    
    if bash "$BOOTSTRAP_SCRIPT" --auto-recover > "$log_file" 2>&1; then
        local end_time=$(date +%s)
        local duration=$((end_time - start_time))
        
        log_success "Run #${run_number} completed in ${duration}s"
        
        RESULTS+=("{\"run\":$run_number,\"scenario\":\"$scenario\",\"status\":\"success\",\"duration\":$duration}")
        SUCCESSFUL_RUNS=$((SUCCESSFUL_RUNS + 1))
        TOTAL_TIME=$((TOTAL_TIME + duration))
        
        # Cleanup
        cleanup_scenario "$scenario"
        
        return 0
    else
        local end_time=$(date +%s)
        local duration=$((end_time - start_time))
        
        log_error "Run #${run_number} failed after ${duration}s"
        log_error "See log: $log_file"
        
        RESULTS+=("{\"run\":$run_number,\"scenario\":\"$scenario\",\"status\":\"failed\",\"duration\":$duration}")
        FAILED_RUNS=$((FAILED_RUNS + 1))
        TOTAL_TIME=$((TOTAL_TIME + duration))
        
        # Cleanup
        cleanup_scenario "$scenario"
        
        return 1
    fi
}

# =====================================================================
# Main Execution
# =====================================================================

main() {
    echo -e "${CYAN}╔═══════════════════════════════════════════════════════╗${NC}"
    echo -e "${CYAN}║  OnboardOps Bootstrap Stress Test                    ║${NC}"
    echo -e "${CYAN}║  Phase 3 T4.10 - Dev 4                                ║${NC}"
    echo -e "${CYAN}╚═══════════════════════════════════════════════════════╝${NC}"
    echo ""
    
    log_info "Starting stress test with 10 sequential runs"
    log_info "Test scenarios: ${SCENARIOS[*]}"
    echo ""
    
    # Create log directory
    mkdir -p "$LOG_DIR"
    
    # Run all tests
    local start_time=$(date +%s)
    
    for i in $(seq 0 9); do
        local run_number=$((i + 1))
        local scenario="${SCENARIOS[$i]}"
        
        if ! run_bootstrap_test "$run_number" "$scenario"; then
            log_warn "Run #${run_number} failed, but continuing..."
        fi
        
        # Brief pause between runs
        if [ $run_number -lt 10 ]; then
            sleep 2
        fi
    done
    
    local end_time=$(date +%s)
    local total_duration=$((end_time - start_time))
    
    # Calculate statistics
    local mean_time=0
    if [ $SUCCESSFUL_RUNS -gt 0 ]; then
        mean_time=$((TOTAL_TIME / SUCCESSFUL_RUNS))
    fi
    
    # Find worst case (max duration)
    local worst_time=0
    for result in "${RESULTS[@]}"; do
        local duration=$(echo "$result" | grep -o '"duration":[0-9]*' | cut -d: -f2)
        if [ "$duration" -gt "$worst_time" ]; then
            worst_time=$duration
        fi
    done
    
    # Save results to JSON
    cat > "$RESULTS_FILE" <<EOF
{
  "test_name": "Bootstrap Stress Test",
  "phase": "Phase 3 T4.10",
  "timestamp": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
  "total_runs": $TOTAL_RUNS,
  "successful_runs": $SUCCESSFUL_RUNS,
  "failed_runs": $FAILED_RUNS,
  "total_duration_seconds": $total_duration,
  "mean_time_seconds": $mean_time,
  "worst_time_seconds": $worst_time,
  "results": [
    $(IFS=,; echo "${RESULTS[*]}")
  ]
}
EOF
    
    # Print summary
    echo ""
    echo -e "${CYAN}╔═══════════════════════════════════════════════════════╗${NC}"
    echo -e "${CYAN}║  Stress Test Summary                                  ║${NC}"
    echo -e "${CYAN}╚═══════════════════════════════════════════════════════╝${NC}"
    echo ""
    echo -e "${BLUE}Total Runs:${NC}       $TOTAL_RUNS"
    echo -e "${GREEN}Successful:${NC}       $SUCCESSFUL_RUNS"
    echo -e "${RED}Failed:${NC}           $FAILED_RUNS"
    echo -e "${BLUE}Total Duration:${NC}   ${total_duration}s"
    echo -e "${BLUE}Mean Time:${NC}        ${mean_time}s"
    echo -e "${BLUE}Worst Case:${NC}       ${worst_time}s"
    echo ""
    
    # Check acceptance criteria
    local passed=true
    
    if [ $SUCCESSFUL_RUNS -ne $TOTAL_RUNS ]; then
        log_error "❌ Not all runs succeeded ($SUCCESSFUL_RUNS/$TOTAL_RUNS)"
        passed=false
    else
        log_success "✓ All runs succeeded ($SUCCESSFUL_RUNS/$TOTAL_RUNS)"
    fi
    
    if [ $mean_time -ge 120 ]; then
        log_error "❌ Mean time exceeds 2 minutes (${mean_time}s)"
        passed=false
    else
        log_success "✓ Mean time under 2 minutes (${mean_time}s)"
    fi
    
    if [ $worst_time -ge 180 ]; then
        log_error "❌ Worst case exceeds 3 minutes (${worst_time}s)"
        passed=false
    else
        log_success "✓ Worst case under 3 minutes (${worst_time}s)"
    fi
    
    echo ""
    log_info "Results saved to: $RESULTS_FILE"
    log_info "Logs saved to: $LOG_DIR"
    echo ""
    
    if [ "$passed" = true ]; then
        echo -e "${GREEN}╔═══════════════════════════════════════════════════════╗${NC}"
        echo -e "${GREEN}║  ✓ STRESS TEST PASSED                                 ║${NC}"
        echo -e "${GREEN}╚═══════════════════════════════════════════════════════╝${NC}"
        return 0
    else
        echo -e "${RED}╔═══════════════════════════════════════════════════════╗${NC}"
        echo -e "${RED}║  ✗ STRESS TEST FAILED                                 ║${NC}"
        echo -e "${RED}╚═══════════════════════════════════════════════════════╝${NC}"
        return 1
    fi
}

# Run main function
main "$@"

# Made with Bob
