# Leaderboard Page Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a leaderboard page with block-vs-block ranking and per-house ranking, accessible at `/#/leaderboard`.

**Architecture:** HashRouter routes (`/` and `/leaderboard`). Data from `residents.json` (master registry) merged with `validated.json` (payments). Pure CSS horizontal bar charts in neobrutalist style.

**Tech Stack:** React 19, react-router-dom, Tailwind CSS v4, lucide-react

**Spec:** `docs/superpowers/specs/2026-03-11-leaderboard-design.md`

---

## File Structure

| File | Action | Responsibility |
|------|--------|---------------|
| `scripts/convert-residents.js` | Create | Convert CSV → `residents.json` |
| `src/data/residents.json` | Create (generated) | Master resident registry |
| `src/data/constants.js` | Create | Shared `BLOCK_COLORS`, `BLOCK_COLORS_UNSELECTED` |
| `src/data/helpers.js` | Modify | Add `getAllResidents()`, `getBlockLeaderboard()`, `getHouseLeaderboard()` |
| `src/components/HomePage.jsx` | Create | Extracted home page (search + dashboard + not-found) |
| `src/components/LeaderboardView.jsx` | Create | Leaderboard page UI |
| `src/main.jsx` | Modify | Wrap App in `HashRouter` |
| `src/App.jsx` | Modify | Add `Routes` for `/` and `/leaderboard` |
| `src/components/SearchView.jsx` | Modify | Import colors from constants, add leaderboard nav link |
| `package.json` | Modify | Add `react-router-dom`, `convert:residents` script |

---

## Chunk 1: Foundation (branch, deps, data pipeline, shared constants)

### Task 1: Create branch and install dependencies

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Create feature branch**

```bash
git checkout -b feat/leaderboard
```

- [ ] **Step 2: Install react-router-dom**

```bash
npm install react-router-dom
```

- [ ] **Step 3: Add `convert:residents` script to package.json**

In `package.json`, add to the `"scripts"` object:

```json
"convert:residents": "node scripts/convert-residents.js"
```

- [ ] **Step 4: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: add react-router-dom and convert:residents script"
```

---

### Task 2: Create convert-residents script and generate residents.json

**Files:**
- Create: `scripts/convert-residents.js`
- Create: `src/data/residents.json` (generated)

The script follows the same pattern as the existing `scripts/convert-validated.js` — reads CSV, parses, writes JSON. The CSV format is `BLOK,NOMOR RUMAH DAN NAMA` where the second column is like `"3. Agus Herianto"`.

- [ ] **Step 1: Create `scripts/convert-residents.js`**

```js
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const DEFAULT_SRC = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '../raw_data/IPL 2026 - Data warga.csv'
)
const DEFAULT_DEST = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '../src/data/residents.json'
)

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
  return out.map(s => s.trim())
}

function parseCSV(content) {
  const lines = content.split(/\r?\n/).filter(l => l.trim() !== '')
  if (lines.length === 0) return []
  // Skip header line
  const rows = []
  for (let i = 1; i < lines.length; i++) {
    const fields = parseCSVLine(lines[i])
    if (fields.length < 2) continue
    rows.push({ blok: fields[0], combined: fields[1] })
  }
  return rows
}

function transform(rows) {
  const out = []
  for (const r of rows) {
    const blok = r.blok.trim().toUpperCase()
    // combined is like "3. Agus Herianto" — split on first ". "
    const dotIndex = r.combined.indexOf('. ')
    if (dotIndex === -1) continue
    const nomorRumah = r.combined.substring(0, dotIndex).trim()
    const namaPemilik = r.combined.substring(dotIndex + 2).trim()
    if (blok && nomorRumah && namaPemilik) {
      out.push({ blok, nomorRumah: String(parseInt(nomorRumah, 10)), namaPemilik })
    }
  }
  return out
}

function main() {
  const src = process.argv[2] ? path.resolve(process.argv[2]) : DEFAULT_SRC
  const dest = process.argv[3] ? path.resolve(process.argv[3]) : DEFAULT_DEST
  const csv = readFileUtf8(src)
  const rows = parseCSV(csv)
  const data = transform(rows)
  fs.mkdirSync(path.dirname(dest), { recursive: true })
  fs.writeFileSync(dest, JSON.stringify(data, null, 2) + '\n', 'utf8')
  console.log(`Wrote ${data.length} residents to ${dest}`)
}

