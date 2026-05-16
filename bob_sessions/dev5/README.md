# Dev 5 - Integration Engineer Sessions

**Developer:** Dev 5  
**Role:** Integration Engineer  
**Primary Ownership:** F7 starter PR generator, F8 AGENTS.md builder, F9 telemetry, demo storyboard, slide deck

## Focus Areas

### Phase 1 (H+0 to H+2)
- Environment verification
- 60-second demo storyboard (CRITICAL PATH)
- Top-level Makefile
- README v1
- bob_sessions folder structure
- GitHub Actions CI setup
- Starter PR candidate identification
- Slide deck outline
- Cover image placeholder

### Phase 2 (H+20 to H+30)
- Dashboard polish and IBM design refinements
- Replay mode implementation
- Certification panel integration

### Phase 3 (H+24 to H+32)
- Starter PR generator (F7) implementation
- AGENTS.md builder (F8) for end users
- Integration with GitHub API

### Phase 4 (H+32 to H+48)
- Final documentation pass
- Video recording and editing
- Slide deck finalization
- Bob session curation
- Submission preparation

## Session Exports

### Curated Sessions (Phase 3 T5.11)

These three sessions represent Dev 5's key contributions and demonstrate effective Bob usage:

1. **`01_f7-starter-pr-implementation.md`** - F7 Starter PR Generator
   - **Duration:** 120 minutes
   - **Bobcoin Cost:** 3.5
   - **Highlights:** Bob Shell integration, test verification, GitHub API, checkpoint system
   - **Why it matters:** Shows end-to-end feature implementation with Bob guidance

2. **`02_f8-agents-md-implementation.md`** - F8 AGENTS.md Generator
   - **Duration:** 105 minutes
   - **Bobcoin Cost:** 2.8
   - **Highlights:** 5-section composition, JSONL parsing, token budget management, graceful degradation
   - **Why it matters:** Demonstrates data-driven documentation generation with Bob

3. **`03_integration-debugging-telemetry.md`** - Telemetry System Debugging
   - **Duration:** 45 minutes
   - **Bobcoin Cost:** 1.2
   - **Highlights:** Systematic debugging, race condition fixes, async queue implementation
   - **Why it matters:** Real debugging workflow showing Bob's value in troubleshooting

**Total Bobcoins:** 7.5 across 3 sessions (average 2.5 per session)
**Total Time:** 270 minutes (4.5 hours)

### Session Selection Rationale

These sessions were chosen because they:
- Cover Dev 5's primary deliverables (F7, F8, integration)
- Show different types of Bob interactions (planning, implementation, debugging)
- Demonstrate Bobcoin efficiency (all under 4 Bobcoins per session)
- Include realistic challenges and solutions
- Provide learning value for judges reviewing the submission

## Key Deliverables

- `docs/demo-storyboard.md` - 60-second demo script (HIGHEST PRIORITY)
- `Makefile` - Top-level build automation with 8 targets
- `README.md` - Comprehensive project documentation
- `bob_sessions/` - Organized session export structure
- `.github/workflows/ci.yml` - CI/CD pipeline
- `docs/starter-tasks.md` - Three candidate first contributions
- `slides/onboardops.md` - 12-slide presentation outline
- `docs/cover.png` - 1280×720 cover image

## Integration Responsibilities

### Documentation
- README with installation, demo, architecture
- Slide deck for 5-minute presentation
- Storyboard for video production
- Bob session curation

### Build & CI
- Makefile for unified commands
- GitHub Actions for automated testing
- Pre-commit hooks coordination
- Cross-platform compatibility

### Demo Preparation
- Storyboard defines "what winning looks like"
- Starter PR candidates for live demo
- Video recording coordination
- Timing and rehearsal

## Makefile Targets

1. **install** - Install all dependencies (backend + frontend)
2. **dev** - Start development servers
3. **test** - Run all tests
4. **demo** - Execute full demo sequence
5. **export-bob-sessions** - Export all Bob sessions
6. **lint** - Run linters on all code
7. **clean** - Clean build artifacts
8. **help** - Show available targets

## Notes

- Demo storyboard is the single highest-leverage task in Phase 1
- All other devs review storyboard at H+2 sync
- Makefile depends on backend/ and frontend/ directories existing
- Starter PR identification depends on Dev 4's demo repo selection
- Cover image is a placeholder in Phase 1, polished in Phase 5
- Session curation happens continuously, not retrospectively