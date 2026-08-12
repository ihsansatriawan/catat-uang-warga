# Referensi Konfigurasi

Semua identitas perumahan ada di **satu file**:
[`src/config/site.config.js`](../src/config/site.config.js).

Dua cara mengubahnya:

```bash
npm run setup     # wizard tanya-jawab, menulis ulang file config
```

atau buka filenya langsung di editor. Keduanya sama saja hasilnya.

> Setelah mengubah config saat `npm run dev` berjalan, halaman ter-refresh sendiri.
> Untuk situs yang sudah online, perubahan baru muncul setelah `git push`.

---

## 1. `perumahan` — identitas

| Field | Isi | Contoh |
|---|---|---|
| `nama` | Nama lengkap. Dipakai di judul tab browser & preview link | `'Perumahan Griya Asri'` |
| `namaPendek` | Nama singkat untuk badge di halaman depan | `'Griya Asri'` |
| `url` | Alamat situs setelah deploy, **tanpa** `/` di akhir. Dipakai untuk link dalam pesan WhatsApp | `'https://griya-asri.netlify.app'` |
| `deskripsi` | Ringkasan situs untuk hasil pencarian Google | `'Cek status pembayaran…'` |

> Kalau `url` dibiarkan kosong, link di pesan broadcast memakai alamat browser
> yang sedang dibuka. Untuk pesan yang dikirim ke warga, sebaiknya diisi.

## 2. `iuran` — nominal & periode

| Field | Isi | Contoh |
|---|---|---|
| `label` | Sebutan iuran di lingkunganmu. Muncul di banyak tempat | `'IPL'`, `'IPKL'`, `'Iuran Warga'` |
| `kepanjangan` | Kepanjangan dari label | `'Iuran Pengelolaan Lingkungan'` |
| `tahun` | Tahun periode yang berjalan | `2026` |
| `nominalBulanan` | Iuran per bulan per rumah, angka polos tanpa titik | `150000` |
| `bulanPerTahun` | Jumlah bulan dalam satu periode | `12` |

Target tahunan per rumah dihitung otomatis: `nominalBulanan × bulanPerTahun`.
Status **Lunas** muncul saat total pembayaran mencapai angka itu; kelebihannya
ditampilkan sebagai saldo untuk tahun berikutnya.

> **Ganti tahun periode.** Saat masuk tahun baru, ubah `tahun` lalu ganti isi
> `src/data/validated.json` dengan data tahun tersebut. Data tahun lama sebaiknya
> diarsipkan sendiri — aplikasi ini menampilkan satu periode aktif.

## 3. `rumah` — struktur blok

| Field | Isi | Contoh |
|---|---|---|
| `blok` | Daftar blok, urutannya menentukan urutan tampilan | `['A','B','C']` |
| `nomorMin` | Nomor rumah terkecil yang boleh dicari | `1` |
| `nomorMax` | Nomor rumah terbesar yang boleh dicari | `20` |

Blok tidak harus huruf — `['1','2','3']` atau `['Melati','Mawar']` juga bisa.
Warna tiap blok dibagikan otomatis dari palet 6 warna dan berputar kalau bloknya
lebih dari enam.

> Nilai blok di sini harus **sama persis** dengan yang ada di data
> (`residents.json`, `validated.json`), termasuk huruf besar/kecil.

## 4. `pembayaran` — rekening

| Field | Isi |
|---|---|
| `bank` | Nama bank |
| `nomorRekening` | Nomor rekening |
| `atasNama` | Nama pemilik rekening |
| `formKonfirmasiUrl` | Link Google Form konfirmasi transfer. Kosongkan (`''`) untuk menyembunyikan tombolnya |

Muncul di kartu **Cara Bayar** dan saat warga mencari rumah yang belum punya transaksi.

## 5. `kontak` — pengurus

| Field | Isi |
|---|---|
| `namaPengurus` | Sebutan yang dipakai di pesan WhatsApp, mis. `'Pengurus'`, `'Bendahara'` |
| `whatsapp` | Format internasional, tanpa `+` dan tanpa `0` di depan: `08123456789` → `'628123456789'` |

Kalau `whatsapp` dikosongkan (`''`), **semua tombol WhatsApp otomatis hilang** —
termasuk tombol "Ada data yang tidak sesuai?" di dashboard dan leaderboard.

