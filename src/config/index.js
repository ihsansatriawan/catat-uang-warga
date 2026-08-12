/**
 * Turunan dari site.config.js — jangan edit file ini.
 * Edit `src/config/site.config.js` (atau jalankan `npm run setup`).
 */
import { siteConfig } from './site.config'

export const SITE = siteConfig

export const PERUMAHAN = siteConfig.perumahan
export const IURAN = siteConfig.iuran
export const RUMAH = siteConfig.rumah
export const PEMBAYARAN = siteConfig.pembayaran
export const KONTAK = siteConfig.kontak
export const FITUR = siteConfig.fitur
export const ACARA = siteConfig.acara

/** Sebutan iuran, mis. "IPL". */
export const LABEL_IURAN = IURAN.label
/** Sebutan iuran + tahun, mis. "IPL 2026". */
export const LABEL_IURAN_TAHUN = `${IURAN.label} ${IURAN.tahun}`
/** Nominal per bulan per rumah. */
export const IURAN_BULANAN = IURAN.nominalBulanan
/** Jumlah bulan dalam satu periode iuran. */
export const BULAN_PER_TAHUN = IURAN.bulanPerTahun
/** Total yang harus dibayar satu rumah dalam setahun. */
export const TARGET_TAHUNAN = IURAN.nominalBulanan * IURAN.bulanPerTahun

/** Daftar blok yang dipakai di seluruh aplikasi. */
export const DAFTAR_BLOK = RUMAH.blok

/** URL situs tanpa garis miring di akhir. */
export const BASE_URL = (PERUMAHAN.url || '').replace(/\/+$/, '')

/**
 * URL absolut ke sebuah halaman, untuk ditempel di pesan WhatsApp.
 * Jatuh balik ke origin browser kalau `perumahan.url` belum diisi.
 */
export function siteUrl(path = '') {
  const suffix = path.startsWith('/') ? path : path ? `/${path}` : ''
  if (BASE_URL) return `${BASE_URL}${suffix}`
  if (typeof window !== 'undefined') return `${window.location.origin}${suffix}`
  return suffix
}

/**
 * Link chat WhatsApp ke pengurus dengan pesan siap kirim.
 * Mengembalikan `null` kalau nomor pengurus belum diisi, supaya tombolnya
 * bisa disembunyikan alih-alih membuka link rusak.
 */
export function waPengurusUrl(pesan = '') {
  const nomor = (KONTAK.whatsapp || '').replace(/[^0-9]/g, '')
  if (!nomor) return null
  return `https://wa.me/${nomor}?text=${encodeURIComponent(pesan)}`
}

/** Link "bagikan ke WhatsApp" tanpa tujuan tertentu (pilih kontak sendiri). */
export function waShareUrl(pesan = '') {
  return `https://wa.me/?text=${encodeURIComponent(pesan)}`
}

/** Format angka jadi rupiah, mis. 250000 → "Rp 250.000". */
export function formatRupiah(amount) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(amount || 0)
}
