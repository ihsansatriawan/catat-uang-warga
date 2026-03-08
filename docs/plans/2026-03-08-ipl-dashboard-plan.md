# IPL Dashboard MVP — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a playful Memphis-Modern dashboard where housing complex residents can look up their IPL payment status by block and house number.

**Architecture:** Single-page React app with Vite + Tailwind CSS v4. Two state-managed views (Search and Dashboard). Static JSON data file exported from Google Sheets. No router, no auth, no backend.

**Tech Stack:** React 19, Vite, Tailwind CSS v4, Lucide React

---

### Task 1: Scaffold Vite + React Project

**Files:**
- Create: `package.json`, `vite.config.js`, `index.html`, `src/main.jsx`, `src/App.jsx`

**Step 1: Create Vite project**

```bash
npm create vite@latest . -- --template react
```

Select defaults. This scaffolds in the current directory.

**Step 2: Install dependencies**

```bash
npm install
npm install tailwindcss @tailwindcss/vite lucide-react
```

**Step 3: Verify dev server starts**

```bash
npm run dev
```

Expected: Vite dev server runs on localhost, default React page renders.

**Step 4: Commit**

```bash
git add -A
git commit -m "chore: scaffold Vite + React project with Tailwind and Lucide"
```

---

### Task 2: Configure Tailwind CSS v4 with Design System

**Files:**
- Modify: `vite.config.js`
- Modify: `src/index.css`
- Delete: `src/App.css` (not needed)

**Step 1: Add Tailwind Vite plugin**

Update `vite.config.js`:

```js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
})
```

**Step 2: Replace `src/index.css` with Tailwind + Design System**

```css
@import "tailwindcss";
@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;700;800&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap');

@theme {
  --color-cream: #FFFDF5;
  --color-slate-dark: #1E293B;
  --color-violet: #8B5CF6;
  --color-pink: #F472B6;
  --color-yellow: #FBBF24;
  --color-green: #22C55E;

  --font-heading: 'Outfit', sans-serif;
  --font-body: 'Plus Jakarta Sans', sans-serif;

  --shadow-hard: 4px 4px 0px 0px #1E293B;
  --shadow-hard-sm: 2px 2px 0px 0px #1E293B;

  --animate-wiggle: wiggle 0.3s ease-in-out;
  --animate-pop-in: pop-in 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
  --animate-bounce-in: bounce-in 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
}

@keyframes wiggle {
  0%, 100% { transform: rotate(0deg); }
  25% { transform: rotate(-2deg); }
  75% { transform: rotate(2deg); }
}

@keyframes pop-in {
  0% { transform: scale(0); opacity: 0; }
  100% { transform: scale(1); opacity: 1; }
}

@keyframes bounce-in {
  0% { transform: scale(0.3); opacity: 0; }
  50% { transform: scale(1.05); }
  70% { transform: scale(0.95); }
  100% { transform: scale(1); opacity: 1; }
}

body {
  font-family: var(--font-body);
  color: var(--color-slate-dark);
  background-color: var(--color-cream);
  background-image: radial-gradient(circle, #1E293B 1px, transparent 1px);
  background-size: 24px 24px;
}
```

**Step 3: Clean up App.jsx**

Replace `src/App.jsx` with minimal shell:

```jsx
function App() {
  return (
    <div className="min-h-screen">
      <h1 className="font-heading text-4xl font-bold text-center py-12">
        IPL Dashboard
      </h1>
    </div>
  )
}

export default App
```

Remove `src/App.css` if it exists.

**Step 4: Verify**

```bash
npm run dev
```

Expected: Page shows "IPL Dashboard" in Outfit font on cream background with dot grid pattern.

**Step 5: Commit**

```bash
git add -A
git commit -m "feat: configure Tailwind v4 with Memphis Modern design system"
```

---

### Task 3: Create Mock Data

**Files:**
- Create: `src/data/validated.json`

**Step 1: Create the mock data file**

