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

   | Timestamp | Blok | Nomor Rumah | Nama | Status | Jumlah |
   | --------- | ---- | ----------- | ---- | ------ | ------ |

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

    sheet.appendRow([
      p.timestamp || new Date().toISOString(),
      p.blok || '',
      p.nomorRumah || '',
      p.nama || '',
      p.status || '',
      p.jumlah || '',
    ])

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

3. Simpan (ikon disket).

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

## Catatan

- Bila `VITE_ATTENDANCE_ENDPOINT` kosong, form tetap tampil tetapi menampilkan
  pesan bahwa form belum terhubung — data tidak akan hilang diam-diam.
- Request dikirim dengan `mode: 'no-cors'` (Apps Script tidak mengirim header
  CORS), sehingga respons server tidak bisa dibaca oleh browser. Aplikasi
  menganggap pengiriman sukses selama tidak ada error jaringan. Verifikasi
  entri masuk dengan mengecek tab `Kehadiran` di Google Sheet.
- Jika mengubah kode Apps Script, lakukan **Deploy → Manage deployments →
  Edit → New version** agar perubahan aktif (URL tetap sama).
