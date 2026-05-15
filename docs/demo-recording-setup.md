# Demo Recording Rig Setup Guide (T5.6)

This guide walks through setting up the recording rig for the OnboardOps final demo video.

## Requirements

- **Demo machine** (as documented in `docs/demo-machine.md`)
- **Recording software**: OBS Studio (recommended) or QuickTime (macOS)
- **Dual monitors** or single ultrawide display
- **Microphone** for narration (optional but recommended)

## Target Specifications

- **Resolution**: 1920×1080 (1080p)
- **Frame rate**: 60 FPS
- **Audio**: 32-bit (if recording narration)
- **Layout**: Dual-source (primary + dashboard)
- **Duration**: 60 seconds for final demo

## Option 1: OBS Studio Setup (Recommended)

### Installation

**macOS:**
```bash
brew install --cask obs
```

**Linux:**
```bash
sudo apt install obs-studio  # Ubuntu/Debian
sudo dnf install obs-studio  # Fedora
```

**Windows:**
Download from https://obsproject.com/

### Configuration Steps

1. **Launch OBS Studio**
   ```bash
   open -a "OBS"  # macOS
   obs            # Linux
   ```

2. **Create Scene: "OnboardOps Demo"**
   - Click "+" under Scenes
   - Name: "OnboardOps Demo"

3. **Add Source: Primary Monitor (Bob IDE)**
   - Click "+" under Sources
   - Select "Display Capture"
   - Name: "Primary - Bob IDE"
   - Properties:
     - Display: Select your primary monitor
     - Capture Cursor: Yes
   - Transform:
     - Position: X=0, Y=0
     - Size: 960×1080 (left half)

4. **Add Source: Secondary Monitor (Dashboard)**
   - Click "+" under Sources
   - Select "Display Capture"
   - Name: "Secondary - Dashboard"
   - Properties:
     - Display: Select your secondary monitor (or browser window)
     - Capture Cursor: No
   - Transform:
     - Position: X=960, Y=0
     - Size: 960×1080 (right half)

5. **Configure Output Settings**
   - Settings → Output
   - Output Mode: Simple
   - Recording Quality: High Quality, Medium File Size
   - Recording Format: MP4
   - Encoder: Hardware (if available) or x264

6. **Configure Video Settings**
   - Settings → Video
   - Base (Canvas) Resolution: 1920×1080
   - Output (Scaled) Resolution: 1920×1080
   - Downscale Filter: Lanczos
   - Common FPS Values: 60

7. **Configure Audio Settings** (if recording narration)
   - Settings → Audio
   - Sample Rate: 48 kHz
   - Channels: Stereo
   - Desktop Audio Device: Default
   - Mic/Auxiliary Audio: Select your microphone

8. **Save Scene Collection**
   - Scene Collection → Save As
   - Name: "OnboardOps-1080p60"

### Test Recording

1. **Arrange Windows**
   - Primary monitor: Bob IDE with `/onboard` command ready
   - Secondary monitor: Dashboard at `http://localhost:3000`

2. **Start Test Recording**
   - Click "Start Recording" (or press hotkey)
   - Record for 30 seconds:
     - Type in Bob IDE
     - Show dashboard updating
     - Demonstrate stopwatch ticking

3. **Stop and Review**
   - Click "Stop Recording"
   - File saved to: `~/Videos/` (default)
   - Open in video player
   - Verify:
     - ✓ 1920×1080 resolution
     - ✓ 60 FPS smooth playback
     - ✓ Both monitors visible
     - ✓ Text legible at 100% zoom
     - ✓ No dropped frames

### OBS Hotkeys (Optional)

Set up hotkeys for hands-free recording:

- Settings → Hotkeys
- Start Recording: `Cmd+Shift+R` (macOS) or `Ctrl+Shift+R`
- Stop Recording: `Cmd+Shift+R` (same key toggles)
- Pause Recording: `Cmd+Shift+P`

## Option 2: QuickTime Setup (macOS Only)

### Configuration Steps

1. **Launch QuickTime Player**
   ```bash
   open -a "QuickTime Player"
   ```

2. **New Screen Recording**
   - File → New Screen Recording
   - Or press: `Cmd+Ctrl+N`

3. **Configure Recording Options**
   - Click dropdown arrow next to record button
   - Microphone: Select if recording narration
   - Quality: Maximum
   - Show Mouse Clicks: Optional

4. **Select Recording Area**
   - Click "Record Selected Portion"
   - Drag to select 1920×1080 area covering both monitors
   - Or use full screen if display is 1920×1080

5. **Test Recording**
   - Click "Start Recording"
   - Record for 30 seconds
   - Press `Cmd+Ctrl+Esc` to stop
   - File → Save
   - Location: `~/Desktop/onboardops-test.mov`