const __filename = fileURLToPath(import.meta.url)
if (process.argv[1] === __filename) {
  main()
}
```

- [ ] **Step 2: Run the script to generate residents.json**

```bash
npm run convert:residents
```

Expected: `Wrote 50 residents to .../src/data/residents.json`

- [ ] **Step 3: Verify output**

Check that `src/data/residents.json` is a JSON array with objects like `{"blok":"A","nomorRumah":"3","namaPemilik":"Agus Herianto"}`.

- [ ] **Step 4: Commit**

```bash
git add scripts/convert-residents.js src/data/residents.json
git commit -m "feat: add convert-residents script and generate residents.json"
```

---

### Task 3: Extract shared constants

**Files:**
- Create: `src/data/constants.js`
- Modify: `src/components/SearchView.jsx:1-21`

Move `BLOCK_COLORS` and `BLOCK_COLORS_UNSELECTED` from `SearchView.jsx` to a shared constants file so both SearchView and LeaderboardView can import them.

- [ ] **Step 1: Create `src/data/constants.js`**

```js
export const BLOCK_COLORS = {
  A: 'bg-violet text-white border-violet',
  B: 'bg-pink text-white border-pink',
  C: 'bg-yellow text-slate-dark border-yellow',
  D: 'bg-green text-white border-green',
  E: 'bg-orange text-white border-orange',
  F: 'bg-slate-dark text-cream border-slate-dark',
}

export const BLOCK_COLORS_UNSELECTED = {
  A: 'bg-white text-slate-dark border-slate-dark hover:bg-violet/10',
  B: 'bg-white text-slate-dark border-slate-dark hover:bg-pink/10',
  C: 'bg-white text-slate-dark border-slate-dark hover:bg-yellow/10',
  D: 'bg-white text-slate-dark border-slate-dark hover:bg-green/10',
  E: 'bg-white text-slate-dark border-slate-dark hover:bg-orange/10',
  F: 'bg-white text-slate-dark border-slate-dark hover:bg-slate-dark/10',
}

// Raw color values for inline styles (bar charts, badges)
export const BLOCK_BAR_COLORS = {
  A: '#8B5CF6',
  B: '#F472B6',
  C: '#FBBF24',
  D: '#22C55E',
  E: '#FB923C',
  F: '#1E293B',
}
```

- [ ] **Step 2: Update SearchView.jsx to import from constants**

Remove the two const declarations (`BLOCK_COLORS` and `BLOCK_COLORS_UNSELECTED` objects) from `src/components/SearchView.jsx` and replace with an import:

```js
import { BLOCK_COLORS, BLOCK_COLORS_UNSELECTED } from '../data/constants'
```

The file's first lines should become:

```js
import { useState } from 'react'
import { Search, Home, MapPin, Calendar } from 'lucide-react'
import { getAvailableBlocks, getLastUpdated } from '../data/helpers'
import { BLOCK_COLORS, BLOCK_COLORS_UNSELECTED } from '../data/constants'
```

- [ ] **Step 3: Verify dev server runs without errors**

```bash
npm run dev
```

Open in browser, confirm SearchView still works with block color buttons.

- [ ] **Step 4: Commit**

```bash
git add src/data/constants.js src/components/SearchView.jsx
git commit -m "refactor: extract BLOCK_COLORS to shared constants"
```

---

## Chunk 2: Data helpers for leaderboard

### Task 4: Add leaderboard helper functions

**Files:**
- Modify: `src/data/helpers.js`

Add three new exported functions. These merge `residents.json` (master list) with payment data from `validated.json`.

- [ ] **Step 1: Add imports and new functions to `src/data/helpers.js`**

Add at the top of the file (after line 1):

```js
import residents from './residents.json'
```

Add the following three functions at the end of the file (after the `formatRupiah` function):

```js
export function getAllResidents() {
  return residents.map((r) => {
    const records = data.filter(
      (d) => d.blok === r.blok && d.nomorRumah === String(r.nomorRumah)
    )
    const totalPaid = records.reduce((sum, d) => sum + d.jumlahPembayaran, 0)
    const completionPct = Math.min(100, Math.round((totalPaid / ANNUAL_TARGET) * 100))
    return {
      blok: r.blok,
      nomorRumah: r.nomorRumah,
      namaPemilik: r.namaPemilik,
      totalPaid,
      annualTarget: ANNUAL_TARGET,
      isLunas: totalPaid >= ANNUAL_TARGET,
      completionPct,
      monthsPaid: Math.floor(totalPaid / MONTHLY_IPL),
    }
  })
}

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

