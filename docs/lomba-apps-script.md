# Pendaftaran Lomba 17-an → Google Sheet

Halaman `/lomba` mengirim data pendaftaran lomba ke Google Sheet yang sama
dengan data lainnya, ke **tab terpisah bernama `Lomba`**. Halaman
`/rekap-lomba` membaca data itu kembali.

Tab `Lomba` **dibuat otomatis** oleh Apps Script pada submit pertama —
lengkap dengan header, baris judul yang di-freeze, dan lebar kolom. Tidak perlu
membuat tab manual.

## Ringkasan alur

```
/lomba (form)  ──POST form=lomba──►  Apps Script Web App  ──►  tab "Lomba"
/rekap-lomba   ──GET  ?form=lomba──►  Apps Script Web App  ◄──
```

Satu submit = satu rumah, tetapi ditulis **satu baris per peserta**. Semua baris
dari submit yang sama berbagi Timestamp dan Submit ID yang sama.

## 1. Terapkan kode Apps Script

Kode Apps Script proyek ini satu file: **`scripts/google-apps-script/Code.gs`**.
Fungsi lomba (`LOMBA_SHEET`, `handleLombaPost_`, `handleLombaGet_`,
`ensureLombaSheet_`) sudah ada di file itu.

1. Di Google Sheet, buka **Extensions → Apps Script**.
2. **Salin seluruh isi** `scripts/google-apps-script/Code.gs` versi terbaru,
   lalu **tempel menimpa** isi editor Apps Script.
3. Simpan (ikon disket).
4. **Deploy → Manage deployments → Edit (ikon pensil) → Version: New version →
   Deploy.** Langkah ini wajib; tanpa "New version" kode baru tidak aktif dan
   URL Web App yang lama tetap menjalankan kode lama.

> **Penting soal `doPost` / `doGet`.** Apps Script hanya boleh punya **satu**
> `doPost` dan **satu** `doGet` per project, sementara proyek ini punya dua form
> (Kehadiran & Lomba). Karena itu keduanya kini dirutekan lewat parameter
> `form`:
>
> | Parameter | Tujuan |
> | --------- | ------ |
> | `form=lomba` | tab `Lomba` |
> | tanpa `form` | tab `Kehadiran` (perilaku lama) |
>
> Form kehadiran tidak mengirim parameter `form`, jadi tetap berjalan seperti
> sebelumnya. Jangan menambahkan `doPost`/`doGet` kedua — Apps Script akan
> memakai salah satu saja secara acak.

## 2. Sambungkan ke aplikasi

Secara default halaman `/lomba` **menumpang endpoint yang sama** dengan form
kehadiran, jadi kalau `VITE_ATTENDANCE_ENDPOINT` sudah terisi di Netlify,
**tidak ada yang perlu diubah** — cukup lakukan langkah 1 lalu redeploy situs.

Kalau suatu saat ingin memisahkan (misalnya pakai Spreadsheet berbeda), isi
variabel opsional berikut; bila ada, ia menang atas `VITE_ATTENDANCE_ENDPOINT`:

```bash
# .env.local (dev) atau Netlify → Site settings → Environment variables
VITE_LOMBA_ENDPOINT=https://script.google.com/macros/s/AKfycb.../exec
```

## 3. Kolom tab `Lomba`

Dibuat otomatis, tapi ini isinya supaya gampang dibaca saat mengecek data:

| Kol | Nama | Keterangan |
| --- | ---- | ---------- |
| A | Timestamp | ditulis sebagai **tanggal**, bukan teks — bisa disortir |
| B | Submit ID | sama untuk semua peserta dari satu submit |
| C | Blok | huruf saja (`F`) |
| D | Nomor Rumah | angka saja, tanpa nol depan (`8`) |
| E | Rumah | gabungan untuk dibaca manusia (`F-8`) |
| F | Nama Ayah | |
| G | Nama Ibu | |
| H | WhatsApp | **tidak** dikirim ke halaman rekap |
| I | Nama Peserta | |
| J | Peran | Ayah / Ibu / Anak / Lainnya |
| K | Umur | boleh kosong |
| L–S | 8 kolom lomba | diisi angka `1` bila ikut, kosong bila tidak |
| T | Detail Pentas | isi bila kolom Pentas = 1 |
| U | Total | jumlah lomba yang diikuti peserta itu |

