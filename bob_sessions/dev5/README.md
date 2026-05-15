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

### Phase 1 Sessions
1. `01_environment-verification.md` - Checking local setup
2. `02_demo-storyboard.md` - Creating 60-second frame-by-frame breakdown
3. `03_makefile-creation.md` - Building top-level build automation
4. `04_readme-v1.md` - Authoring comprehensive README
5. `05_bob-sessions-structure.md` - Organizing session export folders
6. `06_github-actions-ci.md` - Setting up CI pipeline
7. `07_starter-pr-candidates.md` - Identifying demo tasks
8. `08_slide-deck-outline.md` - Structuring presentation
9. `09_cover-image.md` - Creating placeholder graphics

### Phase 2+ Sessions
(To be added as development progresses)

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