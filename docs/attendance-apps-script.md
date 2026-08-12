# Form Kehadiran Acara → Google Sheet

Halaman `/kehadiran` mengirim data konfirmasi kehadiran acara **Kumpul Warga
warga** ke Google Sheet yang sama dengan
data lainnya, tetapi ke **tab (sheet) terpisah**.

Karena aplikasi ini tanpa backend, pengiriman data memakai **Google Apps Script
Web App** sebagai jembatan. Ikuti langkah berikut satu kali saja.

## 1. Buat tab baru di Google Sheet

1. Buka Google Sheet yang sama dengan data IPL.
2. Tambahkan sheet/tab baru, beri nama persis: **`Kehadiran`**.
3. Isi baris pertama (header) dengan kolom berikut:

   | Timestamp | Blok | Nomor Rumah | Nama | WhatsApp | Email | Status |
   | --------- | ---- | ----------- | ---- | -------- | ----- | ------ |

## 2. Tambahkan fungsi kehadiran ke Apps Script

Kode Apps Script proyek ini adalah satu file: **`scripts/google-apps-script/Code.gs`**
(berisi validasi pembayaran + deploy JSON ke GitHub). Fungsi untuk form
kehadiran — `ATTENDANCE_SHEET`, `doPost`, dan `doGet` — sudah **ditambahkan**
ke file itu (lihat section "Attendance (Kehadiran) — Web App endpoint").

> **Penting: tambahkan, jangan hapus/ganti kode lama.** Fungsi kehadiran
> tidak bentrok dengan fungsi yang sudah ada, dan tab tujuannya terpisah.

Cara menerapkannya ke Google Sheet:

1. Di Google Sheet, buka menu **Extensions → Apps Script**.
2. Cara termudah agar selalu sinkron dengan repo: **salin seluruh isi**
   `scripts/google-apps-script/Code.gs` (versi terbaru) lalu **tempel menimpa**
   isi editor Apps Script. (Aman karena file di repo ini memang sudah memuat
   semua fungsi lama + fungsi kehadiran.)
   Alternatif, jika kamu punya perubahan lokal di Apps Script yang belum ada di
   repo: **tempel hanya** blok `ATTENDANCE_SHEET` + `doPost` + `doGet` di akhir
   script yang sudah ada.
3. `doGet` sengaja **tidak** mengembalikan nomor WhatsApp & email agar data
   pribadi tidak bocor ke halaman rekap publik.
4. Simpan (ikon disket).

> Ingin menyimpan **semua riwayat** (setiap submit jadi baris baru, boleh
> dobel)? Di `doPost`, ganti seluruh blok upsert dengan satu baris:
> `sheet.appendRow(row)`.

## 3. Deploy sebagai Web App

1. Klik **Deploy → New deployment**.
2. Klik ikon gerigi → pilih **Web app**.
3. Isi:
   - **Description**: `Form Kehadiran`
   - **Execute as**: `Me`
   - **Who has access**: `Anyone`
4. Klik **Deploy**, izinkan akses (authorize) saat diminta.
5. Salin **Web app URL** — bentuknya:
   `https://script.google.com/macros/s/AKfycb.../exec`

## 4. Sambungkan ke aplikasi

Tambahkan URL tadi ke environment variable:

```bash
# .env.local (untuk dev lokal)
VITE_ATTENDANCE_ENDPOINT=https://script.google.com/macros/s/AKfycb.../exec
```

Untuk produksi (Netlify): **Site settings → Environment variables**, tambahkan
`VITE_ATTENDANCE_ENDPOINT` dengan URL yang sama, lalu **redeploy**.

## 5. Rekap: siapa yang belum mengisi

Untuk memantau **rumah mana yang belum konfirmasi**, buat satu tab baru
bernama **`Rekap`**. Isi kolom A & B dengan daftar seluruh rumah terdaftar
(50 rumah) berikut — cukup **salin-tempel** blok di bawah ke sel **A1**
(pisah otomatis per kolom bila di-paste, atau tempel apa adanya lalu pakai
Data → Split text to columns):

