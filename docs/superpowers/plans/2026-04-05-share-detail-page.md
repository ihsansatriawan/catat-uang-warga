# Share Detail Page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking. **No code review between tasks** — execute straight through.

**Goal:** Add a shareable `/warga/:blok/:nomorRumah` route so users can share direct links to a resident's payment dashboard, with a native share button.

**Architecture:** Extract the dashboard rendering from `HomePage` into a new route-based `WargaPage` component. Simplify `HomePage` to search-only with `navigate()`. Add share button to `DashboardView` using Web Share API with clipboard fallback.

**Tech Stack:** React 19, react-router-dom v7, lucide-react, Vite

---

### Task 1: Create WargaPage route wrapper

**Files:**
- Create: `src/components/WargaPage.jsx`
- Modify: `src/App.jsx`

- [ ] **Step 1: Create `src/components/WargaPage.jsx`**

```jsx
import { useParams, useNavigate } from 'react-router-dom'
import { MessageCircle } from 'lucide-react'
import { getResident } from '../data/helpers'
import DashboardView from './DashboardView'

export default function WargaPage() {
  const { blok, nomorRumah } = useParams()
  const navigate = useNavigate()
  const resident = getResident(blok, nomorRumah)

  if (!resident) {
    return (
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
              href={`https://wa.me/628111719913?text=${encodeURIComponent(`Saya mencari nomor rumah saya: Blok ${blok} No. ${nomorRumah} namun data tidak ditemukan`)}`}
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
            onClick={() => navigate('/')}
            className="mt-2 bg-violet text-white font-heading font-bold border-2 border-slate-dark rounded-full px-6 py-2 shadow-hard hover:translate-x-[-2px] hover:translate-y-[-2px] transition-all"
          >
            Coba Lagi
          </button>
        </div>
      </div>
    )
  }

  return <DashboardView resident={resident} onBack={() => navigate('/')} />
}
```

- [ ] **Step 2: Add route to `src/App.jsx`**

Add the import and route. The full file should be:

```jsx
import { Routes, Route } from 'react-router-dom'
import HomePage from './components/HomePage'
import WargaPage from './components/WargaPage'
import LeaderboardView from './components/LeaderboardView'
import BroadcastView from './components/BroadcastView'
import ExpensesView from './components/ExpensesView'

function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/warga/:blok/:nomorRumah" element={<WargaPage />} />
      <Route path="/leaderboard" element={<LeaderboardView />} />
      <Route path="/broadcast" element={<BroadcastView />} />
      <Route path="/pengeluaran" element={<ExpensesView />} />
    </Routes>
  )
}

export default App
```

- [ ] **Step 3: Verify dev server runs**

Run: `npm run dev` — open `http://localhost:5173/warga/A/1` in browser. Should show the dashboard for Blok A No. 1 (or "not found" if no data for that house). Open `http://localhost:5173/warga/Z/99` — should show "not found" card.

- [ ] **Step 4: Commit**

```bash
git add src/components/WargaPage.jsx src/App.jsx
git commit -m "feat: add /warga/:blok/:nomorRumah route with WargaPage"
```

---

### Task 2: Simplify HomePage to search-only with navigate

**Files:**
- Modify: `src/components/HomePage.jsx`

- [ ] **Step 1: Rewrite `src/components/HomePage.jsx`**

Replace the entire file content with:

```jsx
import { useNavigate } from 'react-router-dom'
import SearchView from './SearchView'

export default function HomePage() {
  const navigate = useNavigate()

  const handleSearch = (blok, nomorRumah) => {
    navigate(`/warga/${blok}/${nomorRumah}`)
  }

  return <SearchView onSearch={handleSearch} />
}
```

- [ ] **Step 2: Verify search flow navigates correctly**

Run: `npm run dev` — open `http://localhost:5173/`. Select Blok A, enter house number 1, click "Cari Sekarang". Should navigate to `/warga/A/1` and show the dashboard. The URL bar should show `/warga/A/1`. Press browser back — should return to `/` with the search form.

- [ ] **Step 3: Commit**

```bash
git add src/components/HomePage.jsx
git commit -m "refactor: simplify HomePage to search-only with navigate"
```

---

### Task 3: Add share button to DashboardView

**Files:**
- Modify: `src/components/DashboardView.jsx`

- [ ] **Step 1: Add share functionality**

In `src/components/DashboardView.jsx`, make these changes:

1. Add `Share2` to the lucide-react import:

```jsx
import { ArrowLeft, CheckCircle, XCircle, Receipt, Image, Calendar, MessageCircle, Share2 } from 'lucide-react'
```

2. Add `copied` state and `handleShare` function inside the component, after the existing `showProof` state:

```jsx
const [copied, setCopied] = useState(false)

const handleShare = async () => {
  const shareData = {
    title: `IPL ${resident.namaPemilik} - Blok ${resident.blok} No. ${resident.nomorRumah}`,
    url: window.location.href,
  }

  if (navigator.share) {
    try {
      await navigator.share(shareData)
    } catch (err) {
      // User cancelled share — ignore
    }
  } else {
    await navigator.clipboard.writeText(shareData.url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }
}
```

3. Add the share button in the sticky top bar, between the back button and the `flex-1 text-center` div. Find this section:

```jsx
        </button>
        <div className="flex-1 text-center">
```

Insert after the closing `</button>` of the back button:

```jsx
        <button
          onClick={handleShare}
          className="
            flex items-center gap-1.5 font-heading font-bold text-sm
            bg-cream border-2 border-slate-dark rounded-full px-3 py-1.5
            shadow-hard-sm
            active:translate-x-[1px] active:translate-y-[1px] active:shadow-none
            transition-all
          "
          aria-label="Bagikan"
        >
          <Share2 size={16} strokeWidth={2.5} />
          {copied ? 'Disalin!' : 'Bagikan'}
        </button>
```

- [ ] **Step 2: Verify share button works**

Run: `npm run dev` — open `http://localhost:5173/warga/A/1`. The sticky top bar should show: [Kembali] [Bagikan] ... [LUNAS/BELUM]. Click "Bagikan":
- On mobile: native share sheet should appear
- On desktop: button text should briefly change to "Disalin!" and the URL should be in clipboard

- [ ] **Step 3: Verify build succeeds**

Run: `npm run build`
Expected: Build completes with no errors.

- [ ] **Step 4: Commit**

```bash
git add src/components/DashboardView.jsx
git commit -m "feat: add share button with Web Share API and clipboard fallback"
```

---

### Task 4: Final verification

- [ ] **Step 1: Test all flows end-to-end**

Run: `npm run dev`

1. **Search flow:** Open `/` → search Blok A No. 1 → URL changes to `/warga/A/1` → dashboard shows → back button returns to `/`
2. **Direct link:** Open `/warga/A/1` directly → dashboard shows immediately
3. **Not found:** Open `/warga/Z/99` → "data tidak ditemukan" card shows → "Coba Lagi" returns to `/`
4. **Share button:** On dashboard, click "Bagikan" → share or clipboard works
5. **Other routes:** `/leaderboard`, `/broadcast`, `/pengeluaran` still work

- [ ] **Step 2: Production build**

Run: `npm run build`
Expected: Clean build, no warnings or errors.
