# Catat Uang Warga

Web app untuk warga perumahan mengecek status pembayaran IPL (Iuran Pengelolaan Lingkungan) 2026.

🌐 **Live:** https://ipl-talago.netlify.app

## Fitur

- Cek status pembayaran per rumah (blok + nomor)
- Riwayat transaksi lengkap
- Indikator lunas / belum lunas
- Progress bar pembayaran tahunan
- Leaderboard blok & rumah (ranking berdasarkan % terkumpul)
- Generate pesan broadcast WhatsApp laporan IPL
- Mobile-first, responsive

## Tech Stack

- React 19 + Vite
- Tailwind CSS v4
- lucide-react
- react-router-dom v7

## Halaman

| Path | Keterangan |
|------|-----------|
| `/` | Cek status pembayaran per rumah |
| `/leaderboard` | Ranking blok & rumah |
| `/broadcast` | Generate pesan WhatsApp |

## Menjalankan Lokal

```bash
npm install
npm run dev
```

## Update Data

Data transaksi disimpan di `src/data/validated.json`. Update dapat dilakukan otomatis via Google Apps Script atau manual:

**Manual:**
1. Download CSV dari Google Sheets → simpan ke `raw_data/IPL 2026 - Validated.csv`
2. Jalankan:
   ```bash
   npm run convert:validated
   ```
3. File `src/data/validated.json` akan diperbarui otomatis

**Update daftar warga:**
```bash
npm run convert:residents   # update src/data/residents.json dari CSV
```

> `raw_data/` di-gitignore karena mengandung data sensitif (email, bukti transfer).

## Build & Deploy

```bash
npm run build   # output ke dist/
```

Deploy otomatis ke Netlify saat push ke `main`.
