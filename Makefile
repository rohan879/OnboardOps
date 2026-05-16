.PHONY: help install dev test demo export-bob-sessions lint clean

# Default target
help: ## Show this help message
	@echo "OnboardOps Makefile Targets:"
	@echo ""
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-20s\033[0m %s\n", $$1, $$2}'
	@echo ""
	@echo "Usage: make [target]"

install: ## Install all dependencies (backend + frontend)
	@echo "📦 Installing OnboardOps dependencies..."
	@echo ""
	@echo "→ Installing backend dependencies..."
	@if [ -d "backend" ]; then \
		cd backend && \
		python3 -m venv .venv && \
		. .venv/bin/activate && \
		pip install --upgrade pip && \
		pip install -r requirements.txt && \
		echo "✓ Backend dependencies installed"; \
	else \
		echo "⚠️  backend/ directory not found (Dev 2 task pending)"; \
	fi
	@echo ""
	@echo "→ Installing frontend dependencies..."
	@if [ -d "frontend" ]; then \
		cd frontend && \
		npm install && \
		echo "✓ Frontend dependencies installed"; \
	else \
		echo "⚠️  frontend/ directory not found (Dev 3 task pending)"; \
	fi
	@echo ""
	@echo "✅ Installation complete!"

dev: ## Start development servers (backend + frontend + telemetry)
	@echo "🚀 Starting OnboardOps development servers..."
	@echo ""
	@echo "→ Starting telemetry capture..."
	@if [ -f "scripts/telemetry.py" ]; then \
		python3 scripts/telemetry.py & \
		echo "✓ Telemetry started (PID: $$!)"; \
	else \
		echo "⚠️  scripts/telemetry.py not found"; \
	fi
	@echo ""
	@echo "→ Starting backend on http://localhost:8765..."
	@if [ -d "backend" ]; then \
		cd backend && \
		. .venv/bin/activate && \
		uvicorn app:app --port 8765 --reload & \
		echo "✓ Backend started (PID: $$!)"; \
	else \
		echo "⚠️  backend/ directory not found"; \
	fi
	@echo ""
	@echo "→ Starting frontend on http://localhost:3000..."
	@if [ -d "frontend" ]; then \
		cd frontend && \
		npm run dev & \
		echo "✓ Frontend started (PID: $$!)"; \
	else \
		echo "⚠️  frontend/ directory not found"; \
	fi
	@echo ""
	@echo "✅ Development servers running!"
	@echo "   Telemetry: Capturing to .onboardops/sessions/"
	@echo "   Backend:  http://localhost:8765"
	@echo "   Frontend: http://localhost:3000"
	@echo "   Dashboard: http://localhost:3000"
	@echo ""
	@echo "Press Ctrl+C to stop all servers"

test: ## Run all tests (backend + frontend)
	@echo "🧪 Running OnboardOps tests..."
	@echo ""
	@echo "→ Running backend tests..."
	@if [ -d "backend" ]; then \
		cd backend && \
		. .venv/bin/activate && \
		pytest -v --cov=. --cov-report=term-missing && \
		echo "✓ Backend tests passed"; \
	else \
		echo "⚠️  backend/ directory not found"; \
	fi
	@echo ""
	@echo "→ Running frontend tests..."
	@if [ -d "frontend" ]; then \
		cd frontend && \
		npm test && \
		echo "✓ Frontend tests passed"; \
	else \
		echo "⚠️  frontend/ directory not found"; \
	fi
	@echo ""
	@echo "✅ All tests passed!"

demo: ## Run the full end-to-end demo
	@echo "🎬 Running OnboardOps demo..."
	@echo ""
	@if [ -f "scripts/e2e-smoke.sh" ]; then \
		chmod +x scripts/e2e-smoke.sh && \
		./scripts/e2e-smoke.sh && \
		echo "✅ Demo completed successfully!"; \
	else \
		echo "⚠️  scripts/e2e-smoke.sh not found (Dev 4 task pending)"; \
		echo ""; \
		echo "Manual demo steps:"; \
		echo "  1. Start backend: cd backend && . .venv/bin/activate && uvicorn app:app --port 8765"; \
		echo "  2. Start frontend: cd frontend && npm run dev"; \
		echo "  3. Open Bob IDE and run: /onboard"; \
		echo "  4. Watch the dashboard at http://localhost:3000"; \
	fi

export-bob-sessions: ## Export and scrub all Bob IDE sessions
	@echo "📤 Exporting Bob IDE sessions..."
	@echo ""
	@if [ -f "scripts/export_bob_sessions.py" ]; then \
		python3 scripts/export_bob_sessions.py; \
	else \
		echo "❌ scripts/export_bob_sessions.py not found"; \
		echo ""; \
		echo "Manual export instructions:"; \
		echo "  1. In Bob IDE, export each task session as Markdown"; \
		echo "  2. Place in bob_sessions/devN/raw/"; \
		echo "  3. Run: python3 scripts/scrub.py <input> <output>"; \
		echo "  4. Rename to: NN_task-title.md"; \
		echo "  5. Add Bobcoin screenshot"; \
		exit 1; \
	fi

lint: ## Run linters on all code
	@echo "🔍 Linting OnboardOps codebase..."
	@echo ""
	@echo "→ Linting backend..."
	@if [ -d "backend" ]; then \
		cd backend && \
		. .venv/bin/activate && \
		ruff check . && \
		echo "✓ Backend linting passed"; \
	else \
		echo "⚠️  backend/ directory not found"; \
	fi
	@echo ""
	@echo "→ Linting frontend..."
	@if [ -d "frontend" ]; then \
		cd frontend && \
		npm run lint && \
		echo "✓ Frontend linting passed"; \
	else \
		echo "⚠️  frontend/ directory not found"; \
	fi
	@echo ""
	@echo "→ Checking markdown files..."
	@if command -v markdownlint >/dev/null 2>&1; then \
		markdownlint '**/*.md' --ignore node_modules --ignore .next || true; \
	else \
		echo "ℹ️  markdownlint not installed (optional)"; \
	fi
	@echo ""
	@echo "✅ Linting complete!"

clean: ## Clean build artifacts and caches
	@echo "🧹 Cleaning OnboardOps build artifacts..."
	@echo ""
	@echo "→ Cleaning Python caches..."
	@find . -type d -name "__pycache__" -exec rm -rf {} + 2>/dev/null || true
	@find . -type d -name ".pytest_cache" -exec rm -rf {} + 2>/dev/null || true
	@find . -type d -name ".ruff_cache" -exec rm -rf {} + 2>/dev/null || true
	@find . -type d -name "*.egg-info" -exec rm -rf {} + 2>/dev/null || true
	@find . -type f -name "*.pyc" -delete 2>/dev/null || true
	@find . -type f -name ".coverage" -delete 2>/dev/null || true
	@echo "✓ Python caches cleaned"
	@echo ""
	@echo "→ Cleaning backend virtualenv..."
	@if [ -d "backend/.venv" ]; then \
		rm -rf backend/.venv && \
		echo "✓ Backend virtualenv removed"; \
	else \
		echo "ℹ️  No backend virtualenv found"; \
	fi
	@echo ""
	@echo "→ Cleaning frontend build artifacts..."
	@if [ -d "frontend/.next" ]; then \
		rm -rf frontend/.next && \
		echo "✓ Next.js build cache removed"; \
	fi
	@if [ -d "frontend/node_modules" ]; then \
		rm -rf frontend/node_modules && \
		echo "✓ Node modules removed"; \
	fi
	@echo ""
	@echo "→ Cleaning logs..."
	@find . -type f -name "*.log" -delete 2>/dev/null || true
	@echo "✓ Log files removed"
	@echo ""
	@echo "✅ Cleanup complete!"
	@echo ""
	@echo "Run 'make install' to reinstall dependencies"

# Additional utility targets

check: lint test ## Run linters and tests (alias for CI)
	@echo "✅ All checks passed!"

dev-backend: ## Start only the backend server
	@echo "🚀 Starting backend on http://localhost:8765..."
	@cd backend && . .venv/bin/activate && uvicorn app:app --port 8765 --reload

dev-frontend: ## Start only the frontend server
	@echo "🚀 Starting frontend on http://localhost:3000..."
	@cd frontend && npm run dev

status: ## Show status of all components
	@echo "📊 OnboardOps Status"
	@echo ""
	@echo "Backend:"
	@if [ -d "backend" ]; then \
		echo "  ✓ Directory exists"; \
		if [ -d "backend/.venv" ]; then \
			echo "  ✓ Virtualenv exists"; \
		else \
			echo "  ✗ Virtualenv not found (run 'make install')"; \
		fi; \
	else \
		echo "  ✗ Directory not found (Dev 2 task pending)"; \
	fi
	@echo ""
	@echo "Frontend:"
	@if [ -d "frontend" ]; then \
		echo "  ✓ Directory exists"; \
		if [ -d "frontend/node_modules" ]; then \
			echo "  ✓ Dependencies installed"; \
		else \
			echo "  ✗ Dependencies not installed (run 'make install')"; \
		fi; \
	else \
		echo "  ✗ Directory not found (Dev 3 task pending)"; \
	fi
	@echo ""
	@echo "Bob Configuration:"
	@if [ -d ".bob" ]; then \
		echo "  ✓ .bob/ directory exists"; \
		ls -1 .bob/modes/*.md 2>/dev/null | wc -l | xargs -I {} echo "  ✓ {} mode(s) configured"; \
		ls -1 .bob/skills/*.md 2>/dev/null | wc -l | xargs -I {} echo "  ✓ {} skill(s) configured"; \
	else \
		echo "  ✗ .bob/ directory not found (Dev 1 task pending)"; \
	fi
	@echo ""
	@echo "Scripts:"
	@if [ -f "scripts/bootstrap.sh" ]; then \
		echo "  ✓ bootstrap.sh exists"; \
	else \
		echo "  ✗ bootstrap.sh not found (Dev 4 task pending)"; \
	fi
	@if [ -f "scripts/e2e-smoke.sh" ]; then \
		echo "  ✓ e2e-smoke.sh exists"; \
	else \
		echo "  ✗ e2e-smoke.sh not found (Dev 4 task pending)"; \
	fi

# Version information
version: ## Show version information
	@echo "OnboardOps v1.0.0"
	@echo "IBM Bob Hackathon 2026"
	@echo ""
	@echo "Component versions:"
	@python3 --version 2>/dev/null || echo "Python: not found"
	@node --version 2>/dev/null || echo "Node: not found"
	@npm --version 2>/dev/null || echo "npm: not found"

# Made with Bob
