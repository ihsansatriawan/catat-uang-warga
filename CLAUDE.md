Always use Context7 MCP when I need library/API documentation, code generation, setup or configuration steps without me having to explicitly ask.

# Project: catat-uang-warga

Produk siap jual: situs transparansi iuran warga untuk perumahan/RT-RW. Warga cek
status pembayarannya sendiri, lihat pengeluaran kas, dan daftar acara warga.

**Ini adalah versi produk (white-label), bukan instance satu perumahan.** Tidak
boleh ada nama perumahan, nomor WhatsApp, rekening, atau data warga asli yang
hardcode di dalam kode. Semuanya lewat `src/config/site.config.js`.

## Stack
- React 19 + Vite 6
- Tailwind CSS v4
- lucide-react for icons
- react-router-dom v7 for routing
- No backend — data IPL statis (JSON), data acara lewat Google Apps Script

## Konfigurasi (yang membuat ini bisa dijual)
- `src/config/site.config.js` — **satu-satunya file yang diedit pembeli**:
  identitas perumahan, label & nominal iuran, daftar blok, rekening, kontak
  pengurus, toggle fitur, detail acara
- `src/config/index.js` — turunan config: `SITE`, `TARGET_TAHUNAN`, `LABEL_IURAN`,
  `DAFTAR_BLOK`, `siteUrl()`, `waPengurusUrl()`, `waShareUrl()`, `formatRupiah()`
- `scripts/setup.js` (`npm run setup`) — wizard interaktif yang menulis ulang
  `site.config.js` + membuat `.env.local`
- `vite.config.js` — menyuntik `%SITE_TITLE%`, `%SITE_DESCRIPTION%`,
  `%SITE_ANALYTICS%` ke `index.html` dari config + env. Kalau `VITE_UMAMI_*`
  kosong, tag analytics tidak ditulis sama sekali (dulu ini bikin dev server 500)
- `waPengurusUrl()` mengembalikan `null` kalau `kontak.whatsapp` kosong —
  komponen menyembunyikan tombol WA-nya, jangan render link kosong
- `FITUR.*` mematikan menu **dan** rute (`App.jsx` mengalihkan ke `/`)
- Warna blok dibagikan otomatis dari palet di `src/data/constants.js`, jadi jumlah
  blok bebas. Kelas Tailwind harus ditulis utuh agar ikut ter-scan saat build

## Routes
- `/` — HomePage: search by blok + house number, leads to DashboardView
- `/warga/:blok/:nomorRumah` — WargaPage: permalink ke satu rumah; fallback ke
  PaymentInfoCard kalau rumah belum punya transaksi
- `/leaderboard` — LeaderboardView (toggle `fitur.leaderboard`)
- `/broadcast` — BroadcastView (toggle `fitur.broadcast`)
- `/pengeluaran` — ExpensesView (toggle `fitur.pengeluaran`)
- `/kehadiran` · `/rekap-kehadiran` — RSVP acara (toggle `fitur.kehadiran`)
- `/lomba` · `/rekap-lomba` — pendaftaran lomba (toggle `fitur.lomba`)
- `*` — dialihkan ke `/`

## Key Files
- `src/data/validated.json` — sumber data transaksi (array `data` + `lastUpdate`)
- `src/data/residents.json` — daftar seluruh warga (blok, nomorRumah, namaPemilik)
- `src/data/expenses.json` — pengeluaran (rutin + insidental + summary)
- `src/data/helpers.js` — akses data, semua konstanta dari `src/config`
- `src/data/constants.js` — palet warna blok (dibagikan otomatis)
- `src/data/lomba.js` — konfigurasi lomba; `LOMBA_EVENT.subtitle` ikut config
- `src/utils/tracking.js` — wrapper Umami (`trackEvent`), no-op kalau tidak ada
- `scripts/generate-demo-data.js` (`npm run demo:seed`) — data demo deterministik
  mengikuti jumlah blok/rumah di config. **Data di `src/data/` saat ini demo.**
- `scripts/convert-*.js` — konversi CSV → JSON, default path relatif ke `raw_data/`

