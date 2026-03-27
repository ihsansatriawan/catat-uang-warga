# Expense Tracker (Pengeluaran) — Design Spec

## Overview

Tambah halaman pengeluaran di web app agar warga bisa melihat transparansi keuangan RT — total pemasukan, pengeluaran, dan sisa anggaran. Data di-publish dari Google Sheets via Apps Script (extend pipeline existing), ditampilkan di route `/pengeluaran`, dan bisa di-copy sebagai broadcast WhatsApp.

**Prinsip utama**: Additive only — tidak mengubah fungsi atau flow existing di Apps Script maupun web app.

## Data Source

### Sheet Format (tidak berubah)

Tab "Pengeluaran Rutin" memiliki dua tabel:

**Tabel Rutin (kiri):**
| Keterangan | Masuk | Keluar |
|---|---|---|
| Sisa Kas 2025 | 22,408,505 | |
| Total Iuran Warga 2026 | 39,450,000 | |
| Security Januari | | 2,450,000 |
| ... | | |
| Total | 61,858,505 | 6,850,000 |
| Sisa | 55,008,505 | |

**Tabel Insidental (kanan) — kolom Kategori ditambahkan:**
| Keterangan | Masuk | Keluar | Tanggal | Kategori |
|---|---|---|---|---|
| sisa uang (potong biaya rutin) | 55,008,505 | | 1 January 2026 | |
| Bahan renovasi taman blok F | | 1,500,000 | 3 January 2026 | Renovasi |
| THR 2026 | | 2,750,000 | 28 February 2026 | THR |
| ... | | | | |

- Kolom Kategori hanya di tabel insidental (kolom baru setelah Tanggal)
- Tabel rutin tidak perlu kategori — sudah jelas (Security bulanan, dll)

## Data Structure — `expenses.json`

```json
{
  "lastUpdate": "2026-03-27T10:00:00+07:00",
  "rutin": [
    { "keterangan": "Sisa Kas 2025", "masuk": 22408505, "keluar": null },
    { "keterangan": "Security Januari", "masuk": null, "keluar": 2450000 }
  ],
  "insidental": [
    {
      "keterangan": "Bahan renovasi taman blok F",
      "masuk": null,
      "keluar": 1500000,
      "tanggal": "2026-01-03",
      "kategori": "Renovasi"
    }
  ],
  "summary": {
    "totalMasuk": 55008505,
    "totalKeluar": 24578900,
    "sisaAnggaran": 30429605
  }
}
```

- `summary` dihitung di Apps Script saat build JSON
- Saldo actual **tidak** disertakan (disembunyikan dari public)
- `tanggal` di-format ISO (YYYY-MM-DD) saat build JSON

## Apps Script Changes

### Prinsip: Additive Only

Tidak mengubah fungsi existing:
- `onEditHandler()` — tidak disentuh
- `deployToSite()` — tidak disentuh
- `buildValidatedJson()` — tidak disentuh
- `pushToGitHub()` — di-reuse tanpa modifikasi (sudah generic, terima path + content)

### Fungsi Baru

**`buildExpensesJson()`**
- Baca tab "Pengeluaran Rutin"
- Parse tabel rutin (kiri): baca rows sampai ketemu "Total"
- Parse tabel insidental (kanan): baca rows sampai ketemu "Total"
- Hitung summary dari total rows
- Return JSON string

**`deployExpensesToSite()`**
- Panggil `buildExpensesJson()`
- Panggil `pushToGitHub('src/data/expenses.json', jsonContent)`
- Tampilkan status dialog (success/error)

### Custom Menu Extension

```
IPL Tools
├── Deploy Data ke Website           (existing, tidak berubah)
├── Deploy Pengeluaran ke Website    (baru)
```

## Web App — Route & Component

### Route

`/pengeluaran` — route baru di `App.jsx`

### Component: `ExpensesView.jsx`

**Layout:**

```
┌─────────────────────────────┐
│ ← Pengeluaran Warga   2026 │  sticky top bar
├─────────────────────────────┤
│  Total Masuk       55.008jt │  summary cards
│  Total Keluar      24.578jt │
│  Sisa Anggaran     30.429jt │
├─────────────────────────────┤
│  Pengeluaran Rutin          │  section header
│ ┌───────────────────┬──────┐│
│ │ Security Januari  │2.45jt││  table rows
│ │ Security Februari │2.70jt││
│ │ ...               │      ││
│ └───────────────────┴──────┘│
├─────────────────────────────┤
│  Pengeluaran Insidental     │  section header
│  [Semua] [Renovasi] [THR]   │  filter chips (dynamic)
│ ┌────────────────┬────┬────┐│
│ │ Bahan renovasi │1.5j│3/1 ││  table with tanggal
│ │ Pasir renovasi │5.3j│3/1 ││
│ │ ...            │    │    ││
│ └────────────────┴────┴────┘│
├─────────────────────────────┤
│  Copy Broadcast WA          │  button
│  Last update: 27 Mar 2026   │
└─────────────────────────────┘
```

**Styling:**
- Mengikuti pattern existing: `border-2`, `shadow-hard`, `rounded-3xl`, stagger animations
- Filter chips: dynamic dari kategori unik di data insidental, style mirip block filter di `LeaderboardView.jsx`
- Summary cards: 3 cards horizontal atau stacked, formatRupiah untuk angka

**Navigation:**
- Tambah link ke `/pengeluaran` dari halaman yang relevan (HomePage atau nav)

## WhatsApp Broadcast

### Format Pesan

```
*Laporan Pengeluaran IPL 2026*
Update: 27 Maret 2026

Total Masuk: Rp 55.008.505
Total Keluar: Rp 24.578.900
Sisa Anggaran: Rp 30.429.605

*Breakdown per Kategori:*
• Renovasi: Rp 15.000.000
• Security: Rp 6.850.000
• THR: Rp 2.750.000

Detail lengkap: https://ipl-talago.netlify.app/pengeluaran
```

### Implementasi

- Fungsi `generateExpenseBroadcastMessage()` di `helpers.js`
- Kategori di-aggregate: rutin (semua masuk "Security") + insidental (per kolom kategori)
- Copy-to-clipboard reuse pattern dari `BroadcastView.jsx`

## Helper Functions

**Baru di `helpers.js`:**
- `getExpenses()` — return parsed `expenses.json` (rutin, insidental, summary)
- `getExpenseCategories()` — return daftar kategori unik dari data insidental
- `generateExpenseBroadcastMessage()` — WhatsApp-formatted broadcast string

## Conversion Script (Fallback)

- `scripts/convert-expenses.js` — manual convert CSV ke `expenses.json`
- npm script: `npm run convert:expenses`

## Analytics

**Events baru:**
- `open_expenses` — saat mount halaman pengeluaran
- `filter_expense_category` — saat klik filter chip kategori
- `copy_expense_broadcast` — saat copy broadcast WA

## CLAUDE.md Updates

Tambahkan ke CLAUDE.md:
- Route `/pengeluaran` di section Routes
- `src/data/expenses.json` di section Key Files
- `ExpensesView.jsx` di section Key Files
- Helper functions baru di section Helper Functions
- `convert:expenses` di section Scripts
- Analytics events baru di section Analytics (jika ada)

## Out of Scope

- Saldo actual tidak ditampilkan
- Tidak ada edit/input pengeluaran dari web (read-only)
- Tidak ada auth/login
- Tidak mengubah format sheet existing (hanya tambah kolom Kategori di tabel insidental)
