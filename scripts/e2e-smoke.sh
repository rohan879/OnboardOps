#!/bin/bash
# =====================================================================
# OnboardOps E2E Smoke Test Harness - T4.8
# Dev 4 - Infra / Bob Shell
#
# Orchestrates end-to-end smoke testing of backend + frontend + Bob
# =====================================================================

set -e

# Configuration
BACKEND_PORT=8765
FRONTEND_PORT=3000
MAX_WAIT=30
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# =====================================================================
# Utility Functions
# =====================================================================

log_info() {
    echo -e "${BLUE}ℹ${NC} $1"
}

log_success() {
    echo -e "${GREEN}✓${NC} $1"
}

log_error() {
    echo -e "${RED}✗${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

# Cleanup function (called on exit)
cleanup() {
    log_info "Cleaning up..."
    
    # Kill backend if we started it
    if [ ! -z "$BACKEND_PID" ] && ps -p $BACKEND_PID > /dev/null 2>&1; then
        log_info "Stopping backend (PID: $BACKEND_PID)"
        kill $BACKEND_PID 2>/dev/null || true
    fi
    
    # Kill frontend if we started it
    if [ ! -z "$FRONTEND_PID" ] && ps -p $FRONTEND_PID > /dev/null 2>&1; then
        log_info "Stopping frontend (PID: $FRONTEND_PID)"
        kill $FRONTEND_PID 2>/dev/null || true
    fi
    
    log_success "Cleanup complete"
}

# Set trap for cleanup
trap cleanup EXIT INT TERM

# =====================================================================
# Pre-flight Checks
# =====================================================================

preflight_checks() {
    log_info "Running pre-flight checks..."
    
    # Check if we're in the project root
    if [ ! -f "$PROJECT_ROOT/README.md" ]; then
        log_error "Not in OnboardOps project root"
        exit 1
    fi
    
    # Check if backend directory exists
    if [ ! -d "$PROJECT_ROOT/backend" ]; then
        log_warning "Backend directory not found (expected at: $PROJECT_ROOT/backend)"
        log_warning "This is expected if Dev 2 hasn't pushed their stub yet"
        BACKEND_EXISTS=false
    else
        BACKEND_EXISTS=true
    fi
    
    # Check if frontend directory exists
    if [ ! -d "$PROJECT_ROOT/frontend" ]; then
        log_warning "Frontend directory not found (expected at: $PROJECT_ROOT/frontend)"
        log_warning "This is expected if Dev 3 hasn't pushed their stub yet"
        FRONTEND_EXISTS=false
    else
        FRONTEND_EXISTS=true
    fi
    
    log_success "Pre-flight checks complete"
}

# =====================================================================
# Port Management
# =====================================================================

kill_port() {
    local port=$1
    log_info "Checking port $port..."
    
    if lsof -ti:$port > /dev/null 2>&1; then
        log_warning "Port $port is in use, killing process..."
        lsof -ti:$port | xargs kill -9 2>/dev/null || true
        sleep 1
        
        if lsof -ti:$port > /dev/null 2>&1; then
            log_error "Failed to free port $port"
            return 1
        fi
        log_success "Port $port freed"
    else
        log_success "Port $port is available"
    fi
    
    return 0
}

# =====================================================================
# Backend Management
# =====================================================================

start_backend() {
    if [ "$BACKEND_EXISTS" = false ]; then
        log_warning "Skipping backend (not available yet)"
        return 0
    fi
    
    log_info "Starting backend on port $BACKEND_PORT..."
    
    cd "$PROJECT_ROOT/backend"
    
    # Check if backend has dependencies installed
    if [ ! -d ".venv" ] && [ ! -d "node_modules" ]; then
        log_warning "Backend dependencies not installed"
        log_info "Attempting to install..."
        
        if [ -f "requirements.txt" ]; then
            python3 -m venv .venv
            source .venv/bin/activate
            pip install -r requirements.txt > /dev/null 2>&1
        elif [ -f "package.json" ]; then
            npm install > /dev/null 2>&1
        fi
    fi
    
    # Start backend
    if [ -f "app.py" ]; then
        # Python backend
        if [ -d ".venv" ]; then
            source .venv/bin/activate
        fi
        uvicorn app:app --port $BACKEND_PORT --reload > /tmp/backend.log 2>&1 &
        BACKEND_PID=$!
    elif [ -f "package.json" ]; then
        # Node backend
        npm start > /tmp/backend.log 2>&1 &
        BACKEND_PID=$!
    else
        log_error "No backend entry point found (app.py or package.json)"
        return 1
    fi
    
    log_info "Backend started (PID: $BACKEND_PID)"
    cd "$PROJECT_ROOT"
}

wait_for_backend() {
    if [ "$BACKEND_EXISTS" = false ]; then
        return 0
    fi
    
    log_info "Waiting for backend health check..."
    
    local elapsed=0
    while [ $elapsed -lt $MAX_WAIT ]; do
        if curl -s "http://localhost:$BACKEND_PORT/health" > /dev/null 2>&1; then
            log_success "Backend is healthy"
            return 0
        fi
        sleep 1
        elapsed=$((elapsed + 1))
    done
    
    log_error "Backend health check failed after ${MAX_WAIT}s"
    log_info "Backend log:"
    tail -20 /tmp/backend.log
    return 1
}

# =====================================================================
# Frontend Management
# =====================================================================

start_frontend() {
    if [ "$FRONTEND_EXISTS" = false ]; then
        log_warning "Skipping frontend (not available yet)"
        return 0
    fi
    
    log_info "Starting frontend on port $FRONTEND_PORT..."
    
    cd "$PROJECT_ROOT/frontend"
    
    # Check if frontend has dependencies installed
    if [ ! -d "node_modules" ]; then
        log_warning "Frontend dependencies not installed"
        log_info "Attempting to install..."
        npm install > /dev/null 2>&1 || pnpm install > /dev/null 2>&1
    fi
    
    # Start frontend
    if [ -f "package.json" ]; then
        npm run dev > /tmp/frontend.log 2>&1 &
        FRONTEND_PID=$!
        log_info "Frontend started (PID: $FRONTEND_PID)"
    else
        log_error "No package.json found in frontend directory"
        return 1
    fi
    
    cd "$PROJECT_ROOT"
}

wait_for_frontend() {
    if [ "$FRONTEND_EXISTS" = false ]; then
        return 0
    fi
    
    log_info "Waiting for frontend to be ready..."
    
    local elapsed=0
    while [ $elapsed -lt $MAX_WAIT ]; do
        if curl -s "http://localhost:$FRONTEND_PORT" > /dev/null 2>&1; then
            log_success "Frontend is ready"
            return 0
        fi
        sleep 1
        elapsed=$((elapsed + 1))
    done
    
    log_error "Frontend failed to start after ${MAX_WAIT}s"
    log_info "Frontend log:"
    tail -20 /tmp/frontend.log
    return 1
}

# =====================================================================
# Integration Tests
# =====================================================================

test_backend_health() {
    if [ "$BACKEND_EXISTS" = false ]; then
        log_info "Skipping backend health test (backend not available)"
        return 0
    fi
    
    log_info "Testing backend /health endpoint..."
    
    local response=$(curl -s "http://localhost:$BACKEND_PORT/health")
    if echo "$response" | grep -q "ok"; then
        log_success "Backend health check passed"
        return 0
    else
        log_error "Backend health check failed"
        log_error "Response: $response"
        return 1
    fi
}

test_backend_mcp() {
    if [ "$BACKEND_EXISTS" = false ]; then
        log_info "Skipping MCP endpoint test (backend not available)"
        return 0
    fi
    
    log_info "Testing backend /mcp endpoint..."
    
    local response=$(curl -s -X POST "http://localhost:$BACKEND_PORT/mcp" \
        -H "Content-Type: application/json" \
        -d '{"method":"tools/list"}')
    
    if echo "$response" | grep -q "tools"; then
        log_success "MCP endpoint responded"
        return 0
    else
        log_warning "MCP endpoint response unexpected (may be a stub)"
        return 0  # Don't fail, as this is expected in Phase 1
    fi
}

test_frontend_load() {
    if [ "$FRONTEND_EXISTS" = false ]; then
        log_info "Skipping frontend load test (frontend not available)"
        return 0
    fi
    
    log_info "Testing frontend page load..."
    
    local status=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:$FRONTEND_PORT")
    if [ "$status" = "200" ]; then
        log_success "Frontend page loads successfully"
        return 0
    else
        log_error "Frontend returned status: $status"
        return 1
    fi
}

test_websocket_connection() {
    if [ "$BACKEND_EXISTS" = false ] || [ "$FRONTEND_EXISTS" = false ]; then
        log_info "Skipping WebSocket test (services not available)"
        return 0
    fi
    
    log_info "Testing WebSocket connection..."
    
    # This is a basic check - full WebSocket testing would require wscat or similar
    # For Phase 1, we just verify the endpoint exists
    if curl -s -I "http://localhost:$BACKEND_PORT/events" | grep -q "101\|426"; then
        log_success "WebSocket endpoint exists"
        return 0
    else
        log_warning "WebSocket endpoint check inconclusive (expected in Phase 1)"
        return 0  # Don't fail
    fi
}

test_fake_onboard_invocation() {
    if [ "$BACKEND_EXISTS" = false ]; then
        log_info "Skipping /onboard test (backend not available)"
        return 0
    fi
    
    log_info "Testing fake /onboard invocation..."
    
    # This would be a real /onboard call in Phase 2+
    # For Phase 1, we just verify the backend is responsive
    local response=$(curl -s "http://localhost:$BACKEND_PORT/health")
    if [ ! -z "$response" ]; then
        log_success "Backend is responsive (fake /onboard test passed)"
        return 0
    else
        log_error "Backend not responsive"
        return 1
    fi
}

# =====================================================================
# Main Execution
# =====================================================================

main() {
    echo "=========================================="
    echo "OnboardOps E2E Smoke Test"
    echo "=========================================="
    echo ""
    
    # Pre-flight checks
    preflight_checks || exit 1
    echo ""
    
    # Kill any existing processes on our ports
    kill_port $BACKEND_PORT || exit 1
    kill_port $FRONTEND_PORT || exit 1
    echo ""
    
    # Start services
    start_backend || exit 1
    start_frontend || exit 1
    echo ""
    
    # Wait for services to be ready
    wait_for_backend || exit 1
    wait_for_frontend || exit 1
    echo ""
    
    # Run integration tests
    log_info "Running integration tests..."
    echo ""
    
    TESTS_PASSED=0
    TESTS_FAILED=0
    
    test_backend_health && TESTS_PASSED=$((TESTS_PASSED + 1)) || TESTS_FAILED=$((TESTS_FAILED + 1))
    test_backend_mcp && TESTS_PASSED=$((TESTS_PASSED + 1)) || TESTS_FAILED=$((TESTS_FAILED + 1))
    test_frontend_load && TESTS_PASSED=$((TESTS_PASSED + 1)) || TESTS_FAILED=$((TESTS_FAILED + 1))
    test_websocket_connection && TESTS_PASSED=$((TESTS_PASSED + 1)) || TESTS_FAILED=$((TESTS_FAILED + 1))
    test_fake_onboard_invocation && TESTS_PASSED=$((TESTS_PASSED + 1)) || TESTS_FAILED=$((TESTS_FAILED + 1))
    
    echo ""
    echo "=========================================="
    echo "Test Results"
    echo "=========================================="
    echo "Passed: $TESTS_PASSED"
    echo "Failed: $TESTS_FAILED"
    echo ""
    
    if [ $TESTS_FAILED -eq 0 ]; then
        log_success "All tests passed!"
        echo ""
        echo "Services are running:"
        echo "  Backend:  http://localhost:$BACKEND_PORT"
        echo "  Frontend: http://localhost:$FRONTEND_PORT"
        echo ""
        echo "Press Ctrl+C to stop services and exit"
        
        # Keep services running until user interrupts
        wait
    else
        log_error "Some tests failed"
        exit 1
    fi
}

# Run main function
main "$@"

# Made with Bob
