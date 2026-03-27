# Expense Tracker Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a `/pengeluaran` page showing expense data (rutin + insidental) with category filtering, WhatsApp broadcast copy, and Apps Script pipeline — all additive, no changes to existing code.

**Architecture:** New `expenses.json` data file pushed by Apps Script. New `ExpensesView.jsx` component at `/pengeluaran` route. Helper functions in `helpers.js` for data access and broadcast message generation. Conversion script as manual fallback.

**Tech Stack:** React 19, Vite, Tailwind CSS v4, lucide-react, Google Apps Script

---

## File Map

| Action | File | Responsibility |
|--------|------|----------------|
| Create | `src/data/expenses.json` | Placeholder expense data for dev |
| Create | `src/components/ExpensesView.jsx` | Expense page UI |
| Modify | `src/data/helpers.js` | Add `getExpenses()`, `getExpenseCategories()`, `generateExpenseBroadcastMessage()` |
| Modify | `src/App.jsx` | Add `/pengeluaran` route |
| Create | `scripts/convert-expenses.js` | Manual CSV → JSON fallback |
| Modify | `scripts/google-apps-script/Code.gs` | Add `buildExpensesJson()`, `deployExpensesToSite()`, extend menu |
| Modify | `package.json` | Add `convert:expenses` script |
| Modify | `CLAUDE.md` | Document new route, files, helpers |

---

### Task 1: Seed expense data and helper functions

**Files:**
- Create: `src/data/expenses.json`
- Modify: `src/data/helpers.js`

- [ ] **Step 1: Create placeholder `expenses.json`**

Create `src/data/expenses.json` with realistic sample data matching the spec schema:

```json
{
  "lastUpdate": "2026-03-27",
  "rutin": [
    { "keterangan": "Sisa Kas 2025", "masuk": 22408505, "keluar": null },
    { "keterangan": "Total Iuran Warga 2026", "masuk": 39450000, "keluar": null },
    { "keterangan": "Security Januari", "masuk": null, "keluar": 2450000 },
    { "keterangan": "Security Februari", "masuk": null, "keluar": 2700000 },
    { "keterangan": "Security Maret", "masuk": null, "keluar": 1700000 }
  ],
  "insidental": [
    { "keterangan": "sisa uang (potong biaya rutin)", "masuk": 55008505, "keluar": null, "tanggal": "2026-01-01", "kategori": "" },
    { "keterangan": "Bahan renovasi taman blok F", "masuk": null, "keluar": 1500000, "tanggal": "2026-01-03", "kategori": "Renovasi" },
    { "keterangan": "pasir renovasi taman blok F", "masuk": null, "keluar": 5300000, "tanggal": "2026-01-03", "kategori": "Renovasi" },
    { "keterangan": "semen 20 sak + deposit renovasi taman blok F", "masuk": null, "keluar": 1500000, "tanggal": "2026-01-07", "kategori": "Renovasi" },
    { "keterangan": "kran pipa renovasi taman blok F", "masuk": null, "keluar": 50000, "tanggal": "2026-01-08", "kategori": "Renovasi" },
    { "keterangan": "bahan semen renovasi taman blok F", "masuk": null, "keluar": 385000, "tanggal": "2026-01-10", "kategori": "Renovasi" },
    { "keterangan": "tukang renovasi taman blok F", "masuk": null, "keluar": 1000000, "tanggal": "2026-01-11", "kategori": "Renovasi" },
    { "keterangan": "pasir semen renovasi taman blok F", "masuk": null, "keluar": 900000, "tanggal": "2026-01-16", "kategori": "Renovasi" },
    { "keterangan": "Bahan renovasi taman blok F", "masuk": null, "keluar": 900000, "tanggal": "2026-01-20", "kategori": "Renovasi" },
    { "keterangan": "tukang renovasi taman blok F", "masuk": null, "keluar": 1000000, "tanggal": "2026-01-23", "kategori": "Renovasi" },
    { "keterangan": "semen + paralon renovasi taman blok F", "masuk": null, "keluar": 602500, "tanggal": "2026-01-24", "kategori": "Renovasi" },
    { "keterangan": "semen renovasi taman blok F", "masuk": null, "keluar": 722500, "tanggal": "2026-01-27", "kategori": "Renovasi" },
    { "keterangan": "fogging + angkut sampah fasum", "masuk": null, "keluar": 452500, "tanggal": "2026-01-31", "kategori": "Operasional" },
    { "keterangan": "tukang renovasi taman blok F", "masuk": null, "keluar": 1000000, "tanggal": "2026-02-02", "kategori": "Renovasi" },
    { "keterangan": "belanja taman renov blok F", "masuk": null, "keluar": 1500000, "tanggal": "2026-02-15", "kategori": "Renovasi" },
    { "keterangan": "net dan jaring lapangan blok F", "masuk": null, "keluar": 266400, "tanggal": "2026-02-21", "kategori": "Fasilitas" },
    { "keterangan": "ngebor lubang pipa lapangan", "masuk": null, "keluar": 250000, "tanggal": "2026-02-22", "kategori": "Fasilitas" },
    { "keterangan": "tukang 2 orang", "masuk": null, "keluar": 1800000, "tanggal": "2026-02-28", "kategori": "Renovasi" },
    { "keterangan": "THR 2026", "masuk": null, "keluar": 2750000, "tanggal": "2026-02-28", "kategori": "THR" },
    { "keterangan": "aksesoris bahan lapangan", "masuk": null, "keluar": 400000, "tanggal": "2026-03-25", "kategori": "Fasilitas" },
    { "keterangan": "satpam infal lebaran", "masuk": null, "keluar": 300000, "tanggal": "2026-03-26", "kategori": "Operasional" }
  ],
  "summary": {
    "totalMasuk": 55008505,
    "totalKeluar": 24578900,
    "sisaAnggaran": 30429605
  }
}
```

