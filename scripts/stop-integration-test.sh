#!/bin/bash
# OnboardOps Phase 2 Integration Test - Stop Script

echo "🛑 Stopping OnboardOps Integration Test Services"
echo "==============================================="

# Check if we're in the right directory
if [ ! -f "AGENTS.md" ]; then
    echo "❌ Error: Please run this script from the OnboardOps repository root"
    exit 1
fi

# Create logs directory if it doesn't exist
mkdir -p logs

# Stop backend
if [ -f "logs/backend.pid" ]; then
    BACKEND_PID=$(cat logs/backend.pid)
    if ps -p $BACKEND_PID > /dev/null 2>&1; then
        echo "Stopping backend (PID: $BACKEND_PID)..."
        kill $BACKEND_PID
        rm logs/backend.pid
        echo "✅ Backend stopped"
    else
        echo "⚠️  Backend process not found"
        rm logs/backend.pid
    fi
else
    echo "⚠️  No backend PID file found"
fi

# Stop frontend
if [ -f "logs/frontend.pid" ]; then
    FRONTEND_PID=$(cat logs/frontend.pid)
    if ps -p $FRONTEND_PID > /dev/null 2>&1; then
        echo "Stopping frontend (PID: $FRONTEND_PID)..."
        kill $FRONTEND_PID
        rm logs/frontend.pid
        echo "✅ Frontend stopped"
    else
        echo "⚠️  Frontend process not found"
        rm logs/frontend.pid
    fi
else
    echo "⚠️  No frontend PID file found"
fi

# Kill any remaining processes on ports 8765 and 3000
echo ""
echo "Checking for remaining processes on ports 8765 and 3000..."

if lsof -ti:8765 > /dev/null 2>&1; then
    echo "Killing remaining processes on port 8765..."
    lsof -ti:8765 | xargs kill -9 2>/dev/null || true
fi

if lsof -ti:3000 > /dev/null 2>&1; then
    echo "Killing remaining processes on port 3000..."
    lsof -ti:3000 | xargs kill -9 2>/dev/null || true
fi

echo ""
echo "✅ All services stopped"
echo ""
echo "📊 Logs preserved in:"
echo "   logs/backend.log"
echo "   logs/frontend.log"

# Made with Bob