```json
[
  {
    "timestamp": "2026-01-15T10:30:00Z",
    "email": "budi@email.com",
    "blok": "A",
    "nomorRumah": "1",
    "namaPemilik": "Budi Santoso",
    "jumlahPembayaran": 250000,
    "buktiTransfer": "https://drive.google.com/file/d/placeholder1/view"
  },
  {
    "timestamp": "2026-02-10T14:20:00Z",
    "email": "budi@email.com",
    "blok": "A",
    "nomorRumah": "1",
    "namaPemilik": "Budi Santoso",
    "jumlahPembayaran": 250000,
    "buktiTransfer": "https://drive.google.com/file/d/placeholder2/view"
  },
  {
    "timestamp": "2026-03-05T09:15:00Z",
    "email": "budi@email.com",
    "blok": "A",
    "nomorRumah": "1",
    "namaPemilik": "Budi Santoso",
    "jumlahPembayaran": 250000,
    "buktiTransfer": "https://drive.google.com/file/d/placeholder3/view"
  },
  {
    "timestamp": "2026-01-20T11:00:00Z",
    "email": "siti@email.com",
    "blok": "A",
    "nomorRumah": "2",
    "namaPemilik": "Siti Rahayu",
    "jumlahPembayaran": 250000,
    "buktiTransfer": "https://drive.google.com/file/d/placeholder4/view"
  },
  {
    "timestamp": "2026-02-18T16:45:00Z",
    "email": "siti@email.com",
    "blok": "A",
    "nomorRumah": "2",
    "namaPemilik": "Siti Rahayu",
    "jumlahPembayaran": 500000,
    "buktiTransfer": "https://drive.google.com/file/d/placeholder5/view"
  },
  {
    "timestamp": "2026-01-05T08:30:00Z",
    "email": "agus@email.com",
    "blok": "B",
    "nomorRumah": "5",
    "namaPemilik": "Agus Wijaya",
    "jumlahPembayaran": 3000000,
    "buktiTransfer": "https://drive.google.com/file/d/placeholder6/view"
  },
  {
    "timestamp": "2026-01-12T13:00:00Z",
    "email": "dewi@email.com",
    "blok": "C",
    "nomorRumah": "10",
    "namaPemilik": "Dewi Lestari",
    "jumlahPembayaran": 250000,
    "buktiTransfer": "https://drive.google.com/file/d/placeholder7/view"
  },
  {
    "timestamp": "2026-02-12T13:00:00Z",
    "email": "dewi@email.com",
    "blok": "C",
    "nomorRumah": "10",
    "namaPemilik": "Dewi Lestari",
    "jumlahPembayaran": 250000,
    "buktiTransfer": "https://drive.google.com/file/d/placeholder8/view"
  },
  {
    "timestamp": "2026-03-01T10:00:00Z",
    "email": "dewi@email.com",
    "blok": "C",
    "nomorRumah": "10",
    "namaPemilik": "Dewi Lestari",
    "jumlahPembayaran": 250000,
    "buktiTransfer": "https://drive.google.com/file/d/placeholder9/view"
  },
  {
    "timestamp": "2026-01-25T15:30:00Z",
    "email": "rudi@email.com",
    "blok": "F",
    "nomorRumah": "15",
    "namaPemilik": "Rudi Hermawan",
    "jumlahPembayaran": 250000,
    "buktiTransfer": "https://drive.google.com/file/d/placeholder10/view"
  }
]
```

This gives us:
- **Budi (A-1)**: 3 payments of 250k = 750k (not lunas)
- **Siti (A-2)**: 2 payments totaling 750k (not lunas)
- **Agus (B-5)**: 1 payment of 3M (lunas!)
- **Dewi (C-10)**: 3 payments of 250k = 750k (not lunas)
- **Rudi (F-15)**: 1 payment of 250k (not lunas)

**Step 2: Create data helper**

Create `src/data/helpers.js`:

```js
import data from './validated.json'

const MONTHLY_IPL = 250000
const MONTHS_PER_YEAR = 12
const ANNUAL_TARGET = MONTHLY_IPL * MONTHS_PER_YEAR

export function getResident(blok, nomorRumah) {
  const records = data.filter(
    (r) => r.blok === blok && r.nomorRumah === String(nomorRumah)
  )
  if (records.length === 0) return null

  const namaPemilik = records[0].namaPemilik
  const totalPaid = records.reduce((sum, r) => sum + r.jumlahPembayaran, 0)
  const isLunas = totalPaid >= ANNUAL_TARGET

  return {
    namaPemilik,
    blok,
    nomorRumah,
    totalPaid,
    annualTarget: ANNUAL_TARGET,
    isLunas,
    transactions: records.sort(
      (a, b) => new Date(a.timestamp) - new Date(b.timestamp)
    ),
  }
}

export function getAvailableBlocks() {
  return ['A', 'B', 'C', 'D', 'E', 'F']
}

export function formatRupiah(amount) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(amount)
}
```

**Step 3: Commit**

```bash
git add src/data/
git commit -m "feat: add mock payment data and data helpers"
```

---

### Task 4: Build SearchView Component

**Files:**
- Create: `src/components/SearchView.jsx`
- Modify: `src/App.jsx`

**Step 1: Create SearchView**

