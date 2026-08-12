# Panduan Instalasi

Panduan lengkap dari nol sampai situs bisa diakses warga. Tidak perlu pengalaman
programming — cukup bisa copy-paste dan mengikuti langkah.

Perkiraan waktu: **30–60 menit** untuk versi dasar.

- [Langkah 1 — Siapkan komputer](#langkah-1--siapkan-komputer)
- [Langkah 2 — Jalankan di komputer sendiri](#langkah-2--jalankan-di-komputer-sendiri)
- [Langkah 3 — Isi konfigurasi perumahan](#langkah-3--isi-konfigurasi-perumahan)
- [Langkah 4 — Masukkan data warga & pembayaran](#langkah-4--masukkan-data-warga--pembayaran)
- [Langkah 5 — Online-kan di Netlify](#langkah-5--online-kan-di-netlify)
- [Langkah 6 — Fitur opsional](#langkah-6--fitur-opsional)
- [Masalah yang sering muncul](#masalah-yang-sering-muncul)

---

## Langkah 1 — Siapkan komputer

Yang perlu di-install:

1. **Node.js versi 20 atau lebih baru** — unduh di <https://nodejs.org> (pilih LTS).
   Cek berhasil dengan membuka Terminal / Command Prompt lalu ketik:
   ```bash
   node -v
   ```
   Harus muncul angka seperti `v20.x.x` atau lebih tinggi.

2. **Git** — unduh di <https://git-scm.com>. Dipakai untuk menyimpan kode ke GitHub.

3. **Akun GitHub** (gratis) — <https://github.com/signup>

4. **Akun Netlify** (gratis) — <https://app.netlify.com/signup>, daftar pakai akun GitHub
   supaya langsung tersambung.

> **Editor teks.** Untuk mengedit file konfigurasi, pakai editor apa pun.
> Yang gratis dan enak dipakai: [VS Code](https://code.visualstudio.com).

---

## Langkah 2 — Jalankan di komputer sendiri

Masuk ke folder project lewat Terminal, lalu:

```bash
npm install
npm run dev
```

Buka <http://localhost:5173> di browser. Situs sudah jalan dengan **data demo**
(nama-nama fiktif) supaya kamu bisa lihat semua fiturnya lebih dulu.

Untuk menghentikan server: tekan `Ctrl + C` di Terminal.

---

## Langkah 3 — Isi konfigurasi perumahan

Jalankan wizard:

```bash
npm run setup
```

Wizard akan menanyakan satu per satu — tekan Enter untuk memakai nilai bawaan
yang muncul di dalam `[kurung]`:

| Pertanyaan | Contoh jawaban |
|---|---|
| Nama perumahan | `Perumahan Griya Asri` |
| Nama pendek | `Griya Asri` |
| Alamat situs setelah deploy | `https://griya-asri.netlify.app` |
| Sebutan iuran | `IPL` |
| Tahun periode iuran | `2026` |
| Iuran per bulan per rumah | `150000` |
| Daftar blok | `A,B,C` |
| Nomor rumah terkecil / terbesar | `1` / `20` |
| Nama bank, no rekening, atas nama | `BCA`, `1234567890`, `Bendahara RT 05` |
| Nomor WhatsApp pengurus | `08123456789` |
| Fitur mana yang dipakai | `y` / `n` |

Setelah selesai, wizard menulis ulang `src/config/site.config.js` dan membuat
`.env.local`.

> **Alamat situs belum tahu?** Isi perkiraan saja dulu. Setelah deploy di Langkah 5
> alamat aslinya ketahuan — tinggal jalankan `npm run setup` lagi, atau edit
> `perumahan.url` langsung di `src/config/site.config.js`.

Jalankan `npm run dev` lagi untuk melihat hasilnya. Semua tulisan sekarang sudah
memakai nama perumahanmu.

Kalau lebih suka mengedit manual, semua field dijelaskan di
[KONFIGURASI.md](KONFIGURASI.md).

---

## Langkah 4 — Masukkan data warga & pembayaran

Ada dua cara. **Cara A** paling cepat untuk memulai; **Cara B** untuk pemakaian
jangka panjang.

### Cara A — dari file CSV (manual)

1. Buat folder `raw_data/` di dalam folder project (folder ini sengaja tidak ikut
   ter-upload ke GitHub karena bisa berisi data pribadi).

2. **Daftar warga.** Siapkan `raw_data/Data Warga.csv` dengan dua kolom —
   blok, lalu nomor + nama digabung:

   ```csv
   Blok,Rumah
   A,1. Budi Santoso
   A,2. Siti Rahmawati
   B,1. Agus Wijaya
   ```

   Lalu jalankan:
   ```bash
   npm run convert:residents
   ```

3. **Data pembayaran.** Siapkan `raw_data/Validated.csv` hasil export dari
   spreadsheet pembayaran, lalu:
   ```bash
   npm run convert:validated
   ```

4. **Data pengeluaran.** Siapkan `raw_data/Transaksi.csv`, lalu:
   ```bash
   npm run convert:expenses
   ```

Kalau nama file CSV-mu berbeda, kasih tahu lokasinya langsung:

```bash
node scripts/convert-residents.js "raw_data/punyaku.csv"
```

> **Data demo masih terpasang?** Perintah `convert:*` di atas otomatis menimpanya.
> Untuk mengosongkan tanpa punya CSV, isi `src/data/residents.json` dengan `[]` dan
> `src/data/validated.json` dengan `{"lastUpdate": null, "data": []}`.

### Cara B — dari Google Sheet (otomatis, disarankan)

Pengurus cukup mengelola data di Google Sheet; situs update sendiri tanpa
menyentuh kode sama sekali. Setup-nya sekali di awal:
[google-apps-script-setup.md](google-apps-script-setup.md).

Setelah aktif, alur hariannya ada di [PANDUAN-PENGURUS.md](PANDUAN-PENGURUS.md).

---

## Langkah 5 — Online-kan di Netlify

### 5a. Upload kode ke GitHub

Buat repository baru (private boleh) di <https://github.com/new>, lalu dari folder
project:

```bash
git init
git add .
git commit -m "setup awal"
git branch -M main
git remote add origin https://github.com/USERNAME/NAMA-REPO.git
git push -u origin main
```

Ganti `USERNAME` dan `NAMA-REPO` sesuai punyamu.

### 5b. Hubungkan ke Netlify

1. Buka <https://app.netlify.com> → **Add new site** → **Import an existing project**
2. Pilih **GitHub**, lalu pilih repository yang barusan dibuat
3. Isi pengaturan build:

   | Kolom | Isi |
   |---|---|
   | Build command | `npm run build` |
   | Publish directory | `dist` |

4. Klik **Deploy**. Tunggu 1–2 menit.

Netlify memberi alamat acak seperti `https://splendid-cat-123.netlify.app`.
Ganti jadi lebih rapi lewat **Site configuration → Change site name**, misal
`griya-asri.netlify.app`.

### 5c. Samakan alamat situs di config

Setelah alamat final diketahui, buka `src/config/site.config.js`, isi
`perumahan.url` dengan alamat tersebut, lalu:

```bash
git add . && git commit -m "update url situs" && git push
```

Netlify otomatis deploy ulang. Alamat ini dipakai untuk link di pesan broadcast
WhatsApp, jadi penting benar.

> **Setiap `git push` ke `main` memicu deploy ulang otomatis.** Tidak perlu
> upload manual lagi selamanya.

### 5d. (Opsional) Domain sendiri

Kalau punya domain seperti `iuran-griyaasri.com`: **Domain management → Add a domain**,
lalu ikuti instruksi DNS dari Netlify.

---

## Langkah 6 — Fitur opsional

Semua opsional — situs sudah berfungsi penuh tanpa ini.

| Fitur | Panduan | Yang didapat |
|---|---|---|
| Update data dari Google Sheet | [google-apps-script-setup.md](google-apps-script-setup.md) | Pengurus update data tanpa buka kode |
| Form RSVP acara | [attendance-apps-script.md](attendance-apps-script.md) | Halaman `/kehadiran` + rekapnya aktif |
| Form pendaftaran lomba | [lomba-apps-script.md](lomba-apps-script.md) | Halaman `/lomba` + rekapnya aktif |
| Analytics | [analytics.md](analytics.md) | Statistik pengunjung, cookieless |

Fitur yang butuh Google Apps Script memerlukan environment variable. Isi di dua tempat:

1. **Lokal** — file `.env.local` di folder project
2. **Produksi** — Netlify → **Site configuration → Environment variables**

Daftar lengkap variabelnya ada di [KONFIGURASI.md](KONFIGURASI.md#environment-variable).

> Setelah menambah environment variable di Netlify, klik **Deploys → Trigger deploy**
> supaya nilainya ikut ter-build.

Fitur yang tidak dipakai sebaiknya dimatikan saja lewat `fitur` di
`src/config/site.config.js` — menunya hilang dan halamannya tidak bisa dibuka.

---

## Masalah yang sering muncul

**`npm: command not found`**
Node.js belum terpasang atau Terminal belum di-restart setelah install. Tutup
Terminal, buka lagi, cek `node -v`.

**Halaman putih kosong setelah deploy**
Biasanya build gagal. Cek Netlify → **Deploys** → klik deploy terakhir → baca lognya.
Coba `npm run build` di komputer sendiri untuk melihat error yang sama.

**Buka `/leaderboard` langsung malah error 404 di Netlify**
File `public/_redirects` harus ikut ter-upload. Isinya:
```
/*    /index.html   200
```

**Nomor rumah dicari tapi "Data tidak ditemukan"**
Rumah itu belum punya transaksi di `validated.json`. Ini normal — warga akan
melihat kartu cara bayar. Pastikan juga blok di data (`A`) sama persis dengan blok
di config, termasuk huruf besar/kecilnya.

**Tombol WhatsApp tidak muncul**
`kontak.whatsapp` masih kosong di config. Isi dengan format `628…`, tanpa `+` dan
tanpa `0` di depan.

**Halaman `/kehadiran` bilang "belum aktif"**
`VITE_ATTENDANCE_ENDPOINT` belum diisi. Lihat
[attendance-apps-script.md](attendance-apps-script.md).

**Angka di situs tidak berubah padahal Sheet sudah diupdate**
Data iuran ikut ter-*bundle* saat build, jadi harus ada deploy ulang. Lewat menu
Apps Script ini otomatis; kalau manual, jalankan `convert:*` lalu `git push`.

**Ingin balik ke tampilan awal dengan data contoh**
```bash
npm run demo:seed
```
⚠️ Perintah ini menimpa data di `src/data/`.
