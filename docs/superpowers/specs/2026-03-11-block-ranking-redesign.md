# Block Ranking Redesign — Design Spec

**Date:** 2026-03-11
**Status:** In Review

---

## Problem

The current `getBlockLeaderboard()` ranks blocks by percentage of **fully-lunas houses** (binary: paid ≥ Rp 3,000,000 or not). This ignores partial payments entirely.

**Example of the flaw:** A block where all 10 houses paid 11/12 months (92% each) would score 0% and rank last — behind a block with 1 lunas house and 9 unpaid houses (10%).

---

## Goal

Rank blocks by **total payment collected vs total expected**, giving credit for partial payments.

---

## Chosen Approach

**Option 2 — Total paid / total target ratio:**

```
collectionPct = Math.min(100, Math.round(sum(totalPaid) / (totalHouses × ANNUAL_TARGET) × 100))
```

Simple and intuitive — maps directly to "how much money has this block collected out of what's expected." The `Math.min(100)` cap prevents a single overpaying house from pushing the block score above 100%. This is equivalent to averaging per-house completion percentages only when no house has overpaid; in the overpay case, block-level capping is applied instead.

`sumPaid` is accumulated from `r.totalPaid`, which is already computed by `getAllResidents()`. That function iterates `residents.json` — the canonical house roster (name + block + house number for all registered residents, separate from the payment transaction log in `validated.json`). Blocks not present in `residents.json` are naturally excluded from the result — they are not scored as 0%.

---

## Changes

### `src/data/helpers.js` — `getBlockLeaderboard()`

**Before (current):**
```js
export function getBlockLeaderboard() {
  const all = getAllResidents()
  const blocks = {}
  for (const r of all) {
    if (!blocks[r.blok]) blocks[r.blok] = { total: 0, lunas: 0 }
    blocks[r.blok].total++
    if (r.isLunas) blocks[r.blok].lunas++
  }
  return Object.entries(blocks)
    .map(([blok, { total, lunas }]) => ({
      blok,
      totalHouses: total,
      lunasCount: lunas,
      lunasPct: total > 0 ? Math.round((lunas / total) * 100) : 0,
    }))
    .sort((a, b) => b.lunasPct - a.lunasPct || a.blok.localeCompare(b.blok))
}
```

**After:**
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

**Key changes:**
- Accumulate `sumPaid` per block from `r.totalPaid` (computed by `getAllResidents()`) instead of only counting `lunas`
- Compute `collectionPct` from `Math.min(100, Math.round(sumPaid / (total * ANNUAL_TARGET) * 100))` — the `* 100` converts the ratio to a percentage; the cap prevents overpay inflation at the block level
- `ANNUAL_TARGET` is already defined at module scope in `helpers.js` (line 8)
- Sort by `collectionPct` instead of `lunasPct`
- `lunasCount` is kept as supplementary data for the UI

---

### `src/components/LeaderboardView.jsx` — Block Ranking UI

| Element | File location | Before | After |
|--------|--------------|--------|-------|
| CSS bar fill width (`--progress-width`) | line 85 | `\`${block.lunasPct}%\`` | `\`${block.collectionPct}%\`` |
| Percentage label text | line 90 | `{block.lunasPct}%` | `{block.collectionPct}%` |
| Header label text | line 61 | `% rumah lunas` | `% terkumpul` |
| House count | unchanged | `{block.lunasCount}/{block.totalHouses} 🏠` | unchanged |

Note: only the text content of the header label changes — surrounding element/class remains the same.

---

## Non-Goals

- No changes to house ranking logic (`getHouseLeaderboard`)
- No changes to `DashboardView` or `SearchView`
- No new data fields in `validated.json`

---

## Success Criteria

- A block where all houses paid partial amounts ranks higher than a block with only 1 fully-lunas house
- Given a block with 2 houses each paying Rp 1,500,000, `collectionPct` equals 50
- `collectionPct` is capped at 100 at the block level: `Math.min(100, ...)` is applied after summing all house payments, so a single overpaying house cannot push the block score above 100%
- Blocks absent from `residents.json` are excluded from the ranking (not scored as 0%)
- UI label shows `% terkumpul` instead of `% rumah lunas`
- The CSS progress bar fill (`--progress-width`) reflects the new `collectionPct` value
