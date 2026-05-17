# OnboardOps

![OnboardOps cover](docs/onboardops-cover%281%29.png)

**/onboard: a custom IBM Bob mode for live repository onboarding.**

OnboardOps turns IBM Bob into a 10-minute repo whisperer. A developer runs
`/onboard` inside Bob, and a custom Bob mode guides them through repository
cartography, practice questions, certification, and a first-PR path while a live
web dashboard mirrors the session in real time.

The project was built for the **IBM Bob Hackathon 2026**.

## What It Does

OnboardOps is not a static dashboard and it is not tied to one demo repository.
It is a Bob-native onboarding workflow:

1. The onboardee opens a repository in IBM Bob.
2. They run the custom `/onboard` command.
3. Bob activates the OnboardOps mode and skills.
4. Bob emits live events through the `institutional-knowledge` MCP server.
5. The dashboard renders dependency maps, entry points, hotspots, conventions,
   practice questions, certification results, and starter PR candidates.
6. The onboardee answers questions in the website.
7. Bob waits for those answers, grades understanding, and continues the flow.

The target repository is supplied per session by Bob, for example
`https://github.com/RSSNext/Folo`. It is not hardcoded into the deployment.

## Core Contribution

The center of the project is the custom IBM Bob mode:

```yaml
# .bob/modes/onboard.md
name: onboard
slash: /onboard
description: Start the OnboardOps Socratic onboarding flow
activates_skills:
  - repo-cartography
  - certification
  - starter-tasks
  - agents-md-recipe
requires_mcp: institutional-knowledge
stance: socratic
checkpoint_every: true
```

The `/onboard` mode drives the whole session. It maps the repository, asks
sample practice questions, waits for dashboard answers, runs certification, and
then proposes a safe first contribution path.

## Live Demo Flow

```text
IBM Bob IDE
  run /onboard
      |
      v
Custom OnboardOps Mode
  activates cartography, certification, starter-task skills
      |
      v
Institutional Knowledge MCP Server
  emits session_start, card_emit, question_ask, certification_grade events
      |
      v
WebSocket Dashboard
  renders the live onboarding session and sends answers back to Bob
```

## Dashboard Plates

### Plate I: Architecture Cartograph

Bob emits a dependency graph and the dashboard groups modules into readable
roles:

- **Orchestrators**: modules that call many others and coordinate product flows.
- **Bridges**: modules that connect layers or package boundaries.
- **Shared services**: modules many others depend on; important and risky to
  change.
- **Leaves**: edge modules with fewer dependents, often safer for first PRs.

### Plates II-IV: Reading Lenses

- **Entry points**: HTTP routes, CLI scripts, jobs, and stream consumers.
- **Change hotspots**: files with high recent commit activity, trend lines, and
  ownership context.
- **Project conventions**: naming, test placement, export patterns, store
  patterns, and other examples backed by real files.

### Questions

Practice questions appear first, then certification questions appear in the same
dashboard section. All questions are multiple choice. Bob waits for each website
answer before continuing.

### Starter PR

After certification, OnboardOps surfaces real starter issue candidates or a
bounded Bob-suggested task based on the repository map.

## Architecture

```text
IBM Bob IDE
  .bob/modes/onboard.md
  .bob/skills/
  .bob/mcp.json
        |
        | MCP
        v
FastAPI backend
  backend/app.py
  backend/tools/
  backend/ws/
        |
        | WebSocket
        v
Frontend dashboard
  frontend/src/app/page.tsx
```

## Repository Structure

```text
.bob/                  Bob mode, skills, commands, and MCP binding
backend/               FastAPI MCP server and WebSocket bridge
frontend/              Live dashboard
scripts/               Bootstrap, telemetry, demo, and export scripts
docs/                  Slides, images, design assets, and notes
bob_sessions/          Exported IBM Bob sessions for judging
notes/                 Development audits and project notes
```

## Local Development

### Prerequisites

- IBM Bob IDE
- Python 3.11+
- Node.js 20+
- Git

### Backend

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app:app --host 127.0.0.1 --port 8765 --reload
```

On Windows PowerShell:

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
python -m uvicorn app:app --host 127.0.0.1 --port 8765 --reload
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Open:

```text
http://localhost:3000
```

## Running `/onboard` In Bob

1. Start the backend and frontend.
2. Open the target repository in IBM Bob.
3. Make sure `.bob/mcp.json` points to the OnboardOps backend.
4. Run:

```text
/onboard
```

Bob will start a session, emit live dashboard events, ask practice questions,
run certification, and surface a starter PR path.

For local runs the backend is usually:

```text
http://127.0.0.1:8765
```

For deployed demos, point Bob's MCP config to the deployed backend URL.

## Deployment Notes

For hackathon judging, OnboardOps should be deployed as the platform, not as a
single hardcoded target repository.

Recommended Replit production shape:

```text
https://your-replit-app.replit.app/
  /                  frontend dashboard
  /events            WebSocket bridge
  /health            backend health
  /mcp               MCP server
  /mcp/invoke        MCP tool invocation
```

Set only generic secrets:

```env
ONBOARDOPS_GITHUB_TOKEN=optional_github_token_for_api_budget
```

Do not set these in production unless running a fixed local demo:

```env
ONBOARDOPS_DEMO_REPO
ONBOARDOPS_DEMO_REPO_PATH
NEXT_PUBLIC_REPOSITORY_URL
```

The target repo should come from `session_start.repository_url`.

## Testing

Backend:

```bash
cd backend
pytest
```

Frontend:

```bash
cd frontend
npm run lint
npm run typecheck
npm run build
```

## IBM Bob Report

Submission reviewers should be able to inspect the Bob-assisted development
sessions. Exported IBM Bob sessions belong in:

```text
bob_sessions/
```

If a final report is exported as a PDF or Markdown bundle, place it under:

```text
docs/bob-report/
```

## Tech Stack

- IBM Bob custom mode, skills, slash command, checkpoints, and MCP binding
- FastAPI backend
- WebSocket event bridge
- GitPython and GitHub API powered repository analysis
- Next.js dashboard
- IBM Carbon-inspired visual system
- Zustand, Framer Motion, and Lucide icons

## Team

Built by Manush, Rohan, Dhruv, Varun, and Vraj for the IBM Bob Hackathon 2026.

## Links

- Source: [github.com/rohan879/OnboardOps](https://github.com/rohan879/OnboardOps)
- Demo target example: [github.com/RSSNext/Folo](https://github.com/RSSNext/Folo)
- Hackathon: IBM Bob Hackathon 2026

## License

MIT. See [LICENSE](LICENSE).

