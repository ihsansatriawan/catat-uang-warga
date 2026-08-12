# Pendaftaran Lomba 17-an → Google Sheet

Halaman `/lomba` mengirim data pendaftaran ke **Google Sheet khusus lomba yang
terpisah dari spreadsheet IPL**. Halaman `/rekap-lomba` membacanya kembali.

Karena spreadsheet-nya terpisah, Apps Script-nya juga **project sendiri** dengan
Web App dan URL sendiri. Tidak ada hubungannya dengan `Code.gs` milik
spreadsheet IPL.

```
Spreadsheet IPL             Spreadsheet Lomba  ← baru, dibuat sendiri
├─ tab Raw Data             └─ tab Lomba       ← dibuat otomatis
├─ tab Validated
├─ tab Transaksi
└─ tab Kehadiran
   Apps Script: Code.gs        Apps Script: Lomba.gs
   VITE_ATTENDANCE_ENDPOINT    VITE_LOMBA_ENDPOINT
```

> **Kenapa harus project terpisah?** Apps Script hanya mengenali **satu**
> `doPost` dan **satu** `doGet` per project. `Code.gs` sudah memakai keduanya
> untuk form kehadiran. Kalau `Lomba.gs` ditempel ke project yang sama, salah
> satu `doPost` akan diam-diam menimpa yang lain dan form kehadiran mati tanpa
> pesan error. Jadi: satu spreadsheet, satu Apps Script project, satu Web App.

## 1. Buat spreadsheet lomba

Buat Google Sheet baru, misalnya diberi nama **"Lomba 17-an 2026"**. Biarkan
kosong — tab `Lomba` beserta headernya **dibuat otomatis** pada submit pertama,
lengkap dengan baris judul yang di-freeze dan lebar kolom yang sudah diatur.

Jangan membuat tab `Lomba` manual. Script hanya mengisi header kalau sheet-nya
masih kosong, jadi tab buatan tangan dengan header sendiri bisa bikin kolomnya
tidak nyambung — penulisan ke sheet berdasarkan **posisi** kolom, bukan nama.

## 2. Pasang Apps Script

1. Dari spreadsheet lomba tadi, buka **Extensions → Apps Script**.
2. Hapus isi `Code.gs` bawaan yang kosong itu, lalu **tempel seluruh isi**
   `scripts/google-apps-script/Lomba.gs` dari repo ini.
3. Simpan (ikon disket).

> Jangan menempel `scripts/google-apps-script/Code.gs` ke sini — file itu milik
> spreadsheet IPL dan berisi fungsi validasi pembayaran, deploy JSON ke GitHub,
> serta form kehadiran. Begitu pula sebaliknya.

## 3. Deploy sebagai Web App

1. **Deploy → New deployment**.
2. Klik ikon gerigi → pilih **Web app**.
3. Isi:
   - **Description**: `Form Lomba`
   - **Execute as**: `Me`
   - **Who has access**: `Anyone`
4. **Deploy**, lalu izinkan akses (authorize) saat diminta.
5. Salin **Web app URL** — bentuknya
   `https://script.google.com/macros/s/AKfycb.../exec`

> Kalau nanti isi `Lomba.gs` diubah, jalankan **Deploy → Manage deployments →
> Edit (ikon pensil) → Version: New version → Deploy**. Tanpa "New version",
> URL yang sama tetap menjalankan kode lama.

## 4. Sambungkan ke aplikasi

```bash
# .env.local (dev lokal)
VITE_LOMBA_ENDPOINT=https://script.google.com/macros/s/AKfycb.../exec
```

Produksi (Netlify): **Site settings → Environment variables**, tambahkan
`VITE_LOMBA_ENDPOINT` dengan URL yang sama, lalu **redeploy**.

**Isi URL Web App lomba, bukan URL yang dipakai `VITE_ATTENDANCE_ENDPOINT`.**
Keduanya menunjuk spreadsheet yang berbeda. Kalau `VITE_LOMBA_ENDPOINT` kosong,
form lomba sengaja menolak mengirim dan menampilkan pesan bahwa form belum
terhubung — ini disengaja supaya data lomba tidak pernah nyasar ke spreadsheet
IPL.

