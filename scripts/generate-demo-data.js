#!/usr/bin/env node
/**
 * Membuat data DEMO (warga, pembayaran, pengeluaran) supaya aplikasi langsung
 * bisa dibuka tanpa perlu menyiapkan data asli lebih dulu.
 *
 *   npm run demo:seed
 *
 * Semua nama di sini fiktif. Jumlah blok & rumah mengikuti
 * src/config/site.config.js, jadi hasilnya selalu nyambung dengan konfigurasi.
 *
 * Data yang dihasilkan deterministik (seed tetap), jadi menjalankan ulang
 * script ini menghasilkan file yang sama persis.
 *
 * ⚠️  Menimpa src/data/residents.json, validated.json, dan expenses.json.
 */
import { writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { siteConfig } from '../src/config/site.config.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const DATA_DIR = resolve(__dirname, '../src/data')

const { rumah, iuran } = siteConfig

/** PRNG sederhana dengan seed tetap → hasil selalu sama tiap dijalankan. */
function mulberry32(seed) {
  return function random() {
    seed |= 0
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
const rand = mulberry32(20260101)
const pick = (arr) => arr[Math.floor(rand() * arr.length)]
const between = (min, max) => min + Math.floor(rand() * (max - min + 1))

const DEPAN = [
  'Budi', 'Siti', 'Agus', 'Dewi', 'Rizky', 'Putri', 'Andi', 'Rina', 'Hendra',
  'Maya', 'Doni', 'Lestari', 'Fajar', 'Ayu', 'Bagus', 'Nurul', 'Iwan', 'Sari',
  'Yoga', 'Wulan', 'Dimas', 'Intan', 'Arif', 'Ratna', 'Eko', 'Tika',
]
const BELAKANG = [
  'Santoso', 'Wijaya', 'Pratama', 'Nugroho', 'Halim', 'Saputra', 'Kurniawan',
  'Maharani', 'Setiawan', 'Firmansyah', 'Anggraini', 'Susanto', 'Rahmawati',
  'Hidayat', 'Permana', 'Utami',
]

/* ---------------------------------------------------------------- warga --- */
const residents = []
for (const blok of rumah.blok) {
  for (let nomor = rumah.nomorMin; nomor <= rumah.nomorMax; nomor++) {
    // ~12% rumah dianggap masih kosong / belum dihuni
    if (rand() < 0.12) continue
    residents.push({
      blok,
      nomorRumah: String(nomor),
      namaPemilik: `${pick(DEPAN)} ${pick(BELAKANG)}`,
    })
  }
}

/* ----------------------------------------------------------- pembayaran --- */
const pad = (n) => String(n).padStart(2, '0')
const timestampFor = (bulanIndex) => {
  const bulan = Math.min(11, Math.max(0, bulanIndex))
  return `${iuran.tahun}-${pad(bulan + 1)}-${pad(between(2, 26))}T${pad(between(8, 20))}:${pad(between(0, 59))}:00+07:00`
}

const transaksi = []
for (const r of residents) {
  const dadu = rand()
  let totalBulan
  if (dadu < 0.35) totalBulan = iuran.bulanPerTahun            // lunas setahun
  else if (dadu < 0.45) totalBulan = iuran.bulanPerTahun + between(1, 3) // bayar lebih
  else if (dadu < 0.85) totalBulan = between(1, iuran.bulanPerTahun - 1) // cicil
  else totalBulan = 0                                          // belum bayar

  let sisa = totalBulan
  let bulanBerjalan = 0
  while (sisa > 0) {
    // Warga biasanya bayar borongan 1–6 bulan sekaligus
    const bayarBulan = Math.min(sisa, between(1, 6))
    transaksi.push({
      timestamp: timestampFor(bulanBerjalan),
      blok: r.blok,
      nomorRumah: r.nomorRumah,
      namaPemilik: r.namaPemilik,
      jumlahPembayaran: bayarBulan * iuran.nominalBulanan,
    })
    sisa -= bayarBulan
    bulanBerjalan += bayarBulan
  }
}
transaksi.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp))

const totalIuranMasuk = transaksi.reduce((s, t) => s + t.jumlahPembayaran, 0)
const lastUpdate = `${iuran.tahun}-12-31`

/* ---------------------------------------------------------- pengeluaran --- */
const BULAN = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli',
  'Agustus', 'September', 'Oktober', 'November', 'Desember']

const sisaKasTahunLalu = 15000000
const rutin = [
  { keterangan: `Sisa Kas ${iuran.tahun - 1}`, masuk: sisaKasTahunLalu, keluar: null },
  { keterangan: `Total Iuran Warga ${iuran.tahun}`, masuk: totalIuranMasuk, keluar: null },
]
for (let i = 0; i < 6; i++) {
  rutin.push({ keterangan: `Security ${BULAN[i]}`, masuk: null, keluar: 2400000 })
  rutin.push({ keterangan: `Kebersihan ${BULAN[i]}`, masuk: null, keluar: 900000 })
}

const INSIDENTAL_TEMPLATE = [
  ['Perbaikan lampu jalan blok depan', 1250000, 'Fasilitas Umum'],
  ['Servis pompa air taman', 850000, 'Fasilitas Umum'],
  ['Cat ulang pos satpam', 1600000, 'Renovasi'],
  ['Perbaikan gerbang otomatis', 3200000, 'Renovasi'],
  ['Konsumsi rapat warga', 450000, 'Kegiatan Warga'],
  ['Santunan warga sakit', 1000000, 'Sosial'],
  ['Hadiah lomba 17 Agustus', 2750000, 'Kegiatan Warga'],
  ['Dekorasi acara warga', 1200000, 'Kegiatan Warga'],
  ['Pembelian tanaman taman', 700000, 'Fasilitas Umum'],
  ['Alat kebersihan', 380000, 'Operasional'],
  ['Token listrik fasilitas umum', 600000, 'Operasional'],
  ['Perbaikan saluran air', 1900000, 'Fasilitas Umum'],
]
const insidental = INSIDENTAL_TEMPLATE.map(([keterangan, keluar, kategori], i) => ({
  keterangan,
  masuk: null,
  keluar,
  tanggal: `${iuran.tahun}-${pad((i % 12) + 1)}-${pad(between(3, 27))}`,
  kategori,
}))

const totalMasuk =
  rutin.reduce((s, r) => s + (r.masuk || 0), 0) +
  insidental.reduce((s, r) => s + (r.masuk || 0), 0)
const totalKeluar =
  rutin.reduce((s, r) => s + (r.keluar || 0), 0) +
  insidental.reduce((s, r) => s + (r.keluar || 0), 0)

/* ---------------------------------------------------------------- tulis --- */
const write = (name, value) => {
  writeFileSync(resolve(DATA_DIR, name), `${JSON.stringify(value, null, 2)}\n`)
  console.log(`  ✔ src/data/${name}`)
}

console.log('Menulis data demo…')
write('residents.json', residents)
write('validated.json', { lastUpdate, data: transaksi })
write('expenses.json', {
  lastUpdate,
  rutin,
  insidental,
  summary: {
    totalMasuk,
    totalKeluar,
    sisaAnggaran: totalMasuk - totalKeluar,
  },
})

console.log(
  `\nSelesai — ${residents.length} rumah, ${transaksi.length} transaksi demo.\n` +
  'Ganti dengan data asli lewat `npm run convert:residents` / `convert:validated`\n' +
  'atau lewat Google Apps Script (lihat docs/PANDUAN-PENGURUS.md).'
)
