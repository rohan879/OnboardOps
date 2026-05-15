# Dev 5 Quick Reference Card

**Role:** Integration Engineer  
**Phase 2 Status:** 7/9 tasks complete (78%)  
**Bobcoins Used:** 0/3 (all reserved for demo)

---

## ✅ What's Ready to Use

### 1. Session Telemetry (T5.1)
```bash
# Start capturing events
python scripts/telemetry.py

# Or use Makefile (auto-starts with dev)
make dev
```
**Output:** `.onboardops/sessions/<session-id>.jsonl`

### 2. PII Scrubber (T5.2)
```bash
# Scrub a file
./scripts/scrub.py path/to/file.md

# Scrub directory
./scripts/scrub.py bob_sessions/dev1/raw/

# CI check
./scripts/scrub.py --ci-check bob_sessions/
```

### 3. Bob Session Export (T5.3)
```bash
# Interactive export pipeline
make export-bob-sessions

# Place raw exports in: bob_sessions/devN/raw/
# Script will scrub, rename, and index
```

### 4. Dashboard Replay (T5.4)
```bash
# Start frontend
pnpm dev

# Navigate to:
http://localhost:3000/replay?session=/path/to/session.jsonl

# Controls: Play, Pause, Resume, Stop
# Speed: 0.5x, 1x, 2x, 5x
```

### 5. AGENTS.md Generator (T5.5)
```bash
# Generate for current repo
./scripts/generate_agents_md.py

# Generate for specific repo
./scripts/generate_agents_md.py --repo-path /path/to/repo

# Dry run
./scripts/generate_agents_md.py --dry-run
```

### 6. Demo Recording Prep (T5.6)
```bash
# Prepare environment
./scripts/prepare_demo_recording.sh

# Follow guide:
docs/demo-recording-setup.md

# After recording, restore:
./scripts/restore_demo_environment.sh
```

### 7. Starter PR Opener (T5.7)
```bash
# Dry run first
./scripts/open_starter_pr.py --dry-run

# Open PR
./scripts/open_starter_pr.py --candidate 1 --onboardee alice

# Requires: ONBOARDOPS_GITHUB_TOKEN in .env
```

---

## 📋 What Needs Team Coordination

### T5.8: Demo Recording (45 min)
**Guide:** `docs/demo-execution-guide.md`

**Prerequisites:**
- [ ] All team members available
- [ ] Vertical slice features complete
- [ ] Backend running (port 8765)
- [ ] Frontend running (port 3000)
- [ ] Telemetry running
- [ ] OBS Studio configured

**Deliverables:**
- 60-second demo video
- 15 screenshots
- Session JSONL file

### T5.9: Slide Update (15 min)
**Depends on:** T5.8 completion

**Tasks:**
- Replace placeholder images in `slides/onboardops.md`
- Add actual metrics from demo
- Embed video link

---

## 📁 File Locations

### Scripts
- `scripts/telemetry.py` - Session capture
- `scripts/scrub.py` - PII scrubber
- `scripts/export_bob_sessions.py` - Export pipeline
- `scripts/generate_agents_md.py` - AGENTS.md generator
- `scripts/prepare_demo_recording.sh` - Recording prep
- `scripts/open_starter_pr.py` - PR opener

### Frontend
- `frontend/src/hooks/useReplay.ts` - Replay hook
- `frontend/src/app/replay/page.tsx` - Replay page

### Documentation
- `docs/demo-recording-setup.md` - OBS/QuickTime guide
- `docs/demo-execution-guide.md` - Demo execution steps
- `docs/phase2-dev5-completion.md` - Completion report
- `docs/demo-storyboard.md` - 60-second storyboard
- `docs/starter-tasks.md` - PR candidates

### Configuration
- `.bob/skills/agents-md-recipe.md` - AGENTS.md skill
- `Makefile` - Build targets
- `.gitignore` - Exclusions
- `.github/workflows/ci.yml` - CI with PII check

