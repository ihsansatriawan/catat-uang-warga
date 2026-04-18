# GAS Expenses Parity Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Align `scripts/google-apps-script/Code.gs` `buildExpensesJson` with `scripts/convert-expenses.js` (source of truth) so the spreadsheet's deploy button produces the same `expenses.json` as the local CSV converter.

**Architecture:** Two in-place edits to a single function in `Code.gs`. No new files. `convert-expenses.js` is not touched — it is the reference. The script runs inside Google Apps Script, so there is no local test runner; verification is done by structural inspection (code diff) and a parity checklist against the JS source.

**Tech Stack:** Google Apps Script (V8 runtime), Node.js 20+ (for the JS reference converter).

**Spec:** `docs/superpowers/specs/2026-04-19-gas-expenses-parity-design.md`

---

## File Structure

- Modify: `scripts/google-apps-script/Code.gs`
  - Function `buildExpensesJson` — rutin loop (currently lines ~384–404)
  - Function `buildExpensesJson` — totals block (currently line ~444)

No new files. No tests added (GAS has no local test harness in this repo; the JS converter already exists and functions as the parity reference).

---

## Task 1: Add `rutinTotalMasuk` accumulator

**Files:**
- Modify: `scripts/google-apps-script/Code.gs` — rutin parsing block in `buildExpensesJson` (around lines 385–404)

**Rationale:** `convert-expenses.js:89` declares `let rutinTotalMasuk = 0` and `convert-expenses.js:98` increments it inside the rutin loop. `Code.gs` is missing both. Task 2 depends on this variable existing.

- [ ] **Step 1: Declare the accumulator**

Open `scripts/google-apps-script/Code.gs`. Locate:

```js
  // Parse Rutin table (left: cols A, B, C)
  var rutin = [];
  var rutinTotalKeluar = 0;
```

Change to:

```js
  // Parse Rutin table (left: cols A, B, C)
  var rutin = [];
  var rutinTotalMasuk = 0;
  var rutinTotalKeluar = 0;
```

- [ ] **Step 2: Increment the accumulator inside the loop**

In the same function, locate the end of the rutin loop:

```js
    rutin.push({
      keterangan: keterangan,
      masuk: masuk || null,
      keluar: keluar || null
    });

    rutinTotalKeluar += keluar;
  }
```

Change to:

```js
    rutin.push({
      keterangan: keterangan,
      masuk: masuk || null,
      keluar: keluar || null
    });

    rutinTotalMasuk += masuk;
    rutinTotalKeluar += keluar;
  }
```

- [ ] **Step 3: Visual diff against JS source**

Open both files side by side:
- `scripts/convert-expenses.js` lines 88–100
- `scripts/google-apps-script/Code.gs` rutin block (now modified)

Verify both:
- Declare `rutinTotalMasuk` and `rutinTotalKeluar` before the loop.
- Increment both variables once per loop iteration.
- Use the same break condition (empty / "total" / "sisa").

The JS uses `let` and 0-indexed `row[0..2]`; the GAS uses `var` and `EXPENSES_CONFIG.RUTIN_*_COL - 1` (1-indexed config). These are stylistic only — the resulting column indices and accumulator semantics must match.

- [ ] **Step 4: Commit**

```bash
git add scripts/google-apps-script/Code.gs
git commit -m "fix(gas): accumulate rutinTotalMasuk in expenses build

Mirrors the accumulator present in scripts/convert-expenses.js so the
GAS pipeline can compute totalMasuk from rutin income. No behavior
change yet — the accumulator is not read until the next commit."
```

---

## Task 2: Use `rutinTotalMasuk` as `totalMasuk`

**Files:**
- Modify: `scripts/google-apps-script/Code.gs` — totals block in `buildExpensesJson` (around line 444)

**Rationale:** `convert-expenses.js:120` reads `const totalMasuk = rutinTotalMasuk`. `Code.gs:444` reads `var totalMasuk = insidentalTotalMasuk`. This is the bug fixed in the JS by commit `31e9e7b` that has not propagated to GAS. Swapping the right-hand side is the whole fix.

- [ ] **Step 1: Swap the source variable**

In `scripts/google-apps-script/Code.gs`, locate:

```js
  var totalMasuk = insidentalTotalMasuk;
  var totalKeluar = rutinTotalKeluar + insidentalTotalKeluar;
  var sisaAnggaran = totalMasuk - totalKeluar;
```

Change to:

```js
  var totalMasuk = rutinTotalMasuk;
  var totalKeluar = rutinTotalKeluar + insidentalTotalKeluar;
  var sisaAnggaran = totalMasuk - totalKeluar;
```

Only the first line changes.

- [ ] **Step 2: Confirm `insidentalTotalMasuk` is intentionally unused**