## Helper Functions (`src/data/helpers.js`)
- `getResident(blok, nomorRumah)` — satu warga + transaksinya
- `getAllResidents()` — semua warga + statistik pembayaran
- `getBlockLeaderboard()` — blok diurutkan by `collectionPct`
- `getHouseLeaderboard(blok?)` — rumah diurutkan by `completionPct`
- `generateBroadcastMessage()` / `generateExpenseBroadcastMessage()`
- `getAttendanceHouses(blok?)`, `getResidentName(blok, nomorRumah)`
- `getAvailableBlocks()` — dari config, bukan hardcode
- `getLastUpdated()`, `formatRupiah(amount)`, `getExpenses()`, `getExpenseCategories()`

Urutan blok mengikuti `DAFTAR_BLOK` (bukan abjad) lewat `compareBlok()`.

## Data Schema (`validated.json`)
```json
{
  "timestamp": "2026-01-01T00:00:00+07:00",
  "blok": "A",
  "nomorRumah": "1",
  "namaPemilik": "Name",
  "jumlahPembayaran": 250000
}
```
Field `email` dan `buktiTransfer` sengaja tidak ikut ke JSON publik.

## Scripts
```bash
npm run setup             # wizard konfigurasi
npm run dev               # dev server
npm run build             # production build
npm run lint              # eslint (eslint.config.js, flat config)
npm run demo:seed         # regenerate data demo
npm run convert:validated # raw_data/Validated.csv    → src/data/validated.json
npm run convert:residents # raw_data/Data Warga.csv   → src/data/residents.json
npm run convert:expenses  # raw_data/Transaksi.csv    → src/data/expenses.json
```

## Dokumentasi (bagian dari produk yang dijual)
- `README.md` — halaman depan produk
- `docs/INSTALASI.md` — nol sampai online, untuk pembeli
- `docs/KONFIGURASI.md` — referensi tiap field config + env var
- `docs/PANDUAN-PENGURUS.md` — pemakaian harian tanpa menyentuh kode
- `docs/google-apps-script-setup.md`, `attendance-apps-script.md`,
  `lomba-apps-script.md`, `analytics.md` — setup integrasi
- `LICENSE.md` — lisensi komersial satu komunitas

Kalau mengubah perilaku yang dilihat pembeli, perbarui dokumennya di commit yang sama.

## Constants
- Iuran bulanan, jumlah bulan, target tahunan: semua dari `src/config`
- Blok: dari `rumah.blok` di config (default A–F, maksimal bebas)

## Block Ranking Logic
Blok diurutkan berdasarkan `collectionPct`: total terkumpul ÷ (jumlah rumah ×
target tahunan), dibatasi 100%. Kontribusi tiap rumah di-cap di target tahunan
supaya kelebihan bayar satu rumah tidak menutupi rumah yang belum bayar.

## Apps Script — dua spreadsheet terpisah
Satu project Apps Script hanya bisa punya satu `doPost`/`doGet`, jadi kedua form
tinggal di **spreadsheet + project + Web App URL yang berbeda**.

| Spreadsheet | Script | Tabs | Env var |
| --- | --- | --- | --- |
| Iuran | `scripts/google-apps-script/Code.gs` | Raw Data, Validated, Transaksi, Kehadiran | `VITE_ATTENDANCE_ENDPOINT` |
| Lomba | `scripts/google-apps-script/Lomba.gs` | Lomba (auto-created) | `VITE_LOMBA_ENDPOINT` |

`VITE_LOMBA_ENDPOINT` **tanpa fallback** — kalau kosong, form lomba menolak submit
supaya data tidak nyasar ke spreadsheet iuran. Penulisan sheet bersifat posisional:
`LOMBA_KEYS` di `Lomba.gs` harus urut sama dengan `LOMBA_LIST` di `src/data/lomba.js`.

## Notes
- `raw_data/` gitignored — berisi CSV dengan field sensitif
- `.env.local` opsional; aplikasi jalan tanpa file itu
- ProofModal masih placeholder statis, tidak menampilkan gambar bukti transfer
- Jangan commit data warga asli ke branch produk ini
