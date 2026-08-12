/* ==========================================================================
 *  KONFIGURASI UTAMA
 *  --------------------------------------------------------------------------
 *  SATU-SATUNYA file yang wajib kamu edit untuk memakai sistem ini di
 *  perumahan sendiri. Semua tampilan (judul, nominal iuran, blok, rekening,
 *  kontak pengurus, menu yang aktif) mengikuti isi file ini.
 *
 *  Cara paling cepat: jalankan `npm run setup` — wizard akan menanyakan
 *  semuanya lalu menulis ulang file ini untukmu.
 *
 *  Penjelasan tiap field: docs/KONFIGURASI.md
 * ========================================================================== */

export const siteConfig = {
  /* ---------------------------------------------------------------------
   * 1. IDENTITAS PERUMAHAN
   * ------------------------------------------------------------------- */
  perumahan: {
    // Nama lengkap, dipakai di judul halaman & pesan WhatsApp.
    nama: 'Perumahan Contoh Asri',
    // Nama pendek untuk badge di halaman depan.
    namaPendek: 'Contoh Asri',
    // Alamat situs setelah di-deploy (tanpa garis miring di akhir).
    // Dipakai untuk link di pesan broadcast WhatsApp.
    url: 'https://iuran-warga-contoh.netlify.app',
    // Dipakai sebagai <meta name="description"> di hasil pencarian Google.
    deskripsi: 'Cek status pembayaran iuran warga, transparansi pengeluaran, dan pendaftaran acara warga.',
  },

  /* ---------------------------------------------------------------------
   * 2. IURAN
   * ------------------------------------------------------------------- */
  iuran: {
    // Sebutan iuran di lingkunganmu: 'IPL', 'IPKL', 'Iuran Warga', dst.
    label: 'IPL',
    // Kepanjangannya, ditampilkan di beberapa keterangan.
    kepanjangan: 'Iuran Pengelolaan Lingkungan',
    // Tahun periode iuran yang sedang berjalan.
    tahun: 2026,
    // Nominal iuran per bulan per rumah (angka, tanpa titik).
    nominalBulanan: 250000,
    // Umumnya 12. Ubah kalau iuran dihitung per periode lain.
    bulanPerTahun: 12,
  },

  /* ---------------------------------------------------------------------
   * 3. STRUKTUR RUMAH
   * ------------------------------------------------------------------- */
  rumah: {
    // Daftar blok. Boleh berapa pun jumlahnya: ['A','B'] atau ['1','2','3'].
    // Warna blok dibagikan otomatis, tidak perlu setting warna manual.
    blok: ['A', 'B', 'C', 'D', 'E', 'F'],
    // Rentang nomor rumah yang boleh diisi di form pencarian.
    nomorMin: 1,
    nomorMax: 15,
  },

  /* ---------------------------------------------------------------------
   * 4. INFORMASI PEMBAYARAN
   *    Muncul di kartu "Cara Bayar" dan saat rumah belum punya transaksi.
   * ------------------------------------------------------------------- */
  pembayaran: {
    bank: 'Bank Contoh',
    nomorRekening: '1234567890',
    atasNama: 'Bendahara Warga',
    // Link Google Form konfirmasi pembayaran. Kosongkan ('') kalau tidak
    // pakai form — tombolnya otomatis disembunyikan.
    formKonfirmasiUrl: '',
  },

  /* ---------------------------------------------------------------------
   * 5. KONTAK PENGURUS
   * ------------------------------------------------------------------- */
  kontak: {
    namaPengurus: 'Pengurus',
    // Format internasional tanpa tanda + dan tanpa 0 di depan.
    // Contoh: 0812-3456-789 ditulis '628123456789'.
    // Kosongkan ('') untuk menyembunyikan semua tombol WhatsApp.
    whatsapp: '',
  },

  /* ---------------------------------------------------------------------
   * 6. FITUR YANG AKTIF
   *    Set false untuk menyembunyikan menu sekaligus mematikan halamannya.
   * ------------------------------------------------------------------- */
  fitur: {
    leaderboard: true,  // /leaderboard — ranking blok & rumah
    pengeluaran: true,  // /pengeluaran — transparansi pengeluaran
    broadcast: true,    // /broadcast   — generator pesan WhatsApp
    kehadiran: true,    // /kehadiran   — RSVP acara warga
    lomba: true,        // /lomba       — pendaftaran lomba
  },

  /* ---------------------------------------------------------------------
   * 7. ACARA WARGA (halaman /kehadiran)
   *    Diabaikan kalau fitur.kehadiran = false.
   * ------------------------------------------------------------------- */
  acara: {
    judul: 'Kumpul Warga',
    tanggalLabel: 'Minggu, 2 Agustus 2026',
    waktuLabel: '19.30 WIB',
    tempatLabel: 'Balai Warga',
    agenda: [
      'Laporan keuangan warga',
      'Rencana acara 17 Agustus',
    ],
  },
}

export default siteConfig