Urutan kolom L–S sama persis dengan urutan lomba di sheet lama:
Bendera · Air · Kerupuk · Paku · Karung · Kelereng · Tepung · Pentas.

> Urutan ini ditentukan oleh `LOMBA_KEYS` di `Code.gs` dan `LOMBA_LIST` di
> `src/data/lomba.js`. Keduanya harus **selalu sama urutannya** — Apps Script
> menulis berdasarkan posisi kolom, bukan nama.

### Submit ulang = menimpa

Kalau rumah yang sama mendaftar lagi, semua baris lama rumah itu **dihapus**
lalu daftar peserta yang baru ditulis ulang. Jadi warga bisa membuka form lagi
untuk menambah/mengurangi peserta tanpa jadi dobel.

Ingin menyimpan semua riwayat (setiap submit jadi baris baru, boleh dobel)?
Di `handleLombaPost_`, hapus blok "Hapus baris lama rumah ini".

## 4. Tab `Rekap Lomba` (opsional, buat panitia)

Buat tab baru bernama `Rekap Lomba`, tempel di **A1**:

```
Lomba	Kategori	Kolom	Jumlah Peserta
Memindahkan Bendera	Balita (KU-4)	L	
Mengisi Air ke Botol	Balita (KU-4)	M	
Makan Kerupuk	Semua Umur	N	
Masukin Paku ke Botol	KU-7 ke atas	O	
Balap Karung	KU-7 ke atas	P	
Balap Kelereng	KU-7 ke atas	Q	
Pindah Tepung Terigu (Tim)	KU-7 ke atas	R	
Pentas Seni	Semua Umur	S	
```

Di **D2**, lalu tarik ke bawah sampai D9:

```
=COUNTIF(INDIRECT("Lomba!"&C2&":"&C2), 1)
```

Angka ringkasan, misalnya di **F1:G3**:

```
Total pendaftaran lomba	=SUM(D2:D9)
Total peserta	=COUNTA(Lomba!I2:I)
Total rumah ikut	=COUNTUNIQUE(Lomba!E2:E)
```

## 5. Tab `Rekap Rumah` (opsional) — siapa yang belum daftar

Buat tab `Rekap Rumah`. Kolom A–C diisi daftar seluruh rumah (salin dari
bagian 5 di `docs/attendance-apps-script.md`), dengan header:

```
Blok	Nomor Rumah	Nama	Status Daftar	Jml Peserta	Jml Lomba
```

**D2** — sudah daftar atau belum:

```
=IF(COUNTIFS(Lomba!$C:$C, A2, Lomba!$D:$D, B2) > 0, "✅ Sudah", "❌ Belum")
```

**E2** — berapa orang dari rumah itu:

```
=COUNTIFS(Lomba!$C:$C, A2, Lomba!$D:$D, B2)
```

**F2** — total pendaftaran lomba dari rumah itu:

```
=SUMIFS(Lomba!$U:$U, Lomba!$C:$C, A2, Lomba!$D:$D, B2)
```

Filter kolom D ke "❌ Belum" untuk mendapat daftar rumah yang perlu ditagih.

> Halaman `/rekap-lomba` sudah menampilkan informasi yang sama di web, jadi tab
> ini hanya perlu kalau panitia lebih suka bekerja langsung di spreadsheet.

## Catatan

- Bila endpoint kosong, form tetap tampil tetapi menampilkan pesan bahwa form
  belum terhubung — data tidak hilang diam-diam.
- Request POST dikirim dengan `mode: 'no-cors'` (Apps Script tidak mengirim
  header CORS), sehingga respons tidak bisa dibaca browser. Aplikasi menganggap
  pengiriman sukses selama tidak ada error jaringan. Verifikasi entri masuk
  dengan mengecek tab `Lomba`.
- `handleLombaGet_` sengaja **tidak** mengirim kolom WhatsApp agar nomor
  pribadi tidak bocor ke halaman rekap yang bersifat publik.
- Tanggal acara, jam, tempat, dan batas pendaftaran diatur di
  `src/data/lomba.js` (`LOMBA_EVENT`) — ubah di sana, bukan di komponen.
- Kalau pendaftaran sudah lewat batas, form otomatis menutup diri dan chip
  "Daftar Lomba 17-an" di halaman depan ikut disembunyikan.
