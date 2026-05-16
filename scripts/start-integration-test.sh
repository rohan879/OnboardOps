#!/bin/bash
# OnboardOps Phase 2 Integration Test - Quick Start Script
# This script helps you start the backend and frontend for T1.3 testing

set -e

echo "🚀 OnboardOps Phase 2 Integration Test - Quick Start"
echo "=================================================="
echo ""

# Check if we're in the right directory
if [ ! -f "AGENTS.md" ]; then
    echo "❌ Error: Please run this script from the OnboardOps repository root"
    exit 1
fi

# Function to check if port is in use
check_port() {
    local port=$1
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1 ; then
        return 0
    else
        return 1
    fi
}

echo "📋 Pre-flight Checks"
echo "-------------------"

# Check Python
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 not found. Please install Python 3.11+"
    exit 1
fi
echo "✅ Python 3 found: $(python3 --version)"

# Check Node
if ! command -v node &> /dev/null; then
    echo "❌ Node.js not found. Please install Node.js 20+"
    exit 1
fi
echo "✅ Node.js found: $(node --version)"

# Check pnpm
if ! command -v pnpm &> /dev/null; then
    echo "⚠️  pnpm not found. Installing..."
    npm install -g pnpm
fi
echo "✅ pnpm found: $(pnpm --version)"

echo ""
echo "🔧 Setting Up Backend"
echo "--------------------"

# Backend setup
cd backend

if [ ! -d ".venv" ]; then
    echo "Creating Python virtual environment..."
    python3 -m venv .venv
fi

echo "Activating virtual environment..."
source .venv/bin/activate || source .venv/Scripts/activate

echo "Installing backend dependencies..."
pip install -q -r requirements.txt

echo "✅ Backend ready"
cd ..

echo ""
echo "🎨 Setting Up Frontend"
echo "---------------------"

cd frontend

if [ ! -d "node_modules" ]; then
    echo "Installing frontend dependencies..."
    pnpm install
fi

echo "✅ Frontend ready"
cd ..

echo ""
echo "🚦 Starting Services"
echo "-------------------"

# Check if ports are already in use
if check_port 8765; then
    echo "⚠️  Port 8765 already in use (backend). Skipping backend start."
    BACKEND_RUNNING=true
else
    echo "Starting backend on port 8765..."
    cd backend
    source .venv/bin/activate || source .venv/Scripts/activate
    uvicorn app:app --port 8765 --reload > ../logs/backend.log 2>&1 &
    BACKEND_PID=$!
    echo "✅ Backend started (PID: $BACKEND_PID)"
    cd ..
    BACKEND_RUNNING=false
fi

if check_port 3000; then
    echo "⚠️  Port 3000 already in use (frontend). Skipping frontend start."
    FRONTEND_RUNNING=true
else
    echo "Starting frontend on port 3000..."
    cd frontend
    pnpm dev > ../logs/frontend.log 2>&1 &
    FRONTEND_PID=$!
    echo "✅ Frontend started (PID: $FRONTEND_PID)"
    cd ..
    FRONTEND_RUNNING=false
fi

echo ""
echo "⏳ Waiting for services to be ready..."
sleep 5

# Test backend health
echo "Testing backend health..."
if curl -s http://127.0.0.1:8765/health | grep -q "ok"; then
    echo "✅ Backend health check passed"
else
    echo "❌ Backend health check failed"
    echo "Check logs/backend.log for details"
fi

echo ""
echo "✨ Integration Test Environment Ready!"
echo "======================================"
echo ""
echo "📍 Services:"
echo "   Backend:  http://127.0.0.1:8765"
echo "   Frontend: http://localhost:3000"
echo ""
echo "📝 Next Steps:"
echo "   1. Open the demo repository in Bob IDE"
echo "   2. Type /onboard in Bob's chat panel"
echo "   3. Follow the test plan in docs/phase2-integration-test-plan.md"
echo ""
echo "📊 Logs:"
echo "   Backend:  logs/backend.log"
echo "   Frontend: logs/frontend.log"
echo ""
echo "🛑 To stop services:"
echo "   ./scripts/stop-integration-test.sh"
echo ""

# Save PIDs for cleanup
if [ "$BACKEND_RUNNING" = false ]; then
    echo $BACKEND_PID > logs/backend.pid
fi
if [ "$FRONTEND_RUNNING" = false ]; then
    echo $FRONTEND_PID > logs/frontend.pid
fi

# Made with Bob