- [ ] **Step 2: Add helper functions to `helpers.js`**

Add at the top of `helpers.js`, after the existing imports:

```js
import expenses from './expenses.json'
```

Add at the bottom of `helpers.js`:

```js
export function getExpenses() {
  return expenses
}

export function getExpenseCategories() {
  const categories = expenses.insidental
    .map((item) => item.kategori)
    .filter((k) => k && k.trim() !== '')
  return [...new Set(categories)].sort()
}

export function generateExpenseBroadcastMessage() {
  const { summary, rutin, insidental } = expenses
  const lastUpdated = expenses.lastUpdate
  const dateStr = lastUpdated
    ? new Date(lastUpdated).toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        timeZone: 'Asia/Jakarta',
      })
    : new Date().toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        timeZone: 'Asia/Jakarta',
      })

  let msg = `*Laporan Pengeluaran IPL 2026*\nUpdate: ${dateStr}\n\n`
  msg += `Total Masuk: ${formatRupiah(summary.totalMasuk)}\n`
  msg += `Total Keluar: ${formatRupiah(summary.totalKeluar)}\n`
  msg += `Sisa Anggaran: ${formatRupiah(summary.sisaAnggaran)}\n`

  // Aggregate by category
  const categoryTotals = {}

  // Rutin: aggregate all keluar as "Security"
  for (const item of rutin) {
    if (item.keluar) {
      categoryTotals['Security'] = (categoryTotals['Security'] || 0) + item.keluar
    }
  }

  // Insidental: aggregate by kategori
  for (const item of insidental) {
    if (item.keluar && item.kategori) {
      categoryTotals[item.kategori] = (categoryTotals[item.kategori] || 0) + item.keluar
    }
  }

  const sortedCategories = Object.entries(categoryTotals).sort((a, b) => b[1] - a[1])

  if (sortedCategories.length > 0) {
    msg += `\n*Breakdown per Kategori:*\n`
    for (const [kategori, total] of sortedCategories) {
      msg += `• ${kategori}: ${formatRupiah(total)}\n`
    }
  }

  msg += `\nDetail lengkap: https://ipl-talago.netlify.app/pengeluaran`
  return msg
}
```

- [ ] **Step 3: Verify dev server still works**

Run: `npm run dev`
Expected: Dev server starts without errors. Existing pages still work.

- [ ] **Step 4: Commit**

```bash
git add src/data/expenses.json src/data/helpers.js
git commit -m "feat: add expense data and helper functions"
```

---

### Task 2: Add route and ExpensesView component

**Files:**
- Create: `src/components/ExpensesView.jsx`
- Modify: `src/App.jsx`

- [ ] **Step 1: Create `ExpensesView.jsx`**

Create `src/components/ExpensesView.jsx`:

```jsx
import { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, Copy, Check, Wallet } from 'lucide-react'
import {
  getExpenses,
  getExpenseCategories,
  generateExpenseBroadcastMessage,
  formatRupiah,
} from '../data/helpers'
import { trackEvent } from '../utils/tracking'

