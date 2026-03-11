# Block Ranking Redesign — Design Spec

**Date:** 2026-03-11
**Status:** Approved

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
collectionPct = Math.round(sum(totalPaid) / (totalHouses × ANNUAL_TARGET) × 100)
```

This is equivalent to averaging individual house completion percentages, but expressed as a single ratio. Simple, intuitive, and maps directly to "how much money has this block collected out of what's expected."

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
      collectionPct: total > 0 ? Math.round((sumPaid / (total * ANNUAL_TARGET)) * 100) : 0,
    }))
    .sort((a, b) => b.collectionPct - a.collectionPct || a.blok.localeCompare(b.blok))
}
```

**Key changes:**
- Accumulate `sumPaid` per block instead of only counting `lunas`
- Compute `collectionPct` from `sumPaid / (total * ANNUAL_TARGET)`
- Sort by `collectionPct` instead of `lunasPct`
- `lunasCount` is kept as supplementary data for the UI

---

### `src/components/LeaderboardView.jsx` — Block Ranking UI

| Element | Before | After |
|--------|--------|-------|
| Bar width | `block.lunasPct%` | `block.collectionPct%` |
| Header label | `% rumah lunas` | `% terkumpul` |
| Percentage display | `{block.lunasPct}%` | `{block.collectionPct}%` |
| House count | `{block.lunasCount}/{block.totalHouses} 🏠` | unchanged |

---

## Non-Goals

- No changes to house ranking logic (`getHouseLeaderboard`)
- No changes to `DashboardView` or `SearchView`
- No new data fields in `validated.json`

---

## Success Criteria

- A block where all houses paid partial amounts ranks higher than a block with only 1 fully-lunas house
- The displayed percentage reflects total money collected vs total money expected
- UI label clearly communicates the new metric (`% terkumpul`)
