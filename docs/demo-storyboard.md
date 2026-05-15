# OnboardOps 60-Second Demo Storyboard

**Tagline:** "The 10-Minute Repo Whisperer"

**Purpose:** This frame-by-frame breakdown defines the exact 60-second sequence that anchors our final video and live presentation. Every beat specifies what's on screen, what the narrator says, what the user does, and which OnboardOps feature is being showcased.

---

## Beat-by-Beat Breakdown (60 seconds total)

### Beat 1: The Cold Start (0:00 - 0:03)
**Duration:** 3 seconds

**On Screen:**
- Split screen: Left = terminal with `git clone` command completing, Right = empty Bob IDE chat window
- Repository name visible: `full-stack-fastapi-template` (or selected demo repo)
- No prior context, no README open, completely fresh clone

**Narrator Says:**
> "New repository. 10,000 lines. Zero context. The clock starts now."

**User Does:**
- Nothing (establishing shot showing the challenge)

**Feature Showcased:**
- Problem statement: the intimidating reality of joining an unfamiliar codebase

---

### Beat 2: OnboardOps Activation (0:03 - 0:08)
**Duration:** 5 seconds

**On Screen:**
- User types `/onboard` in Bob IDE chat
- Dashboard appears on second monitor with stopwatch starting at 00:00.0
- Bob's custom mode indicator shows "Onboard Mode" active

**Narrator Says:**
> "One command. `/onboard`. Your AI copilot takes over."

**User Does:**
- Types `/onboard` and presses Enter
- Glances at dashboard as stopwatch begins

**Feature Showcased:**
- Custom Bob mode activation
- Real-time dashboard initialization
- Stopwatch begins tracking onboarding time

---

### Beat 3: First Cartography Card - Dependency Graph (0:08 - 0:15)
**Duration:** 7 seconds

**On Screen:**
- Bob's first message renders with greeting
- Card 1 animates in: "Dependency Graph" with visual tree showing FastAPI → SQLAlchemy → Alembic
- Dashboard event stream shows: `ToolCall: git_blame_summary`
- MCP server indicator lights up green

**Narrator Says:**
> "Bob maps the codebase in real-time. Dependencies, entry points, conventions—all extracted from git history."

**User Does:**
- Reads Bob's greeting
- Watches card animation

**Feature Showcased:**
- Repo Cartography Skill (Stage 1: Dependency Graph)
- MCP tool invocation (`git_blame_summary`)
- Real-time card emission to dashboard

---

### Beat 4: Cartography Cards 2-4 Stream In (0:15 - 0:25)
**Duration:** 10 seconds

**On Screen:**
- Card 2: "Entry Points" - highlights `main.py`, `app/api/routes/`, `tests/`
- Card 3: "Change Hotspots" - heatmap showing `app/models/user.py` (most modified)
- Card 4: "Project Conventions" - bullet list: "Uses Pydantic for validation", "Alembic for migrations", "Pytest for testing"
- Event stream shows three more tool calls: `commit_frequency`, `recent_authors`, `file_changelog`

**Narrator Says:**
> "Four cards. Thirty seconds. You now know more than the README could ever tell you."

**User Does:**
- Scrolls through cards in Bob chat
- Observes event stream activity on dashboard

**Feature Showcased:**
- Repo Cartography Skill (Stages 2-4)
- Multiple MCP tool orchestration
- Institutional Knowledge extraction from git history

---

### Beat 5: Bootstrap Auto-Recovery (0:25 - 0:35)
**Duration:** 10 seconds

**On Screen:**
- Terminal window shows bootstrap script running
- Error appears: `Error: Port 8000 already in use`
- Auto-recovery kicks in: `Detecting port conflict... Killing process 12345... Retrying...`
- Green checkmark: `✓ Health check passed`
- Dashboard shows "Bootstrap: Complete" status

**Narrator Says:**
> "Setup fails? OnboardOps auto-recovers. Port conflicts, missing dependencies—handled automatically."

**User Does:**
- Watches terminal output (no manual intervention needed)

**Feature Showcased:**
- Bootstrap Engine (F3)
- Auto-recovery from common setup failures
- Self-healing installation process

---

### Beat 6: Certification Quiz (0:35 - 0:48)
**Duration:** 13 seconds

**On Screen:**
- Certification panel slides in from right side of dashboard
- Three questions appear sequentially:
  1. "What ORM does this project use?" → User types: "SQLAlchemy" → ✓ Pass
  2. "Where are API routes defined?" → User types: "app/api/routes/" → ✓ Pass
  3. "What's the migration tool?" → User types: "Alembic" → ✓ Pass
