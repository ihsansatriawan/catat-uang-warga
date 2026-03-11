# Block Ranking by Collection % Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Change block ranking from "% of fully-lunas houses" to "% of total IPL collected vs expected" so partial payments count toward a block's score.

**Architecture:** Two focused changes — update the `getBlockLeaderboard()` function in `helpers.js` to compute `collectionPct` from `sumPaid / (totalHouses × ANNUAL_TARGET)`, then update the three `lunasPct` references in `LeaderboardView.jsx` to use `collectionPct` and update the header label.

**Tech Stack:** React 19, Vite, no test runner — verification is manual via dev server.

**Spec:** `docs/superpowers/specs/2026-03-11-block-ranking-redesign.md`

---

## Chunk 1: Update `getBlockLeaderboard()` in helpers.js

### Task 1: Update block ranking logic

**Files:**
- Modify: `src/data/helpers.js:69-85`

- [ ] **Step 1: Verify current behavior before changing**

  Start the dev server and note the current leaderboard order:
  ```bash
  npm run dev
  ```
  Open `http://localhost:5173/leaderboard` in the browser. Screenshot or note the current block ranking order and percentages. This is your baseline.

- [ ] **Step 2: Update `getBlockLeaderboard()` in `src/data/helpers.js`**

  Replace the current function (lines 69–85) with:

  ```js
  export function getBlockLeaderboard() {
    const all = getAllResidents()
    const blocks = {}
    for (const r of all) {
      if (!blocks[r.blok]) blocks[r.blok] = { total: 0, lunas: 0, sumPaid: 0 }
      blocks[r.blok].total++
      blocks[r.blok].sumPaid += r.totalPaid
      if (r.isLunas) blocks[r.blok].lunas++
    }
    return Object.entries(blocks)
      .map(([blok, { total, lunas, sumPaid }]) => ({
        blok,
        totalHouses: total,
        lunasCount: lunas,
        sumPaid,
        collectionPct: total > 0 ? Math.min(100, Math.round((sumPaid / (total * ANNUAL_TARGET)) * 100)) : 0,
      }))
      .sort((a, b) => b.collectionPct - a.collectionPct || a.blok.localeCompare(b.blok))
  }
  ```

  Key changes:
  - Accumulator gains `sumPaid: 0` field
  - `blocks[r.blok].sumPaid += r.totalPaid` accumulates raw payment per block
  - New field `collectionPct` replaces `lunasPct` — computed as `Math.min(100, Math.round(sumPaid / (total * ANNUAL_TARGET) * 100))`
  - `sumPaid` is returned (kept for potential future use)
  - Sort key changes from `lunasPct` to `collectionPct`
  - `lunasCount` is kept for the UI house count display

- [ ] **Step 3: Verify no JS errors in the terminal**

  The dev server should still be running. Check the terminal output — there should be no import or runtime errors.

- [ ] **Step 4: Commit**

  ```bash
  git add src/data/helpers.js
  git commit -m "feat: rank blocks by total collection % instead of lunas count"
  ```

---

## Chunk 2: Update LeaderboardView.jsx UI references

### Task 2: Update block ranking UI to use `collectionPct`

**Files:**
- Modify: `src/components/LeaderboardView.jsx:61,85,90`

- [ ] **Step 1: Update the CSS progress bar fill (line 85)**

  Find this line in `LeaderboardView.jsx`:
  ```jsx
  '--progress-width': `${block.lunasPct}%`,
  ```
  Replace with:
  ```jsx
  '--progress-width': `${block.collectionPct}%`,
  ```

- [ ] **Step 2: Update the percentage label text (line 90)**

  Find:
  ```jsx
  {block.lunasPct}%
  ```
  Replace with:
  ```jsx
  {block.collectionPct}%
  ```

- [ ] **Step 3: Update the header label text (line 61)**

  Find:
  ```jsx
  % rumah lunas
  ```
  Replace with:
  ```jsx
  % terkumpul
  ```

- [ ] **Step 4: Verify in browser**

  With the dev server still running, open `http://localhost:5173/leaderboard`.

  Check:
  1. Block ranking order may differ from the old baseline (partial payers now count)
  2. The header label now reads `% terkumpul` (not `% rumah lunas`)
  3. The progress bar for each block fills proportionally to `collectionPct`
  4. The house count (`X/Y 🏠`) still shows correctly
  5. No blank/NaN values appear

  **Manual test case:** If you can identify a block where some houses have partial payments (e.g., paid 6/12 months), it should now contribute to the block's score rather than being counted as 0.

- [ ] **Step 5: Run lint to catch any issues**

  ```bash
  npm run lint
  ```
  Expected: no errors.

- [ ] **Step 6: Commit**

  ```bash
  git add src/components/LeaderboardView.jsx
  git commit -m "feat: update leaderboard UI to display collectionPct for block ranking"
  ```

---

## Final Verification

- [ ] **Build production bundle and confirm no errors**

  ```bash
  npm run build
  ```
  Expected: build completes with no errors or warnings about undefined variables.

- [ ] **Confirm spec criteria are met**

  Against `docs/superpowers/specs/2026-03-11-block-ranking-redesign.md` success criteria:

  | Criterion | How to verify |
  |-----------|--------------|
  | Partial payers rank a block higher | Observe ranking — blocks with many partial payers should rank above blocks with 1 lunas + rest unpaid |
  | 2 houses × Rp 1,500,000 = 50% | Use browser console: `import('./src/data/helpers.js').then(m => console.log(m.getBlockLeaderboard()))` or inspect output values |
  | `collectionPct` capped at 100 | No block shows > 100% |
  | Blocks absent from `residents.json` excluded | Confirm only blocks A–F (those in `residents.json`) appear; no phantom block with 0% appears in the leaderboard |
  | Label shows `% terkumpul` | Visual check on leaderboard page |
  | Progress bar reflects `collectionPct` | Bar width matches the displayed % |