```jsx
import { useState } from 'react'
import { Search } from 'lucide-react'
import { getAvailableBlocks } from '../data/helpers'

export default function SearchView({ onSearch }) {
  const [blok, setBlok] = useState('')
  const [nomorRumah, setNomorRumah] = useState('')

  const handleSubmit = (e) => {
    e.preventDefault()
    if (blok && nomorRumah) {
      onSearch(blok, nomorRumah)
    }
  }

  const blocks = getAvailableBlocks()

  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-4 animate-pop-in">
      {/* Hero Header */}
      <div className="text-center mb-8">
        <h1 className="font-heading text-5xl md:text-6xl font-extrabold text-slate-dark mb-3">
          Cek IPL Perumahan
        </h1>
        <p className="font-body text-lg text-slate-dark/70">
          Masukkan blok dan nomor rumah untuk melihat status pembayaran
        </p>
      </div>

      {/* Sticker Card Search Box */}
      <form
        onSubmit={handleSubmit}
        className="bg-white border-2 border-slate-dark rounded-2xl shadow-hard p-8 w-full max-w-md hover:animate-wiggle transition-transform"
      >
        <div className="space-y-4">
          {/* Blok Dropdown */}
          <div>
            <label className="font-heading font-bold text-sm mb-1 block">
              Blok
            </label>
            <select
              value={blok}
              onChange={(e) => setBlok(e.target.value)}
              className="w-full border-2 border-slate-dark rounded-xl px-4 py-3 font-body text-base bg-cream focus:outline-none focus:ring-2 focus:ring-violet"
            >
              <option value="">Pilih Blok...</option>
              {blocks.map((b) => (
                <option key={b} value={b}>
                  Blok {b}
                </option>
              ))}
            </select>
          </div>

          {/* Nomor Rumah Input */}
          <div>
            <label className="font-heading font-bold text-sm mb-1 block">
              Nomor Rumah
            </label>
            <input
              type="number"
              min="1"
              max="15"
              value={nomorRumah}
              onChange={(e) => setNomorRumah(e.target.value)}
              placeholder="1 - 15"
              className="w-full border-2 border-slate-dark rounded-xl px-4 py-3 font-body text-base bg-cream focus:outline-none focus:ring-2 focus:ring-violet"
            />
          </div>

          {/* Candy Button */}
          <button
            type="submit"
            disabled={!blok || !nomorRumah}
            className="w-full bg-violet text-white font-heading font-bold text-lg border-2 border-slate-dark rounded-full px-6 py-3 shadow-hard hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_0px_#1E293B] active:translate-x-0 active:translate-y-0 active:shadow-hard-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <Search size={20} strokeWidth={2.5} />
            Cari
          </button>
        </div>
      </form>
    </div>
  )
}
```

**Step 2: Wire up App.jsx**

```jsx
import { useState } from 'react'
import { getResident } from './data/helpers'
import SearchView from './components/SearchView'

function App() {
  const [resident, setResident] = useState(null)

  const handleSearch = (blok, nomorRumah) => {
    const result = getResident(blok, nomorRumah)
    setResident(result)
  }

  const handleBack = () => setResident(null)

  return (
    <div className="min-h-screen">
      {resident === null ? (
        <SearchView onSearch={handleSearch} />
      ) : resident === undefined ? (
        <div className="flex items-center justify-center min-h-screen">
          <p className="font-heading text-xl">Data tidak ditemukan</p>
        </div>
      ) : null}
    </div>
  )
}

export default App
```

Note: `getResident` returns `null` for not found. We handle both `null` (initial/not-found after search) states. We'll refine this in the next task when DashboardView is added.

**Step 3: Verify**

```bash
npm run dev
```

Expected: Search form renders centered with Outfit headings, dot grid background, hard shadows on the card and button. Hover effects work.

**Step 4: Commit**

```bash
git add src/components/SearchView.jsx src/App.jsx
git commit -m "feat: add SearchView with Sticker Card and Candy Button"
```

---

### Task 5: Build DashboardView Component

**Files:**
- Create: `src/components/DashboardView.jsx`
- Modify: `src/App.jsx`

**Step 1: Create DashboardView**

