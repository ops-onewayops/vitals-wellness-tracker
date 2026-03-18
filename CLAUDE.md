# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev      # Start dev server at localhost:3000
npm run build    # Production build to /dist
npm run preview  # Preview production build
```

No test runner or linter is configured.

## Architecture

**Stack:** React 18 + Vite 5, Recharts for charts, IndexedDB (`idb`) for storage, Anthropic Claude API for AI features. PWA with Service Worker.

**File structure:**
```
src/
  App.jsx              ← Shell: data loading, routing, nav, toast
  theme.js             ← G colors, PAIN_LOCS, PAIN_TYPES, SUPP_LIST, GOAL_OPTS, DEF
  intel.js             ← useVitalsIntel(data) hook — cross-domain intelligence engine
  helpers.js           ← td(), uid(), hr(), ld(), sv(), toB64(), vo2(), SK
  api.js               ← Anthropic API wrapper (unchanged)
  storage.js           ← IndexedDB layer (unchanged)
  components/
    Glass.jsx          ← Glass, GradCard, Ring, Fld, Btn, Slider, Modal, EI, Section
    BottomNav.jsx      ← 3-tab nav (Home/Log/Coach) + gear icon (Settings)
    Toast.jsx          ← Toast component
  pages/
    Home.jsx           ← Dashboard: recovery rings, signals, vitals grid, Today feed
    Log.jsx            ← Unified logging: AI food entry + accordion category forms
    Coach.jsx          ← AI coach chat + full analysis + history + memory
    Settings.jsx       ← Profile, targets, API key, workout builder, stacks, pain, PRs, feedback, data
```

**No backend.** All data lives in IndexedDB on-device. Users supply their own Anthropic API key. Data export/import is JSON.

## Data Model

All app state lives in a single `data` object in `App.jsx`, loaded from IndexedDB on mount. Top-level keys: `profile`, `nutrition`, `training`, `postWorkout`, `prs`, `painLog`, `bodyMetrics`, `sleep`, `lifestyle`, `hydration`, `supplements`, `healthImports`, `heartRate`, `ecg`, `bloodOx`, `respiratory`, `stepsData`, `watchWorkouts`, `insights`, `aiMemory`, `suppStacks`, `feedback`.

## Navigation

3-tab bottom nav + gear: **Home / Log / Coach / ⚙️**

- **Home** — Dashboard (recovery score, daily rings, smart signals, Today feed)
- **Log** — Unified logging: AI text/photo food entry + 10 category accordion forms
- **Coach** — AI chat (with `executeLogBlock` log parser), full analysis, history, memory
- **Settings** (gear icon) — Profile, targets, API key, workout builder, stacks, pain log, PRs, feedback, data export/import

## Intelligence Engine

`useVitalsIntel` hook computes cross-domain signals from raw data: recovery score (0–100), muscle freshness by group, deficit calculations, and contextual nudges. This is the core analytical layer consumed by all tabs.

## Styling

No CSS framework or files. All styles are inline React style props. Dark theme with glass morphism. Color constants in a `G` object in App.jsx. Mobile-first, max-width 480px, safe-area insets for notched devices.
