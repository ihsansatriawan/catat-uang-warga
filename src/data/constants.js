import { DAFTAR_BLOK } from '../config'

/**
 * Warna blok dibagikan otomatis dari palet di bawah, mengikuti urutan blok di
 * `site.config.js`. Jadi mau bloknya 2 atau 12, tidak perlu setting warna.
 *
 * Kelas Tailwind ditulis utuh (bukan disusun dari potongan string) supaya
 * ikut ter-scan saat build.
 */
const PALETTE = [
  {
    selected: 'bg-violet text-white border-violet',
    unselected: 'bg-white text-slate-dark border-slate-dark hover:bg-violet/10',
    bar: '#8B5CF6',
  },
  {
    selected: 'bg-pink text-white border-pink',
    unselected: 'bg-white text-slate-dark border-slate-dark hover:bg-pink/10',
    bar: '#F472B6',
  },
  {
    selected: 'bg-yellow text-slate-dark border-yellow',
    unselected: 'bg-white text-slate-dark border-slate-dark hover:bg-yellow/10',
    bar: '#FBBF24',
  },
  {
    selected: 'bg-green text-white border-green',
    unselected: 'bg-white text-slate-dark border-slate-dark hover:bg-green/10',
    bar: '#22C55E',
  },
  {
    selected: 'bg-orange text-white border-orange',
    unselected: 'bg-white text-slate-dark border-slate-dark hover:bg-orange/10',
    bar: '#FB923C',
  },
  {
    selected: 'bg-slate-dark text-cream border-slate-dark',
    unselected: 'bg-white text-slate-dark border-slate-dark hover:bg-slate-dark/10',
    bar: '#1E293B',
  },
]

const paletteFor = (index) => PALETTE[index % PALETTE.length]

export const BLOCK_COLORS = Object.fromEntries(
  DAFTAR_BLOK.map((blok, i) => [blok, paletteFor(i).selected])
)

export const BLOCK_COLORS_UNSELECTED = Object.fromEntries(
  DAFTAR_BLOK.map((blok, i) => [blok, paletteFor(i).unselected])
)

// Nilai warna mentah untuk inline style (bar chart, badge)
export const BLOCK_BAR_COLORS = Object.fromEntries(
  DAFTAR_BLOK.map((blok, i) => [blok, paletteFor(i).bar])
)