export default function ExpensesView() {
  const [selectedCategory, setSelectedCategory] = useState('')
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    trackEvent('open_expenses')
  }, [])

  const expenses = useMemo(() => getExpenses(), [])
  const categories = useMemo(() => getExpenseCategories(), [])
  const broadcastMessage = useMemo(() => generateExpenseBroadcastMessage(), [])

  const lastUpdated = useMemo(() => {
    const raw = expenses.lastUpdate
    if (!raw) return null
    return new Date(raw).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      timeZone: 'Asia/Jakarta',
    })
  }, [expenses.lastUpdate])

  const filteredInsidental = useMemo(() => {
    if (!selectedCategory) return expenses.insidental
    return expenses.insidental.filter((item) => item.kategori === selectedCategory)
  }, [expenses.insidental, selectedCategory])

  function handleCategoryFilter(kategori) {
    setSelectedCategory(kategori)
    if (kategori) {
      trackEvent('filter_expense_category', { kategori })
    }
  }

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(broadcastMessage)
    } catch {
      const textarea = document.createElement('textarea')
      textarea.value = broadcastMessage
      textarea.style.position = 'fixed'
      textarea.style.opacity = '0'
      document.body.appendChild(textarea)
      textarea.select()
      document.execCommand('copy')
      document.body.removeChild(textarea)
    }
    trackEvent('copy_expense_broadcast')
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  function formatTanggal(tanggal) {
    if (!tanggal) return ''
    return new Date(tanggal).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      timeZone: 'Asia/Jakarta',
    })
  }

  return (
    <div className="flex flex-col min-h-dvh animate-pop-in">
      {/* Sticky top bar */}
      <div className="sticky top-0 z-10 bg-cream/90 backdrop-blur-md border-b-2 border-slate-dark/10 safe-x px-4 py-3 flex items-center gap-3">
        <Link
          to="/"
          className="
            flex items-center gap-1.5 font-heading font-bold text-sm
            bg-yellow border-2 border-slate-dark rounded-full px-3 py-1.5
            shadow-hard-sm
            active:translate-x-[1px] active:translate-y-[1px] active:shadow-none
            transition-all
          "
        >
          <ArrowLeft size={16} strokeWidth={2.5} />
          Kembali
        </Link>
        <div className="flex-1 text-center">
          <span className="font-heading font-bold text-sm text-slate-dark/50">
            Pengeluaran 2026
          </span>
        </div>
        <Wallet size={20} strokeWidth={2.5} className="text-green" />
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto safe-x">
        <div className="max-w-lg mx-auto px-4 py-6 space-y-5">

          {/* Summary Cards */}
          <div className="space-y-3 animate-slide-up stagger-1">
            <div className="bg-white border-2 border-slate-dark rounded-2xl shadow-hard-sm p-4 flex items-center justify-between">
              <span className="font-heading font-bold text-sm text-slate-dark/70">Total Masuk</span>
              <span className="font-heading font-bold text-base text-green">
                {formatRupiah(expenses.summary.totalMasuk)}
              </span>
            </div>
            <div className="bg-white border-2 border-slate-dark rounded-2xl shadow-hard-sm p-4 flex items-center justify-between">
              <span className="font-heading font-bold text-sm text-slate-dark/70">Total Keluar</span>
              <span className="font-heading font-bold text-base text-red-500">
                {formatRupiah(expenses.summary.totalKeluar)}
              </span>
            </div>
            <div className="bg-white border-2 border-slate-dark rounded-2xl shadow-hard-sm p-4 flex items-center justify-between">
              <span className="font-heading font-bold text-sm text-slate-dark/70">Sisa Anggaran</span>
              <span className="font-heading font-bold text-base text-violet">
                {formatRupiah(expenses.summary.sisaAnggaran)}
              </span>
            </div>
          </div>

          {/* Pengeluaran Rutin Section */}
          <div className="bg-white border-2 border-slate-dark rounded-3xl shadow-hard overflow-hidden animate-slide-up stagger-2">
            <div className="px-5 py-4 border-b-2 border-slate-dark flex items-center gap-2">
              <span className="text-lg">📋</span>
              <h2 className="font-heading font-bold text-base">Pengeluaran Rutin</h2>
            </div>

            <div>
              {expenses.rutin.map((item, i) => (
                <div
                  key={i}
                  className={`
                    flex items-center justify-between px-5 py-3
                    ${i < expenses.rutin.length - 1 ? 'border-b border-slate-dark/10' : ''}
                  `}
                >
                  <span className="font-body text-sm text-slate-dark flex-1 min-w-0 truncate pr-3">
                    {item.keterangan}
                  </span>
                  {item.masuk && (
                    <span className="font-heading font-bold text-sm text-green flex-shrink-0">
                      +{formatRupiah(item.masuk)}
                    </span>
                  )}
                  {item.keluar && (
                    <span className="font-heading font-bold text-sm text-red-500 flex-shrink-0">
                      -{formatRupiah(item.keluar)}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Pengeluaran Insidental Section */}
          <div className="bg-white border-2 border-slate-dark rounded-3xl shadow-hard overflow-hidden animate-slide-up stagger-3">
            <div className="px-5 py-4 border-b-2 border-slate-dark flex items-center gap-2">
              <span className="text-lg">📊</span>
              <h2 className="font-heading font-bold text-base">Pengeluaran Insidental</h2>
            </div>

            {/* Category filter chips */}
            <div className="px-5 py-3 border-b border-slate-dark/10 flex gap-2 overflow-x-auto">
              <button
                onClick={() => handleCategoryFilter('')}
                className={`
                  flex-shrink-0 border-2 rounded-full px-3 py-1 font-heading font-bold text-xs
                  transition-all duration-150
                  ${!selectedCategory
                    ? 'bg-violet text-white border-violet shadow-hard-sm'
                    : 'bg-white text-slate-dark border-slate-dark hover:bg-violet/10'
                  }
                `}
              >
                Semua
              </button>
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => handleCategoryFilter(cat)}
                  className={`
                    flex-shrink-0 border-2 rounded-full px-3 py-1 font-heading font-bold text-xs
                    transition-all duration-150
                    ${selectedCategory === cat
                      ? 'bg-violet text-white border-violet shadow-hard-sm'
                      : 'bg-white text-slate-dark border-slate-dark hover:bg-violet/10'
                    }
                  `}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Insidental items */}
            <div>
              {filteredInsidental.map((item, i) => (
                <div
                  key={i}
                  className={`
                    flex items-center px-5 py-3 gap-3
                    ${i < filteredInsidental.length - 1 ? 'border-b border-slate-dark/10' : ''}
                  `}
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-body text-sm text-slate-dark truncate">
                      {item.keterangan}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      {item.tanggal && (
                        <span className="font-body text-xs text-slate-dark/40">
                          {formatTanggal(item.tanggal)}
                        </span>
                      )}
                      {item.kategori && (
                        <span className="font-body text-xs text-violet bg-violet/10 px-1.5 py-0.5 rounded">
                          {item.kategori}
                        </span>
                      )}
                    </div>
                  </div>
                  {item.masuk && (
                    <span className="font-heading font-bold text-sm text-green flex-shrink-0">
                      +{formatRupiah(item.masuk)}
                    </span>
                  )}
                  {item.keluar && (
                    <span className="font-heading font-bold text-sm text-red-500 flex-shrink-0">
                      -{formatRupiah(item.keluar)}
                    </span>
                  )}
                </div>
              ))}

              {filteredInsidental.length === 0 && (
                <div className="px-5 py-8 text-center">
                  <p className="font-body text-sm text-slate-dark/40">
                    Tidak ada pengeluaran untuk kategori ini
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Copy broadcast button */}
          <div className="animate-slide-up stagger-4 flex flex-col items-center gap-3">
            <button
              onClick={handleCopy}
              className={`
                flex items-center justify-center gap-2 w-full max-w-[280px]
                font-heading font-bold
                border-2 border-slate-dark rounded-full px-5 py-2.5
                shadow-hard-sm text-sm
                hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-hard
                active:translate-x-0 active:translate-y-0 active:shadow-none
                transition-all duration-150
                ${copied
                  ? 'bg-yellow text-slate-dark'
                  : 'bg-green text-white'
                }
              `}
            >
              {copied
                ? <><Check size={16} strokeWidth={2.5} /> Tersalin!</>
                : <><Copy size={16} strokeWidth={2.5} /> Salin Broadcast WA</>
              }
            </button>
          </div>

          {/* Last updated */}
          {lastUpdated && (
            <div className="text-center animate-fade-in mt-2">
              <p className="font-body text-xs text-slate-dark/40">
                Data diperbarui: <span className="font-semibold text-slate-dark/60">{lastUpdated}</span>
              </p>
            </div>
          )}

        </div>
      </div>

      {/* Bottom safe area */}
      <div className="safe-bottom bg-cream" />
    </div>
  )
}
```

- [ ] **Step 2: Add route to `App.jsx`**

Add import at line 4 (after BroadcastView import):

```js
import ExpensesView from './components/ExpensesView'
```

Add route after the `/broadcast` route (line 11):

```jsx
<Route path="/pengeluaran" element={<ExpensesView />} />
```

- [ ] **Step 3: Verify page renders**

Run: `npm run dev`
Navigate to: `http://localhost:5173/pengeluaran`
Expected: Page renders with summary cards, rutin table, insidental table with filter chips, and copy button.

- [ ] **Step 4: Commit**

```bash
git add src/components/ExpensesView.jsx src/App.jsx
git commit -m "feat: add expense tracker page at /pengeluaran"
```

---

### Task 3: Add navigation link to pengeluaran

**Files:**
- Modify: `src/components/SearchView.jsx`

- [ ] **Step 1: Read `SearchView.jsx` to find where to add link**

The SearchView already has links to `/leaderboard` and `/broadcast`. Add a link to `/pengeluaran` following the same pattern.

- [ ] **Step 2: Add pengeluaran link**

In `SearchView.jsx`, find the existing navigation links section and add a link to `/pengeluaran` using the same styling pattern. Use `Wallet` icon from lucide-react.

Add to the lucide-react import:

```js
import { ..., Wallet } from 'lucide-react'
```

Add the link next to the existing Leaderboard/Broadcast links:

```jsx
<Link
  to="/pengeluaran"
  className="flex items-center justify-center gap-2 w-full
    bg-white text-slate-dark font-heading font-bold
    border-2 border-slate-dark rounded-full px-5 py-2.5
    shadow-hard-sm text-sm
    hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-hard
    active:translate-x-0 active:translate-y-0 active:shadow-none
    transition-all duration-150"
>
  <Wallet size={16} strokeWidth={2.5} />
  Pengeluaran
</Link>
```

- [ ] **Step 3: Verify navigation works**

Run: `npm run dev`
Navigate to: `http://localhost:5173/`
Expected: Pengeluaran link visible and navigates to `/pengeluaran`.

- [ ] **Step 4: Commit**

```bash
git add src/components/SearchView.jsx
git commit -m "feat: add pengeluaran navigation link"
```

---

### Task 4: Apps Script — expense deploy functions

**Files:**
- Modify: `scripts/google-apps-script/Code.gs`

**Important:** The existing `pushToGitHub()` function hardcodes `CONFIG.FILE_PATH` (line 225). To maintain the additive-only principle, we create a new `pushFileToGitHub(filePath, content)` function that accepts a path parameter, reusing the same GitHub API logic.

- [ ] **Step 1: Add expense config constants**

Add after the existing `CONFIG` block (after line 43):

```js
var EXPENSES_CONFIG = {
  TAB: 'Pengeluaran Rutin',
  FILE_PATH: 'src/data/expenses.json',
  // Tabel Rutin (left): columns A, B, C (Keterangan, Masuk, Keluar)
  RUTIN_START_COL: 1,
  RUTIN_KETERANGAN_COL: 1,
  RUTIN_MASUK_COL: 2,
  RUTIN_KELUAR_COL: 3,
  // Tabel Insidental (right): columns E, F, G, H, I (Keterangan, Masuk, Keluar, Tanggal, Kategori)
  INSIDENTAL_START_COL: 5,
  INSIDENTAL_KETERANGAN_COL: 5,
  INSIDENTAL_MASUK_COL: 6,
  INSIDENTAL_KELUAR_COL: 7,
  INSIDENTAL_TANGGAL_COL: 8,
  INSIDENTAL_KATEGORI_COL: 9,
  DATA_START_ROW: 2 // Row 1 is header
};
```

- [ ] **Step 2: Add `pushFileToGitHub()` function**

Add after the existing `getFileSha()` function (after line 280):

```js
/**
 * Pushes content to a specific file path in the GitHub repo.
 * Generic version that accepts filePath parameter.
 */
function pushFileToGitHub(filePath, content) {
  var props = PropertiesService.getScriptProperties();
  var token = props.getProperty('GITHUB_TOKEN');
  var repo = props.getProperty('GITHUB_REPO');

  if (!token || !repo) {
    throw new Error('Missing GITHUB_TOKEN or GITHUB_REPO in Script Properties.');
  }

  var apiUrl = 'https://api.github.com/repos/' + repo + '/contents/' + filePath;
  var sha = getFileSha(apiUrl, token);

  var payload = {
    message: 'chore: update expense data',
    content: Utilities.base64Encode(content, Utilities.Charset.UTF_8),
    branch: CONFIG.BRANCH
  };

  if (sha) {
    payload.sha = sha;
  }

  var options = {
    method: 'put',
    contentType: 'application/json',
    headers: {
      'Authorization': 'Bearer ' + token,
      'Accept': 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28'
    },
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  };

  var response = UrlFetchApp.fetch(apiUrl, options);
  var code = response.getResponseCode();

  if (code !== 200 && code !== 201) {
    throw new Error('GitHub API error (' + code + '): ' + response.getContentText());
  }
}
```

- [ ] **Step 3: Add `buildExpensesJson()` function**

Add after `pushFileToGitHub()`:

```js
/**
 * Reads the "Pengeluaran Rutin" tab and builds the expenses JSON object.
 * Parses two tables: Rutin (left, cols A-C) and Insidental (right, cols E-I).
 */
function buildExpensesJson() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(EXPENSES_CONFIG.TAB);
  if (!sheet) throw new Error('Tab "' + EXPENSES_CONFIG.TAB + '" not found.');

  var lastRow = sheet.getLastRow();
  var lastCol = sheet.getLastColumn();
  if (lastRow < 2) {
    return { lastUpdate: getTodayISO(), rutin: [], insidental: [], summary: { totalMasuk: 0, totalKeluar: 0, sisaAnggaran: 0 } };
  }

  var allData = sheet.getRange(EXPENSES_CONFIG.DATA_START_ROW, 1, lastRow - 1, lastCol).getValues();

  // Parse Rutin table (left: cols A, B, C)
  var rutin = [];
  var rutinTotalMasuk = 0;
  var rutinTotalKeluar = 0;

  for (var i = 0; i < allData.length; i++) {
    var row = allData[i];
    var keterangan = String(row[EXPENSES_CONFIG.RUTIN_KETERANGAN_COL - 1] || '').trim();

    if (!keterangan || keterangan.toLowerCase() === 'total' || keterangan.toLowerCase() === 'sisa') break;

    var masuk = toIntAmount(row[EXPENSES_CONFIG.RUTIN_MASUK_COL - 1]);
    var keluar = toIntAmount(row[EXPENSES_CONFIG.RUTIN_KELUAR_COL - 1]);

    rutin.push({
      keterangan: keterangan,
      masuk: masuk || null,
      keluar: keluar || null
    });

    rutinTotalMasuk += masuk;
    rutinTotalKeluar += keluar;
  }

  // Parse Insidental table (right: cols E, F, G, H, I)
  var insidental = [];
  var insidentalTotalMasuk = 0;
  var insidentalTotalKeluar = 0;

  for (var j = 0; j < allData.length; j++) {
    var row2 = allData[j];
    var ket2 = String(row2[EXPENSES_CONFIG.INSIDENTAL_KETERANGAN_COL - 1] || '').trim();

    if (!ket2 || ket2.toLowerCase() === 'total') break;

    var masuk2 = toIntAmount(row2[EXPENSES_CONFIG.INSIDENTAL_MASUK_COL - 1]);
    var keluar2 = toIntAmount(row2[EXPENSES_CONFIG.INSIDENTAL_KELUAR_COL - 1]);
    var tanggalRaw = row2[EXPENSES_CONFIG.INSIDENTAL_TANGGAL_COL - 1];
    var kategori = String(row2[EXPENSES_CONFIG.INSIDENTAL_KATEGORI_COL - 1] || '').trim();

    // Format tanggal to ISO date (YYYY-MM-DD)
    var tanggal = null;
    if (tanggalRaw instanceof Date) {
      tanggal = tanggalRaw.getFullYear() + '-' + pad2(tanggalRaw.getMonth() + 1) + '-' + pad2(tanggalRaw.getDate());
    } else if (tanggalRaw) {
      var parsed = new Date(tanggalRaw);
      if (!isNaN(parsed.getTime())) {
        tanggal = parsed.getFullYear() + '-' + pad2(parsed.getMonth() + 1) + '-' + pad2(parsed.getDate());
      }
    }

    insidental.push({
      keterangan: ket2,
      masuk: masuk2 || null,
      keluar: keluar2 || null,
      tanggal: tanggal,
      kategori: kategori
    });

    insidentalTotalMasuk += masuk2;
    insidentalTotalKeluar += keluar2;
  }

  // Summary: totalMasuk from insidental (which includes "sisa uang" carry-over),
  // totalKeluar from both tables, sisaAnggaran = totalMasuk - totalKeluar
  var totalMasuk = insidentalTotalMasuk;
  var totalKeluar = rutinTotalKeluar + insidentalTotalKeluar;
  var sisaAnggaran = totalMasuk - totalKeluar;

  return {
    lastUpdate: getTodayISO(),
    rutin: rutin,
    insidental: insidental,
    summary: {
      totalMasuk: totalMasuk,
      totalKeluar: totalKeluar,
      sisaAnggaran: sisaAnggaran
    }
  };
}
```

- [ ] **Step 4: Add `deployExpensesToSite()` function**

Add after `buildExpensesJson()`:

```js
/**
 * Reads expense data, converts to JSON, pushes to GitHub.
 * Triggered from custom menu "IPL Tools > Deploy Pengeluaran ke Website".
 */
function deployExpensesToSite() {
  var ui = SpreadsheetApp.getUi();

  var response = ui.alert(
    'Deploy Pengeluaran',
    'This will update the live site with current expense data. Continue?',
    ui.ButtonSet.YES_NO
  );
  if (response !== ui.Button.YES) return;

  try {
    var json = buildExpensesJson();
    var jsonString = JSON.stringify(json, null, 2) + '\n';

    pushFileToGitHub(EXPENSES_CONFIG.FILE_PATH, jsonString);

    SpreadsheetApp.getActiveSpreadsheet().toast(
      'Expense data deployed successfully! (' + json.rutin.length + ' rutin, ' + json.insidental.length + ' insidental)',
      'Deploy Complete',
      5
    );
  } catch (err) {
    ui.alert('Deploy failed: ' + err.message);
  }
}
```

- [ ] **Step 5: Extend `onOpen()` menu**

Modify the `onOpen()` function to add the new menu item. Replace:

```js
function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('IPL Tools')
    .addItem('Deploy to Site', 'deployToSite')
    .addToUi();
}
```

With:

```js
function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('IPL Tools')
    .addItem('Deploy Data ke Website', 'deployToSite')
    .addSeparator()
    .addItem('Deploy Pengeluaran ke Website', 'deployExpensesToSite')
    .addToUi();
}
```

- [ ] **Step 6: Commit**

```bash
git add scripts/google-apps-script/Code.gs
git commit -m "feat: add expense deploy functions to Apps Script"
```

---

### Task 5: Conversion script (manual fallback)

**Files:**
- Create: `scripts/convert-expenses.js`
- Modify: `package.json`

- [ ] **Step 1: Create `convert-expenses.js`**

Create `scripts/convert-expenses.js`:

```js
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const DEFAULT_SRC = path.resolve(__dirname, '../raw_data/IPL 2026 - Pengeluaran Rutin.csv')
const DEFAULT_DEST = path.resolve(__dirname, '../src/data/expenses.json')

function readFileUtf8(p) {
  const raw = fs.readFileSync(p, 'utf8')
  return raw.replace(/^\uFEFF/, '')
}

function parseCSVLine(line) {
  const out = []
  let cur = ''
  let inQuotes = false
  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        cur += '"'
        i++
      } else {
        inQuotes = !inQuotes
      }
    } else if (ch === ',' && !inQuotes) {
      out.push(cur)
      cur = ''
    } else {
      cur += ch
    }
  }
  out.push(cur)
  return out.map((s) => s.trim())
}

function parseCSV(content) {
  const lines = content.split(/\r?\n/).filter((l) => l.trim() !== '')
  if (lines.length === 0) return []
  return lines.map((line) => parseCSVLine(line))
}

function pad2(n) {
  return String(n).padStart(2, '0')
}

function getTodayISODateOnly() {
  const d = new Date()
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`
}

function toIntAmount(s) {
  const cleaned = String(s || '').replace(/[^\d]/g, '')
  return cleaned ? parseInt(cleaned, 10) : 0
}

function parseDateString(s) {
  if (!s) return null
  const d = new Date(s)
  if (isNaN(d.getTime())) return null
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`
}

function main() {
  const src = process.argv[2] ? path.resolve(process.argv[2]) : DEFAULT_SRC
  const dest = process.argv[3] ? path.resolve(process.argv[3]) : DEFAULT_DEST

  const csv = readFileUtf8(src)
  const rows = parseCSV(csv)

  if (rows.length < 2) {
    console.error('CSV has no data rows')
    process.exit(1)
  }

  // Skip header row (row 0)
  const dataRows = rows.slice(1)

  // Parse Rutin (cols 0, 1, 2: Keterangan, Masuk, Keluar)
  const rutin = []
  let rutinTotalKeluar = 0

  for (const row of dataRows) {
    const keterangan = (row[0] || '').trim()
    if (!keterangan || keterangan.toLowerCase() === 'total' || keterangan.toLowerCase() === 'sisa') break
    const masuk = toIntAmount(row[1])
    const keluar = toIntAmount(row[2])
    rutin.push({ keterangan, masuk: masuk || null, keluar: keluar || null })
    rutinTotalKeluar += keluar
  }

  // Parse Insidental (cols 4, 5, 6, 7, 8: Keterangan, Masuk, Keluar, Tanggal, Kategori)
  const insidental = []
  let insidentalTotalMasuk = 0
  let insidentalTotalKeluar = 0

  for (const row of dataRows) {
    const keterangan = (row[4] || '').trim()
    if (!keterangan || keterangan.toLowerCase() === 'total') break
    const masuk = toIntAmount(row[5])
    const keluar = toIntAmount(row[6])
    const tanggal = parseDateString(row[7])
    const kategori = (row[8] || '').trim()

    insidental.push({ keterangan, masuk: masuk || null, keluar: keluar || null, tanggal, kategori })
    insidentalTotalMasuk += masuk
    insidentalTotalKeluar += keluar
  }

  const totalMasuk = insidentalTotalMasuk
  const totalKeluar = rutinTotalKeluar + insidentalTotalKeluar
  const sisaAnggaran = totalMasuk - totalKeluar

  const result = {
    lastUpdate: getTodayISODateOnly(),
    rutin,
    insidental,
    summary: { totalMasuk, totalKeluar, sisaAnggaran },
  }

  fs.mkdirSync(path.dirname(dest), { recursive: true })
  fs.writeFileSync(dest, JSON.stringify(result, null, 2) + '\n', 'utf8')
  console.log(`Wrote ${rutin.length} rutin + ${insidental.length} insidental records to ${dest}`)
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main()
}
```

- [ ] **Step 2: Add npm script to `package.json`**

In `package.json`, add after the `"convert:residents"` script:

```json
"convert:expenses": "node scripts/convert-expenses.js"
```

- [ ] **Step 3: Commit**

```bash
git add scripts/convert-expenses.js package.json
git commit -m "feat: add expense CSV conversion script"
```

---

### Task 6: Update documentation

**Files:**
- Modify: `CLAUDE.md`

- [ ] **Step 1: Update CLAUDE.md**

Add to the **Routes** section:

```
- `/pengeluaran` — ExpensesView: expense transparency page with category filtering
```

Add to **Key Files** section:

```
- `src/data/expenses.json` — expense data (rutin + insidental, with summary)
- `src/components/ExpensesView.jsx` — expense transparency page
- `scripts/convert-expenses.js` — converts expense CSV to `expenses.json`
```

Add to **Helper Functions** section:

```
- `getExpenses()` — returns parsed `expenses.json` (rutin, insidental, summary)
- `getExpenseCategories()` — returns unique kategori list from insidental data
- `generateExpenseBroadcastMessage()` — WhatsApp-formatted expense report string
```

Add to **Scripts** section:

```bash
npm run convert:expenses  # convert raw_data/IPL 2026 - Pengeluaran Rutin.csv → src/data/expenses.json
```

- [ ] **Step 2: Verify build passes**

Run: `npm run build`
Expected: Build succeeds with no errors.

- [ ] **Step 3: Commit**

```bash
git add CLAUDE.md
git commit -m "docs: update CLAUDE.md with expense tracker documentation"
```

---

## Verification Checklist

After all tasks are complete, verify:

- [ ] `http://localhost:5173/pengeluaran` renders with summary, rutin table, insidental table
- [ ] Category filter chips work (filter insidental items)
- [ ] "Salin Broadcast WA" copies formatted message to clipboard
- [ ] Broadcast message includes breakdown per kategori and link to `/pengeluaran`
- [ ] Navigation link from home page works
- [ ] Existing pages (`/`, `/leaderboard`, `/broadcast`) still work unchanged
- [ ] `npm run build` passes
