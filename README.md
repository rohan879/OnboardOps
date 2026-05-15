# OnboardOps

![OnboardOps Cover](docs/cover.png)

**The 10-Minute Repo Whisperer** — AI-powered onboarding that turns repository strangers into confident contributors in under 10 minutes.

[![CI Status](https://github.com/YOUR-ORG/onboardops/workflows/OnboardOps%20CI/badge.svg)](https://github.com/YOUR-ORG/onboardops/actions)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

---

## The Problem

Every developer has been there: you join a new team, clone an unfamiliar repository, and face the onboarding gauntlet:

- 🕐 **Hours lost** reading outdated or incomplete documentation
- 🔍 **Critical context buried** in commit history, not docs
- 🎯 **First PRs are intimidating** without knowing where to start
- 🔄 **Setup failures** that require senior developer intervention
- ❓ **No verification** that you actually understand the codebase

Traditional onboarding takes **days or weeks**. OnboardOps compresses it into **one cup of coffee**.

---

## The Solution

OnboardOps is an AI-powered onboarding copilot built on IBM's Bob IDE. It combines:

1. **Socratic Guidance** — Bob's custom `/onboard` mode asks questions instead of giving answers
2. **Institutional Knowledge** — Extract context from git history, not stale docs
3. **Auto-Recovery** — Self-healing setup that fixes common failures automatically
4. **Certification** — Prove you understand before you commit
5. **Starter PR** — Generate your first contribution in minutes

---

## 60-Second Demo

🎥 **[Watch the demo video](https://youtu.be/PLACEHOLDER)** (Coming soon)

![Demo GIF](docs/demo.gif)

**What you'll see:**
- 0:00 — Fresh clone, zero context
- 0:03 — Type `/onboard`, stopwatch starts
- 0:08 — Bob maps the codebase in real-time
- 0:25 — Bootstrap auto-recovers from port conflict
- 0:35 — Socratic certification (3 questions)
- 0:48 — Starter PR generated and tested
- 0:55 — PR opens on GitHub: "Onboarded: 9 min 12 sec"

**Result:** Six months of onboarding, compressed into one cup of coffee.

---

## Quick Start

### Prerequisites

- **Bob IDE** — [Install from IBM](https://ibm.com/bob) (hackathon team account required)
- **Node.js** 20+ — [Download](https://nodejs.org/)
- **Python** 3.11+ — [Download](https://python.org/)
- **Git** & **GitHub CLI** — [Install gh](https://cli.github.com/)

### Installation

```bash
# Clone the repository
git clone https://github.com/YOUR-ORG/onboardops.git
cd onboardops

# Install all dependencies (backend + frontend)
make install

# Start development servers
make dev
```

The backend will start on `http://localhost:8765` and the frontend on `http://localhost:3000`.

### Run the Demo

```bash
# Execute the full end-to-end demo
make demo
```

This will:
1. Start the backend MCP server
2. Launch the dashboard
3. Run the bootstrap engine on the demo repository
4. Execute a complete onboarding flow
5. Generate a starter PR

---

## Architecture

![Architecture Diagram](docs/architecture.png)

### Components

#### 1. Bob Custom Mode (`/onboard`)
- **Purpose:** Socratic onboarding guide that asks questions instead of giving answers
- **Location:** `.bob/modes/onboard.md`
- **Skills:** Repo Cartography, Certification
- **MCP Server:** Institutional Knowledge

#### 2. Institutional Knowledge MCP Server
- **Purpose:** Extract context from git history via 7 specialized tools
- **Tech Stack:** FastAPI, GitPython, WebSockets
- **Location:** `backend/`
- **Tools:**
  - `git_blame_summary` — Authorship statistics
  - `commit_frequency` — Temporal activity patterns
  - `recent_authors` — Active contributor identification
  - `pr_for_file` — Pull request history per file
  - `file_changelog` — Detailed change history
  - `rationale_for_commit` — Commit message analysis
  - `incident_for_file` — Bug/incident correlation

#### 3. Real-Time Dashboard
- **Purpose:** Visual progress tracking and certification interface
- **Tech Stack:** Next.js 14, Tailwind CSS, IBM Design System
- **Location:** `frontend/`
- **Features:**
  - Live stopwatch tracking onboarding time
  - 4-card cartography stepper
  - Real-time event stream
  - Certification panel with Socratic quiz

#### 4. Bootstrap Engine
- **Purpose:** Self-healing setup with auto-recovery
- **Tech Stack:** Bash, Bob Shell
- **Location:** `scripts/bootstrap.sh`
- **Auto-Recovery Patterns:**
  - Port conflicts
  - Node version mismatches
  - Missing virtualenvs
  - Missing seed data
  - Service failures

---

## Features

### F1: Custom Bob Mode
Activate with `/onboard` to enter Socratic onboarding mode. Bob guides you through the codebase by asking questions, not giving answers.

### F2: Repo Cartography (4 Stages)
1. **Dependency Graph** — Visual map of project dependencies
2. **Entry Points** — Where to start reading code
3. **Change Hotspots** — Most frequently modified files
4. **Project Conventions** — Coding standards and patterns

### F3: Bootstrap Engine
Self-healing setup that detects and auto-recovers from common failures:
- Kills processes on conflicting ports
- Switches Node versions via nvm
- Creates missing virtualenvs
- Runs seed scripts
- Starts required services

### F4: Institutional Knowledge MCP
7 specialized tools that extract context from git history:
- Who wrote this code and why?
- What files change together?
- Which commits fixed bugs in this file?
- What PRs touched this code?

### F5: Real-Time Dashboard
Track your onboarding progress live:
- Stopwatch showing elapsed time
- 4-card stepper for cartography stages
- Event stream showing MCP tool calls
- WebSocket connection with auto-reconnect

### F6: Socratic Certification
12-question quiz that verifies understanding:
- Questions generated from cartography insights
- Real-time grading with partial credit
- Must pass before generating starter PR
- Rubric-based evaluation

### F7: Starter PR Generator
AI-generated first contribution:
- Analyzes codebase for good first issues
- Generates code + tests
- Runs test suite
- Opens PR with "Onboarded: X min Y sec" timestamp

### F8: AGENTS.md Builder
Personalized onboarding artifact:
- Summarizes cartography findings
- Lists key conventions
- Identifies subject matter experts
- Provides quick reference for future work

### F9: Telemetry & Replay
Complete audit trail:
- Every Bob session exportable to JSON
- Dashboard state reconstructable from logs
- Replay mode for debugging
- Bobcoin usage tracking

---

## Tech Stack

### Bob IDE Integration
- **Custom Modes** — `.bob/modes/onboard.md`
- **Skills** — `.bob/skills/repo-cartography.md`, `.bob/skills/certification.md`
- **MCP Binding** — `.bob/mcp.json` (project-scoped)
- **Bob Shell** — Non-interactive piping for auto-recovery

### Backend
- **FastAPI** — REST API and WebSocket server
- **GitPython** — Git repository analysis
- **Pydantic** — Data validation and serialization
- **HTTPX** — GitHub API client
- **PyYAML** — Configuration parsing

### Frontend
- **Next.js 14** — React framework with App Router
- **Tailwind CSS** — Utility-first styling
- **IBM Design System** — Carbon colors and IBM Plex Sans
- **Zustand** — State management
- **Framer Motion** — Card emission animations
- **Lucide React** — Icon library

### Infrastructure
- **GitHub Actions** — CI/CD pipeline
- **Gitleaks** — Secret scanning
- **Ruff** — Python linting
- **ESLint** — JavaScript linting
- **Pytest** — Backend testing
- **Vitest** — Frontend testing

---

## Development

### Available Commands

```bash
make help              # Show all available targets
make install           # Install dependencies (backend + frontend)
make dev               # Start development servers
make test              # Run all tests
make demo              # Execute full demo sequence
make export-bob-sessions  # Export all Bob sessions
make lint              # Run linters on all code
make clean             # Clean build artifacts and caches
```

### Project Structure

```
onboardops/
├── .bob/                    # Bob IDE configuration
│   ├── modes/              # Custom modes
│   ├── skills/             # Skills (cartography, certification)
│   └── mcp.json            # MCP server binding
├── backend/                # FastAPI MCP server
│   ├── app.py             # Application entry point
│   ├── mcp/               # MCP tool implementations
│   ├── ws/                # WebSocket event bridge
│   └── tools/             # 7 git analysis tools
├── frontend/              # Next.js dashboard
│   ├── src/app/          # App Router pages
│   ├── src/components/   # React components
│   └── src/hooks/        # Custom hooks (WebSocket, etc.)
├── scripts/              # Automation scripts
│   ├── bootstrap.sh      # Bootstrap engine
│   └── e2e-smoke.sh      # End-to-end smoke test
├── docs/                 # Documentation
│   ├── demo-storyboard.md  # 60-second demo script
│   ├── architecture.png    # System architecture diagram
│   └── cover.png          # Cover image
├── bob_sessions/         # Exported Bob IDE sessions
│   ├── dev1/            # Bob Architect sessions
│   ├── dev2/            # Backend/MCP sessions
│   ├── dev3/            # Frontend sessions
│   ├── dev4/            # Infrastructure sessions
│   └── dev5/            # Integration sessions
└── .github/workflows/    # CI/CD pipelines
```

### Running Tests

```bash
# Backend tests
cd backend
source .venv/bin/activate
pytest

# Frontend tests
cd frontend
pnpm test

# All tests
make test
```

---

## Team

Built for the **IBM Bob Hackathon 2026** by a team of five developers:

- **Dev 1** — Bob Architect (Custom modes, skills, MCP configuration)
- **Dev 2** — Backend / MCP Engineer (Institutional Knowledge server)
- **Dev 3** — Frontend Engineer (Real-time dashboard)
- **Dev 4** — Infrastructure Engineer (Bootstrap engine, Bob Shell)
- **Dev 5** — Integration Engineer (Demo storyboard, documentation, CI)

---

## Contributing

This project was built in 48 hours for a hackathon. While we're not actively accepting contributions, feel free to:

1. **Fork** the repository
2. **Adapt** it for your own onboarding needs
3. **Share** your improvements with the community

---

## License

MIT License — See [LICENSE](LICENSE) for details.

---

## Acknowledgments

- **IBM Bob Team** — For creating an incredible AI-powered IDE
- **Lablab.ai** — For hosting the hackathon
- **NativelyAI** — For sponsorship and support
- **FastAPI Community** — For the demo repository that inspired this project

---

## Links

- 📺 **Demo Video:** [YouTube](https://youtu.be/PLACEHOLDER)
- 📊 **Slide Deck:** [Google Slides](https://docs.google.com/presentation/d/PLACEHOLDER)
- 🏆 **Hackathon Submission:** [Lablab.ai](https://lablab.ai/event/PLACEHOLDER)
- 💬 **Discussion:** [GitHub Discussions](https://github.com/YOUR-ORG/onboardops/discussions)

---

<div align="center">

**OnboardOps** — The 10-Minute Repo Whisperer

*Six months of onboarding, compressed into one cup of coffee.*

Built with ❤️ using IBM Bob IDE

</div>