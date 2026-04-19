# GAS Expenses Parity with convert-expenses.js

**Date:** 2026-04-19
**Status:** Approved
**Scope:** `scripts/google-apps-script/Code.gs` (expenses section only)

## Problem

`scripts/convert-expenses.js` and the expenses pipeline in `scripts/google-apps-script/Code.gs` produce the same JSON shape from different inputs (CSV vs. Google Sheet). On 2026-03-27, commit `31e9e7b` fixed a `sisaAnggaran` miscalculation in the JS converter but did not update `Code.gs`. The two sources have drifted: the next time the spreadsheet operator clicks **IPL Tools → Deploy Pengeluaran ke Website**, the live `src/data/expenses.json` will be overwritten with the pre-fix values.

## Goal

Align `Code.gs` with `convert-expenses.js`. `convert-expenses.js` is the source of truth.

## Audit Results

Compared every stage of the two pipelines. These match and need no change:

- Header detection (first row with column A = "keterangan", case-insensitive, after trim).
- Rutin column mapping: Keterangan / Masuk / Keluar = cols A / B / C (0, 1, 2).
- Insidental column mapping: Keterangan / Masuk / Keluar / Tanggal / Kategori = cols E / F / G / H / I (4, 5, 6, 7, 8).
- Row skip rules: break on empty keterangan, "total", or (rutin only) "sisa".
- Amount parsing: strip non-digits, `parseInt`, fallback 0. GAS additionally short-circuits numeric cell types — equivalent result.
- Date parsing: produces `YYYY-MM-DD` or `null`. GAS handles native `Date` objects from Sheets; JS parses strings via `new Date()`.
- Output shape: `{ lastUpdate, rutin, insidental, summary: { totalMasuk, totalKeluar, sisaAnggaran } }`.
- Rutin item shape: `{ keterangan, masuk: masuk || null, keluar: keluar || null }`.
- Insidental item shape: `{ keterangan, masuk: masuk || null, keluar: keluar || null, tanggal, kategori }`.
- `lastUpdate` format: `YYYY-MM-DD` from today's local date.

Two drifts found:

| # | Location in `Code.gs` | JS (source of truth) | GAS (drifted) |
|---|---|---|---|
| 1 | Line 444 | `totalMasuk = rutinTotalMasuk` | `totalMasuk = insidentalTotalMasuk` |
| 2 | Rutin loop, lines 386–404 | `rutinTotalMasuk` is declared and accumulated | Not declared, never accumulated |

Drift #2 exists because drift #1 is the current behavior — fixing #1 requires #2.

## Design

Two minimal edits to `buildExpensesJson` in `scripts/google-apps-script/Code.gs`.

### Edit 1 — accumulate `rutinTotalMasuk`

Inside the rutin-parsing block (currently around lines 385–404):

- Declare `var rutinTotalMasuk = 0;` next to the existing `var rutinTotalKeluar = 0;`.
- Inside the loop, add `rutinTotalMasuk += masuk;` next to the existing `rutinTotalKeluar += keluar;`.

### Edit 2 — use `rutinTotalMasuk` as `totalMasuk`

At line 444, change:

```js
var totalMasuk = insidentalTotalMasuk;
```

to:

```js
var totalMasuk = rutinTotalMasuk;
```

### Out of scope

- `insidentalTotalMasuk` stays computed but unused. The JS version also computes-and-discards it, so leaving it in place keeps the two files structurally symmetric; a future editor diffing them sees the same variable set.
- No changes to the `validated.json` pipeline, the GitHub push helpers, the menu, or the `onEditHandler`.
- No refactor, no added configuration, no additional columns or fields.

## Verification

`Code.gs` runs only inside Google Apps Script. Verification plan:

1. Before running, record the current `src/data/expenses.json` summary as a baseline.
2. Paste the updated `Code.gs` into the Script Editor of the IPL 2026 spreadsheet.
3. From the sheet, run **IPL Tools → Deploy Pengeluaran ke Website**.
4. Inspect the resulting `src/data/expenses.json` and confirm:
   - `summary.totalMasuk` equals the sum of the **Masuk** column in the Rutin table (Sisa Kas 2025 + Iuran Warga), **not** the Insidental running total.
   - `summary.totalKeluar` is unchanged in formula (rutin Keluar + insidental Keluar).
   - `summary.sisaAnggaran === summary.totalMasuk - summary.totalKeluar`.
5. Re-running `npm run convert:expenses` locally against the matching CSV should produce the same three summary values. Any divergence after this change indicates a new drift.

Sanity check: if the GAS-produced `totalMasuk` is noticeably smaller than the Rutin Masuk sum — specifically, close to `rutinMasuk - rutinKeluar` — Edit 2 was not applied.

## Risks

- **Accidental overwrite.** Any prior deploy from the unfixed `Code.gs` would already have reverted `expenses.json`. Current `src/data/expenses.json` (HEAD) is the post-fix version, so no fix-up commit is needed before the GAS update — but anyone with edit access to the Script Editor could still trigger a regression until the updated script is pasted in.
- **Rutin-only totalMasuk assumption.** The fix relies on Insidental masuk being informational only (not part of the top-line income). This matches the commit message of `31e9e7b` ("Sisa Kas 2025 + Iuran Warga"). If that assumption changes, both the JS and GAS must change together.