export function getHouseLeaderboard(blok) {
  let all = getAllResidents()
  if (blok) {
    all = all.filter((r) => r.blok === blok)
  }
  return all.sort(
    (a, b) =>
      b.completionPct - a.completionPct ||
      a.blok.localeCompare(b.blok) ||
      Number(a.nomorRumah) - Number(b.nomorRumah)
  )
}
```

- [ ] **Step 2: Verify the file has no syntax errors**

```bash
npm run dev
```

No errors in terminal.

- [ ] **Step 3: Commit**

```bash
git add src/data/helpers.js
git commit -m "feat: add leaderboard data helper functions"
```

---

## Chunk 3: Routing setup

### Task 5: Add HashRouter and routes

**Files:**
- Modify: `src/main.jsx`
- Modify: `src/App.jsx`

- [ ] **Step 1: Wrap App with HashRouter in `src/main.jsx`**

Replace the entire file content:

```jsx
import { createRoot } from 'react-dom/client'
import { HashRouter } from 'react-router-dom'
import './index.css'
import App from './App'

createRoot(document.getElementById('root')).render(
  <HashRouter>
    <App />
  </HashRouter>
)
```

- [ ] **Step 2: Update `src/App.jsx` to use Routes**

Replace the entire file content. The search+dashboard flow stays as state-based within a `HomePage` component. The leaderboard gets its own route.

```jsx
import { Routes, Route } from 'react-router-dom'
import HomePage from './components/HomePage'
import LeaderboardView from './components/LeaderboardView'

function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/leaderboard" element={<LeaderboardView />} />
    </Routes>
  )
}

export default App
```

- [ ] **Step 3: Create `src/components/HomePage.jsx`**

Extract the existing App logic (search + dashboard + not-found) into a new `HomePage` component. This is the exact content of the old `App.jsx` function body, moved to its own component:

```jsx
import { useState, useEffect } from 'react'
import { MessageCircle } from 'lucide-react'
import { getResident } from '../data/helpers'
import SearchView from './SearchView'
import DashboardView from './DashboardView'

