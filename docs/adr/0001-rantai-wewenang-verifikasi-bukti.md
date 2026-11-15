# Rantai wewenang verifikasi Bukti Transfer: Claude mengekstrak, kode memutuskan, Bendahara menyetujui

Verifikasi **Setoran** dibantu Claude API (vision) yang dipanggil dari Apps Script. Wewenang
sengaja dipecah tiga: Claude **hanya** mengembalikan JSON berisi apa yang terbaca di gambar
(nomor rekening, nama penerima, nominal, tanggal, jam) tanpa penilaian apa pun; `Code.gs` yang
membandingkannya dengan `EXPECTED_REKENING` / `EXPECTED_NAMA` dan menghasilkan `aiVerdict`; dan
`validationStatus` tetap hanya boleh ditulis manusia.

## Considered Options

**Membiarkan Claude memutuskan langsung ("cocok atau tidak?")** — ditolak. Verdict-nya tidak bisa
diaudit: mustahil tahu apakah "cocok" berasal dari nomor rekening penuh atau dari tebakan bahwa
`IHSAN S` cukup mirip dengan nama pemilik rekening. Dengan pemisahan ini, setiap verdict bisa
dilacak ke **Sinyal Tujuan** mana yang dipakai, dan aturannya bisa diperbaiki tanpa menyentuh
prompt sama sekali.

**Membiarkan AI menulis `Valid` untuk kasus berkeyakinan tinggi** — ditolak untuk saat ini.
Kolom `validationStatus` bernilai `Valid` memicu `onEditHandler` menyalin baris ke tab Validated,
yang berarti barisnya masuk antrean publikasi ke situs publik. Menyerahkan pemicu itu ke mesin
sebelum ada satu pun angka akurasi yang terukur berarti kesalahan pertama baru ketahuan saat ada
warga komplen. Jalur naiknya sudah disiapkan: jalankan backfill ke seluruh riwayat Raw Data,
bandingkan `aiVerdict` dengan `validationStatus` yang sudah diisi manusia berbulan-bulan, dan
angka "AI meluluskan yang dulu ditolak manusia" adalah satu-satunya syarat untuk naik level.

**Menjalankan verifikasi di layanan eksternal** — ditolak. Data, trigger, penyimpanan secret, dan
proses deploy sudah ada di dalam Apps Script yang sama, dan script berjalan sebagai Bendahara
sehingga akses ke gambar di Drive otomatis didapat. Layanan terpisah berarti mengurus OAuth ke
Sheets + Drive dari nol untuk masalah yang tidak ada.

## Consequences

- `ANTHROPIC_API_KEY` menempati Script Properties bersama `GITHUB_TOKEN`. Siapa pun yang diberi
  akses **edit** ke spreadsheet IPL bisa membaca keduanya lewat Apps Script editor.
- Toleransi **Selisih Nominal** sengaja asimetris (longgar ke atas, ketat ke bawah) karena
  risikonya asimetris — kelebihan bayar tidak merusak catatan publik, kekurangan bayar merusak.
- Umur bukti diekstrak dan dicatat di `aiAlasan` tetapi **tidak** menghasilkan flag: belum ada
  data tentang jeda upload yang wajar di komplek ini, jadi ambang batas apa pun sekarang adalah
  tebakan. Deteksi duplikat lewat **Sidik Jari Bukti** menutup kasus yang paling berbahaya
  (bukti lama di-upload ulang) tanpa risiko salah tuduh itu.
