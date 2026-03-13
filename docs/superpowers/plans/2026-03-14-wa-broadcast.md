# WhatsApp Broadcast Message Generator — Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a `/broadcast` page that generates a WhatsApp-ready text message summarizing IPL payment status per block and per house, with a copy-to-clipboard button.

**Architecture:** New helper function `generateBroadcastMessage()` composes the message text from existing data functions. New `BroadcastView.jsx` component renders a preview and copy button. Route added in `App.jsx`.

**Tech Stack:** React 19, React Router (react-router-dom v7), Tailwind CSS v4, lucide-react

**Spec:** `docs/superpowers/specs/2026-03-14-wa-broadcast-design.md`

---

## File Structure

| File | Action | Responsibility |
|------|--------|----------------|
| `src/data/helpers.js` | Modify | Add `generateBroadcastMessage()` function |
| `src/components/BroadcastView.jsx` | Create | Broadcast preview page with copy button |
| `src/App.jsx` | Modify | Add `/broadcast` route |

---

## Chunk 1: Implementation

### Task 1: Add `generateBroadcastMessage()` to helpers.js

**Files:**
- Modify: `src/data/helpers.js` (append after line 100)

**Dependencies:** Uses existing `getBlockLeaderboard()`, `getHouseLeaderboard()`, `getLastUpdated()`, and constants `MONTHLY_IPL`.

- [ ] **Step 1: Add the function**

Append to `src/data/helpers.js`:

```javascript
export function generateBroadcastMessage() {
  const blocks = getBlockLeaderboard().sort((a, b) => a.blok.localeCompare(b.blok))
  const lastUpdated = getLastUpdated()
  const dateStr = lastUpdated
    ? new Date(lastUpdated).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
    : new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })

  let msg = `📊 *Laporan IPL 2026*\n📅 ${dateStr}\n`

  for (const block of blocks) {
    const houses = getHouseLeaderboard(block.blok)
    const lunas = houses.filter(h => h.isLunas)
    const partial = houses.filter(h => h.totalPaid > 0 && !h.isLunas)
    const unpaid = houses.filter(h => h.totalPaid === 0)

    msg += `\n*Blok ${block.blok} — ${block.collectionPct}%* (${block.lunasCount}/${block.totalHouses} rumah bayar penuh)\n`

    for (const h of lunas) {
      const months = Math.min(12, Math.floor(h.totalPaid / MONTHLY_IPL))
      msg += `  ✅ ${h.blok}-${h.nomorRumah} ${h.namaPemilik} — ${months} bln\n`
    }

    for (const h of partial) {
      const months = Math.floor(h.totalPaid / MONTHLY_IPL)
      msg += `  🔵 ${h.blok}-${h.nomorRumah} ${h.namaPemilik} — ${months} bln\n`
    }

    if (unpaid.length > 0) {
      const unpaidSorted = unpaid.sort((a, b) => Number(a.nomorRumah) - Number(b.nomorRumah))
      const unpaidLabels = unpaidSorted.map(h => `${h.blok}-${h.nomorRumah}`)
      // Group into lines of ~5 for readability
      for (let i = 0; i < unpaidLabels.length; i += 5) {
        msg += `  ⬜ ${unpaidLabels.slice(i, i + 5).join(', ')}\n`
      }
    }
  }

  msg += `\n📱 Cek detail → cek-ipl.web.app`
  return msg
}
```

- [ ] **Step 2: Verify dev server starts without errors**

Run: `npm run dev`
Expected: Compiles successfully, no errors in terminal.

- [ ] **Step 3: Commit**

```bash
git add src/data/helpers.js
git commit -m "feat: add generateBroadcastMessage helper"
```

---

### Task 2: Create BroadcastView.jsx

**Files:**
- Create: `src/components/BroadcastView.jsx`

**Dependencies:** Task 1 must be completed first (`generateBroadcastMessage` must exist).

- [ ] **Step 1: Create the component**

Create `src/components/BroadcastView.jsx`:

```jsx
import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, Copy, Check, Send } from 'lucide-react'
import { generateBroadcastMessage } from '../data/helpers'
import { trackEvent } from '../utils/tracking'

export default function BroadcastView() {
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    trackEvent('open_broadcast')
  }, [])
  const message = generateBroadcastMessage()

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(message)
    } catch {
      // Fallback for browsers without Clipboard API
      const textarea = document.createElement('textarea')
      textarea.value = message
      textarea.style.position = 'fixed'
      textarea.style.opacity = '0'
      document.body.appendChild(textarea)
      textarea.select()
      document.execCommand('copy')
      document.body.removeChild(textarea)
    }
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
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
            Broadcast
          </span>
        </div>
        <Send size={20} strokeWidth={2.5} className="text-green" />
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto safe-x">
        <div className="max-w-lg mx-auto px-4 py-6 space-y-5">

          {/* WhatsApp preview card */}
          <div className="bg-white border-2 border-slate-dark rounded-3xl shadow-hard overflow-hidden animate-slide-up stagger-1">
            <div className="px-5 py-4 border-b-2 border-slate-dark flex items-center gap-2">
              <span className="text-lg">💬</span>
              <h2 className="font-heading font-bold text-base">Preview Pesan</h2>
            </div>

            <div
              className="p-4"
              style={{ backgroundColor: '#075e54' }}
            >
              <div
                className="rounded-xl p-4 text-sm leading-relaxed"
                style={{
                  backgroundColor: '#dcf8c6',
                  color: '#111',
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                  fontFamily: 'system-ui, -apple-system, sans-serif',
                }}
              >
                {message}
              </div>
            </div>
          </div>

          {/* Copy button */}
          <div className="animate-slide-up stagger-2 flex flex-col items-center gap-3">
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
                : <><Copy size={16} strokeWidth={2.5} /> Salin Pesan</>
              }
            </button>

            <Link
              to="/leaderboard"
              className="font-body text-sm text-slate-dark/50 hover:text-slate-dark transition-colors"
            >
              Lihat Leaderboard →
            </Link>
          </div>

        </div>
      </div>

      {/* Bottom safe area */}
      <div className="safe-bottom bg-cream" />
    </div>
  )
}
```

- [ ] **Step 2: Verify no syntax errors**

Run: `npm run dev`
Expected: Compiles successfully (component not yet routed, just verify no import errors).

- [ ] **Step 3: Commit**

```bash
git add src/components/BroadcastView.jsx
git commit -m "feat: add BroadcastView component"
```

---

### Task 3: Add route and verify

**Files:**
- Modify: `src/App.jsx` (add import + route)

**Dependencies:** Tasks 1 and 2 must be completed first.

- [ ] **Step 1: Add the route**

In `src/App.jsx`, add import at line 3:

```javascript
import BroadcastView from './components/BroadcastView'
```

Add route after the leaderboard route (line 9):

```jsx
<Route path="/broadcast" element={<BroadcastView />} />
```

- [ ] **Step 2: Verify in browser**

Run: `npm run dev`
Navigate to: `http://localhost:5173/broadcast`

Expected:
- Page loads with sticky header ("Kembali" + "Broadcast" title)
- WhatsApp-style preview shows formatted message with all 6 blocks A–F
- Each block shows collection %, house count, per-house detail with months
- ✅/🔵/⬜ icons display correctly
- "Salin Pesan" button is visible
- Clicking "Salin Pesan" copies text and shows "Tersalin!" for 2 seconds
- Paste copied text in any text editor to verify formatting

- [ ] **Step 3: Commit**

```bash
git add src/App.jsx
git commit -m "feat: add /broadcast route"
```

---

## Verification Checklist

After all tasks are complete, verify against spec success criteria:

- [ ] Navigating to `/broadcast` shows the formatted message preview
- [ ] Message includes all 6 blocks A–F in alphabetical order
- [ ] Each block shows: collection %, houses paid count, per-house detail with months
- [ ] ✅/🔵/⬜ icons correctly categorize houses
- [ ] Unpaid houses are grouped compactly (not one per line)
- [ ] Copy button copies plain text to clipboard
- [ ] Copied text renders correctly in WhatsApp (bold, line breaks, emojis)
- [ ] Date matches lastUpdate from validated.json
