// Konfigurasi lomba 17-an — dipakai bersama oleh /lomba dan /rekap-lomba.
//
// PENTING: urutan LOMBA_LIST menentukan urutan kolom di tab "Lomba" pada Google
// Sheet (kolom L–S). Jangan ubah urutannya tanpa menyesuaikan LOMBA_KEYS di
// scripts/google-apps-script/Lomba.gs — Apps Script menulis berdasarkan posisi.

import { IURAN, PERUMAHAN } from '../config'

export const LOMBA_EVENT = {
  title: 'Lomba 17-an',
  subtitle: `${PERUMAHAN.namaPendek} ${IURAN.tahun}`,
  dateLabel: 'Minggu, 16 Agustus 2026',
  timeLabel: '07.30 WIB',
  placeLabel: 'Lapangan Utama',
  // Batas akhir pendaftaran (akhir hari, WIB)
  deadline: '2026-08-12T23:59:59+07:00',
  deadlineLabel: 'Rabu, 12 Agustus 2026',
}

export const LOMBA_LIST = [
  { key: 'bendera', label: 'Memindahkan bendera', kategori: 'KU-4' },
  { key: 'air', label: 'Mengisi air ke dalam botol', kategori: 'KU-4' },
  { key: 'kerupuk', label: 'Makan kerupuk', kategori: 'Semua Umur' },
  { key: 'paku', label: 'Masukin paku ke dalam botol', kategori: 'KU-7 ke atas' },
  { key: 'karung', label: 'Balap karung', kategori: 'KU-7 ke atas' },
  { key: 'kelereng', label: 'Balap kelereng', kategori: 'KU-7 ke atas' },
  { key: 'tepung', label: 'Memindahkan tepung terigu', kategori: 'KU-7 ke atas' },
  { key: 'pentas', label: 'Pentas seni', kategori: 'Semua Umur' },
]

// Pengelompokan untuk tampilan form. Kategori umur hanya informasi — tidak
// membatasi pilihan, siapa pun boleh mendaftar di lomba mana pun.
export const LOMBA_GROUPS = [
  { title: 'Balita', note: 'KU-4', keys: ['bendera', 'air'] },
  { title: '7 Tahun ke Atas', note: 'KU-7', keys: ['paku', 'karung', 'kelereng', 'tepung'] },
  { title: 'Semua Umur', note: '', keys: ['kerupuk', 'pentas'] },
]

export const PERAN_OPTIONS = ['Ayah', 'Ibu', 'Anak', 'Lainnya']

// Kelompok umur untuk tampilan rekap. Sama seperti kategori lomba, ini hanya
// pengelompokan tampilan — bukan pembatas siapa yang boleh ikut lomba apa.
// Batas terakhir sengaja dibiarkan tanpa `max` supaya jadi penampung sisanya.
export const UMUR_GROUPS = [
  { key: 'balita', label: 'Balita', note: '0–6 th', min: 0, max: 6 },
  { key: 'anak', label: 'Anak', note: '7–12 th', min: 7, max: 12 },
  { key: 'remaja', label: 'Remaja', note: '13–17 th', min: 13, max: 17 },
  { key: 'dewasa', label: 'Dewasa', note: '18 th ke atas', min: 18, max: Infinity },
]

// Peserta yang tidak mengisi umur tetap harus muncul, jadi ditampung di sini.
export const UMUR_GROUP_UNKNOWN = { key: 'tanpaUmur', label: 'Umur belum diisi', note: '' }

/** Umur dari sheet bisa berupa string kosong, null, atau angka dalam string. */
export function parseUmur(umur) {
  if (umur === '' || umur == null) return null
  const n = Number(umur)
  return Number.isFinite(n) ? n : null
}

export function getUmurGroup(umur) {
  const n = parseUmur(umur)
  if (n == null) return UMUR_GROUP_UNKNOWN
  return UMUR_GROUPS.find((g) => n >= g.min && n <= g.max) || UMUR_GROUP_UNKNOWN
}

// Batas "wajar" jumlah lomba per peserta — bukan larangan, hanya peringatan
// halus supaya tidak asal centang semua dan bentrok jadwal.
export const LOMBA_WARN_THRESHOLD = 4

export const LOMBA_BY_KEY = Object.fromEntries(LOMBA_LIST.map((l) => [l.key, l]))

export function getLombaLabel(key) {
  return LOMBA_BY_KEY[key]?.label || key
}

/** Sisa hari sampai pendaftaran ditutup. Negatif berarti sudah lewat. */
export function getDaysLeft(now = new Date()) {
  const deadline = new Date(LOMBA_EVENT.deadline)
  return Math.ceil((deadline - now) / 86400000)
}

export function isRegistrationClosed(now = new Date()) {
  return now > new Date(LOMBA_EVENT.deadline)
}