```jsx
import { useState } from 'react'
import { ArrowLeft, CheckCircle, XCircle, Receipt, Image } from 'lucide-react'
import { formatRupiah } from '../data/helpers'
import ProofModal from './ProofModal'

export default function DashboardView({ resident, onBack }) {
  const [modalImage, setModalImage] = useState(null)

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 animate-pop-in">
      {/* Back Button */}
      <button
        onClick={onBack}
        className="flex items-center gap-2 font-heading font-bold text-sm mb-6 bg-yellow border-2 border-slate-dark rounded-full px-4 py-2 shadow-hard-sm hover:translate-x-[-2px] hover:translate-y-[-2px] transition-all"
      >
        <ArrowLeft size={18} strokeWidth={2.5} />
        Kembali
      </button>

      {/* Resident Header */}
      <div className="mb-8 text-center">
        <h1 className="font-heading text-4xl md:text-5xl font-extrabold text-slate-dark inline-block">
          {resident.namaPemilik}
        </h1>
        {/* Squiggle underline */}
        <svg className="mx-auto mt-2" width="200" height="12" viewBox="0 0 200 12">
          <path
            d="M0 6 Q 10 0, 20 6 T 40 6 T 60 6 T 80 6 T 100 6 T 120 6 T 140 6 T 160 6 T 180 6 T 200 6"
            fill="none"
            stroke="#8B5CF6"
            strokeWidth="3"
            strokeLinecap="round"
          />
        </svg>
        <p className="font-body text-slate-dark/60 mt-2">
          Blok {resident.blok} No. {resident.nomorRumah}
        </p>
      </div>

      {/* Summary Pills */}
      <div className="flex flex-col sm:flex-row gap-4 mb-8">
        <div className="flex-1 bg-white border-2 border-slate-dark rounded-2xl shadow-hard p-5">
          <div className="flex items-center gap-2 mb-2">
            <Receipt size={20} strokeWidth={2.5} className="text-violet" />
            <span className="font-heading font-bold text-sm">Total Terbayar</span>
          </div>
          <p className="font-heading text-2xl font-extrabold text-violet">
            {formatRupiah(resident.totalPaid)}
          </p>
          <p className="font-body text-xs text-slate-dark/50 mt-1">
            dari {formatRupiah(resident.annualTarget)}
          </p>
        </div>

        <div className={`flex-1 border-2 border-slate-dark rounded-2xl shadow-hard p-5 ${
          resident.isLunas ? 'bg-green/10' : 'bg-pink/10'
        }`}>
          <div className="flex items-center gap-2 mb-2">
            {resident.isLunas ? (
              <CheckCircle size={20} strokeWidth={2.5} className="text-green" />
            ) : (
              <XCircle size={20} strokeWidth={2.5} className="text-pink" />
            )}
            <span className="font-heading font-bold text-sm">Status</span>
          </div>
          <p className={`font-heading text-2xl font-extrabold ${
            resident.isLunas ? 'text-green' : 'text-pink'
          }`}>
            {resident.isLunas ? 'LUNAS' : 'BELUM LUNAS'}
          </p>
          <p className="font-body text-xs text-slate-dark/50 mt-1">
            {resident.isLunas
              ? 'Pembayaran tahun ini sudah lengkap'
              : `Kurang ${formatRupiah(resident.annualTarget - resident.totalPaid)}`}
          </p>
        </div>
      </div>

      {/* Transaction History */}
      <div className="bg-white border-2 border-slate-dark rounded-2xl shadow-hard overflow-hidden">
        <div className="px-5 py-4 border-b-2 border-slate-dark">
          <h2 className="font-heading font-bold text-lg">Riwayat Pembayaran</h2>
        </div>
        <div className="divide-y-2 divide-slate-dark/10">
          {resident.transactions.map((tx, i) => (
            <div
              key={i}
              className="flex items-center justify-between px-5 py-4 hover:bg-cream/50 transition-colors"
              style={{ animationDelay: `${i * 0.1}s` }}
            >
              <div>
                <p className="font-heading font-bold text-base">
                  {formatRupiah(tx.jumlahPembayaran)}
                </p>
                <p className="font-body text-sm text-slate-dark/60">
                  {new Date(tx.timestamp).toLocaleDateString('id-ID', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })}
                </p>
              </div>
              {/* Proof thumbnail */}
              <button
                onClick={() => setModalImage(tx.buktiTransfer)}
                className="w-12 h-12 bg-cream border-2 border-slate-dark rounded-lg shadow-hard-sm hover:translate-x-[-2px] hover:translate-y-[-2px] transition-all flex items-center justify-center"
              >
                <Image size={20} strokeWidth={2.5} className="text-slate-dark/40" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Proof Modal */}
      {modalImage && (
        <ProofModal imageUrl={modalImage} onClose={() => setModalImage(null)} />
      )}
    </div>
  )
}
```

**Step 2: Update App.jsx to include DashboardView**

