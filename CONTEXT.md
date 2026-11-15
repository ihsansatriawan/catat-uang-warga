# Catat Uang Warga

Pencatatan dan publikasi iuran IPL warga komplek Talago tahun 2026. Warga transfer manual ke
rekening bendahara, upload bukti lewat Google Form, bendahara memverifikasi, lalu data yang
sudah terverifikasi dipublikasikan ke situs publik.

## Language

### Pihak dan identitas

**Warga**:
Penghuni komplek yang wajib membayar IPL.
_Hindari_: user, member, penduduk

**Rumah**:
Unit penagihan, diidentifikasi oleh pasangan Blok (A–F) + Nomor Rumah. Satu **Rumah** punya satu
tagihan tahunan, bukan satu **Warga**.
_Hindari_: unit, properti

**Bendahara**:
Pemegang rekening tujuan dan satu-satunya pihak yang berwenang menyetujui sebuah **Setoran**.
_Hindari_: admin, pengurus

### Pembayaran

**IPL**:
Iuran bulanan tetap Rp 250.000 per **Rumah**; target tahunan Rp 3.000.000.

**Setoran**:
Satu submission Google Form — klaim dari seorang **Warga** bahwa dia sudah transfer, disertai
**Bukti Transfer**. Satu baris di tab Raw Data.
_Hindari_: pembayaran, transaksi (dua kata ini ambigu antara "duit yang berpindah" dan "klaim
yang dicatat")

**Bukti Transfer**:
Screenshot struk transfer yang di-upload **Warga**. Selalu berkas gambar (JPG/PNG); format lain
tidak bisa dibaca dan langsung ditolak.
_Hindari_: receipt, struk

**Nominal Klaim**:
Angka yang **diketik Warga** di form. Inilah yang masuk `validated.json` dan tampil di situs
publik — jadi inilah angka yang harus benar.

**Nominal Bukti**:
Angka yang terbaca **di dalam gambar** **Bukti Transfer**. Tidak pernah disimpan sebagai catatan
resmi; fungsinya hanya membuktikan **Nominal Klaim**.

**Selisih Nominal**:
`Nominal Bukti − Nominal Klaim`. Positif sampai Rp 10.000 dianggap biaya admin bank dan
diloloskan; negatif berapa pun ditandai, karena artinya **Warga** mengklaim lebih besar dari yang
dia transfer.

### Verifikasi

**Validasi**:
Keputusan **Bendahara** atas sebuah **Setoran**, tercatat di kolom `validationStatus`
(`Pending | Valid | Invalid`). Hanya manusia yang menulis kolom ini. `Valid` memicu penyalinan
baris ke tab Validated.

**Saran AI**:
Rekomendasi mesin atas sebuah **Setoran**, tercatat di kolom `aiVerdict` / `aiAlasan`. Tidak
pernah menyentuh `validationStatus`. Satu-satunya nilai yang boleh dilewati **Bendahara** tanpa
membuka gambar adalah `✅ COCOK`.

**Sinyal Tujuan**:
Petunjuk di dalam **Bukti Transfer** tentang siapa penerima transfer. Kekuatannya berbeda-beda
tergantung bank: nomor rekening penuh (kuat), empat digit terakhir (sedang), nama penerima saja
(lemah). Sinyal lemah tetap diloloskan, tetapi kekuatannya selalu dicatat di `aiAlasan`.

**Sidik Jari Bukti**:
Gabungan `Nominal Bukti + tanggal + jam` yang terbaca dari gambar. Dipakai untuk mendeteksi satu
**Bukti Transfer** yang sama dipakai untuk dua **Setoran** berbeda.

## Relationships

- Satu **Rumah** punya banyak **Setoran** (idealnya 12 per tahun)
- Satu **Setoran** punya tepat satu **Bukti Transfer** dan tepat satu **Saran AI**
- Satu **Setoran** punya tepat satu **Validasi**, dan hanya **Bendahara** yang menetapkannya
- Satu **Sidik Jari Bukti** hanya boleh dimiliki satu **Setoran** — tabrakan berarti duplikat
- Hanya **Setoran** ber-**Validasi** `Valid` yang muncul di `validated.json`

## Example dialogue

> **Dev:** "Kalau **Saran AI** bilang `✅ COCOK`, berarti **Setoran**-nya sudah tervalidasi?"
>
> **Bendahara:** "Belum. `✅ COCOK` itu artinya 'aku sudah baca gambarnya dan nggak nemu masalah'.
> Yang bikin sebuah **Setoran** jadi `Valid` cuma aku. Kalau mesin boleh nulis `Valid`, aku
> nggak bisa lagi bedain mana baris yang beneran pernah dilihat orang."
>
> **Dev:** "Kalau **Nominal Bukti**-nya 252.500 sementara **Nominal Klaim**-nya 250.000?"
>
> **Bendahara:** "Loloskan. Itu biaya admin, dan yang tercatat di website tetap 250.000 — nggak
> ada yang salah. Yang harus ditahan itu kebalikannya: klaim 750.000, bukti 250.000. Website-nya
> bakal bohong."

## Flagged ambiguities

- **"Jumlah Pembayaran"** dipakai untuk dua angka yang berbeda: yang diketik **Warga** di form,
  dan yang terbaca di gambar. Diselesaikan: **Nominal Klaim** vs **Nominal Bukti**. Yang pertama
  adalah catatan resmi, yang kedua adalah buktinya.
- **"Valid"** hampir dipakai untuk keputusan manusia sekaligus keputusan mesin. Diselesaikan:
  **Validasi** milik manusia (`validationStatus`), **Saran AI** milik mesin (`aiVerdict`). Kolom
  terpisah, kosakata terpisah.
- **"Cek nomor rekening"** ternyata bukan mencocokkan satu field, karena tiap bank menampilkan
  hal berbeda. Diselesaikan: **Sinyal Tujuan**, dengan kekuatan bertingkat.
