# Form Kehadiran Acara → Google Sheet

Halaman `/kehadiran` mengirim data konfirmasi kehadiran acara **Kumpul Warga
D'talago Regency (Minggu, 2 Agustus 2026)** ke Google Sheet yang sama dengan
data lainnya, tetapi ke **tab (sheet) terpisah**.

Karena aplikasi ini tanpa backend, pengiriman data memakai **Google Apps Script
Web App** sebagai jembatan. Ikuti langkah berikut satu kali saja.

## 1. Buat tab baru di Google Sheet

1. Buka Google Sheet yang sama dengan data IPL.
2. Tambahkan sheet/tab baru, beri nama persis: **`Kehadiran`**.
3. Isi baris pertama (header) dengan kolom berikut:

   | Timestamp | Blok | Nomor Rumah | Nama | WhatsApp | Email | Status | Jumlah |
   | --------- | ---- | ----------- | ---- | -------- | ----- | ------ | ------ |

## 2. Tambahkan Apps Script

1. Di Google Sheet, buka menu **Extensions → Apps Script**.
2. Hapus kode contoh, tempel kode berikut:

```javascript
// Nama tab tujuan
const SHEET_NAME = 'Kehadiran'

function doPost(e) {
  const lock = LockService.getScriptLock()
  lock.waitLock(30000)
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet()
    const sheet = ss.getSheetByName(SHEET_NAME)
    const p = e.parameter

    const row = [
      p.timestamp || new Date().toISOString(),
      p.blok || '',
      p.nomorRumah || '',
      p.nama || '',
      p.whatsapp || '',
      p.email || '',
      p.status || '',
      p.jumlah || '',
    ]

    // Upsert: kalau Blok + Nomor Rumah yang sama sudah pernah mengisi,
    // baris lamanya ditimpa (bukan menambah baris baru). Jadi 1 rumah = 1 baris.
    const values = sheet.getDataRange().getValues()
    let targetRow = 0 // 0 = tidak ketemu
    for (let i = 1; i < values.length; i++) {
      // kolom B = Blok (index 1), kolom C = Nomor Rumah (index 2)
      if (
        String(values[i][1]) === String(p.blok) &&
        String(values[i][2]) === String(p.nomorRumah)
      ) {
        targetRow = i + 1 // nomor baris di sheet (1-based, header di baris 1)
        break
      }
    }

    if (targetRow > 0) {
      sheet.getRange(targetRow, 1, 1, row.length).setValues([row])
    } else {
      sheet.appendRow(row)
    }

    return ContentService
      .createTextOutput(JSON.stringify({ ok: true }))
      .setMimeType(ContentService.MimeType.JSON)
  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ ok: false, error: String(err) }))
      .setMimeType(ContentService.MimeType.JSON)
  } finally {
    lock.releaseLock()
  }
}
```

> Ingin menyimpan **semua riwayat** (setiap submit jadi baris baru, boleh
> dobel)? Ganti seluruh blok upsert di atas dengan satu baris:
> `sheet.appendRow(row)`.

3. **Untuk halaman rekap di web** (`/rekap-kehadiran`), tambahkan juga fungsi
   `doGet` berikut di bawah `doPost`. Fungsi ini sengaja **tidak** mengembalikan
   nomor WhatsApp & email agar data pribadi tidak bocor ke publik:

```javascript
function doGet(e) {
  const ss = SpreadsheetApp.getActiveSpreadsheet()
  const sheet = ss.getSheetByName(SHEET_NAME)
  const values = sheet.getDataRange().getValues()

  const out = []
  for (let i = 1; i < values.length; i++) {
    const r = values[i]
    if (!r[1] && !r[2]) continue // lewati baris kosong
    out.push({
      blok: String(r[1]),
      nomorRumah: String(r[2]),
      nama: String(r[3]),
      // r[4] = WhatsApp & r[5] = Email TIDAK disertakan (privasi)
      status: String(r[6]),
      jumlah: r[7],
      timestamp: r[0],
    })
  }

  return ContentService
    .createTextOutput(JSON.stringify({ ok: true, data: out }))
    .setMimeType(ContentService.MimeType.JSON)
}
```

4. Simpan (ikon disket).

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
F	8	Ihsan Satriawan
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
daftar per blok. Halaman ini membaca data lewat fungsi `doGet` (langkah 2.3),
jadi pastikan `doGet` sudah ditempel dan deployment sudah **New version**.

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
