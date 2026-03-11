# Leaderboard Page Design

## Overview

Add a leaderboard page to the IPL payment checker app with two sections: block-vs-block ranking and per-house ranking. Accessible via react-router at `/leaderboard`.

## Architecture

### Routing

- Add `react-router-dom` to the project
- Use `HashRouter` (avoids need for server-side SPA fallback config — works with static hosting out of the box)
- Routes: `/` (SearchView), `/leaderboard` (LeaderboardView)
- DashboardView remains state-based from SearchView (intentional — avoids exposing resident data in shareable URLs)
- Router provider (`HashRouter`) wraps `<App />` in `src/main.jsx`
- Navigation: link on SearchView to `/leaderboard`, back button on leaderboard to `/`

### Data Layer

**Master resident registry** (`src/data/residents.json`):
- Generated from `raw_data/IPL 2026 - Data warga.csv` via a new `scripts/convert-residents.js` script
- CSV format: `BLOK,NOMOR RUMAH DAN NAMA` (e.g., `A,3. Agus Herianto`)
- Script splits on first `.` to extract house number and name
- Output format:
```json
[
  { "blok": "A", "nomorRumah": "3", "namaPemilik": "Agus Herianto" },
  ...
]
```
- House counts are derived dynamically from `residents.json` (not hard-coded)

**Shared constants** (`src/data/constants.js` — new file):
- Extract `BLOCK_COLORS` and `BLOCK_COLORS_UNSELECTED` from `SearchView.jsx` into a shared module
- Imported by both `SearchView.jsx` and `LeaderboardView.jsx`

**New helper functions** in `src/data/helpers.js`:
- `getAllResidents()` — returns all residents from `residents.json` merged with payment data from `validated.json`
  - Merged object shape: `{ blok, nomorRumah, namaPemilik, totalPaid, annualTarget, isLunas, completionPct, monthsPaid }`
  - `residents.json` is authoritative for the master list and names
  - Payment data matched by `blok + nomorRumah`
  - Houses in `validated.json` but missing from `residents.json` are excluded (data integrity — registry is the source of truth)
  - Completion % capped at 100 for ranking purposes (overpayment does not rank higher than lunas)
- `getBlockLeaderboard()` — returns blocks ranked by % of houses lunas, house counts derived from `residents.json`
- `getHouseLeaderboard(blok?)` — returns houses ranked by payment completion %, optionally filtered by block
  - Tie-breaker: same % → sort by block letter, then house number

### Ranking Metrics

**Block ranking**: % of houses that are fully paid (lunas). E.g., if block E has 7 houses and 3 are lunas → 43%. Secondary info: X/Y houses lunas.

**House ranking**: payment completion % (`totalPaid / annualTarget * 100`, capped at 100). Secondary info: total amount paid + months covered (totalPaid / 250000).

## Page Layout

Single scrollable page, stacked sections:

### 1. Sticky Header
- Back button ("Kembali") linking to `/`
- Page title "Leaderboard"
- Matches existing DashboardView header style

### 2. Block Ranking Section
- Title: "🏆 Ranking Blok"
- Horizontal bar chart, sorted descending by % lunas
- Each row: block letter (colored) | neobrutalist bordered bar with block color fill | percentage | `X/Y 🏠`
- Bar style: thick 2px borders, block-specific colors from `BLOCK_COLORS`, gradient fill

### 3. House Ranking Section
- Title: "🏠 Ranking Per Rumah"
- Block filter chips: "Semua" (default) + A through F, using `BLOCK_COLORS` scheme
- Ranked list of houses with payments:
  - Each row: rank number, block-house badge (colored), owner name, inline mini progress bar, completion %
  - Secondary line: total paid + months covered
  - Progress bar color: green if lunas, violet if in progress
- Collapsible "Belum bayar" section at bottom:
  - Lists houses with zero payments from the master registry
  - Shows block-house badge and owner name
  - Collapsed by default
- Tapping a house row does NOT navigate to dashboard (intentional — keeps leaderboard self-contained)

### Visual Style
- Neobrutalist: thick borders, hard shadows, bold typography, block colors
- Pure CSS bars (no charting library)
- Matches existing app design system (border-2, border-slate-dark, rounded-3xl, shadow-hard, font-heading/font-body)
- Animations: animate-slide-up with stagger classes

## New Files
- `src/components/LeaderboardView.jsx` — leaderboard page component
- `src/data/residents.json` — master resident registry (generated)
- `src/data/constants.js` — shared constants (BLOCK_COLORS)
- `scripts/convert-residents.js` — CSV to JSON converter for resident data

## Modified Files
- `src/data/helpers.js` — add leaderboard data functions + import residents.json
- `src/App.jsx` — add react-router routes for `/` and `/leaderboard`
- `src/main.jsx` — wrap App with HashRouter
- `src/components/SearchView.jsx` — import BLOCK_COLORS from constants, add navigation link to leaderboard
- `package.json` — add `react-router-dom` dependency, add `convert:residents` script

## Scripts
```bash
npm run convert:residents  # convert raw_data/IPL 2026 - Data warga.csv → src/data/residents.json
```