```
Blok	Nomor Rumah	Nama	Status Isi	Status Kehadiran
A	3	Agus Herianto
A	5	Iksan
A	7	Ashar
A	8	Fajar Harry Aji
A	9	Simon
B	1	Tommy
B	2	Budiarti Rahayu
B	3	Juwarno
B	5	Erland Tanjung
B	6	Danu Mega Winanto
B	7	Delfryanto Marola
B	8	Ryan
B	9	Ukky January Linzki
B	10	Kusumo
B	12	Hana Kristina Natalia
C	1	Bimo Andono
C	2	Siti Munifah
C	3	Bayu Priguna
C	5	Riza Ardiansyah
C	6	Andi Medika Satria
C	7	Sahrul
C	8	Bahri
C	9	Sunyata
C	10	Bambang
C	11	Fajar Sidiq
D	1	Luthfi Rianhar
D	2	Lutfi Agizal
D	3	Giyono
D	5	Ken Garda Pinilih
D	6	Andi Supandi
D	7	Mega Prasetyawan
D	8	Denny
D	10	Andika Amri
E	1	Mohammad Reshki Maulana
E	3	Deden P.
E	5	Wiwi Dewi Murni
E	7	Arief Rahman Hakim
E	8	Fajar Dwi Bayu Aji
E	12	Ghozi Tsany Arifin
E	15	Eko Prastyawan
F	1	Widdesto Ari
F	2	Terry
F	3	Herdhana Prayana Dipura
F	5	Dhany Yanuar Hindriyanto
F	6	Thomas
F	7	Erlin
F	8	Budi Santoso
F	9	Imam
F	10	Lili Deviani
F	11	Safrudin
```

Lalu di **sel D2** (kolom "Status Isi") tempel formula berikut, dan salin ke
bawah sampai baris terakhir (D51):

```
=IF(COUNTIFS(Kehadiran!$B:$B, A2, Kehadiran!$C:$C, B2) > 0, "✅ Sudah", "❌ Belum")
```

Dan di **sel E2** (kolom "Status Kehadiran") — untuk menarik status terakhir
yang mereka pilih (Hadir / Tidak Hadir / Masih Ragu):

```
=IFERROR(XLOOKUP(A2 & "-" & B2, ARRAYFORMULA(Kehadiran!$B:$B & "-" & Kehadiran!$C:$C), Kehadiran!$G:$G, "-", 0, -1), "-")
```

Hasilnya: satu tabel berisi semua 50 rumah, kolom **Status Isi** langsung
menandai mana yang **✅ Sudah** dan mana yang **❌ Belum** mengisi (otomatis
ter-update begitu ada submit baru). Untuk melihat daftar yang belum saja,
klik ikon filter pada kolom **Status Isi** lalu pilih hanya "❌ Belum".

> Angka baris (D2:D51) mengikuti 50 rumah di atas. Kalau jumlah rumah
> berubah, sesuaikan sampai baris terakhir daftar.

## 6. Halaman rekap di web (`/rekap-kehadiran`)

Selain tab `Rekap` di Google Sheet (langkah 5), aplikasi punya halaman
**`/rekap-kehadiran`** yang menampilkan rekap langsung di web: jumlah rumah
yang sudah/belum konfirmasi, rincian Hadir / Tidak Hadir / Masih Ragu, serta
daftar per blok. Halaman ini membaca data lewat fungsi `doGet` (bagian 2),
jadi pastikan `doGet` sudah ada di Apps Script dan deployment sudah **New version**.

Halaman ini **tidak menampilkan** nomor WhatsApp & email karena `doGet` memang
tidak mengirim kolom tersebut — data pribadi tetap hanya ada di Google Sheet.

## Catatan

- Bila `VITE_ATTENDANCE_ENDPOINT` kosong, form tetap tampil tetapi menampilkan
  pesan bahwa form belum terhubung — data tidak akan hilang diam-diam.
- Request dikirim dengan `mode: 'no-cors'` (Apps Script tidak mengirim header
  CORS), sehingga respons server tidak bisa dibaca oleh browser. Aplikasi
  menganggap pengiriman sukses selama tidak ada error jaringan. Verifikasi
  entri masuk dengan mengecek tab `Kehadiran` di Google Sheet.
- Jika mengubah kode Apps Script, lakukan **Deploy → Manage deployments →
  Edit → New version** agar perubahan aktif (URL tetap sama).