6. **Verify Recording**
   - Open in QuickTime
   - Window → Show Movie Inspector
   - Verify:
     - Format: H.264
     - Dimensions: 1920×1080
     - FPS: 60 (or 30 if hardware limited)
     - Data Rate: ~10-20 Mbps

### QuickTime Limitations

⚠️ **Note**: QuickTime may not support:
- Dual-source layout (requires manual window arrangement)
- 60 FPS on older Macs (may default to 30 FPS)
- Advanced audio mixing

**Recommendation**: Use OBS Studio for production recording.

## Layout Verification Checklist

Before the final demo recording, verify:

- [ ] Primary monitor shows Bob IDE clearly
- [ ] Secondary monitor shows dashboard at `localhost:3000`
- [ ] Stopwatch is visible and ticking
- [ ] Event stream is visible
- [ ] Text is legible at 100% zoom (minimum 12pt font equivalent)
- [ ] No desktop clutter (close unnecessary windows)
- [ ] No notifications enabled (Do Not Disturb mode)
- [ ] Browser dev tools closed
- [ ] Terminal output clean (no errors)

## Recording Best Practices

### Before Recording

1. **Clean Desktop**
   ```bash
   # Hide desktop icons (macOS)
   defaults write com.apple.finder CreateDesktop false
   killall Finder
   ```

2. **Enable Do Not Disturb**
   - macOS: Control Center → Focus → Do Not Disturb
   - Linux: Settings → Notifications → Do Not Disturb

3. **Close Unnecessary Apps**
   - Email clients
   - Chat applications
   - System monitors
   - Background processes

4. **Prepare Demo Script**
   - Have `docs/demo-storyboard.md` open on third monitor or printed
   - Practice the 60-second flow 2-3 times
   - Time yourself with a stopwatch

### During Recording

1. **Smooth Mouse Movements**
   - Move cursor deliberately
   - Avoid rapid movements
   - Pause briefly before clicking

2. **Clear Narration** (if recording audio)
   - Speak clearly and slowly
   - Pause between sentences
   - Avoid filler words ("um", "uh")

3. **Timing**
   - Follow the storyboard beats
   - Each beat is 3-5 seconds
   - Total: 60 seconds ±5 seconds

### After Recording

1. **Review Immediately**
   - Watch full recording
   - Check for:
     - Audio sync issues
     - Dropped frames
     - Text legibility
     - Timing accuracy

2. **Save Multiple Takes**
   - Name: `onboardops-demo-take-01.mp4`
   - Keep best 2-3 takes
   - Delete obvious failures

3. **Backup**
   ```bash
   # Copy to recordings directory
   mkdir -p docs/recordings/phase2
   cp ~/Videos/onboardops-demo-*.mp4 docs/recordings/phase2/
   ```

## Troubleshooting

### Issue: Dropped Frames

**Cause**: CPU/GPU overload  
**Solution**:
- Lower FPS to 30
- Use hardware encoder (H.264 NVENC/VideoToolbox)
- Close background applications
- Reduce canvas resolution to 1280×720

### Issue: Audio Desync

**Cause**: Sample rate mismatch  
**Solution**:
- Set audio to 48 kHz in OBS
- Disable audio enhancements in system settings
- Use external microphone instead of built-in

### Issue: Text Not Legible

**Cause**: Font size too small or compression artifacts  
**Solution**:
- Increase Bob IDE font size to 14pt+
- Increase dashboard font size in CSS
- Use higher bitrate (20+ Mbps)
- Disable downscaling

### Issue: Dashboard Not Updating

**Cause**: WebSocket connection failed  
**Solution**:
- Verify backend running: `curl localhost:8765/health`
- Check browser console for errors
- Restart telemetry service
- Use replay mode with pre-recorded session

## File Locations

After setup, you should have:

```
docs/recordings/
├── phase2/
│   ├── onboardops-test-01.mp4      # Test recording
│   ├── onboardops-demo-take-01.mp4 # Demo take 1
│   ├── onboardops-demo-take-02.mp4 # Demo take 2
│   └── session-data.jsonl          # Telemetry from recording
└── phase5/
    └── onboardops-final.mp4        # Final edited video
```

## Next Steps

After completing this setup:

1. ✅ Mark T5.6 as complete
2. → Proceed to T5.7 (Starter PR Opener)
3. → Use this rig for T5.8 (First Demo Recording)
4. → Use this rig for Phase 5 final video

## Acceptance Criteria

- [x] OBS or QuickTime configured
- [x] Test recording completed (30 seconds)
- [x] Recording plays back at 1080p60
- [x] Both monitors visible in frame
- [x] Text legible at 100% zoom
- [x] No dropped frames
- [x] Preset saved for reuse

---

**Owner**: Dev 5 (Integration Engineer)  
**Phase**: 2 (H+2 to H+10)  
**Time Budget**: 30 minutes  
**Dependencies**: Demo machine (T4.7)