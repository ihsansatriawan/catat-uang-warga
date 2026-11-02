# Google Apps Script Setup Guide

Automates the data pipeline: validation in Google Sheet → JSON push to GitHub → Netlify deploy.

## Prerequisites

- Google Sheet with IPL payment data (raw + Validated tabs)
- GitHub account with access to `ihsansatriawan/catat-uang-warga` repo

## Step 1: Create GitHub Personal Access Token

1. Go to https://github.com/settings/tokens?type=beta (fine-grained tokens)
2. Click **Generate new token**
3. Settings:
   - **Token name:** `ipl-sheet-deploy`
   - **Expiration:** 90 days (or custom)
   - **Repository access:** Only select repositories → `catat-uang-warga`
   - **Permissions:** Contents → Read and write
4. Click **Generate token** and copy the token immediately

## Step 2: Add validationStatus Column to Raw Tab

1. Open your Google Sheet
2. In the raw data tab (`Form_Responses`), add a new column at the end
3. Set the header to: `validationStatus`
4. Add data validation (dropdown) to the entire column:
   - Select the column → Data → Data validation → Dropdown
   - Options: `Pending`, `Valid`, `Invalid`

## Step 3: Set Up Apps Script

1. In Google Sheet → **Extensions** → **Apps Script**
2. Delete any existing code in `Code.gs`
3. Paste the contents of `scripts/google-apps-script/Code.gs` from this repo
4. The script is pre-configured for tab name `Form_Responses`. Update `CONFIG.RAW_TAB` if your tab has a different name

## Step 4: Store Credentials in Script Properties

1. In Apps Script editor → **Project Settings** (gear icon on the left)
2. Scroll to **Script Properties** → **Add a property**
3. Add two properties:

| Property | Value |
|----------|-------|
| `GITHUB_TOKEN` | Your personal access token from Step 1 |
| `GITHUB_REPO` | `ihsansatriawan/catat-uang-warga` |

## Step 5: Set Up Installable onEdit Trigger