Search `Code.gs` for `insidentalTotalMasuk`. Expected: still declared (`var insidentalTotalMasuk = 0;`) and still accumulated inside the insidental loop, but no longer read anywhere. This matches the JS, which also computes `insidentalTotalMasuk` on `convert-expenses.js:104,116` but never reads it. Do **not** delete the accumulator — keeping it preserves structural symmetry between the two files.

- [ ] **Step 3: Line-by-line parity check against JS**

Open both files and confirm each pair matches in semantics:

| Concern | `convert-expenses.js` | `Code.gs` |
| --- | --- | --- |
| Rutin column indices | `row[0]`, `row[1]`, `row[2]` | cols A, B, C via `RUTIN_*_COL - 1` |
| Rutin break conditions | empty / "total" / "sisa" | same |
| Insidental column indices | `row[4..8]` | cols E, F, G, H, I via `INSIDENTAL_*_COL - 1` |
| Insidental break conditions | empty / "total" | same |
| `totalMasuk` source | `rutinTotalMasuk` | `rutinTotalMasuk` (after this task) |
| `totalKeluar` formula | `rutinTotalKeluar + insidentalTotalKeluar` | same |
| `sisaAnggaran` formula | `totalMasuk - totalKeluar` | same |
| `lastUpdate` format | `YYYY-MM-DD` (local) | `YYYY-MM-DD` (local) |
| Output object shape | `{ lastUpdate, rutin, insidental, summary }` | same |
| Rutin item shape | `{ keterangan, masuk: masuk \|\| null, keluar: keluar \|\| null }` | same |
| Insidental item shape | `{ keterangan, masuk: masuk \|\| null, keluar: keluar \|\| null, tanggal, kategori }` | same |

If any row disagrees after this change, stop and flag the drift. It should not — the audit in the spec already verified these match everywhere except the two spots fixed by Tasks 1 and 2.

- [ ] **Step 4: Commit**

```bash
git add scripts/google-apps-script/Code.gs
git commit -m "fix(gas): use rutinTotalMasuk for expenses totalMasuk

Mirrors scripts/convert-expenses.js (commit 31e9e7b). The GAS deploy
was overwriting src/data/expenses.json with insidentalTotalMasuk,
which is the running balance after rutin deductions and therefore
double-counts rutinTotalKeluar in sisaAnggaran. Use the rutin masuk
sum instead."
```

---

## Task 3: Operator verification (manual, post-deploy)

**Files:** none — operator step, tracked here so it is not forgotten.

**Context:** `Code.gs` is not in the runtime path of Vite/React; it lives in the Google Apps Script bound to the IPL 2026 spreadsheet. Pushing the branch to GitHub does not update the running script. The spreadsheet owner must paste the updated file into the Script Editor before the fix takes effect.

- [ ] **Step 1: Record baseline summary**

Read the current `src/data/expenses.json`:

```bash
node -e "console.log(JSON.stringify(require('./src/data/expenses.json').summary, null, 2))"
```

Write down `totalMasuk`, `totalKeluar`, `sisaAnggaran` as the expected-after values (the JSON is already correct from the last local `convert:expenses` run).

- [ ] **Step 2: Update the bound script**

In the IPL 2026 Google Spreadsheet: **Extensions → Apps Script**. Replace the contents of the `Code.gs` file in the editor with the updated file from this repo (`scripts/google-apps-script/Code.gs`). Save (Ctrl+S / Cmd+S).

- [ ] **Step 3: Trigger the deploy menu**

In the spreadsheet, **IPL Tools → Deploy Pengeluaran ke Website**. Confirm the dialog. Wait for the success toast.

- [ ] **Step 4: Diff the resulting commit on `main`**

On GitHub, open the commit made by the deploy (message starts with `chore: update expense data`). Confirm:

- `summary.totalMasuk` matches the baseline from Step 1 (or the new Rutin Masuk sum if Rutin rows changed between Step 1 and Step 3).
- `summary.sisaAnggaran === summary.totalMasuk - summary.totalKeluar`.
- `summary.totalMasuk` is **not** equal to what it would be under the old formula (`insidentalTotalMasuk`). A quick sniff: the old `totalMasuk` would approximately equal `rutinTotalMasuk - rutinTotalKeluar`. If you see that, the fix is not live — the Script Editor was not updated.

- [ ] **Step 5: Mark task done**

No commit needed — this is a runtime verification, not a code change. Update any ops notes if you keep them.

---

## Out of Scope (explicit)

- `validated.json` pipeline, `pushToGitHub`, `pushFileToGitHub`, `onEditHandler`, the menu, and all helpers (`parseBlokNomorNama`, `toIsoWIB`, `toIntAmount`, `getTodayISO`, `pad2`).
- Refactoring the `EXPENSES_CONFIG` 1-based column constants.
- Removing the unused `insidentalTotalMasuk` accumulator (intentionally kept for symmetry with the JS reference).
- Any `convert-expenses.js` changes.
