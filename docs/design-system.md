# OnboardOps Design System

## Overview

OnboardOps follows the **IBM Design System** (Carbon Design System) for visual consistency with IBM's enterprise design language. This document codifies our implementation of IBM's design principles.

---

## Typography

### Font Families

```css
--font-ibm-plex-sans: 'IBM Plex Sans', sans-serif;
--font-ibm-plex-serif: 'IBM Plex Serif', serif;
--font-ibm-plex-mono: 'IBM Plex Mono', monospace;
```

### Type Scale

| Element | Font | Weight | Size | Line Height | Usage |
|---------|------|--------|------|-------------|-------|
| **H1** | IBM Plex Sans | 700 (Bold) | 32px | 40px | Page titles |
| **H2** | IBM Plex Sans | 600 (Semibold) | 24px | 32px | Section headers |
| **H3** | IBM Plex Sans | 600 (Semibold) | 18px | 24px | Card titles |
| **Body** | IBM Plex Sans | 400 (Regular) | 14px | 20px | Main content |
| **Body Small** | IBM Plex Sans | 400 (Regular) | 12px | 16px | Secondary text |
| **Caption** | IBM Plex Sans | 400 (Regular) | 11px | 14px | Labels, metadata |
| **Code** | IBM Plex Mono | 400 (Regular) | 13px | 20px | Code snippets |
| **Questions** | IBM Plex Serif | 400 (Regular) | 16px | 24px | Certification quiz |

### Typography Rules

1. **Headings:** Always use IBM Plex Sans Bold or Semibold
2. **Body Text:** IBM Plex Sans Regular for readability
3. **Code:** IBM Plex Mono for all code, file paths, and technical identifiers
4. **Emphasis:** IBM Plex Serif for certification questions (typographic contrast)
5. **Never mix:** Don't use system fonts or fallbacks

---

## Color Palette

### Primary Colors

```css
/* IBM Blue - Primary Actions */
--color-ibm-blue-60: #0F62FE;  /* Buttons, links, primary UI */
--color-ibm-blue-70: #0043CE;  /* Hover states */

/* IBM Gray - Text & Backgrounds */
--color-ibm-gray-10: #F4F4F4;  /* Light backgrounds */
--color-ibm-gray-20: #E0E0E0;  /* Borders, dividers */
--color-ibm-gray-70: #525252;  /* Secondary text */
--color-ibm-gray-100: #161616; /* Primary text */

/* IBM Green - Success States */
--color-ibm-green-50: #24A148; /* Pass badges, success messages */

/* IBM Red - Error States */
--color-ibm-red-50: #DA1E28;   /* Fail badges, error messages */

/* IBM Orange - Warning States */
--color-ibm-orange-40: #FF832B; /* Partial badges, warnings */

/* IBM Purple - Accent */
--color-ibm-purple-50: #8A3FFC; /* Entry points, special highlights */
```

### Color Usage Matrix

| Context | Color | Hex | Usage |
|---------|-------|-----|-------|
| **Primary Action** | IBM Blue 60 | `#0F62FE` | Buttons, links, active states |
| **Primary Text** | IBM Gray 100 | `#161616` | Headings, body text |
| **Secondary Text** | IBM Gray 70 | `#525252` | Captions, metadata |
| **Background** | White | `#FFFFFF` | Main canvas |
| **Surface** | IBM Gray 10 | `#F4F4F4` | Cards, panels |
| **Border** | IBM Gray 20 | `#E0E0E0` | Dividers, outlines |
| **Success** | IBM Green 50 | `#24A148` | Pass states, checkmarks |
| **Error** | IBM Red 50 | `#DA1E28` | Fail states, errors |
| **Warning** | IBM Orange 40 | `#FF832B` | Partial states, cautions |
| **Info** | IBM Blue 60 | `#0F62FE` | In-progress, info messages |

### Opacity Levels

- **10%:** Subtle backgrounds (`bg-ibm-blue-60/10`)
- **20%:** Hover states
- **30%:** Border colors
- **100%:** Text and icons

---

## Spacing System

### 8px Grid

All spacing follows an **8px base unit**:

```
4px  = 0.5 unit (rare, only for tight spacing)
8px  = 1 unit
16px = 2 units (component padding)
24px = 3 units (section gaps)
32px = 4 units (major sections)
48px = 6 units (page margins)
64px = 8 units (header height)
```

### Component Spacing

| Component | Padding | Gap | Margin |
|-----------|---------|-----|--------|
| **Card** | 24px | - | 16px bottom |
| **Button** | 12px 24px | - | - |
| **Input** | 12px 16px | - | - |
| **Header** | 16px 24px | - | - |
| **Section** | - | 24px | 32px bottom |
| **List Item** | 12px 16px | 8px | - |
| **Badge** | 4px 12px | - | - |

### Layout Grid

```
Header:     64px height
Stepper:    80px height
Content:    Flexible (min 888px)
Footer:     48px height
Sidebar:    384px width (fixed)
Main:       ~1440px width (flexible)
```

---

## Component Patterns

### Cards

**Structure:**
```
┌─────────────────────────────────┐
│ Header (64px)                   │ ← 24px padding
│ ├─ Icon (20px)                  │
│ ├─ Title (18px Bold)            │
│ └─ Status Badge                 │
├─────────────────────────────────┤
│ Body (flexible)                 │ ← 24px padding
│ └─ Content                      │
└─────────────────────────────────┘
```

