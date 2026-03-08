Always use Context7 MCP when I need library/API documentation, code generation, setup or configuration steps without me having to explicitly ask.

# Project: catat-uang-warga

Web app for residents to check their IPL (housing fee) payment status for 2026.

## Stack
- React 19 + Vite
- Tailwind CSS v4
- lucide-react for icons
- No backend — data is static JSON

## Key Files
- `src/data/validated.json` — source of truth for all transactions (flat array under `data`, with top-level `lastUpdate`)
- `src/data/helpers.js` — data access functions (`getResident`, `formatRupiah`, `getLastUpdated`)
- `src/components/SearchView.jsx` — search form (select blok A–F + house number)
- `src/components/DashboardView.jsx` — payment dashboard per resident
- `src/components/ProofModal.jsx` — placeholder modal for proof of transfer
- `scripts/convert-validated.js` — converts raw CSV export to `validated.json`

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
```

## Constants
- Monthly IPL: Rp 250,000
- Annual target: Rp 3,000,000 (12 months)
- Blocks: A, B, C, D, E, F (up to 15 houses each)

## Notes
- `raw_data/` is gitignored — contains the original CSV with sensitive fields
- ProofModal shows a static placeholder; it does not display actual transfer images