## 5. Kolom tab `Lomba`

Dibuat otomatis, tapi ini isinya supaya gampang saat mengecek data:

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

> Urutan ini ditentukan oleh `LOMBA_KEYS` di `Lomba.gs` dan `LOMBA_LIST` di
> `src/data/lomba.js`. Keduanya harus **selalu sama urutannya**.

### Submit ulang = menimpa

Kalau rumah yang sama mendaftar lagi, semua baris lama rumah itu **dihapus**
lalu daftar peserta yang baru ditulis ulang. Jadi tidak akan pernah ada entri
dobel untuk satu rumah.

Konsekuensinya: kalau warga mengirim daftar yang hanya berisi satu peserta baru,
peserta yang sudah terdaftar sebelumnya ikut terhapus. Supaya itu tidak terjadi
diam-diam, halaman `/lomba` menarik data lewat `doGet` saat blok + nomor rumah
dipilih. Bila rumah itu sudah terdaftar, form menampilkan peringatan berisi nama
peserta yang sudah ada beserta tombol **"Muat & edit data yang sudah ada"**,
yang mengisi ulang form dengan daftar peserta lama untuk ditambah/diubah.

Nomor WhatsApp sengaja tidak ikut termuat karena `doGet` memang tidak
mengirimkannya (privasi) — warga mengisinya ulang.

Ingin menyimpan semua riwayat (setiap submit jadi baris baru, boleh dobel)?
Di `handleLombaPost_`, hapus blok "Hapus baris lama rumah ini". Kalau itu
dilakukan, matikan juga peringatan di form karena asumsinya berubah.

## 6. Tab `Rekap Lomba` (opsional, buat panitia)

Di spreadsheet lomba, buat tab baru bernama `Rekap Lomba`, tempel di **A1**:

```
Lomba	Kategori	Kolom	Jumlah Peserta
Memindahkan Bendera	Balita (KU-4)	L	
Mengisi Air ke Botol	Balita (KU-4)	M	
Makan Kerupuk	Semua Umur	N	
Masukin Paku ke Botol	KU-7 ke atas	O	
Balap Karung	KU-7 ke atas	P	
Balap Kelereng	KU-7 ke atas	Q	
Pindah Tepung Terigu	KU-7 ke atas	R	
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

## 7. Tab `Rekap Rumah` (opsional) — siapa yang belum daftar

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

- Request POST dikirim dengan `mode: 'no-cors'` (Apps Script tidak mengirim
  header CORS), sehingga respons tidak bisa dibaca browser. Aplikasi menganggap
  pengiriman sukses selama tidak ada error jaringan. Verifikasi entri masuk
  dengan mengecek tab `Lomba`.
- Form mengirim parameter `form=lomba`. `Lomba.gs` mengabaikannya — parameter
  itu hanya penanda supaya request tetap benar bila endpoint lomba suatu saat
  digabung ke Web App yang merutekan berdasarkan `form`.
- `handleLombaGet_` sengaja **tidak** mengirim kolom WhatsApp agar nomor
  pribadi tidak bocor ke halaman rekap yang bersifat publik.
- Tanggal acara, jam, tempat, dan batas pendaftaran diatur di
  `src/data/lomba.js` (`LOMBA_EVENT`) — ubah di sana, bukan di komponen.
- Kalau pendaftaran sudah lewat batas, form otomatis menutup diri dan halaman
  `/lomba` menampilkan pengumuman "Pendaftaran Sudah Ditutup" di paling atas.
  Chip di halaman depan tetap mengarah ke `/lomba` — labelnya berubah jadi
  "Info Lomba 17-an" — supaya warga melihat pengumuman itu.
- Panitia juga bisa menutup pendaftaran lebih awal tanpa menunggu jam deadline:
  set `LOMBA_EVENT.registrationClosed` di `src/data/lomba.js` jadi `true`
  (kembalikan ke `false` kalau mau dibuka lagi).
