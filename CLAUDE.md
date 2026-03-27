Always use Context7 MCP when I need library/API documentation, code generation, setup or configuration steps without me having to explicitly ask.

# Project: catat-uang-warga

Web app for residents to check their IPL (housing fee) payment status for 2026.

## Stack
- React 19 + Vite
- Tailwind CSS v4
- lucide-react for icons
- react-router-dom v7 for routing
- No backend — data is static JSON

## Routes
- `/` — HomePage: search by blok + house number, leads to DashboardView
- `/leaderboard` — LeaderboardView: block ranking + house-level leaderboard
- `/broadcast` — BroadcastView: generate WhatsApp broadcast message
- `/pengeluaran` — ExpensesView: expense transparency page with category filtering

## Key Files
- `src/data/validated.json` — source of truth for all transactions (flat array under `data`, with top-level `lastUpdate`)
- `src/data/residents.json` — master registry of all residents (blok, nomorRumah, namaPemilik)
- `src/data/helpers.js` — data access functions
- `src/data/constants.js` — block colors (BLOCK_COLORS, BLOCK_COLORS_UNSELECTED, BLOCK_BAR_COLORS)
- `src/utils/tracking.js` — Umami analytics wrapper (`trackEvent`)
- `src/components/HomePage.jsx` — search form + result (SearchView + DashboardView combined)
- `src/components/SearchView.jsx` — search form (select blok A–F + house number)
- `src/components/DashboardView.jsx` — payment dashboard per resident
- `src/components/LeaderboardView.jsx` — block & house leaderboards with bar charts
- `src/components/BroadcastView.jsx` — WhatsApp broadcast message generator
- `src/components/ProofModal.jsx` — placeholder modal for proof of transfer
- `scripts/convert-validated.js` — converts raw CSV export to `validated.json`
- `scripts/convert-residents.js` — converts resident CSV to `residents.json`
- `src/data/expenses.json` — expense data (rutin + insidental, with summary)
- `src/components/ExpensesView.jsx` — expense transparency page
- `scripts/convert-expenses.js` — converts expense CSV to `expenses.json`

## Helper Functions (`src/data/helpers.js`)
- `getResident(blok, nomorRumah)` — single resident with transactions
- `getAllResidents()` — all residents with payment stats from `residents.json`
- `getBlockLeaderboard()` — blocks ranked by `collectionPct` (% of total expected revenue collected)
- `getHouseLeaderboard(blok?)` — houses sorted by `completionPct`, optionally filtered by block
- `generateBroadcastMessage()` — WhatsApp-formatted IPL report string
- `getAvailableBlocks()` — returns `['A','B','C','D','E','F']`
- `getLastUpdated()` — returns `lastUpdate` from `validated.json`
- `formatRupiah(amount)` — formats number as IDR currency
- `getExpenses()` — returns parsed `expenses.json` (rutin, insidental, summary)
- `getExpenseCategories()` — returns unique kategori list from insidental data
- `generateExpenseBroadcastMessage()` — WhatsApp-formatted expense report string

## Data Schema (`validated.json`)
Each record in `data[]`:
```json
{
  "timestamp": "2026-01-01T00:00:00+07:00",
  "blok": "A",
  "nomorRumah": "1",
  "namaPemilik": "Name",
  "jumlahPembayaran": 250000
}
```
Fields `email` and `buktiTransfer` are intentionally excluded from the public JSON.

## Scripts
```bash
npm run dev               # start dev server
npm run build             # production build
npm run convert:validated # convert raw_data/IPL 2026 - Validated.csv → src/data/validated.json
npm run convert:residents # convert resident CSV → src/data/residents.json
npm run convert:expenses       # convert raw_data/IPL 2026 - Pengeluaran Rutin.csv → src/data/expenses.json
```

## Constants
- Monthly IPL: Rp 250,000
- Annual target: Rp 3,000,000 (12 months)
- Blocks: A, B, C, D, E, F (up to 15 houses each)

## Block Ranking Logic
Blocks are ranked by **collection percentage** (`collectionPct`): ratio of total payments collected to total expected (totalHouses × ANNUAL_TARGET), capped at 100%. This rewards partial payments — a block where many residents pay partially ranks higher than one where only a few pay in full.

## Analytics
Umami analytics via `src/utils/tracking.js`. Call `trackEvent(name, data)` — no-ops if `window.umami` is undefined.

## Notes
- `raw_data/` is gitignored — contains the original CSV with sensitive fields
- ProofModal shows a static placeholder; it does not display actual transfer images
- Deployed at: https://ipl-talago.netlify.app
