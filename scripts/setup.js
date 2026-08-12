#!/usr/bin/env node
/**
 * Wizard setup — menanyakan identitas perumahan lalu menulis ulang
 * src/config/site.config.js dan menyiapkan .env.local.
 *
 *   npm run setup
 *
 * Tekan Enter untuk memakai nilai yang ada di dalam kurung siku.
 */
import { createInterface } from 'node:readline/promises'
import { copyFileSync, existsSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { stdin, stdout } from 'node:process'
import { siteConfig } from '../src/config/site.config.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(__dirname, '..')
const CONFIG_PATH = resolve(ROOT, 'src/config/site.config.js')

// Wizard ini dirancang untuk terminal. SETUP_ALLOW_NON_TTY=1 dipakai untuk
// pengujian otomatis (jawaban dialirkan lewat pipe).
if (!stdin.isTTY && process.env.SETUP_ALLOW_NON_TTY !== '1') {
  console.error(
    'Setup butuh terminal interaktif.\n' +
    'Jalankan `npm run setup` langsung di terminal, atau edit\n' +
    'src/config/site.config.js secara manual.'
  )
  process.exit(1)
}

const rl = createInterface({ input: stdin, output: stdout })

const ask = async (label, fallback = '') => {
  const hint = fallback === '' ? '' : ` [${fallback}]`
  const jawab = (await rl.question(`${label}${hint}: `)).trim()
  return jawab || String(fallback)
}

const askNumber = async (label, fallback) => {
  while (true) {
    const jawab = await ask(label, fallback)
    const angka = Number(String(jawab).replace(/[^0-9]/g, ''))
    if (Number.isFinite(angka) && angka > 0) return angka
    console.log('  ⚠ Harus berupa angka. Coba lagi.')
  }
}

const askYesNo = async (label, fallback = true) => {
  const jawab = (await ask(`${label} (y/n)`, fallback ? 'y' : 'n')).toLowerCase()
  return jawab.startsWith('y')
}

const quote = (value) => `'${String(value).replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`

function renderConfig(c) {
  return `/* ==========================================================================
 *  KONFIGURASI UTAMA
 *  --------------------------------------------------------------------------
 *  SATU-SATUNYA file yang wajib kamu edit untuk memakai sistem ini di
 *  perumahan sendiri. Semua tampilan (judul, nominal iuran, blok, rekening,
 *  kontak pengurus, menu yang aktif) mengikuti isi file ini.
 *
 *  File ini terakhir ditulis oleh \`npm run setup\`. Aman diedit manual.
 *
 *  Penjelasan tiap field: docs/KONFIGURASI.md
 * ========================================================================== */

export const siteConfig = {
  /* 1. IDENTITAS PERUMAHAN */
  perumahan: {
    nama: ${quote(c.perumahan.nama)},
    namaPendek: ${quote(c.perumahan.namaPendek)},
    // Alamat situs setelah di-deploy, tanpa garis miring di akhir.
    url: ${quote(c.perumahan.url)},
    deskripsi: ${quote(c.perumahan.deskripsi)},
  },

  /* 2. IURAN */
  iuran: {
    label: ${quote(c.iuran.label)},
    kepanjangan: ${quote(c.iuran.kepanjangan)},
    tahun: ${c.iuran.tahun},
    nominalBulanan: ${c.iuran.nominalBulanan},
    bulanPerTahun: ${c.iuran.bulanPerTahun},
  },

  /* 3. STRUKTUR RUMAH */
  rumah: {
    blok: [${c.rumah.blok.map(quote).join(', ')}],
    nomorMin: ${c.rumah.nomorMin},
    nomorMax: ${c.rumah.nomorMax},
  },

  /* 4. INFORMASI PEMBAYARAN */
  pembayaran: {
    bank: ${quote(c.pembayaran.bank)},
    nomorRekening: ${quote(c.pembayaran.nomorRekening)},
    atasNama: ${quote(c.pembayaran.atasNama)},
    // Kosongkan ('') kalau tidak pakai Google Form konfirmasi.
    formKonfirmasiUrl: ${quote(c.pembayaran.formKonfirmasiUrl)},
  },

  /* 5. KONTAK PENGURUS */
  kontak: {
    namaPengurus: ${quote(c.kontak.namaPengurus)},
    // Format internasional tanpa + dan tanpa 0 di depan, mis. '628123456789'.
    // Kosongkan ('') untuk menyembunyikan semua tombol WhatsApp.
    whatsapp: ${quote(c.kontak.whatsapp)},
  },

  /* 6. FITUR YANG AKTIF */
  fitur: {
    leaderboard: ${c.fitur.leaderboard},
    pengeluaran: ${c.fitur.pengeluaran},
    broadcast: ${c.fitur.broadcast},
    kehadiran: ${c.fitur.kehadiran},
    lomba: ${c.fitur.lomba},
  },

  /* 7. ACARA WARGA (halaman /kehadiran) */
  acara: {
    judul: ${quote(c.acara.judul)},
    tanggalLabel: ${quote(c.acara.tanggalLabel)},
    waktuLabel: ${quote(c.acara.waktuLabel)},
    tempatLabel: ${quote(c.acara.tempatLabel)},
    agenda: [
${c.acara.agenda.map((a) => `      ${quote(a)},`).join('\n')}
    ],
  },
}

export default siteConfig
`
}

async function main() {
  const c = structuredClone(siteConfig)

  console.log('\n=== Setup Catat Uang Warga ===')
  console.log('Tekan Enter untuk memakai nilai dalam [kurung].\n')

  console.log('— Identitas perumahan —')
  c.perumahan.nama = await ask('Nama perumahan', c.perumahan.nama)
  c.perumahan.namaPendek = await ask('Nama pendek (untuk badge)', c.perumahan.nama)
  c.perumahan.url = (await ask('Alamat situs setelah deploy', c.perumahan.url)).replace(/\/+$/, '')

  console.log('\n— Iuran —')
  c.iuran.label = await ask('Sebutan iuran (IPL / IPKL / Iuran Warga)', c.iuran.label)
  c.iuran.kepanjangan = await ask('Kepanjangannya', c.iuran.kepanjangan)
  c.iuran.tahun = await askNumber('Tahun periode iuran', c.iuran.tahun)
  c.iuran.nominalBulanan = await askNumber('Iuran per bulan per rumah (angka)', c.iuran.nominalBulanan)
  c.iuran.bulanPerTahun = await askNumber('Jumlah bulan per periode', c.iuran.bulanPerTahun)
  c.perumahan.deskripsi = `Cek status pembayaran ${c.iuran.label} ${c.perumahan.nama}, transparansi pengeluaran, dan pendaftaran acara warga.`

  console.log('\n— Struktur rumah —')
  const blokInput = await ask('Daftar blok, pisahkan koma', c.rumah.blok.join(','))
  c.rumah.blok = blokInput
    .split(',')
    .map((b) => b.trim())
    .filter(Boolean)
    // Blok satu huruf disamakan jadi huruf besar supaya cocok dengan isi data
    // (residents.json / validated.json). Nama blok panjang dibiarkan apa adanya.
    .map((b) => (b.length === 1 ? b.toUpperCase() : b))
  c.rumah.nomorMin = await askNumber('Nomor rumah terkecil', c.rumah.nomorMin)
  c.rumah.nomorMax = await askNumber('Nomor rumah terbesar', c.rumah.nomorMax)

  console.log('\n— Rekening pembayaran —')
  c.pembayaran.bank = await ask('Nama bank', c.pembayaran.bank)
  c.pembayaran.nomorRekening = await ask('Nomor rekening', c.pembayaran.nomorRekening)
  c.pembayaran.atasNama = await ask('Atas nama', c.pembayaran.atasNama)
  c.pembayaran.formKonfirmasiUrl = await ask('Link Google Form konfirmasi (boleh kosong)', c.pembayaran.formKonfirmasiUrl)

  console.log('\n— Kontak pengurus —')
  c.kontak.namaPengurus = await ask('Sebutan pengurus', c.kontak.namaPengurus)
  const waInput = await ask('Nomor WhatsApp pengurus (mis. 08123456789, boleh kosong)', c.kontak.whatsapp)
  const waDigits = waInput.replace(/[^0-9]/g, '')
  c.kontak.whatsapp = waDigits.startsWith('0') ? `62${waDigits.slice(1)}` : waDigits

  console.log('\n— Fitur yang dipakai —')
  c.fitur.leaderboard = await askYesNo('Aktifkan Leaderboard?', c.fitur.leaderboard)
  c.fitur.pengeluaran = await askYesNo('Aktifkan halaman Pengeluaran?', c.fitur.pengeluaran)
  c.fitur.broadcast = await askYesNo('Aktifkan generator Broadcast WhatsApp?', c.fitur.broadcast)
  c.fitur.kehadiran = await askYesNo('Aktifkan RSVP acara warga?', c.fitur.kehadiran)
  c.fitur.lomba = await askYesNo('Aktifkan pendaftaran lomba?', c.fitur.lomba)

  if (c.fitur.kehadiran) {
    console.log('\n— Acara warga —')
    c.acara.judul = await ask('Nama acara', c.acara.judul)
    c.acara.tanggalLabel = await ask('Tanggal acara (teks bebas)', c.acara.tanggalLabel)
    c.acara.waktuLabel = await ask('Jam acara', c.acara.waktuLabel)
    c.acara.tempatLabel = await ask('Tempat acara', c.acara.tempatLabel)
  }

  writeFileSync(CONFIG_PATH, renderConfig(c))
  console.log('\n✔ src/config/site.config.js ditulis ulang.')

  const envLocal = resolve(ROOT, '.env.local')
  if (!existsSync(envLocal)) {
    copyFileSync(resolve(ROOT, '.env.example'), envLocal)
    console.log('✔ .env.local dibuat dari .env.example.')
  } else {
    console.log('• .env.local sudah ada, dibiarkan apa adanya.')
  }

  console.log(
    '\nLangkah berikutnya:\n' +
    '  1. npm run dev            → buka http://localhost:5173\n' +
    '  2. Isi data warga         → docs/PANDUAN-PENGURUS.md\n' +
    '  3. Deploy                 → docs/INSTALASI.md\n'
  )
}

main()
  .catch((err) => {
    console.error('\nSetup gagal:', err.message)
    process.exitCode = 1
  })
  .finally(() => rl.close())
