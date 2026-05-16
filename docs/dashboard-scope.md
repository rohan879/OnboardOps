# OnboardOps Dashboard Scope

## Resolution Target: 1920×1080 (Desktop Only)

### Decision Rationale

For the IBM Bob Hackathon 2026, the OnboardOps dashboard is **intentionally locked to 1920×1080 resolution** with no mobile-responsive fallbacks. This is a strategic decision to maximize demo quality within the 48-hour time constraint.

### Technical Implementation

**Viewport Constraints:**
```typescript
// frontend/src/app/layout.tsx
export const viewport = {
  width: 1920,
  height: 1080,
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};
```

**CSS Lockdown:**
```css
/* frontend/src/app/globals.css */
body {
  min-width: 1920px;
  min-height: 1080px;
  overflow-x: hidden;
}
```

### Why Desktop-Only?

1. **Demo Recording Quality:** All hackathon submissions are recorded at 1920×1080 for consistency
2. **Time Efficiency:** Responsive design would consume 8-12 hours of the 48-hour window
3. **Target Audience:** Enterprise developers onboarding to repositories work on desktop machines
4. **Visual Fidelity:** Complex visualizations (dependency graphs, sparklines) require screen real estate
5. **IBM Design System:** IBM Carbon components are optimized for desktop-first workflows

### What This Means

**✅ Supported:**
- Desktop browsers at 1920×1080 or higher
- Chrome, Firefox, Safari, Edge (latest versions)
- Screen recording at 1080p
- Presentation mode on external displays

**❌ Not Supported:**
- Mobile devices (phones, tablets)
- Responsive breakpoints (768px, 1024px, etc.)
- Portrait orientation
- Browser zoom levels other than 100%

### Post-Hackathon Roadmap

Mobile support is **explicitly deferred** to post-hackathon development:

1. **Phase 4 (Post-Hackathon):** Add responsive breakpoints
2. **Phase 5:** Mobile-optimized card layouts
3. **Phase 6:** Touch-friendly interactions

### Testing Protocol

**Before Demo Recording:**
1. Set browser window to exactly 1920×1080
2. Verify no horizontal scroll at target resolution
3. Test all four cartography stages at full resolution
4. Confirm certification panel fits in right sidebar
5. Check stopwatch and header alignment

**Browser DevTools Settings:**
- Disable device emulation
- Set zoom to 100%
- Use "Responsive" mode set to 1920×1080
- Disable touch simulation

### Design Constraints

All UI components are designed with these fixed dimensions:

- **Header:** Full width, 64px height
- **Stepper:** Full width, 80px height
- **Main Panel:** ~1440px width (flexible)
- **Right Sidebar:** 384px width (fixed)
- **Footer:** Full width, 48px height

**Total Vertical Budget:**
- Header: 64px
- Stepper: 80px
- Content: 888px (flexible)
- Footer: 48px
- **Total:** 1080px

### Known Limitations

1. **No Mobile Fallback:** Accessing on mobile shows desktop layout (unusable)
2. **No Zoom Support:** Browser zoom breaks layout (by design)
3. **No Print Styles:** Dashboard is screen-only
4. **No Accessibility Zoom:** Screen magnification not tested

### Acceptance Criteria

- ✅ Dashboard renders pixel-perfect at 1920×1080
- ✅ No horizontal scroll at target resolution
- ✅ All components visible without vertical scroll (except transcript)
- ✅ Resizing browser window does not break layout
- ✅ Documentation explains desktop-only scope

### References

- **IBM Design System:** https://carbondesignsystem.com/
- **Demo Recording Specs:** 1920×1080, 60fps, H.264
- **Target Browsers:** Chrome 120+, Firefox 121+, Safari 17+

---

**Last Updated:** 2026-05-16  
**Status:** Locked for Hackathon Demo  
**Owner:** Dev 3 (Frontend/Dashboard)