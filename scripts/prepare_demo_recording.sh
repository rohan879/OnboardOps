#!/bin/bash
# OnboardOps Demo Recording Preparation Script
# Prepares the system for recording the demo video

set -e

echo "======================================================================"
echo "OnboardOps Demo Recording Preparation"
echo "======================================================================"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if running on macOS
if [[ "$OSTYPE" == "darwin"* ]]; then
    IS_MACOS=true
else
    IS_MACOS=false
fi

echo "→ Checking system..."
echo "  OS: $OSTYPE"
echo ""

# 1. Hide desktop icons (macOS only)
if [ "$IS_MACOS" = true ]; then
    echo "→ Hiding desktop icons..."
    defaults write com.apple.finder CreateDesktop false
    killall Finder 2>/dev/null || true
    echo -e "  ${GREEN}✓${NC} Desktop icons hidden"
else
    echo -e "  ${YELLOW}⚠${NC}  Desktop icon hiding not supported on this OS"
fi
echo ""

# 2. Enable Do Not Disturb
echo "→ Enabling Do Not Disturb..."
if [ "$IS_MACOS" = true ]; then
    # macOS Monterey and later
    defaults -currentHost write ~/Library/Preferences/ByHost/com.apple.notificationcenterui doNotDisturb -boolean true
    defaults -currentHost write ~/Library/Preferences/ByHost/com.apple.notificationcenterui doNotDisturbDate -date "$(date -u +"%Y-%m-%d %H:%M:%S +0000")"
    killall NotificationCenter 2>/dev/null || true
    echo -e "  ${GREEN}✓${NC} Do Not Disturb enabled"
else
    echo -e "  ${YELLOW}⚠${NC}  Please enable Do Not Disturb manually"
fi
echo ""

# 3. Close unnecessary applications
echo "→ Closing unnecessary applications..."
APPS_TO_CLOSE=("Slack" "Discord" "Mail" "Messages" "Calendar" "Activity Monitor")

for app in "${APPS_TO_CLOSE[@]}"; do
    if pgrep -x "$app" > /dev/null; then
        echo "  Closing $app..."
        osascript -e "quit app \"$app\"" 2>/dev/null || true
    fi
done
echo -e "  ${GREEN}✓${NC} Unnecessary apps closed"
echo ""

# 4. Check if backend is running
echo "→ Checking backend status..."
if curl -s http://localhost:8765/health > /dev/null 2>&1; then
    echo -e "  ${GREEN}✓${NC} Backend is running"
else
    echo -e "  ${RED}✗${NC} Backend is NOT running"
    echo "  Start with: cd backend && source .venv/bin/activate && uvicorn app:app --port 8765"
fi
echo ""

# 5. Check if frontend is running
echo "→ Checking frontend status..."
if curl -s http://localhost:3000 > /dev/null 2>&1; then
    echo -e "  ${GREEN}✓${NC} Frontend is running"
else
    echo -e "  ${RED}✗${NC} Frontend is NOT running"
    echo "  Start with: cd frontend && pnpm dev"
fi
echo ""

# 6. Check if telemetry is running
echo "→ Checking telemetry status..."
if pgrep -f "telemetry.py" > /dev/null; then
    echo -e "  ${GREEN}✓${NC} Telemetry is running"
else
    echo -e "  ${YELLOW}⚠${NC}  Telemetry is NOT running"
    echo "  Start with: python scripts/telemetry.py &"
fi
echo ""

# 7. Create recordings directory
echo "→ Creating recordings directory..."
mkdir -p docs/recordings/phase2
echo -e "  ${GREEN}✓${NC} Directory created: docs/recordings/phase2"
echo ""

# 8. Check OBS/QuickTime
echo "→ Checking recording software..."
if [ "$IS_MACOS" = true ]; then
    if [ -d "/Applications/OBS.app" ]; then
        echo -e "  ${GREEN}✓${NC} OBS Studio found"
        echo "  Launch with: open -a OBS"
    else
        echo -e "  ${YELLOW}⚠${NC}  OBS Studio not found"
        echo "  Install with: brew install --cask obs"
    fi
    echo -e "  ${GREEN}✓${NC} QuickTime available (built-in)"
else
    if command -v obs > /dev/null; then
        echo -e "  ${GREEN}✓${NC} OBS Studio found"
    else
        echo -e "  ${YELLOW}⚠${NC}  OBS Studio not found"
        echo "  Install with: sudo apt install obs-studio"
    fi
fi
echo ""

# 9. Display checklist
echo "======================================================================"
echo "Pre-Recording Checklist"
echo "======================================================================"
echo ""
echo "Before starting the recording, verify:"
echo ""
echo "  [ ] Backend running (http://localhost:8765)"
echo "  [ ] Frontend running (http://localhost:3000)"
echo "  [ ] Telemetry capturing events"
echo "  [ ] Bob IDE open with /onboard command ready"
echo "  [ ] Dashboard visible on second monitor"
echo "  [ ] OBS/QuickTime configured (1920×1080, 60fps)"
echo "  [ ] Do Not Disturb enabled"
echo "  [ ] Desktop clean (no clutter)"
echo "  [ ] Storyboard open for reference"
echo "  [ ] Microphone tested (if recording audio)"
echo ""
echo "======================================================================"
echo "Ready to Record!"
echo "======================================================================"
echo ""
echo "Next steps:"
echo "  1. Review docs/demo-storyboard.md"
echo "  2. Practice the 60-second flow"
echo "  3. Start recording"
echo "  4. Follow the storyboard beats"
echo "  5. Save recording to docs/recordings/phase2/"
echo ""

# 10. Restore function
cat > /tmp/restore_demo_env.sh << 'EOF'
#!/bin/bash
# Restore normal environment after recording

echo "Restoring environment..."

# Show desktop icons (macOS)
if [[ "$OSTYPE" == "darwin"* ]]; then
    defaults write com.apple.finder CreateDesktop true
    killall Finder 2>/dev/null || true
    
    # Disable Do Not Disturb
    defaults -currentHost delete ~/Library/Preferences/ByHost/com.apple.notificationcenterui doNotDisturb 2>/dev/null || true
    defaults -currentHost delete ~/Library/Preferences/ByHost/com.apple.notificationcenterui doNotDisturbDate 2>/dev/null || true
    killall NotificationCenter 2>/dev/null || true
fi

echo "✓ Environment restored"
echo ""
echo "To restore manually:"
echo "  - Re-enable desktop icons"
echo "  - Disable Do Not Disturb"
echo "  - Reopen closed applications"
EOF

chmod +x /tmp/restore_demo_env.sh

echo "To restore environment after recording:"
echo "  /tmp/restore_demo_env.sh"
echo ""

# Made with Bob
