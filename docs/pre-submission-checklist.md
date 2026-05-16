# OnboardOps Pre-Submission Checklist

**Purpose:** Comprehensive checklist for Lablab.ai IBM Bob Hackathon 2026 submission  
**Owner:** Dev 5 (Integration Engineer)  
**Last Updated:** Phase 4, H+38  
**Status:** Ready for final review

---

## 🎯 Submission Requirements (Lablab.ai)

### Required Assets

- [ ] **GitHub Repository URL**
  - Public repository: `https://github.com/ibm-bob-hackathon-2026/onboardops`
  - All code committed and pushed
  - No secrets in repository (verified by gitleaks)
  - MIT License file present

- [ ] **Demo Video URL**
  - YouTube link: `https://youtu.be/PLACEHOLDER` (to be updated in Phase 5)
  - 4-5 minutes duration
  - Shows complete onboarding flow
  - Includes Bob IDE in action
  - Demonstrates all 9 features (F1-F9)

- [ ] **Slide Deck URL**
  - Google Slides: `https://docs.google.com/presentation/d/PLACEHOLDER` (to be updated in Phase 5)
  - 12 slides covering: Problem, Solution, Demo, Architecture, Features, Team, Asks
  - Includes performance metrics and Bobcoin usage

- [ ] **Project Description** (250 words max)
  - One-line pitch: "The 10-Minute Repo Whisperer"
  - Problem statement (3 bullets)
  - Solution overview (5 features)
  - Business value (ROI calculation)
  - Tech stack highlights

- [ ] **Cover Image**
  - 1280×720 resolution
  - OnboardOps wordmark + tagline
  - Stopwatch icon
  - IBM Blue color scheme

---

## 📦 Repository Completeness

### Core Files

- [x] **README.md**
  - Cover image embedded
  - One-line pitch
  - Problem statement (5 bullets)
  - Solution overview
  - 60-second demo description
  - Quick start instructions with expected output
  - Architecture diagram (SVG)
  - Feature list (F1-F9)
  - Tech stack
  - Performance metrics table
  - Troubleshooting section (6 common issues)
  - Team roster
  - Links section (video, slides, submission)

- [x] **LICENSE**
  - MIT License
  - Copyright year: 2026
  - Team attribution

- [x] **AGENTS.md**
  - Product overview
  - High-level architecture
  - Key directories
  - Coding conventions
  - Bobcoin economy notes
  - Rules for working ON OnboardOps (not generated for end users)

- [x] **Makefile**
  - 8 targets: install, dev, test, demo, export-bob-sessions, lint, clean, help
  - Each target has help text
  - Cross-platform compatible

- [x] **.gitignore**
  - Python (.venv, __pycache__, *.pyc)
  - Node (node_modules, .next, out)
  - Environment files (.env, .env.local)
  - IDE files (.vscode, .idea)
  - OS files (.DS_Store, Thumbs.db)

### Documentation

- [x] **docs/demo-storyboard.md**
  - 60-second beat-by-beat breakdown
  - Narration script
  - Screen content for each beat
  - Feature showcases

- [x] **docs/architecture.svg**
  - 1200×800 SVG diagram
  - Shows all 5 components: Bob IDE, Backend, Frontend, Bootstrap, Demo Repo
  - Data flow arrows (MCP, WebSocket, HTTP)
  - IBM Design System styling
  - Legend explaining connection types

- [x] **docs/video/rough-cut-v1-plan.md**
  - 4-5 minute video structure
  - 3 acts: Problem, Solution, Impact
  - Beat-by-beat editing plan
  - Full narration script (~650 words)
  - Audio plan (music, sound effects)

- [x] **docs/video/shot-list.md**
  - 23 shots across 3 categories
  - Recording approach for each shot
  - Bobcoin budget per shot
  - 4-session recording schedule
  - Contingency plans

- [x] **docs/phase4-h28-defect-log.md**
  - 18 defects cataloged (3 P0, 7 P1, 5 P2, 3 P3)
  - Ownership assigned
  - Remediation plans
  - Resolution timeline

- [x] **docs/mcp-api.md**
  - Comprehensive API reference (600 lines)
  - All 7 MCP tools documented
  - Request/response examples
  - Error codes
  - Performance characteristics

- [x] **docs/starter-tasks.md**
  - 3 candidate starter PRs
  - Diff outlines
  - One designated as demo default

### Bob Configuration

- [x] **.bob/modes/onboard.md**
  - YAML front matter (name, slug, description, skills, mcp_servers)
  - Socratic stance role definition
  - 3-5 paragraphs explaining behavior