export default function HomePage() {
  const [resident, setResident] = useState(null)
  const [searched, setSearched] = useState(false)
  const [searchQuery, setSearchQuery] = useState({ blok: '', nomorRumah: '' })

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [searched])

  const handleSearch = (blok, nomorRumah) => {
    const result = getResident(blok, nomorRumah)
    setResident(result)
    setSearched(true)
    setSearchQuery({ blok, nomorRumah })
  }

  const handleBack = () => {
    setResident(null)
    setSearched(false)
  }

  return (
    <div className="min-h-screen">
      {!searched ? (
        <SearchView onSearch={handleSearch} />
      ) : resident ? (
        <DashboardView resident={resident} onBack={handleBack} />
      ) : (
        <div className="flex flex-col items-center justify-center min-h-screen px-4 animate-pop-in">
          <div className="bg-white border-2 border-slate-dark rounded-3xl shadow-hard p-8 max-w-sm w-full text-center space-y-4">
            <p className="font-heading text-xl font-bold text-slate-dark">Data tidak ditemukan</p>
            <p className="font-body text-sm text-slate-dark/70">
              Mungkin Anda belum melakukan pembayaran IPL.
              <br />Berikut panduannya:
            </p>

            <div className="bg-cream border-2 border-slate-dark/10 rounded-2xl p-4 text-left space-y-2 font-body text-sm text-slate-dark">
              <p>💰 <strong>Iuran IPL 2026:</strong> Rp 250.000</p>
              <p>📱 <strong>Rekening Pembayaran:</strong><br />
                <span className="ml-5">Bank Jago: <span className="font-heading font-bold">503795009221</span></span><br />
                <span className="ml-5">a.n. Ihsan Satriawan</span>
              </p>
              <p>✅ <strong>Konfirmasi Pembayaran:</strong><br />
                <span className="ml-5">Mohon isi form konfirmasi setelah transfer ya 🙏</span>
              </p>
              <a
                href="https://forms.gle/u8XSmBgTKN46rSLp7"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-violet font-heading font-bold underline underline-offset-2 hover:text-violet/80 transition-colors"
              >
                🔗 Isi Form Konfirmasi
              </a>
            </div>

            <div className="border-t-2 border-slate-dark/10 pt-4">
              <p className="font-body text-sm text-slate-dark/70 mb-3">
                Harap hubungi pengurus untuk informasi lebih lanjut
              </p>
              <a
                href={`https://wa.me/628111719913?text=${encodeURIComponent(`Saya mencari nomor rumah saya: Blok ${searchQuery.blok} No. ${searchQuery.nomorRumah} namun data tidak ditemukan`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="
                  inline-flex items-center justify-center gap-2 w-full
                  bg-green text-white font-heading font-bold
                  border-2 border-slate-dark rounded-full px-6 py-3
                  shadow-hard
                  hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-hard-lg
                  active:translate-x-0 active:translate-y-0 active:shadow-hard-sm
                  transition-all duration-150
                "
              >
                <MessageCircle size={18} strokeWidth={2.5} />
                Hubungi via WhatsApp
              </a>
            </div>

            <button
              onClick={handleBack}
              className="mt-2 bg-violet text-white font-heading font-bold border-2 border-slate-dark rounded-full px-6 py-2 shadow-hard hover:translate-x-[-2px] hover:translate-y-[-2px] transition-all"
            >
              Coba Lagi
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 4: Create a placeholder `src/components/LeaderboardView.jsx`**

Temporary placeholder so routing works:

```jsx
import { Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'

export default function LeaderboardView() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center space-y-4">
        <h1 className="font-heading text-2xl font-bold">Leaderboard</h1>
        <p className="font-body text-slate-dark/60">Coming soon...</p>
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 font-heading font-bold text-sm bg-yellow border-2 border-slate-dark rounded-full px-3 py-1.5 shadow-hard-sm"
        >
          <ArrowLeft size={16} strokeWidth={2.5} />
          Kembali
        </Link>
      </div>
    </div>
  )
}
```

- [ ] **Step 5: Verify routing works**

```bash
npm run dev
```

- Open `http://localhost:5173` — should show SearchView
- Open `http://localhost:5173/#/leaderboard` — should show placeholder
- Click "Kembali" on leaderboard — should go back to SearchView

- [ ] **Step 6: Commit**

```bash
git add src/main.jsx src/App.jsx src/components/HomePage.jsx src/components/LeaderboardView.jsx
git commit -m "feat: add HashRouter with leaderboard route"
```

---

## Chunk 4: Leaderboard UI

### Task 6: Add leaderboard navigation link to SearchView

**Files:**
- Modify: `src/components/SearchView.jsx`

- [ ] **Step 1: Add Link import and leaderboard button**

Add `Link` import from `react-router-dom` and merge `Trophy` into the existing `lucide-react` import at the top of `SearchView.jsx`:

```js
import { Link } from 'react-router-dom'
```

Update the existing `lucide-react` import line to include `Trophy`:

```js
import { Search, Home, MapPin, Calendar, Trophy } from 'lucide-react'
```

Add a leaderboard link after the closing `</form>` tag (before the closing `</div>` of the main content area). Find the `</form>` at the end and add after it:

```jsx
        {/* Leaderboard link */}
        <div className="mt-4 animate-fade-in stagger-4">
          <Link
            to="/leaderboard"
            className="
              inline-flex items-center gap-2
              font-heading font-bold text-sm text-slate-dark/60
              hover:text-violet transition-colors
            "
          >
            <Trophy size={16} strokeWidth={2.5} />
            Lihat Leaderboard
          </Link>
        </div>
```

- [ ] **Step 2: Verify the link appears and works**

```bash
npm run dev
```

Open browser — leaderboard link should appear below the search form. Clicking it navigates to `/#/leaderboard`.

- [ ] **Step 3: Commit**

```bash
git add src/components/SearchView.jsx
git commit -m "feat: add leaderboard navigation link to SearchView"
```

---

### Task 7: Build the full LeaderboardView

**Files:**
- Modify: `src/components/LeaderboardView.jsx` (replace placeholder)

This is the main UI component. It has three sections: sticky header, block ranking bar chart, and house ranking list with filter chips and collapsible "belum bayar" section.

- [ ] **Step 1: Replace `src/components/LeaderboardView.jsx` with full implementation**

```jsx
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, Trophy, Home, ChevronDown, ChevronUp } from 'lucide-react'
import { getBlockLeaderboard, getHouseLeaderboard, getAvailableBlocks, formatRupiah, getLastUpdated } from '../data/helpers'
import { BLOCK_COLORS, BLOCK_COLORS_UNSELECTED, BLOCK_BAR_COLORS } from '../data/constants'

export default function LeaderboardView() {
  const [selectedBlok, setSelectedBlok] = useState('')
  const [showBelumBayar, setShowBelumBayar] = useState(false)

  const blockLeaderboard = getBlockLeaderboard()
  const houseLeaderboard = getHouseLeaderboard(selectedBlok || undefined)
  const blocks = getAvailableBlocks()

  const paidHouses = houseLeaderboard.filter((h) => h.totalPaid > 0)
  const unpaidHouses = houseLeaderboard.filter((h) => h.totalPaid === 0)

  const lastUpdatedRaw = getLastUpdated()
  const lastUpdateText = lastUpdatedRaw
    ? new Date(lastUpdatedRaw).toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    : null

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
            Leaderboard
          </span>
        </div>
        <Trophy size={20} strokeWidth={2.5} className="text-yellow" />
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto safe-x">
        <div className="max-w-lg mx-auto px-4 py-6 space-y-5">

          {/* Block Ranking Section */}
          <div className="bg-white border-2 border-slate-dark rounded-3xl shadow-hard overflow-hidden animate-slide-up stagger-1">
            <div className="px-5 py-4 border-b-2 border-slate-dark flex items-center gap-2">
              <span className="text-lg">🏆</span>
              <h2 className="font-heading font-bold text-base">Ranking Blok</h2>
              <span className="ml-auto font-body text-xs text-slate-dark/40">% rumah lunas</span>
            </div>

            <div className="p-4 space-y-3">
              {blockLeaderboard.map((block, i) => (
                <div key={block.blok} className="flex items-center gap-2">
                  {/* Rank medal or number */}
                  <span className="w-6 text-center font-heading font-bold text-sm flex-shrink-0">
                    {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}`}
                  </span>

                  {/* Block letter */}
                  <span
                    className="w-8 h-8 rounded-lg border-2 border-slate-dark flex items-center justify-center font-heading font-extrabold text-sm flex-shrink-0 text-white"
                    style={{ backgroundColor: BLOCK_BAR_COLORS[block.blok] }}
                  >
                    {block.blok}
                  </span>

                  {/* Bar */}
                  <div className="flex-1 h-7 bg-cream border-2 border-slate-dark rounded-lg overflow-hidden relative">
                    <div
                      className="h-full rounded-lg progress-bar"
                      style={{
                        '--progress-width': `${block.lunasPct}%`,
                        backgroundColor: BLOCK_BAR_COLORS[block.blok],
                      }}
                    />
                    <span className="absolute right-2 top-1/2 -translate-y-1/2 font-heading font-bold text-xs text-slate-dark">
                      {block.lunasPct}%
                    </span>
                  </div>

                  {/* House count */}
                  <span className="font-body text-xs text-slate-dark/50 w-12 text-right flex-shrink-0">
                    {block.lunasCount}/{block.totalHouses} 🏠
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* House Ranking Section */}
          <div className="bg-white border-2 border-slate-dark rounded-3xl shadow-hard overflow-hidden animate-slide-up stagger-2">
            <div className="px-5 py-4 border-b-2 border-slate-dark flex items-center gap-2">
              <span className="text-lg">🏠</span>
              <h2 className="font-heading font-bold text-base">Ranking Per Rumah</h2>
            </div>

            {/* Block filter chips */}
            <div className="px-5 py-3 border-b border-slate-dark/10 flex gap-2 overflow-x-auto">
              <button
                onClick={() => setSelectedBlok('')}
                className={`
                  flex-shrink-0 border-2 rounded-full px-3 py-1 font-heading font-bold text-xs
                  transition-all duration-150
                  ${!selectedBlok
                    ? 'bg-violet text-white border-violet shadow-hard-sm'
                    : 'bg-white text-slate-dark border-slate-dark hover:bg-violet/10'
                  }
                `}
              >
                Semua
              </button>
              {blocks.map((b) => (
                <button
                  key={b}
                  onClick={() => setSelectedBlok(b)}
                  className={`
                    flex-shrink-0 border-2 rounded-full px-3 py-1 font-heading font-bold text-xs
                    transition-all duration-150
                    ${selectedBlok === b
                      ? `${BLOCK_COLORS[b]} shadow-hard-sm`
                      : BLOCK_COLORS_UNSELECTED[b]
                    }
                  `}
                >
                  {b}
                </button>
              ))}
            </div>

            {/* Paid houses list */}
            <div>
              {paidHouses.map((house, i) => (
                <div
                  key={`${house.blok}-${house.nomorRumah}`}
                  className={`
                    flex items-center gap-3 px-5 py-3
                    ${i < paidHouses.length - 1 || unpaidHouses.length > 0 ? 'border-b border-slate-dark/10' : ''}
                  `}
                >
                  {/* Rank */}
                  <span className="w-6 text-center font-heading font-bold text-sm text-slate-dark/50 flex-shrink-0">
                    {i + 1}
                  </span>

                  {/* Block-house badge */}
                  <span
                    className="px-2 py-0.5 rounded-lg border-2 border-slate-dark font-heading font-bold text-xs text-white flex-shrink-0"
                    style={{ backgroundColor: BLOCK_BAR_COLORS[house.blok] }}
                  >
                    {house.blok}-{house.nomorRumah}
                  </span>

                  {/* Name + secondary info */}
                  <div className="flex-1 min-w-0">
                    <p className="font-heading font-bold text-sm text-slate-dark truncate">
                      {house.namaPemilik}
                    </p>
                    <p className="font-body text-xs text-slate-dark/40">
                      {formatRupiah(house.totalPaid)} · {house.monthsPaid} bln
                    </p>
                  </div>

                  {/* Mini progress bar */}
                  <div className="w-16 h-3 bg-cream border border-slate-dark/20 rounded-full overflow-hidden flex-shrink-0">
                    <div
                      className={`h-full rounded-full ${house.isLunas ? 'bg-green' : 'bg-violet'}`}
                      style={{ width: `${house.completionPct}%` }}
                    />
                  </div>

                  {/* Percentage */}
                  <span className={`font-heading font-bold text-xs w-10 text-right flex-shrink-0 ${house.isLunas ? 'text-green' : 'text-violet'}`}>
                    {house.completionPct}%
                  </span>
                </div>
              ))}
            </div>

            {/* Collapsible belum bayar section */}
            {unpaidHouses.length > 0 && (
              <div>
                <button
                  onClick={() => setShowBelumBayar(!showBelumBayar)}
                  className="w-full flex items-center justify-between px-5 py-3 bg-cream/50 border-t border-slate-dark/10 hover:bg-cream transition-colors"
                >
                  <span className="font-heading font-bold text-sm text-slate-dark/50">
                    Belum bayar ({unpaidHouses.length})
                  </span>
                  {showBelumBayar
                    ? <ChevronUp size={16} strokeWidth={2.5} className="text-slate-dark/40" />
                    : <ChevronDown size={16} strokeWidth={2.5} className="text-slate-dark/40" />
                  }
                </button>

                {showBelumBayar && (
                  <div>
                    {unpaidHouses.map((house, i) => (
                      <div
                        key={`${house.blok}-${house.nomorRumah}`}
                        className={`
                          flex items-center gap-3 px-5 py-2.5
                          ${i < unpaidHouses.length - 1 ? 'border-b border-slate-dark/5' : ''}
                        `}
                      >
                        <span className="w-6 flex-shrink-0" />
                        <span
                          className="px-2 py-0.5 rounded-lg border-2 border-slate-dark/30 font-heading font-bold text-xs text-slate-dark/40 flex-shrink-0"
                        >
                          {house.blok}-{house.nomorRumah}
                        </span>
                        <p className="font-body text-sm text-slate-dark/40 truncate">
                          {house.namaPemilik}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Last updated */}
          {lastUpdateText && (
            <div className="text-center animate-fade-in stagger-3">
              <p className="font-body text-xs text-slate-dark/40">
                Data diperbarui: <span className="font-semibold text-slate-dark/60">{lastUpdateText}</span>
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

- [ ] **Step 2: Verify the full leaderboard page**

```bash
npm run dev
```

Open `http://localhost:5173/#/leaderboard` and verify:
- Block ranking bar chart displays all 6 blocks sorted by % lunas
- House ranking shows paid houses with progress bars
- Block filter chips work (clicking a block filters the house list)
- "Belum bayar" section is collapsed by default, expands on click
- "Kembali" link returns to home page
- All styling matches the neobrutalist design system

- [ ] **Step 3: Commit**

```bash
git add src/components/LeaderboardView.jsx
git commit -m "feat: implement full leaderboard page with bar charts and rankings"
```

---

### Task 8: Final verification and cleanup

- [ ] **Step 1: Run the build**

```bash
npm run build
```

Expected: No errors. Build succeeds.

- [ ] **Step 2: Test the production build**

```bash
npm run preview
```

Open in browser. Test:
- Home page search flow still works
- `/#/leaderboard` works
- Navigation between pages works
- Block filter chips work
- Collapsible belum bayar section works

- [ ] **Step 3: Commit any fixes if needed, then final commit**

If all is well, no additional commit needed. The feature is complete.