**States:**
- **Pending:** Gray border, 60% opacity
- **In-Progress:** Blue border, shimmer effect
- **Complete:** Green border, 100% opacity
- **Error:** Red border, error message

### Buttons

**Primary:**
- Background: IBM Blue 60
- Text: White
- Padding: 12px 24px
- Border Radius: 4px
- Hover: IBM Blue 70

**Secondary:**
- Background: Transparent
- Text: IBM Blue 60
- Border: 1px IBM Blue 60
- Padding: 12px 24px

### Badges

**Grade Badges:**
- **Pass:** Green background (10% opacity), green text, green border (30% opacity)
- **Partial:** Orange background (10% opacity), orange text, orange border (30% opacity)
- **Fail:** Red background (10% opacity), red text, red border (30% opacity)

**Status Badges:**
- Padding: 4px 12px
- Border Radius: 16px (pill shape)
- Font Size: 12px
- Font Weight: 500 (Medium)

---

## Animation Guidelines

### Timing Functions

```typescript
// Shared easing curves
ease-in-out: cubic-bezier(0.4, 0, 0.2, 1)
ease-out: cubic-bezier(0, 0, 0.2, 1)
ease-in: cubic-bezier(0.4, 0, 1, 1)
```

### Duration Scale

- **Fast:** 150ms (hover, focus)
- **Normal:** 300ms (transitions, fades)
- **Slow:** 500ms (complex animations)
- **Very Slow:** 800ms (shimmer, pulse)

### Animation Patterns

| Pattern | Duration | Easing | Usage |
|---------|----------|--------|-------|
| **Fade In** | 300ms | ease-out | Card appearance |
| **Scale Up** | 500ms | spring | Grade badges |
| **Shimmer** | 2000ms | linear | In-progress state |
| **Pulse** | 800ms | ease-in-out | Emphasis |
| **Shake** | 400ms | ease-in-out | Error feedback |
| **Slide In** | 300ms | spring | Banners |

---

## Accessibility

### Contrast Ratios

All text meets **WCAG AA** standards:

- **Normal Text:** 4.5:1 minimum
- **Large Text:** 3:1 minimum
- **UI Components:** 3:1 minimum

### Focus States

- **Outline:** 2px solid IBM Blue 60
- **Offset:** 2px
- **Border Radius:** Matches component

### Keyboard Navigation

- All interactive elements are keyboard accessible
- Tab order follows visual hierarchy
- Focus indicators are always visible

---

## IBM Design System Compliance

### Alignment with Carbon

OnboardOps implements these Carbon Design System principles:

1. **Typography:** IBM Plex font family
2. **Color:** IBM Design Language color palette
3. **Spacing:** 8px grid system
4. **Motion:** Purposeful, productive animations
5. **Iconography:** Lucide React icons (Carbon-compatible)

### Deviations from Carbon

1. **No Carbon Components:** Built custom components for hackathon speed
2. **Simplified Grid:** Fixed 1920×1080 instead of responsive 16-column grid
3. **Custom Animations:** Framer Motion instead of Carbon motion tokens
4. **Lucide Icons:** Instead of Carbon icons (similar visual weight)

### Post-Hackathon Alignment

Future work to increase Carbon compliance:

1. Migrate to `@carbon/react` components
2. Implement 16-column responsive grid
3. Use Carbon motion tokens
4. Replace Lucide icons with Carbon icons
5. Add Carbon themes support

---

## Design Tokens

### CSS Custom Properties

```css
:root {
  /* Colors */
  --color-background: #ffffff;
  --color-foreground: #161616;
  --color-primary: #0F62FE;
  --color-success: #24A148;
  --color-error: #DA1E28;
  --color-warning: #FF832B;
  
  /* Typography */
  --font-sans: 'IBM Plex Sans', sans-serif;
  --font-serif: 'IBM Plex Serif', serif;
  --font-mono: 'IBM Plex Mono', monospace;
  
  /* Spacing */
  --spacing-unit: 8px;
  --spacing-xs: 4px;
  --spacing-sm: 8px;
  --spacing-md: 16px;
  --spacing-lg: 24px;
  --spacing-xl: 32px;
  
  /* Layout */
  --header-height: 64px;
  --stepper-height: 80px;
  --footer-height: 48px;
  --sidebar-width: 384px;
}
```

---

## Component Checklist

### Visual Audit Checklist

- [ ] All headings use IBM Plex Sans Bold/Semibold
- [ ] All body text uses IBM Plex Sans Regular
- [ ] All code uses IBM Plex Mono
- [ ] Certification questions use IBM Plex Serif
- [ ] All colors match IBM Design Language palette
- [ ] All spacing follows 8px grid
- [ ] All animations use defined timing functions
- [ ] All interactive elements have focus states
- [ ] All text meets WCAG AA contrast ratios
- [ ] No horizontal scroll at 1920×1080
- [ ] All components render pixel-perfect

---

## References

- **IBM Design Language:** https://www.ibm.com/design/language/
- **Carbon Design System:** https://carbondesignsystem.com/
- **IBM Plex Fonts:** https://github.com/IBM/plex
- **WCAG 2.1 Guidelines:** https://www.w3.org/WAI/WCAG21/quickref/

---

**Last Updated:** 2026-05-16  
**Version:** 1.0.0  
**Owner:** Dev 3 (Frontend/Dashboard)