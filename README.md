# Catat Uang Warga

Web app untuk warga perumahan mengecek status pembayaran IPL (Iuran Pengelolaan Lingkungan) 2026.

## Fitur

- Cek status pembayaran per rumah (blok + nomor)
- Riwayat transaksi lengkap
- Indikator lunas / belum lunas
- Progress bar pembayaran tahunan
- Mobile-first, responsive

## Tech Stack

- React 19 + Vite
- Tailwind CSS v4
- lucide-react

## Menjalankan Lokal

```bash
npm install
npm run dev
```

## Update Data

Data transaksi disimpan di `src/data/validated.json`. Untuk update dari Google Sheets CSV:

1. Download CSV dari Google Sheets → simpan ke `raw_data/IPL 2026 - Validated.csv`
2. Jalankan:
   ```bash
   npm run convert:validated
   ```
3. File `src/data/validated.json` akan diperbarui otomatis

> `raw_data/` di-gitignore karena mengandung data sensitif (email, bukti transfer).

## Build & Deploy

```bash
npm run build   # output ke dist/
```
