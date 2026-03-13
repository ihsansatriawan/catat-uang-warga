# WhatsApp Broadcast Message Generator

## Problem

The pengurus (admin) needs to regularly share IPL payment status updates with residents via WhatsApp. Currently there's no way to generate a formatted broadcast message from the app — they'd have to manually compile the data.

## Solution

A `/broadcast` page in the web app that generates a formatted WhatsApp-ready text message from the existing payment data, with a copy-to-clipboard button.

## Message Format

Blocks listed alphabetically A–F (no ranking). Each block shows collection percentage, houses paid in full count, and per-house detail with months paid.

```
📊 *Laporan IPL 2026*
📅 14 Maret 2026

*Blok A — 22%* (2/12 rumah bayar penuh)
  ✅ A-5 Iksan — 12 bln
  🔵 A-3 Agus Herianto — 6 bln
  ⬜ A-7, A-8, A-9, A-10

*Blok B — 15%* (1/13 rumah bayar penuh)
  ✅ B-2 Andi — 12 bln
  🔵 B-6 Rudi — 3 bln
  ⬜ B-1, B-3, B-4, B-5

... (C, D, E, F)

📱 Cek detail → cek-ipl.web.app
```

### Formatting Rules

- **✅** = lunas (totalPaid >= 3,000,000 annual target), show months capped: `Math.min(12, Math.floor(totalPaid / 250000))` + " bln"
- **🔵** = partially paid (totalPaid > 0 but < annual target), show months: `Math.floor(totalPaid / 250000)` + " bln"
- **⬜** = belum bayar (totalPaid === 0), grouped compactly as comma-separated house numbers only, no owner names (e.g. "A-7, A-8, A-9")
- Within each block, paid houses sorted by payment % descending (lunas first, then partial payers)
- Unpaid houses listed by house number ascending
- Date uses `lastUpdate` from validated.json, formatted with `toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })`
- WhatsApp bold uses `*text*` syntax
- No access control needed — data is already public on the leaderboard page

## Data Flow

```
helpers.js (existing functions already consume validated.json + residents.json internally)
       ↓
  new: generateBroadcastMessage() in helpers.js
       ↓
  BroadcastView.jsx → renders preview + copy button
```

### New Helper Function

`generateBroadcastMessage()` in `src/data/helpers.js`:

1. Call `getBlockLeaderboard()` to get block-level stats (collectionPct, lunasCount, totalHouses), then **re-sort alphabetically by blok** (since `getBlockLeaderboard()` returns sorted by collectionPct descending)
2. For each block A–F:
   - Call `getHouseLeaderboard(blok)` to get per-house detail (already sorted by completionPct descending)
   - Separate into: lunas, partial payers, unpaid
   - Format each category per the rules above
3. Compose the full message string with header, blocks, and footer
4. Return the plain text string

### Inputs
- `getBlockLeaderboard()` — provides per-block: blok, totalHouses, lunasCount, collectionPct
- `getHouseLeaderboard(blok)` — provides per-house: blok, nomorRumah, namaPemilik, totalPaid, monthsPaid, isLunas, completionPct
- `getLastUpdated()` — provides lastUpdate date

### Output
A single string ready to paste into WhatsApp.

## UI: BroadcastView.jsx

Route: `/broadcast`

### Layout
1. **Sticky header** — same style as LeaderboardView: "Kembali" link (back to `/`), centered title "Broadcast", icon
2. **Preview card** — WhatsApp-style bubble (dark green `#075e54` background, light text) showing the generated message with proper line breaks
3. **Copy button** — prominent button below the preview. Uses `navigator.clipboard.writeText()` with fallback to a hidden textarea + `document.execCommand('copy')` for browsers without Clipboard API. Shows "Tersalin!" feedback for 2 seconds after copy
4. **Leaderboard link** — small text link "Lihat Leaderboard →" below the copy button

### Styling
- Follows existing app design system (Tailwind classes, font-heading, font-body, border-2 border-slate-dark, rounded-3xl, shadow-hard)
- WhatsApp preview card uses inline dark green styling to visually distinguish from the rest of the app
- Copy button uses the same green button style as the existing WhatsApp contact button in LeaderboardView

## Routing

Add `/broadcast` route in the existing router config (App.jsx or equivalent router file).

## Files Changed

| File | Change |
|------|--------|
| `src/data/helpers.js` | Add `generateBroadcastMessage()` function |
| `src/components/BroadcastView.jsx` | New component (preview + copy) |
| `src/App.jsx` | Add `/broadcast` route |

## Success Criteria

1. Navigating to `/broadcast` shows the formatted message preview
2. Message includes all 6 blocks A–F in alphabetical order
3. Each block shows: collection %, houses paid count, per-house detail with months
4. ✅/🔵/⬜ icons correctly categorize houses
5. Unpaid houses are grouped compactly (not one per line)
6. Copy button copies plain text to clipboard
7. Copied text renders correctly in WhatsApp (bold, line breaks, emojis)
8. Date matches lastUpdate from validated.json