The `onEditHandler` function needs an installable trigger (simple triggers can't access other sheets).

1. In Apps Script editor → **Triggers** (clock icon on the left)
2. Click **+ Add Trigger**
3. Settings:
   - **Function:** `onEditHandler`
   - **Event source:** From spreadsheet
   - **Event type:** On edit
4. Click **Save** and authorize when prompted

## Step 6: Test the Setup

### Test auto-copy:
1. Go to your raw data tab
2. Find a row and set `validationStatus` to `Valid`
3. Check the `Validated` tab — the row should appear at the bottom with all raw columns + parsed `B`, `Nomor rumah`, `Nama Pemilik`

### Test deploy:
1. Reload the Google Sheet (to load the custom menu)
2. Click **IPL Tools** → **Deploy Data ke Website**
3. Confirm the dialog
4. Wait for the toast notification ("X records deployed successfully!")
5. Check the site: https://ipl-talago.netlify.app

## Step 7: Verifikasi Bukti Transfer dengan AI

Mengotomasi langkah "cek bukti bayar manual" di alur harian. **AI tidak pernah menulis
`validationStatus`** — alasannya di `docs/adr/0001-rantai-wewenang-verifikasi-bukti.md`.

### 7a. Ambil Anthropic API key

1. Buka https://console.anthropic.com/settings/keys
2. **Create Key**, salin nilainya (cuma ditampilkan sekali)

### 7b. Tambah Script Properties

Project Settings → Script Properties → tambahkan tiga properti:

| Property | Value | Catatan |
|----------|-------|---------|
| `ANTHROPIC_API_KEY` | `sk-ant-...` | |
| `EXPECTED_REKENING` | Nomor rekening Jago bendahara | Digit saja, tanpa spasi |
| `EXPECTED_NAMA` | Nama pemilik rekening | mis. `Ihsan Satriawan` |

> Siapa pun yang punya akses **edit** ke spreadsheet ini bisa membaca ketiganya
> lewat Apps Script editor — sama seperti `GITHUB_TOKEN`.

Kolom `aiVerdict`, `aiAlasan`, dan `aiSidikJari` **dibuat otomatis** di ujung kanan
tab Raw Data saat pertama dijalankan. Tidak perlu dibuat manual.

### 7c. Jalankan backfill lebih dulu

Backfill menghasilkan matriks `aiVerdict` × `validationStatus` di seluruh riwayat —
yaitu perbandingan tebakan AI dengan keputusan yang sudah diisi bendahara berbulan-bulan.
**Ini satu-satunya cara mengukur akurasinya sebelum dipercaya.**

1. Reload spreadsheet → **IPL Tools** → **Backfill Cek AI (15 baris)**
2. Otorisasi saat diminta (butuh akses Drive untuk membaca file bukti)
3. Klik berulang sampai muncul "Backfill selesai"

Diproses 15 baris per klik karena Apps Script mati di 6 menit. Posisi terakhir
disimpan otomatis, jadi aman ditutup di tengah jalan.

Menu pendukung:
- **Cek AI Baris Terpilih** — memproses ulang satu baris yang sedang dipilih,
  walaupun `aiVerdict`-nya sudah terisi. Untuk menguji satu bukti tertentu.
- **Reset Posisi Backfill** — mulai memindai dari baris 2 lagi. Baris yang
  `aiVerdict`-nya sudah terisi tetap dilewati; kosongkan kolomnya untuk memaksa ulang.

### 7d. Review matriks akurasinya

Buat pivot `aiVerdict` (baris) × `validationStatus` (kolom). Sel yang menentukan:

| Sel | Artinya |
|---|---|
| **✅ COCOK × Invalid** | **AI meluluskan yang ditolak manusia.** Satu-satunya angka yang menentukan boleh-tidaknya naik ke auto-Valid nanti. Idealnya nol. |
| ⚠️/❓/🔴 × Valid | Alarm palsu. Tidak berbahaya, tapi kalau banyak berarti bendahara tetap buka semua gambar dan otomasinya tidak menghemat apa pun. |
| ✅ COCOK × Valid | Yang benar-benar dihemat. |

Kalau alarm palsunya banyak dan penyebabnya digit kebaca salah, ganti
`AI_CONFIG.MODEL` di `Code.gs` dari `claude-haiku-4-5` ke `claude-sonnet-5`
(resolusi gambar lebih tinggi), kosongkan kolom `aiVerdict`, reset posisi, ulang.

### 7e. Baru pasang trigger onFormSubmit

**Jangan lakukan ini sebelum 7d selesai direview.**

1. Triggers → **+ Add Trigger**
2. Function: `onFormSubmitHandler` · Event source: **From spreadsheet** · Event type: **On form submit**

### Kosakata aiVerdict

| Nilai | Kapan |
|---|---|
| `✅ COCOK` | Sinyal tujuan cocok + selisih nominal dalam toleransi. **Satu-satunya yang boleh dilewati tanpa buka gambar.** |
| `⚠️ BEDA NOMINAL` | Nominal Bukti kurang dari klaim (berapa pun), atau lebih dari klaim di luar toleransi Rp 10.000 |
| `❓ RAGU` | Tidak ada sinyal tujuan yang terbaca, atau nominal tidak terbaca |
| `🔴 DUPLIKAT` | Sidik jari `nominal\|tanggal\|jam` tabrakan dengan setoran lain |
| `🔴 GAGAL` | File bukan gambar (HEIC/PDF), terlalu besar, tidak ada, atau API gagal permanen |
| *(kosong)* | Belum diproses |

Semua yang bukan `✅ COCOK` → buka gambarnya sendiri, persis seperti proses manual
hari ini. Tidak ada jalur yang lolos diam-diam.

## Troubleshooting

### "Missing GITHUB_TOKEN or GITHUB_REPO"
- Check Script Properties (Step 4) — make sure both properties exist with correct values

### "GitHub API error (409)"
- This means a conflict. Try again — it usually resolves on retry

### "GitHub API error (403)"
- Token might be expired or lack permissions. Generate a new one (Step 1)

### Menu "IPL Tools" not showing
- Reload the Google Sheet. The menu loads via `onOpen()` which runs on page load

### Auto-copy not working
- Verify the trigger exists (Step 5)
- Make sure the column header is exactly `validationStatus` (case-sensitive)
- Make sure `CONFIG.RAW_TAB` matches your actual tab name

### "Setup belum lengkap: ANTHROPIC_API_KEY, ..."
- Cek Script Properties (Step 7b) — ketiga properti harus ada dan tidak kosong

### Semua baris jadi `🔴 GAGAL` dengan "API error 401"
- API key salah atau sudah dicabut. Buat baru di console.anthropic.com

### Semua baris jadi `❓ RAGU`
- Kemungkinan `EXPECTED_REKENING` salah ketik, atau berisi spasi/tanda baca.
  Isi digit saja. Cek satu baris pakai **Cek AI Baris Terpilih** dan baca `aiAlasan` —
  di situ tertulis apa yang sebenarnya terbaca AI di gambar.

### Banyak `⚠️ BEDA NOMINAL` padahal nominalnya benar
- Kemungkinan AI mengambil angka **Total** (nominal + biaya admin) alih-alih
  **Nominal**, atau digitnya kebaca salah karena gambar diperkecil.
  Baca `aiAlasan` untuk melihat angka yang terbaca. Kalau polanya digit kebaca salah,
  naikkan `AI_CONFIG.MODEL` ke `claude-sonnet-5`.

## Daily Workflow

1. Open Google Sheet
2. Review new form submissions in raw tab
3. Lihat kolom `aiVerdict`:
   - `✅ COCOK` → lanjut, tidak perlu buka gambar
   - selain itu → baca `aiAlasan`, buka bukti bayarnya seperti biasa
4. Set `validationStatus` to `Valid` or `Invalid` — valid entries auto-copy to Validated tab
5. When done reviewing, click **IPL Tools** → **Deploy Data ke Website**
6. Site updates automatically via Netlify

For expenses: fill the **Transaksi** tab (Rutin in columns A–C, Insidental in
columns E–I), then click **IPL Tools** → **Deploy Pengeluaran ke Website**.