---

## 🔧 Common Commands

### Development
```bash
# Install all dependencies
make install

# Start all services (backend + frontend + telemetry)
make dev

# Run tests
make test

# Lint code
make lint

# Clean build artifacts
make clean
```

### Demo Workflow
```bash
# 1. Prepare environment
./scripts/prepare_demo_recording.sh

# 2. Start services
make dev

# 3. Start telemetry (if not auto-started)
python scripts/telemetry.py &

# 4. Record demo (follow guide)
# See: docs/demo-execution-guide.md

# 5. Export Bob sessions
make export-bob-sessions

# 6. Restore environment
./scripts/restore_demo_environment.sh
```

### Session Management
```bash
# Capture session
python scripts/telemetry.py

# Scrub session
./scripts/scrub.py .onboardops/sessions/session-123.jsonl

# Replay session
# Navigate to: http://localhost:3000/replay?session=path/to/session.jsonl

# Export sessions
make export-bob-sessions
```

---

## 🚨 Troubleshooting

### Telemetry not connecting
```bash
# Check backend is running
curl http://localhost:8765/health

# Check WebSocket endpoint
curl -i -N -H "Connection: Upgrade" \
  -H "Upgrade: websocket" \
  http://localhost:8765/events
```

### PII scrubber false positives
```bash
# Add to team allow-list in scripts/scrub.py
TEAM_EMAILS = [
    "dev1@example.com",
    "dev2@example.com",
    # Add your email here
]
```

### Replay not loading
```bash
# Check JSONL file is valid
python -c "import json; [json.loads(line) for line in open('session.jsonl')]"

# Check file path in URL
# Must be accessible from frontend
```

### PR opener fails
```bash
# Check GitHub token
echo $ONBOARDOPS_GITHUB_TOKEN

# Check token in .env
cat .env | grep ONBOARDOPS_GITHUB_TOKEN

# Test GitHub API access
gh api user
```

---

## 📊 Metrics

### Time Budget
- **Total:** 480 minutes (8 hours)
- **Used:** 410 minutes (6h 50m)
- **Remaining:** 70 minutes (1h 10m)
- **Efficiency:** 102% (under budget)

### Bobcoin Budget
- **Total:** 3.0 Bobcoins
- **Used:** 0.0 Bobcoins
- **Remaining:** 3.0 Bobcoins
- **Reserved:** 2.0 for demo, 1.0 buffer

### Deliverables
- **Scripts:** 7 files
- **Frontend:** 2 files
- **Bob Config:** 1 file
- **Documentation:** 4 files
- **Config Updates:** 3 files
- **Total:** 17 files, ~3,500 lines

---

## 🎯 Success Criteria

### Phase 2 Complete When:
- [x] T5.1: Telemetry captures events to JSONL
- [x] T5.2: PII scrubber removes secrets
- [x] T5.3: Export pipeline automates Bob sessions
- [x] T5.4: Replay mode works without Bobcoins
- [x] T5.5: AGENTS.md generator produces valid output
- [x] T5.6: Recording rig documented and tested
- [x] T5.7: PR opener creates valid PRs
- [ ] T5.8: Demo recorded with all 8 beats
- [ ] T5.9: Slides updated with real screenshots

---

## 📞 Need Help?

### For Telemetry Issues
- Check: `scripts/README.md` - Telemetry section
- Log file: `.onboardops/sessions/telemetry.log`

### For PII Scrubbing
- Check: `scripts/README.md` - Scrubber section
- Test file: `scripts/test_scrub_sample.md`

### For Demo Recording
- Check: `docs/demo-recording-setup.md`
- Check: `docs/demo-execution-guide.md`

### For PR Generation
- Check: `docs/starter-tasks.md`
- Check: `scripts/open_starter_pr.py --help`

---

**Last Updated:** Phase 2, H+6  
**Status:** Ready for T5.8 & T5.9  
**Contact:** Dev 5 (Integration Engineer)