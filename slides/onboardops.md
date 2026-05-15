# OnboardOps Slide Deck

**Presentation Time:** 5 minutes  
**Format:** 12 slides  
**Audience:** IBM Bob Hackathon judges, technical evaluators

---

## Slide 1: Cover

**Visual Elements:**
- OnboardOps logo (large, centered)
- Stopwatch icon (subtle, top-right)
- IBM Blue gradient background (#0F62FE)

**Text:**
```
OnboardOps
The 10-Minute Repo Whisperer

IBM Bob Hackathon 2026
Team: [Dev 1-5 Names]
```

**Speaker Notes:**
- Introduce team briefly (5 seconds)
- Set up the problem we're solving

---

## Slide 2: The Problem

**Visual Elements:**
- Split screen: frustrated developer vs. complex codebase diagram
- Clock showing "3 days" crossed out
- Scattered documentation icons

**Headline:** "The Onboarding Crisis"

**Bullet Points:**
- 🕐 New developers lose **hours** to outdated documentation
- 🔍 Critical context buried in **git history**, not docs
- 🎯 First PRs are **intimidating** without guidance
- 🔄 Setup failures require **senior developer intervention**
- ❓ No way to **verify understanding** before contributing

**Bottom Text:** "Traditional onboarding: 2-3 days minimum"

**Speaker Notes:**
- Every developer has experienced this
- The problem costs companies real money
- Senior developers interrupted constantly
- Transition: "What if we could compress this to 10 minutes?"

---

## Slide 3: The Solution

**Visual Elements:**
- OnboardOps architecture diagram (simplified)
- Bob IDE logo + custom mode indicator
- Arrows showing data flow

**Headline:** "AI-Powered Onboarding in Under 10 Minutes"

**Key Components:**
1. **Socratic Guidance** — Bob's custom `/onboard` mode
2. **Institutional Knowledge** — Extract context from git history
3. **Auto-Recovery** — Self-healing setup process
4. **Certification** — Verify understanding before contributing
5. **Starter PR** — Generate first contribution automatically

**Bottom Text:** "Built on IBM Bob IDE + Model Context Protocol"

**Speaker Notes:**
- Not just documentation automation
- Active learning through Socratic method
- Leverages git history as source of truth
- Transition to demo

---

## Slide 4: 60-Second Demo

**Visual Elements:**
- Embedded video player (or link to video)
- Key screenshots from demo storyboard:
  - `/onboard` command
  - Cartography cards streaming
  - Bootstrap auto-recovery
  - Certification panel
  - Generated PR

**Headline:** "Watch OnboardOps in Action"

**Timeline Overlay:**
```
0:00 — Fresh clone, zero context
0:03 — Type /onboard, stopwatch starts
0:08 — Bob maps codebase in real-time
0:25 — Bootstrap auto-recovers from failure
0:35 — Socratic certification (3 questions)
0:48 — Starter PR generated and tested
0:55 — PR opens: "Onboarded: 9 min 12 sec"
```

**Speaker Notes:**
- Play 60-second video (or narrate screenshots)
- Emphasize the 9-minute result
- Highlight auto-recovery moment (most dramatic)
- Transition: "Let's break down the architecture"

---

## Slide 5: Architecture Overview

**Visual Elements:**
- Full system architecture diagram
- Color-coded components
- Data flow arrows

**Components:**

**1. Bob Custom Mode**
- `.bob/modes/onboard.md` — Socratic stance
- Invokes skills: Cartography, Certification

**2. Institutional Knowledge MCP Server**
- FastAPI + WebSockets
- 7 git analysis tools
- Real-time event emission

**3. Real-Time Dashboard**
- Next.js + IBM Design System
- Live progress tracking
- Certification interface

**4. Bootstrap Engine**
- Bash + Bob Shell
- 5 auto-recovery patterns
- Checkpoint/restore

**Speaker Notes:**
- Four main components working together
- MCP is the key innovation (explain briefly)
- Everything streams in real-time
- Transition to feature deep-dive

---

## Slide 6: Feature Deep-Dive — Repo Cartography

**Visual Elements:**
- Animated dependency graph
- Heatmap of change hotspots
- Entry point highlights

**Headline:** "F2: Repo Cartography — Automated Codebase Mapping"

**Four Stages:**

1. **Dependency Graph**
   - Visual map of project dependencies
   - Identifies critical paths

2. **Entry Points**
   - Where to start reading code
   - Main files, test files, config files

3. **Change Hotspots**
   - Most frequently modified files
   - High-risk areas

4. **Project Conventions**
   - Coding standards extracted from patterns
   - Testing frameworks, linting rules

**Bottom Text:** "All extracted from git history, not documentation"

**Speaker Notes:**
- This is what makes OnboardOps different
- Not reading docs, reading actual code history
- MCP tools do the heavy lifting
- Transition to institutional knowledge

---

## Slide 7: Feature Deep-Dive — Institutional Knowledge

**Visual Elements:**
- Git history timeline with insights
- MCP tool call visualization
- Example commit analysis

**Headline:** "F4 & F5: Institutional Knowledge MCP Server"

**7 Specialized Tools:**

| Tool | Purpose |
|------|---------|
| `git_blame_summary` | Who wrote this code? |
| `commit_frequency` | When is it most active? |
| `recent_authors` | Who are the experts? |
| `pr_for_file` | What PRs touched this? |
| `file_changelog` | How has it evolved? |
| `rationale_for_commit` | Why was this changed? |
| `incident_for_file` | What bugs occurred here? |

**Bottom Text:** "Context that documentation never captures"

**Speaker Notes:**
- Git history is the source of truth
- These tools answer questions docs can't
- Real-time analysis via MCP
- Transition to auto-recovery

---

## Slide 8: Feature Deep-Dive — Bootstrap & Certification

**Visual Elements:**
- Split screen: Bootstrap terminal output + Certification panel

**Left Side: Bootstrap Engine (F3)**

**Auto-Recovery Patterns:**
1. Port conflicts → Kill process, retry
2. Node version mismatch → Switch via nvm
3. Missing virtualenv → Create and install
4. Missing seed data → Run seed script
5. Service not running → Start service

**Right Side: Certification (F8)**

**Socratic Quiz:**
- 12 questions generated from cartography
- Real-time grading with rubric
- Must pass before generating PR
- Verifies actual understanding

**Bottom Text:** "Self-healing setup + verified competency"

**Speaker Notes:**
- Bootstrap eliminates "works on my machine"
- Certification ensures understanding, not just completion
- Both are unique to OnboardOps
- Transition to Bob-specific features

---

## Slide 9: Bob-Specific Originality

**Visual Elements:**
- Bob IDE screenshot with custom mode active
- MCP configuration file
- Session export example

**Headline:** "Built for Bob, Powered by Bob"

**Key Innovations:**

1. **Custom `/onboard` Mode**
   - Socratic stance (asks questions, doesn't give answers)
   - Project-scoped, not global
   - Composable skills

2. **Project-Scoped MCP Server**
   - `.bob/mcp.json` binds server to project
   - 7 custom tools for git analysis
   - Real-time event streaming to dashboard

3. **Bob Shell Integration**
   - Non-interactive piping for auto-recovery
   - Bobcoin usage tracking
   - Session exports for reproducibility

4. **Skill Composition**
   - Cartography + Certification work together
   - Reusable across projects
   - Extensible architecture

**Bottom Text:** "Not just using Bob — extending Bob's capabilities"

**Speaker Notes:**
- This is what makes it a Bob hackathon winner
- We're not just using Bob, we're showing what's possible
- MCP integration is production-ready
- Transition to business value

---

## Slide 10: Business Value & Impact

**Visual Elements:**
- ROI chart showing time savings
- Before/after comparison
- Cost reduction metrics

**Headline:** "The Business Case"

**Metrics:**

**Time Savings:**
- Traditional onboarding: **2-3 days**
- OnboardOps onboarding: **10 minutes**
- **Reduction: 90%+**

**Cost Savings:**
- Senior developer interruptions: **-80%**
- Onboarding documentation maintenance: **-100%** (git history is always current)
- Time to first PR: **9 minutes** vs. **3 days**

**Quality Improvements:**
- Verified competency via certification
- Consistent onboarding experience
- Measurable outcomes (time, quiz scores)
- Audit trail (Bob session exports)

**Scalability:**
- Works for any git repository
- No per-project documentation needed
- Self-updating (git history grows automatically)

**Bottom Text:** "ROI: 10x in the first week"

**Speaker Notes:**
- This isn't just a cool demo
- Real business value for enterprises
- Scales to thousands of repositories
- Transition to tech stack

---

## Slide 11: Tech Stack & Implementation

**Visual Elements:**
- Technology logos arranged by layer
- GitHub repository stats

**Headline:** "Built in 48 Hours"

**Stack:**

**Bob IDE Layer:**
- Custom modes (`.bob/modes/`)
- Skills (`.bob/skills/`)
- MCP binding (`.bob/mcp.json`)
- Bob Shell (non-interactive)

**Backend Layer:**
- FastAPI (REST + WebSocket)
- GitPython (repository analysis)
- Pydantic (data validation)
- GitHub API (PR generation)

**Frontend Layer:**
- Next.js 14 (App Router)
- Tailwind CSS + IBM Design System
- Zustand (state management)
- Framer Motion (animations)

**Infrastructure:**
- GitHub Actions (CI/CD)
- Gitleaks (secret scanning)
- Pytest + Vitest (testing)

**Stats:**
- **Lines of Code:** ~3,500
- **MCP Tools:** 7
- **Bob Sessions Exported:** 55+
- **Test Coverage:** 80%+

**Speaker Notes:**
- Built entirely during hackathon
- Production-ready code quality
- Extensive Bob session documentation
- Transition to team

---

## Slide 12: Team & Thank You

**Visual Elements:**
- Team photo (or avatars)
- QR code linking to GitHub repo
- OnboardOps logo

**Headline:** "Thank You"

**Team:**
- **Dev 1** — Bob Architect (Custom modes, skills, MCP config)
- **Dev 2** — Backend / MCP (Institutional Knowledge server)
- **Dev 3** — Frontend (Real-time dashboard)
- **Dev 4** — Infrastructure (Bootstrap engine, Bob Shell)
- **Dev 5** — Integration (Demo, docs, CI)

**Links:**
- 📺 **Demo Video:** [YouTube Link]
- 💻 **GitHub:** [Repository URL]
- 📊 **Slides:** [Google Slides Link]
- 🏆 **Submission:** [Lablab.ai Link]

**Call to Action:**
"Try OnboardOps on your next repository clone"

**Bottom Text:**
```
OnboardOps — The 10-Minute Repo Whisperer
Six months of onboarding, compressed into one cup of coffee.

Questions?
```

**Speaker Notes:**
- Thank judges and sponsors
- Emphasize we're available for questions
- Invite them to try it themselves
- End with confidence and energy

---

## Presentation Flow Summary

| Slide | Time | Purpose |
|-------|------|---------|
| 1 | 0:00-0:15 | Hook: introduce problem |
| 2 | 0:15-0:45 | Problem: establish pain points |
| 3 | 0:45-1:15 | Solution: high-level overview |
| 4 | 1:15-2:15 | Demo: show it working (60s video) |
| 5 | 2:15-2:45 | Architecture: explain how it works |
| 6 | 2:45-3:15 | Features: cartography deep-dive |
| 7 | 3:15-3:45 | Features: institutional knowledge |
| 8 | 3:45-4:15 | Features: bootstrap + certification |
| 9 | 4:15-4:35 | Bob-specific: why this wins |
| 10 | 4:35-4:50 | Business value: ROI and impact |
| 11 | 4:50-5:05 | Tech stack: implementation details |
| 12 | 5:05-5:30 | Thank you + Q&A |

**Total:** 5 minutes 30 seconds (5 min presentation + 30s buffer for Q&A setup)

---

## Backup Slides (If Time Permits)

### Backup 1: Comparison Matrix

| Feature | Traditional Docs | OnboardOps |
|---------|-----------------|------------|
| Time to first PR | 2-3 days | 10 minutes |
| Context source | Stale docs | Live git history |
| Setup failures | Manual fix | Auto-recovery |
| Verification | None | Certification quiz |
| Maintenance | Constant | Zero (self-updating) |

### Backup 2: Future Roadmap

- **v1.1:** Slack/Linear MCP integrations
- **v1.2:** Multi-language support (beyond Python/JS)
- **v1.3:** Team onboarding (multiple devs simultaneously)
- **v2.0:** Enterprise deployment (self-hosted MCP server)

---

**Last Updated:** Phase 1, H+0  
**Status:** Ready for content population in Phase 5  
**Format:** Markdown (convert to Google Slides or PowerPoint in Phase 5)