- Dashboard certification score: 3/3 (100%)
- Panel turns green with "Certified" badge

**Narrator Says:**
> "Socratic certification. Three questions. Prove you understand before you commit."

**User Does:**
- Types answers to three questions
- Watches score update in real-time

**Feature Showcased:**
- Certification Skill (F8)
- Socratic questioning approach
- Real-time grading and feedback

---

### Beat 7: Starter PR Generation (0:48 - 0:55)
**Duration:** 7 seconds

**On Screen:**
- Bob message: "Generating your first contribution..."
- Terminal shows: `Running tests... ✓ All tests pass`
- GitHub PR URL appears in Bob chat: `https://github.com/.../pull/42`
- PR title visible: "Add test case for empty user query"
- PR description shows: "Onboarded: 9 min 12 sec"

**Narrator Says:**
> "Your first PR. Generated, tested, and ready to merge. Nine minutes from clone to contribution."

**User Does:**
- Clicks the PR URL

**Feature Showcased:**
- Starter PR Generator (F7)
- Automated test execution
- Time-stamped contribution proof

---

### Beat 8: The Payoff (0:55 - 1:00)
**Duration:** 5 seconds

**On Screen:**
- GitHub PR page loads showing the generated PR
- Stopwatch on dashboard shows: 09:12.4
- Camera pulls back to show both monitors
- Cut to OnboardOps wordmark with tagline

**Narrator Says:**
> "Six months of onboarding, compressed into one cup of coffee."

**User Does:**
- Smiles at camera (optional)

**Feature Showcased:**
- Complete end-to-end flow
- Measurable time savings
- Professional-quality output

---

## Technical Notes for Video Production

### Camera Setup
- **Primary angle:** Over-the-shoulder view showing both monitors
- **Secondary angle:** Close-up of hands typing (for `/onboard` command)
- **Tertiary angle:** Face reaction shot (for certification completion)

### Screen Recording Requirements
- **Left monitor:** Bob IDE (1920x1080 minimum)
- **Right monitor:** Dashboard (1920x1080 minimum)
- **Frame rate:** 60fps for smooth animations
- **Cursor highlighting:** Enabled for visibility

### Audio Requirements
- **Narrator voice:** Professional, energetic, clear diction
- **Background music:** Subtle, tech-forward, builds to climax at PR generation
- **Sound effects:** 
  - Stopwatch tick (subtle)
  - Card emission "whoosh"
  - Certification "ding" on correct answers
  - Success "chime" at PR generation

### Timing Checkpoints
- 0:00 - Cold start
- 0:08 - First card visible
- 0:25 - Bootstrap begins
- 0:35 - Certification starts
- 0:48 - PR generation begins
- 1:00 - Credits

**Total runtime:** Exactly 60 seconds (±1 second tolerance)

---

## Alignment with Features

| Beat | Time | Primary Feature | Secondary Feature |
|------|------|----------------|-------------------|
| 1 | 0:00-0:03 | Problem Statement | - |
| 2 | 0:03-0:08 | Custom Bob Mode (F1) | Dashboard (F9) |
| 3 | 0:08-0:15 | Repo Cartography (F2) | MCP Server (F4) |
| 4 | 0:15-0:25 | Repo Cartography (F2) | Institutional Knowledge (F5) |
| 5 | 0:25-0:35 | Bootstrap Engine (F3) | Auto-Recovery |
| 6 | 0:35-0:48 | Certification (F8) | Dashboard (F9) |
| 7 | 0:48-0:55 | Starter PR (F7) | GitHub Integration |
| 8 | 0:55-1:00 | Complete Flow | Brand Message |

---

## Success Criteria

This storyboard is complete when:
- ✅ All 8 beats are defined with exact timing
- ✅ Every beat specifies: screen content, narration, user action, feature
- ✅ Total duration is exactly 60 seconds
- ✅ All 9 core features are showcased
- ✅ Technical production notes are comprehensive
- ✅ All 4 other developers have reviewed and approved

---

## Review Checklist for H+2 Sync

Each developer should verify:
- [ ] **Dev 1 (Bob Architect):** Custom mode activation and skill invocations are accurate
- [ ] **Dev 2 (Backend/MCP):** MCP tool calls and event stream are realistic
- [ ] **Dev 3 (Frontend):** Dashboard animations and UI states are feasible
- [ ] **Dev 4 (Infrastructure):** Bootstrap auto-recovery scenario is implementable
- [ ] **Dev 5 (Integration):** Overall narrative flow is compelling and timing is achievable

---

**Last Updated:** Phase 1, H+0  
**Status:** Ready for team review  
**Next Action:** Present at H+2 sync meeting for approval