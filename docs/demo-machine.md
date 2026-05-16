# Reference Demo Machine Specification - T4.7 / Phase 3 T4.1

**Updated:** Phase 3 - Added nvm prerequisite for Node version auto-recovery

**Task Owner:** Dev 4 (Infra / Bob Shell)  
**Date:** 2026-05-15  
**Purpose:** Define the canonical demo environment for consistent testing and recording

---

## Overview

This document specifies the reference machine used for all OnboardOps demos, testing, and video recording. All team members should use this specification when preparing for demos or validating functionality.

---

## Hardware Specifications

### Designated Demo Machine
**Owner:** [TO BE FILLED - Team member name]  
**Machine ID:** [TO BE FILLED - e.g., "MacBook Pro 2023"]  
**Serial Number:** [TO BE FILLED - for tracking purposes]

### Hardware Details
- **Processor:** [TO BE FILLED - e.g., Apple M2 Pro, Intel i7, etc.]
- **RAM:** [TO BE FILLED - e.g., 16GB, 32GB]
- **Storage:** [TO BE FILLED - e.g., 512GB SSD]
- **Display:** [TO BE FILLED - e.g., 14-inch Retina, 1920x1080]

---

## Software Environment

### Operating System
- **OS:** macOS [TO BE FILLED - version number]
- **Build:** [TO BE FILLED - e.g., 23A344]
- **Kernel:** [TO BE FILLED - from `uname -r`]

**Verification Command:**
```bash
sw_vers
# ProductName:		macOS
# ProductVersion:	14.2.1
# BuildVersion:		23C71
```

### Shell Environment
- **Default Shell:** bash / zsh [TO BE FILLED]
- **Shell Version:** [TO BE FILLED]
- **Terminal Emulator:** [TO BE FILLED - e.g., iTerm2, Terminal.app]
- **Terminal Theme:** [TO BE FILLED - for consistent screenshots]

**Verification Command:**
```bash
echo $SHELL
$SHELL --version
```

---

## Development Tools

### Node.js
- **Version:** [TO BE FILLED - e.g., 20.11.0]
- **Package Manager:** npm / pnpm [TO BE FILLED]
- **Package Manager Version:** [TO BE FILLED]
- **Installation Method:** nvm / direct [TO BE FILLED]

**Verification Commands:**
```bash
node --version
npm --version  # or pnpm --version
```

### Python
- **Version:** [TO BE FILLED - e.g., 3.11.7]
- **Package Manager:** pip
- **Virtual Environment:** venv / conda [TO BE FILLED]
- **Installation Method:** pyenv / system [TO BE FILLED]

**Verification Commands:**
```bash
python3 --version
pip3 --version
```

### Docker
- **Docker Desktop Version:** [TO BE FILLED - e.g., 4.26.1]
- **Docker Engine Version:** [TO BE FILLED - e.g., 24.0.7]
- **Docker Compose Version:** [TO BE FILLED - e.g., 2.23.3]

**Verification Commands:**
```bash
docker --version
docker-compose --version
```

### Git
- **Version:** [TO BE FILLED - e.g., 2.42.0]
- **GitHub CLI:** [TO BE FILLED - e.g., 2.40.1]

**Verification Commands:**
```bash
git --version
gh --version
```

### Bob Tools
- **Bob IDE:** Installed / Version [TO BE FILLED]
- **Bob Shell:** Installed / Version [TO BE FILLED]
- **Bob Team:** ibm-coding-challenge-xxx

**Verification Commands:**
```bash
bob --version
bob --team
```

---

## Display Configuration

### Screen Resolution
- **Primary Display:** [TO BE FILLED - e.g., 1440x900, 1920x1080]
- **Scaling:** [TO BE FILLED - e.g., Default, More Space]
- **Color Profile:** [TO BE FILLED - e.g., Display P3]

**Why This Matters:** Consistent resolution ensures UI elements are visible and properly sized in recordings.

### Browser Configuration
- **Browser:** [TO BE FILLED - e.g., Chrome, Safari, Firefox]
- **Version:** [TO BE FILLED]
- **Window Size:** [TO BE FILLED - e.g., 1280x720 for recording]
- **Zoom Level:** 100% (default)
- **Extensions:** [TO BE FILLED - list any that might affect demos]

**Recommended Browser Window Size for Recording:**
- Width: 1280px (fits 720p video)
- Height: 720px
- Position: Centered on screen

---

## Recording Setup

### Screen Recording Tool
- **Tool:** [TO BE FILLED - e.g., QuickTime, OBS Studio, ScreenFlow]
- **Version:** [TO BE FILLED]
- **Recording Resolution:** 1280x720 (720p) or 1920x1080 (1080p)
- **Frame Rate:** 30 fps (minimum)
- **Audio:** System audio + microphone