## 6. `fitur` — menghidupkan/mematikan halaman

| Field | Halaman yang dikendalikan |
|---|---|
| `leaderboard` | `/leaderboard` |
| `pengeluaran` | `/pengeluaran` |
| `broadcast` | `/broadcast` |
| `kehadiran` | `/kehadiran` dan `/rekap-kehadiran` |
| `lomba` | `/lomba` dan `/rekap-lomba` |

Set `false` → tombol menunya hilang **dan** halamannya dialihkan ke halaman depan,
jadi tidak bisa dibuka lewat URL langsung.

## 7. `acara` — acara warga (halaman `/kehadiran`)

| Field | Isi | Contoh |
|---|---|---|
| `judul` | Nama acara | `'Kumpul Warga'` |
| `tanggalLabel` | Tanggal sebagai teks bebas | `'Minggu, 2 Agustus 2026'` |
| `waktuLabel` | Jam mulai | `'19.30 WIB'` |
| `tempatLabel` | Lokasi | `'Balai Warga'` |
| `agenda` | Daftar poin agenda | `['Laporan keuangan', 'Rencana 17-an']` |

Diabaikan kalau `fitur.kehadiran` bernilai `false`.

---

## Konfigurasi lomba

Daftar lomba dan jadwalnya ada di file terpisah,
[`src/data/lomba.js`](../src/data/lomba.js), karena isinya lebih panjang:

| Bagian | Isinya |
|---|---|
| `LOMBA_EVENT` | Tanggal, jam, tempat, dan batas akhir pendaftaran |
| `LOMBA_LIST` | Daftar lomba beserta kategori umurnya |
| `LOMBA_GROUPS` | Pengelompokan lomba di tampilan form |
| `UMUR_GROUPS` | Kelompok umur untuk tampilan rekap |

> ⚠️ **Urutan `LOMBA_LIST` menentukan urutan kolom di Google Sheet.** Kalau
> daftarnya diubah, sesuaikan juga `LOMBA_KEYS` di
> `scripts/google-apps-script/Lomba.gs` — Apps Script menulis berdasarkan posisi
> kolom, bukan nama.

---

## Environment variable

Berbeda dengan config di atas, ini berisi **URL & kunci rahasia** sehingga tidak
disimpan di dalam kode. Tempatnya:

- **Lokal** → file `.env.local` (salin dari `.env.example`)
- **Produksi** → Netlify → *Site configuration → Environment variables*

| Variable | Untuk | Wajib? |
|---|---|---|
| `VITE_UMAMI_SCRIPT_URL` | Script URL Umami analytics | Opsional |
| `VITE_UMAMI_WEBSITE_ID` | Website ID Umami | Opsional |
| `VITE_ATTENDANCE_ENDPOINT` | Web App Apps Script untuk `/kehadiran` & `/rekap-kehadiran` | Wajib kalau fitur kehadiran dipakai |
| `VITE_LOMBA_ENDPOINT` | Web App Apps Script untuk `/lomba` & `/rekap-lomba` | Wajib kalau fitur lomba dipakai |

Catatan:

- Semuanya **opsional** — aplikasi tetap jalan kalau dibiarkan kosong. Fitur yang
  butuh endpoint akan menampilkan pesan "belum aktif".
- Kalau `VITE_UMAMI_*` kosong, tag analytics tidak dipasang sama sekali.
- `VITE_LOMBA_ENDPOINT` **tidak punya nilai cadangan**. Kalau kosong, form lomba
  menolak mengirim — ini disengaja supaya data lomba tidak nyasar ke spreadsheet iuran.
- Setelah mengubah environment variable di Netlify, jalankan **Trigger deploy**
  supaya nilai barunya ikut ter-build.

---

## Yang di luar config

| Ingin mengubah | Filenya |
|---|---|
| Warna & font | `src/index.css` (bagian `@theme`) |
| Ikon situs | `public/favicon.svg` |
| Daftar lomba | `src/data/lomba.js` |
| Data warga | `src/data/residents.json` |
| Data pembayaran | `src/data/validated.json` |
| Data pengeluaran | `src/data/expenses.json` |