```jsx
import { useState } from 'react'
import { getResident } from './data/helpers'
import SearchView from './components/SearchView'
import DashboardView from './components/DashboardView'

function App() {
  const [resident, setResident] = useState(null)
  const [searched, setSearched] = useState(false)

  const handleSearch = (blok, nomorRumah) => {
    const result = getResident(blok, nomorRumah)
    setResident(result)
    setSearched(true)
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
        <div className="flex flex-col items-center justify-center min-h-screen gap-4 animate-pop-in">
          <p className="font-heading text-xl font-bold">Data tidak ditemukan</p>
          <p className="font-body text-slate-dark/60">Blok atau nomor rumah tidak terdaftar</p>
          <button
            onClick={handleBack}
            className="bg-violet text-white font-heading font-bold border-2 border-slate-dark rounded-full px-6 py-2 shadow-hard hover:translate-x-[-2px] hover:translate-y-[-2px] transition-all"
          >
            Coba Lagi
          </button>
        </div>
      )}
    </div>
  )
}

export default App
```

**Step 3: Commit (after ProofModal in next task)**

Hold commit until ProofModal is done since DashboardView imports it.

---

### Task 6: Build ProofModal Component

**Files:**
- Create: `src/components/ProofModal.jsx`

**Step 1: Create ProofModal**

```jsx
import { X } from 'lucide-react'

export default function ProofModal({ imageUrl, onClose }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-dark/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-white border-2 border-slate-dark rounded-2xl shadow-hard p-4 max-w-lg w-full mx-4 animate-bounce-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <div className="flex justify-end mb-2">
          <button
            onClick={onClose}
            className="bg-pink text-white border-2 border-slate-dark rounded-full p-1 shadow-hard-sm hover:translate-x-[-2px] hover:translate-y-[-2px] transition-all"
          >
            <X size={20} strokeWidth={2.5} />
          </button>
        </div>

        {/* Placeholder image */}
        <div className="bg-cream border-2 border-slate-dark rounded-xl aspect-square flex flex-col items-center justify-center gap-3">
          <div className="text-6xl">🧾</div>
          <p className="font-heading font-bold text-slate-dark/40">Bukti Transfer</p>
          <p className="font-body text-sm text-slate-dark/30 text-center px-4">
            Placeholder — akan menampilkan bukti transfer asli saat data tersedia
          </p>
        </div>
      </div>
    </div>
  )
}
```

**Step 2: Verify full flow**

```bash
npm run dev
```

Expected:
1. Search page renders with form
2. Enter Blok A, Nomor 1 → shows Budi Santoso dashboard with 3 transactions, "BELUM LUNAS"
3. Enter Blok B, Nomor 5 → shows Agus Wijaya, "LUNAS"
4. Click proof thumbnail → bouncy modal appears with placeholder
5. Click X or outside → modal closes
6. "Kembali" button returns to search

**Step 3: Commit**

```bash
git add src/components/ src/App.jsx
git commit -m "feat: add DashboardView with summary pills, transaction history, and ProofModal"
```

---

### Task 7: Polish and Final Cleanup

**Files:**
- Modify: `src/main.jsx` (ensure index.css is imported)
- Modify: `index.html` (update title, add meta)

**Step 1: Update index.html**

Update the `<title>` and add meta description:

```html
<title>Cek IPL Perumahan</title>
<meta name="description" content="Cek status pembayaran IPL perumahan Anda" />
```

**Step 2: Clean up main.jsx**

Ensure `src/main.jsx` imports index.css and renders App cleanly. Remove any `StrictMode` wrapper if present (causes double-renders of animations).

```jsx
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App'

createRoot(document.getElementById('root')).render(<App />)
```

**Step 3: Delete unused files**

Remove any leftover Vite boilerplate: `src/assets/react.svg`, `public/vite.svg`, `src/App.css`.

```bash
rm -f src/assets/react.svg public/vite.svg src/App.css
```

**Step 4: Final verification**

```bash
npm run dev
npm run build
```

Expected: Both dev and build succeed without errors.

**Step 5: Commit**

```bash
git add -A
git commit -m "chore: polish HTML meta, clean up boilerplate files"
```

---

## Summary of Tasks

| Task | Description | Key Output |
|------|-------------|------------|
| 1 | Scaffold Vite + React | Working dev server |
| 2 | Tailwind v4 + Design System | Memphis Modern theme configured |
| 3 | Mock Data + Helpers | `validated.json` + `helpers.js` |
| 4 | SearchView | Hero section with Sticker Card form |
| 5 | DashboardView | Summary pills + transaction table |
| 6 | ProofModal | Bouncy modal with placeholder |
| 7 | Polish & Cleanup | Production-ready HTML, no boilerplate |