**Recording Settings:**
```
Resolution: 1280x720 (720p HD)
Frame Rate: 30 fps
Format: MP4 (H.264)
Audio: AAC, 128 kbps
Bitrate: 5 Mbps (for 720p)
```

### Audio Setup
- **Microphone:** [TO BE FILLED - e.g., Built-in, Blue Yeti]
- **Audio Interface:** [TO BE FILLED - if applicable]
- **Background Noise:** Minimal (quiet room)
- **Audio Level:** -12dB to -6dB (optimal range)

---

## Network Configuration

### Internet Connection
- **Type:** [TO BE FILLED - e.g., WiFi, Ethernet]
- **Speed:** [TO BE FILLED - e.g., 100 Mbps down, 20 Mbps up]
- **Latency:** [TO BE FILLED - ping to google.com]

**Verification Command:**
```bash
ping -c 5 google.com
speedtest-cli  # if installed
```

### Firewall Settings
- **Firewall:** [TO BE FILLED - On/Off]
- **Allowed Ports:** 8000, 3000, 5432, 6379 (for demo)

---

## Demo Environment Reset Procedure

### Pre-Demo Checklist
Before each demo or recording session, execute this checklist:

```bash
# 1. Close all unnecessary applications
# 2. Clear terminal history
history -c

# 3. Reset terminal to clean state
clear

# 4. Verify Docker is running
docker ps

# 5. Kill any processes on demo ports
lsof -ti:8000 | xargs kill -9 2>/dev/null || true
lsof -ti:3000 | xargs kill -9 2>/dev/null || true

# 6. Clean up temporary files
rm -rf /tmp/onboardops-* 2>/dev/null || true

# 7. Verify Bob Shell authentication
bob --team

# 8. Set terminal to standard size
# Resize terminal window to 80x24 or 120x30

# 9. Navigate to clean workspace
cd ~/Desktop  # or designated demo directory

# 10. Verify internet connectivity
ping -c 1 google.com
```

### Post-Demo Cleanup
After each demo or recording:

```bash
# 1. Stop all demo services
docker-compose down 2>/dev/null || true

# 2. Remove demo repositories
rm -rf onboardops-demo 2>/dev/null || true

# 3. Clear sensitive data
rm -f .env 2>/dev/null || true

# 4. Export Bob session
# (Follow team's Bob session export procedure)

# 5. Save recording
# Move recording to designated folder with naming convention:
# onboardops-demo-YYYYMMDD-HHmm.mp4
```

---

## Baseline Software Versions

### Minimum Required Versions
These are the minimum versions required for OnboardOps to function:

| Tool | Minimum Version | Recommended Version |
|------|----------------|---------------------|
| Node.js | 18.0.0 | 20.11.0+ |
| Python | 3.10.0 | 3.11.0+ |
| Docker | 20.10.0 | 24.0.0+ |
| Git | 2.30.0 | 2.40.0+ |
| Bob Shell | [TBD] | [TBD] |

### Version Verification Script
```bash
#!/bin/bash
# Save as: scripts/verify-demo-machine.sh

echo "=== Demo Machine Verification ==="
echo ""

echo "Operating System:"
sw_vers 2>/dev/null || uname -a

echo ""
echo "Node.js:"
node --version 2>/dev/null || echo "Not installed"

echo ""
echo "Python:"
python3 --version 2>/dev/null || echo "Not installed"

echo ""
echo "Docker:"
docker --version 2>/dev/null || echo "Not installed"
docker ps &>/dev/null && echo "Docker daemon: Running" || echo "Docker daemon: Not running"

echo ""
echo "Git:"
git --version 2>/dev/null || echo "Not installed"

echo ""
echo "Bob Shell:"
bob --version 2>/dev/null || echo "Not installed"
bob --team 2>/dev/null || echo "Not authenticated"

echo ""
echo "Screen Resolution:"
system_profiler SPDisplaysDataType 2>/dev/null | grep Resolution || echo "Unable to detect"

echo ""
echo "=== Verification Complete ==="
```

---

## Troubleshooting

### Common Issues

#### Issue: Screen recording shows wrong resolution
**Solution:** 
1. Set display to native resolution
2. Disable display scaling
3. Restart recording software

#### Issue: Audio not captured
**Solution:**
1. Check system audio permissions
2. Select correct audio input in recording software
3. Test audio levels before recording

#### Issue: Demo services fail to start
**Solution:**
1. Run reset procedure (see above)
2. Verify all ports are available
3. Check Docker daemon status