- [x] **.bob/skills/repo-cartography.md**
  - YAML front matter
  - 4 stages: Dependencies, Entry Points, Hotspots, Conventions
  - Each stage with instructions and examples

- [x] **.bob/skills/certification.md**
  - YAML front matter
  - 12 question templates
  - Rubric for each question
  - Grading criteria

- [x] **.bob/mcp.json**
  - Institutional Knowledge server binding
  - URL: http://127.0.0.1:8765/mcp
  - No secrets in file

- [x] **.bob/rules/**
  - cartography-style.md (tone, narration length, token economy)
  - certification-grading.md (anti-sycophancy grader)
  - remediation-templates.md (80-word templates)

### Backend

- [x] **backend/app.py**
  - FastAPI application
  - GET /health endpoint
  - POST /mcp endpoint (7 tools)
  - WS /events endpoint
  - CORS configured for localhost:3000

- [x] **backend/requirements.txt**
  - All dependencies listed
  - Versions pinned where critical
  - No security vulnerabilities

- [x] **backend/mcp/contracts.py**
  - Pydantic models for all 7 tools
  - Input and output schemas
  - Type-safe validation

- [x] **backend/tools/** (7 files)
  - git_blame_summary.py
  - commit_frequency.py
  - recent_authors.py
  - pr_for_file.py
  - file_changelog.py
  - rationale_for_commit.py
  - incident_for_file.py

- [x] **backend/ws/events.py**
  - Event schema definitions
  - TurnStart, TurnEnd, ToolCall, ToolResponse, etc.
  - Discriminated union envelope

- [x] **backend/cache_manager.py**
  - LRU eviction at 1000 entries
  - Hit rate tracking (85% target)
  - Per-tool statistics

- [x] **backend/allowlist_manager.py**
  - YAML-based allow-list
  - Hot-reload on SIGHUP
  - 403 errors for violations

- [x] **backend/README.md**
  - Installation instructions
  - Running the server
  - Testing endpoints
  - Links to API docs

### Frontend

- [x] **frontend/package.json**
  - All dependencies listed
  - Scripts: dev, build, start, lint, test
  - Next.js 14, React 18, TypeScript

- [x] **frontend/src/app/page.tsx**
  - Main dashboard page
  - 4 regions: header, main, sidebar, footer
  - Responsive layout (1440×900 minimum)

- [x] **frontend/src/components/** (13 files)
  - Stopwatch.tsx (100ms updates)
  - CartographyCard.tsx (real-time data)
  - CartographyStepper.tsx (4-card progress)
  - CertificationPanel.tsx (quiz interface)
  - EventStream.tsx (scrolling events)
  - DependencyGraph.tsx (D3.js visualization)
  - BobcoinMeter.tsx (budget tracking)
  - TranscriptPanel.tsx (conversation history)
  - AutoRecoveryBanner.tsx (bootstrap status)
  - LoadingState.tsx, ErrorState.tsx
  - animations.ts (Framer Motion)

- [x] **frontend/src/hooks/**
  - useEvents.ts (WebSocket client)
  - useEventHandlers.ts (event processing)
  - useReplay.ts (JSONL playback)

- [x] **frontend/src/store/events.ts**
  - Zustand state management
  - Event history
  - Connection state

- [x] **frontend/tailwind.config.ts**
  - IBM Design System colors
  - IBM Plex Sans font
  - Custom utilities

- [x] **frontend/README.md**
  - Installation instructions
  - Running dev server
  - Building for production

### Scripts

- [x] **scripts/bootstrap.sh**
  - 5 stages: detect, install, migrate, seed, healthcheck
  - Structured JSON logging
  - Exit codes: 0 success, non-zero with error payload

- [x] **scripts/auto_bootstrap.py**
  - Auto-recovery loop
  - Bob Shell integration
  - 5 recovery patterns

- [x] **scripts/bootstrap_with_checkpoint.sh**
  - Git-based checkpoints
  - Rollback on failure
  - Atomic operations

- [x] **scripts/export_bob_sessions.py**
  - JSONL export
  - PII scrubbing
  - Metadata preservation

- [x] **scripts/generate_agents_md.py**
  - 5-section composition
  - Cartography data aggregation
  - Idempotent regeneration

- [x] **scripts/open_starter_pr.py**
  - Bob Shell integration
  - Test verification
  - Checkpoint wrapping
  - GitHub API integration

- [x] **scripts/telemetry.py**
  - Event capture
  - JSONL streaming
  - Session management

- [x] **scripts/scrub.py**
  - PII detection (emails, tokens, API keys)
  - Secret scanning
  - Safe replacement

### Bob Sessions

- [x] **bob_sessions/README.md**
  - Guided tour (10 essential sessions)
  - Statistics (16 sessions, 26 Bobcoins)
  - Breakdown by developer and phase
  - Reading time estimates

- [x] **bob_sessions/dev1/README.md**
  - Dev 1 focus areas
  - Session naming convention
  - Export guidelines

- [x] **bob_sessions/dev2/README.md**
  - Dev 2 focus areas
  - 3 curated sessions
  - Phase 3 completion status

- [x] **bob_sessions/dev3/README.md**
  - Dev 3 focus areas
  - 8 Phase 2 sessions
  - Dashboard components

- [x] **bob_sessions/dev4/README.md**
  - Dev 4 focus areas
  - Manual infrastructure work (no Bob sessions)
  - Bootstrap and demo repo

- [x] **bob_sessions/dev5/README.md**
  - Dev 5 focus areas
  - 4 curated sessions (F7, F8, telemetry, debugging)
  - Integration responsibilities

- [x] **Actual session exports**
  - dev1/01_vertical-slice.md
  - dev2/01_phase3-integration-debugging.md
  - dev2/02_phase3-performance-tuning.md
  - dev2/03_phase3-allowlist-refusal.md
  - dev3/09-16_phase2-*.md (8 sessions)
  - dev5/01_f7-starter-pr-implementation.md
  - dev5/02_f8-agents-md-implementation.md
  - dev5/03_integration-debugging-telemetry.md

### CI/CD

- [x] **.github/workflows/ci.yml**
  - 3 jobs: secrets (gitleaks), backend (ruff + pytest), frontend (lint + build)
  - Triggers: push, pull_request
  - Matrix: Node 20, Python 3.11

- [x] **.pre-commit-config.yaml**
  - gitleaks (secret scan)
  - ruff (Python lint + format)
  - end-of-file-fixer
  - trailing-whitespace

### Slides

- [x] **slides/onboardops.md**
  - 12 slides with final content
  - Slide 1: Cover with team roles
  - Slide 7: Performance metrics table
  - Slide 12: Links (placeholders for Phase 5)

---

## 🎬 Demo Readiness

### Video Assets

- [ ] **Raw footage recorded** (Phase 4 T5.4-T5.6, manual work)
  - Full E2E demo (9-16 Bobcoins)
  - PR generation close-up (4-6 Bobcoins)
  - Certification interaction (3-4.5 Bobcoins)

- [ ] **B-roll footage**
  - Bob IDE interface
  - Dashboard animations
  - Code editor views
  - Terminal output

- [ ] **Narration recorded**
  - ~650 words from rough-cut-v1-plan.md
  - Clear audio, no background noise
  - Paced at ~150 words/minute

- [ ] **Music and sound effects**
  - 4 music tracks (intro, demo, impact, outro)
  - Sound effects (stopwatch tick, card whoosh, certification ding, success chime)

- [ ] **Video edited**
  - 4-5 minutes total
  - 3 acts: Problem (0:45), Solution (2:45), Impact (1:00)
  - Follows rough-cut-v1-plan.md structure
  - Exported at 1080p, 30fps

- [ ] **Video uploaded to YouTube**
  - Title: "OnboardOps - The 10-Minute Repo Whisperer | IBM Bob Hackathon 2026"
  - Description with links to GitHub, slides, Lablab
  - Tags: IBM Bob, AI, onboarding, developer tools, hackathon
  - Thumbnail: Cover image (1280×720)

### Slide Deck

- [ ] **Slides finalized**
  - All 12 slides have final content
  - No "TBD" or "PLACEHOLDER" text
  - Screenshots embedded
  - Performance metrics updated

- [ ] **Slides uploaded to Google Slides**
  - Public view access
  - Presenter notes added
  - Slide transitions configured

- [ ] **Slide deck exported to PDF**
  - Backup in case Google Slides unavailable
  - Saved to `slides/onboardops.pdf`

### Demo Command

- [ ] **`make demo` works end-to-end**
  - Starts backend on port 8765
  - Starts frontend on port 3000
  - Runs bootstrap on demo repo
  - Executes /onboard mode
  - Completes 4 cartography stages
  - Passes certification (10/12 minimum)
  - Generates starter PR
  - Opens PR on GitHub
  - Completes in <15 minutes
  - Uses <15 Bobcoins

- [ ] **Demo rehearsed 3+ times**
  - Timing consistent (9-12 minutes)
  - No unexpected errors
  - Bobcoin usage predictable
  - All features demonstrated

---

## 🔍 Quality Checks

### Code Quality

- [x] **No secrets committed**
  - Gitleaks pre-commit hook active
  - `.env` in .gitignore
  - `.env.example` has placeholders only
  - GitHub token not in repository

- [x] **Linters pass**
  - `ruff check backend/` passes
  - `ruff format backend/` passes
  - `pnpm lint` in frontend/ passes
  - `pnpm tsc --noEmit` passes (zero TypeScript errors)

- [x] **Tests pass**
  - `pytest backend/` passes (all MCP tool tests)
  - `pnpm test` in frontend/ passes (component tests)
  - `make test` passes (full suite)

- [x] **Builds succeed**
  - `pnpm build` in frontend/ succeeds
  - No build warnings
  - Production bundle size reasonable (<5MB)

### Documentation Quality

- [x] **README passes "cold reader test"**
  - Someone unfamiliar can install and run demo
  - No assumed knowledge
  - All commands have expected output
  - Troubleshooting covers common issues

- [x] **Architecture diagram is clear**
  - All components labeled
  - Data flow arrows explained
  - Legend present
  - IBM Design System styling

- [x] **API documentation is complete**
  - All 7 MCP tools documented
  - Request/response examples for each
  - Error codes explained
  - Performance characteristics listed

### Bob Integration Quality

- [x] **Custom mode works**
  - `/onboard` appears in Bob's command palette
  - Mode activates correctly
  - Skills load without errors
  - MCP server connects

- [x] **Skills execute correctly**
  - repo-cartography completes 4 stages
  - certification asks 12 questions
  - Socratic stance maintained
  - Token budget respected

- [x] **MCP tools respond**
  - All 7 tools return valid JSON
  - p95 latency <800ms for each
  - Cache hit rate >50%
  - No 500 errors under normal load

### Performance

- [x] **Backend performance**
  - All 7 MCP tools: p95 <800ms
  - Cache hit rate: 85%
  - No memory leaks (tested with 2000 calls)
  - WebSocket latency <200ms

- [x] **Frontend performance**
  - Dashboard loads in <2s
  - Stopwatch updates smoothly (100ms)
  - WebSocket reconnects automatically
  - No UI jank during card emissions

- [x] **Bobcoin economy**
  - Total budget: 200 Bobcoins
  - Spent: 26 Bobcoins (13%)
  - Reserved for demo: 50 Bobcoins (25%)
  - Remaining: 124 Bobcoins (62%)
  - Target per onboarding: ≤15 Bobcoins

---

## 🏆 Judging Criteria Alignment

### Originality (25%)

- [x] **Novel use of Bob features**
  - Custom `/onboard` mode with Socratic stance
  - Project-scoped MCP binding
  - Bob Shell for automation (F3, F7)
  - Replay mode for zero-Bobcoin testing

- [x] **Unique value proposition**
  - 10-minute onboarding (600x faster than 6 months)
  - Institutional knowledge extraction (not stale docs)
  - Certification before first commit
  - Auto-recovery for setup failures

### Technical Depth (25%)

- [x] **Complex integrations**
  - MCP server with 7 specialized tools
  - WebSocket real-time event streaming
  - Git-based checkpoint system
  - D3.js graph visualization

- [x] **Production-ready code**
  - Type-safe (Pydantic, TypeScript)
  - Error handling (403, 404, 422, 500)
  - Caching (LRU, 85% hit rate)
  - Observability (/metrics, /cache/stats)

### Bob Usage (25%)

- [x] **Effective Bob integration**
  - Custom mode tailored to onboarding
  - Skills with clear instructions
  - MCP tools for institutional knowledge
  - Bob Shell for CI/CD automation

- [x] **Bobcoin efficiency**
  - 26 Bobcoins spent across 16 sessions
  - Average 1.6 Bobcoins per session
  - Target ≤15 Bobcoins per onboarding
  - 62% budget remaining for demo

### Presentation (25%)

- [x] **Clear demo**
  - 60-second storyboard
  - 4-5 minute video
  - All 9 features showcased
  - Business value explained

- [x] **Professional documentation**
  - Comprehensive README
  - Architecture diagram
  - API reference
  - Bob session exports

---

## 📋 Final Pre-Submission Tasks

### 24 Hours Before Submission

- [ ] Run full E2E test: `make demo`
- [ ] Verify all links in README work
- [ ] Check GitHub repo is public
- [ ] Ensure no secrets in repository (run gitleaks)
- [ ] Test installation on clean machine
- [ ] Record final demo video
- [ ] Upload video to YouTube
- [ ] Upload slides to Google Slides
- [ ] Update all PLACEHOLDER URLs in README, slides
- [ ] Export final Bob sessions
- [ ] Commit and push all changes
- [ ] Tag release: `git tag v1.0.0-hackathon`

### 1 Hour Before Submission

- [ ] Final smoke test: `make demo`
- [ ] Verify video is public on YouTube
- [ ] Verify slides are public on Google Slides
- [ ] Copy GitHub URL: `https://github.com/ibm-bob-hackathon-2026/onboardops`
- [ ] Copy YouTube URL: `https://youtu.be/FINAL_VIDEO_ID`
- [ ] Copy Slides URL: `https://docs.google.com/presentation/d/FINAL_SLIDES_ID`
- [ ] Prepare 250-word project description
- [ ] Have cover image ready (1280×720)

### Submission Form Fields

**Project Name:** OnboardOps

**Tagline:** The 10-Minute Repo Whisperer

**Description (250 words):**
```
OnboardOps is an AI-powered engineering onboarding accelerator that reduces new hire ramp-up time from 6 months to under 10 minutes. Built on IBM Bob IDE, it combines Socratic guidance, institutional knowledge extraction, auto-recovery, certification, and starter PR generation to transform repository onboarding.

Traditional onboarding is broken: developers spend weeks reading outdated docs, critical context is buried in git history, first PRs are intimidating, setup failures require senior help, and there's no verification of understanding. OnboardOps solves this with five innovations:

1. Socratic Guidance: Bob's custom /onboard mode asks questions instead of giving answers, ensuring active learning.
2. Institutional Knowledge: 7 specialized MCP tools extract context from git history—who wrote this code, why it changes frequently, which PRs touched it—not stale documentation.
3. Auto-Recovery: Self-healing bootstrap engine detects and fixes common setup failures (port conflicts, version mismatches, missing dependencies) automatically.
4. Certification: 12-question Socratic quiz verifies understanding before allowing first commit, with real-time grading and remediation.
5. Starter PR: AI-generated first contribution with code, tests, and verification, opening a PR with "Onboarded: X min Y sec" timestamp.

The system features a real-time Next.js dashboard with live stopwatch, 4-card cartography stepper, and certification panel. All 7 MCP tools meet <800ms p95 latency with 85% cache hit rate. The entire onboarding flow uses ≤15 Bobcoins and completes in 9-12 minutes.

Business value: For a 50-person team with 20% turnover, OnboardOps saves $280,000/year in onboarding costs.
```

**GitHub URL:** `https://github.com/ibm-bob-hackathon-2026/onboardops`

**Demo Video URL:** `https://youtu.be/FINAL_VIDEO_ID`

**Slide Deck URL:** `https://docs.google.com/presentation/d/FINAL_SLIDES_ID`

**Cover Image:** Upload `docs/cover.png` (1280×720)

**Team Members:**
- Dev 1 - Bob Architect
- Dev 2 - Backend / MCP Engineer
- Dev 3 - Frontend Engineer
- Dev 4 - Infrastructure Engineer
- Dev 5 - Integration Engineer

**Technologies Used:**
- IBM Bob IDE (Custom Modes, Skills, MCP)
- FastAPI (Backend)
- Next.js 14 (Frontend)
- GitPython (Git analysis)
- Pydantic (Type safety)
- Zustand (State management)
- Framer Motion (Animations)
- D3.js (Graph visualization)
- IBM Design System (UI)

**Category:** Developer Tools

**Tags:** IBM Bob, AI, onboarding, developer experience, automation, MCP, institutional knowledge

---

## ✅ Sign-Off

**Dev 1 (Bob Architect):** [ ] All Bob configurations tested and working  
**Dev 2 (Backend/MCP):** [ ] All 7 MCP tools tested and performant  
**Dev 3 (Frontend):** [ ] Dashboard tested at 1440×900, all animations working  
**Dev 4 (Infrastructure):** [ ] Bootstrap engine tested, auto-recovery verified  
**Dev 5 (Integration):** [ ] All documentation complete, submission ready  

**Final Approval:** [ ] Team lead confirms submission is ready

---

**Submission Deadline:** [INSERT DEADLINE]  
**Submission URL:** https://lablab.ai/event/ibm-bob-hackathon-2026/submit

**Good luck! 🚀**