---

## Maintenance Schedule

### Weekly
- [ ] Update all development tools to latest stable versions
- [ ] Clear temporary files and caches
- [ ] Verify Bob Shell authentication
- [ ] Test demo flow end-to-end

### Before Each Demo
- [ ] Execute pre-demo checklist
- [ ] Test screen recording setup
- [ ] Verify internet connectivity
- [ ] Confirm all tools are at correct versions

### After Each Demo
- [ ] Execute post-demo cleanup
- [ ] Export and archive Bob sessions
- [ ] Save recordings with proper naming
- [ ] Document any issues encountered

---

## Contact Information

### Demo Machine Owner
**Name:** [TO BE FILLED]  
**Email:** [TO BE FILLED]  
**Slack:** [TO BE FILLED]

### Backup Demo Machine
**Owner:** [TO BE FILLED]  
**Location:** [TO BE FILLED]


## Demo Machine Reset Procedure (T4.8)

### Purpose

The reset script returns the demo machine to a clean state for fresh bootstrap testing. This is essential for:
- Testing bootstrap from scratch
- Validating auto-recovery patterns
- Recording clean demo videos
- Stress testing bootstrap reliability

### Reset Script

**Location:** `scripts/reset-demo-machine.sh`

**What it does:**
1. **Stops all dev servers** - Kills processes on common ports (3000, 5000, 8000, 8080, etc.)
2. **Stops Docker containers** - Runs `docker compose down -v` to remove containers and volumes
3. **Drops and recreates database** - Resets PostgreSQL/MySQL database to empty state
4. **Cleans build artifacts** - Removes node_modules/.cache, dist, build, __pycache__, etc.
5. **Removes virtualenv** - Deletes .venv or venv directory (will be recreated by bootstrap)
6. **Resets git repository** - Stashes changes, cleans untracked files, resets to HEAD
7. **Cleans temporary files** - Removes /tmp/onboardops-*.log and related files
8. **Verifies clean state** - Checks ports are free, git is clean, no virtualenv exists

### Usage

```bash
cd OnboardOps
./scripts/reset-demo-machine.sh
```

### Expected Output

```
╔═══════════════════════════════════════════════════════╗
║  Demo Machine Reset - Return to Clean State          ║
╚═══════════════════════════════════════════════════════╝

Step 1: Stop all dev servers
✓ Dev servers stopped

Step 2: Stop and remove Docker containers
✓ Docker services stopped

Step 3: Drop and recreate database
✓ PostgreSQL database reset

Step 4: Clean build artifacts and caches
✓ Build artifacts cleaned

Step 5: Reset git repository
✓ Git repository reset

Step 6: Clean temporary files
✓ Temporary files cleaned

Step 7: Verify clean state
✓ All common ports are free
✓ Git working directory is clean
✓ No Python virtualenv present

╔═══════════════════════════════════════════════════════╗
║  ✓ Demo Machine Reset Complete                       ║
╚═══════════════════════════════════════════════════════╝

Reset completed in 12s
```

### Reset Time Target

**Target:** <3 minutes (typically completes in 10-30 seconds)

### What is Preserved

- `.env` file (if it exists)
- `.env.local` file (if it exists)
- Git stash (uncommitted changes are stashed, not deleted)

### What is Removed

- All running dev server processes
- Docker containers and volumes
- Database data (dropped and recreated)
- Build artifacts (node_modules/.cache, dist, build, etc.)
- Python virtualenv (.venv or venv)
- Python cache files (__pycache__, *.pyc)
- Untracked git files (except .env)
- OnboardOps temporary files (/tmp/onboardops-*)

### After Reset

Run bootstrap to set up the environment:

```bash
# Standard bootstrap
./scripts/bootstrap.sh

# Or with AI-assisted auto-recovery
python3 scripts/auto_bootstrap.py --auto-recover
```

### Troubleshooting

**Issue: Ports still in use after reset**
- Manually check: `lsof -ti :PORT`
- Kill process: `kill -9 $(lsof -ti :PORT)`

**Issue: Database reset failed**
- Check database is running: `docker ps` or `psql -h localhost -U postgres -l`
- Manually drop/create: `psql -h localhost -U postgres -c "DROP DATABASE demo_db; CREATE DATABASE demo_db;"`

**Issue: Git reset failed**
- Check git status: `git status`
- Manually reset: `git reset --hard HEAD && git clean -fdx -e .env`

### Integration with Stress Testing

The reset script is used in T4.10 (Full Bootstrap Stress Test) to alternate between healthy and broken states:

```bash
# Stress test loop
for i in {1..10}; do
  ./scripts/reset-demo-machine.sh
  ./scripts/bootstrap.sh
  # Verify success
  ./scripts/reset-demo-machine.sh
  # Break something
  ./scripts/bootstrap.sh
  # Verify auto-recovery
done
```

---

---

## Change Log

| Date | Change | Author |
|------|--------|--------|
| 2026-05-15 | Initial specification created | Dev 4 |
| [TBD] | Filled in actual machine details | [TBD] |

---

## Appendix: Quick Reference Commands

```bash
# Verify all tools
./scripts/verify-demo-machine.sh

# Reset demo environment
./scripts/reset-demo-env.sh

# Start demo services
cd onboardops-demo && docker-compose up

# Stop demo services
cd onboardops-demo && docker-compose down

# Check port availability
lsof -i :8000 -i :3000 -i :5432 -i :6379

# Kill all demo processes
pkill -f "onboardops"
```

---

**Document Version:** 1.0  
**Last Updated:** 2026-05-15  
**Owner:** Dev 4 (Infra / Bob Shell)  
**Status:** Template - Awaiting machine details
# Reference Demo Machine Specification - T4.7 / Phase 3 T4.8

**Updated:** Phase 3 T4.8 - Added demo machine reset procedure


---

## Demo Machine Reset Procedure (Phase 3 T4.11)

### Overview

The demo machine must be reset to a pristine state between recording takes to ensure consistent, reproducible demos. The reset script handles all cleanup automatically.

### Reset Script

**Location:** `scripts/reset-demo-machine.sh`  
**Duration:** <3 minutes (full reset), <5 seconds (fast-path)  
**Purpose:** Clean all artifacts, stop services, reset git state

### When to Reset

Reset the demo machine:
- **Before each recording take**
- **After a failed demo run**
- **When switching between demo scenarios**
- **Before stress testing**
- **Before handing off to another team member**

### Reset Procedure

#### Quick Reset (Recommended)

```bash
# Run the reset script
./scripts/reset-demo-machine.sh

# Expected output:
# ╔═══════════════════════════════════════════════════════╗
# ║  OnboardOps Demo Machine Reset                        ║
# ╚═══════════════════════════════════════════════════════╝
#
# [INFO] Checking what needs to be reset...
# [INFO] Stopping development servers...
# [INFO] Cleaning build artifacts...
# [INFO] Resetting git repository...
# [SUCCESS] Demo machine reset complete
#
# Reset Summary:
#   Servers stopped: 2
#   Artifacts cleaned: 156 MB
#   Git status: clean
#   Duration: 2.3s
```

#### Verification After Reset

```bash
# Verify clean state
git status
# Should show: "nothing to commit, working tree clean"

# Verify no processes on demo ports
lsof -i :3000 -i :8000 -i :8765
# Should show: no output (ports free)

# Verify no Docker containers running
docker ps
# Should show: no OnboardOps containers

# Verify no stale virtualenv
ls -la .venv venv 2>/dev/null
# Should show: directories don't exist or are empty
```

### What Gets Reset

The reset script cleans:

1. **Development Servers**
   - Frontend dev server (port 3000)
   - Backend API server (port 8000)
   - WebSocket server (port 8765)

2. **Docker Containers**
   - PostgreSQL database
   - Any other OnboardOps containers

3. **Build Artifacts**
   - `node_modules/` (frontend)
   - `.next/` (Next.js build cache)
   - `__pycache__/` (Python bytecode)
   - `.venv/` or `venv/` (Python virtualenv)
   - `*.pyc` files

4. **Database State**
   - Drops and recreates database
   - Removes migration state
   - Clears seed data markers

5. **Git Repository**
   - Discards uncommitted changes
   - Removes untracked files
   - Resets to HEAD

6. **Temporary Files**
   - `/tmp/onboardops-*` files
   - Log files
   - Telemetry data

### Reset Modes

#### Fast-Path Reset (< 5 seconds)

Used when only minor cleanup is needed:

```bash
./scripts/reset-demo-machine.sh --fast
```

Checks what's dirty and only resets those items:
- Stops only running servers
- Cleans only existing artifacts
- Skips git reset if tree is clean

#### Full Reset (< 3 minutes)

Used for complete cleanup:

```bash
./scripts/reset-demo-machine.sh --full
```

Performs all cleanup operations regardless of current state.

#### Dry Run

Preview what would be reset without making changes:

```bash
./scripts/reset-demo-machine.sh --dry-run
```

### Troubleshooting

#### Reset Script Fails

If the reset script fails:

1. **Check for permission errors:**
   ```bash
   chmod +x ./scripts/reset-demo-machine.sh
   ```

2. **Manually stop stubborn processes:**
   ```bash
   # Find processes on demo ports
   lsof -ti :3000 :8000 :8765 | xargs kill -9
   ```

3. **Force Docker cleanup:**
   ```bash
   docker-compose down -v
   docker system prune -f
   ```

4. **Nuclear option (last resort):**
   ```bash
   # Re-clone the repository
   cd ..
   rm -rf OnboardOps
   git clone <repo-url> OnboardOps
   cd OnboardOps
   ```

#### Ports Still in Use After Reset

```bash
# Identify the process
lsof -i :3000

# Kill it forcefully
kill -9 <PID>
```

#### Git Reset Fails

```bash
# Force reset to clean state
git reset --hard HEAD
git clean -fdx

# If that fails, stash everything
git stash --include-untracked
```

### Pre-Recording Checklist

Before starting a recording session:

1. ✅ Run reset script: `./scripts/reset-demo-machine.sh`
2. ✅ Verify clean state (see verification commands above)
3. ✅ Check Bob auth: `bob --version`
4. ✅ Check network: `ping -c 1 google.com`
5. ✅ Check disk space: `df -h .`
6. ✅ Close unnecessary applications
7. ✅ Set display resolution (if recording)
8. ✅ Disable notifications (if recording)

### Post-Recording Checklist

After completing a recording session:

1. ✅ Save recording files
2. ✅ Export Bob sessions
3. ✅ Run reset script for next session
4. ✅ Document any issues encountered
5. ✅ Update timing data if needed

### Integration with Preflight Script

In Phase 4, the preflight script will automatically verify that the reset script was run recently:

```bash
# Phase 4 preflight check
./scripts/preflight.sh

# Checks include:
# - Reset script ran in last 60 seconds
# - All services stopped
# - Git tree clean
# - Ports available
```

### Reset Script Output Format

The reset script provides structured output:

```
╔═══════════════════════════════════════════════════════╗
║  OnboardOps Demo Machine Reset                        ║
╚═══════════════════════════════════════════════════════╝

[INFO] Checking what needs to be reset...
[INFO] Stopping development servers...
  ✓ Stopped frontend server (PID 12345)
  ✓ Stopped backend server (PID 12346)
  ✓ Stopped WebSocket server (PID 12347)

[INFO] Stopping Docker containers...
  ✓ Stopped postgresql container

[INFO] Cleaning build artifacts...
  ✓ Removed node_modules/ (145 MB)
  ✓ Removed .next/ (8 MB)
  ✓ Removed .venv/ (3 MB)

[INFO] Resetting database...
  ✓ Dropped database onboardops_dev
  ✓ Removed migration markers

[INFO] Resetting git repository...
  ✓ Discarded uncommitted changes
  ✓ Removed untracked files
  ✓ Working tree clean

[INFO] Cleaning temporary files...
  ✓ Removed /tmp/onboardops-* files

[SUCCESS] Demo machine reset complete

Reset Summary:
  Servers stopped: 3
  Containers stopped: 1
  Artifacts cleaned: 156 MB
  Git status: clean
  Duration: 2.3s
```

### Known Limitations

1. **Docker Required:** Reset script assumes Docker is installed for database cleanup
2. **Git Repository:** Assumes project is a git repository
3. **Permissions:** May require sudo for some operations (script will prompt)
4. **Platform:** Optimized for macOS/Linux; Windows support limited

### Emergency Reset

If the standard reset fails completely:

```bash
# Emergency reset procedure
cd /path/to/OnboardOps

# 1. Kill all processes
pkill -f "node.*3000"
pkill -f "python.*8000"
pkill -f "python.*8765"

# 2. Stop Docker
docker-compose down -v

# 3. Clean everything
rm -rf node_modules .next __pycache__ .venv venv
rm -f /tmp/onboardops-*

# 4. Reset git
git reset --hard HEAD
git clean -fdx

# 5. Verify
git status
lsof -i :3000 -i :8000 -i :8765
```

### Handoff to Dev 5 (Phase 4)

When handing off the demo machine to Dev 5 for Phase 5 video recording:

1. Run full reset: `./scripts/reset-demo-machine.sh --full`
2. Verify all checks pass
3. Confirm Bob authentication works
4. Test one complete bootstrap run
5. Document any machine-specific quirks
6. Transfer ownership in this document

---

**Reset Procedure Added:** Phase 3 T4.11  
**Last Updated:** 2026-05-16  
**Maintained By:** Dev 4 → Dev 5 (Phase 5)
