import { useState, useEffect, useMemo, useCallback } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowLeft,
  ClipboardList,
  RefreshCw,
  Loader2,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Circle,
} from 'lucide-react'
import { getAvailableBlocks, getAttendanceHouses } from '../data/helpers'
import { trackEvent } from '../utils/tracking'
import { BLOCK_COLORS, BLOCK_COLORS_UNSELECTED } from '../data/constants'

const ENDPOINT = import.meta.env.VITE_ATTENDANCE_ENDPOINT || ''

// Status → tampilan
const STATUS_META = {
  Hadir: { label: 'Hadir', cls: 'bg-green text-white border-green', Icon: CheckCircle2 },
  'Tidak Hadir': { label: 'Tidak Hadir', cls: 'bg-red-500 text-white border-red-500', Icon: XCircle },
  'Masih Ragu': { label: 'Masih Ragu', cls: 'bg-orange text-white border-orange', Icon: HelpCircle },
}
const BELUM = { label: 'Belum isi', cls: 'bg-white text-slate-dark/40 border-slate-dark/20', Icon: Circle }

export default function RekapKehadiranView() {
  const [selectedBlok, setSelectedBlok] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [submissions, setSubmissions] = useState({}) // key "blok-nomor" → { status, nama, timestamp }

  const blocks = getAvailableBlocks()

  const load = useCallback(async () => {
    if (!ENDPOINT) {
      setError('Rekap belum aktif — endpoint Google Sheet belum diatur.')
      setLoading(false)
      return
    }
    setLoading(true)
    setError('')
    try {
      const res = await fetch(ENDPOINT, { method: 'GET' })
      const json = await res.json()
      const rows = Array.isArray(json?.data) ? json.data : []
      // Upsert seharusnya sudah unik, tapi jaga-jaga: baris terakhir menang.
      const map = {}
      for (const r of rows) {
        if (!r.blok || !r.nomorRumah) continue
        map[`${r.blok}-${r.nomorRumah}`] = {
          status: r.status || '',
          nama: r.nama || '',
          timestamp: r.timestamp || '',
        }
      }
      setSubmissions(map)
    } catch {
      setError('Gagal memuat data. Cek koneksi lalu coba lagi.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    trackEvent('open_rekap_kehadiran')
    load()
  }, [load])

  // Gabungkan master rumah dengan data submission
  const houses = useMemo(() => {
    return getAttendanceHouses(selectedBlok || undefined).map((h) => {
      const sub = submissions[`${h.blok}-${h.nomorRumah}`]
      return {
        ...h,
        filled: !!sub,
        status: sub?.status || '',
      }
    })
  }, [selectedBlok, submissions])

  // Statistik dihitung dari seluruh rumah (bukan hanya blok terpilih)
  const stats = useMemo(() => {
    const all = getAttendanceHouses().map((h) => ({
      ...h,
      status: submissions[`${h.blok}-${h.nomorRumah}`]?.status || '',
    }))
    const s = { total: all.length, filled: 0, hadir: 0, tidak: 0, ragu: 0 }
    for (const h of all) {
      if (!h.status) continue
      s.filled++
      if (h.status === 'Hadir') s.hadir++
      else if (h.status === 'Tidak Hadir') s.tidak++
      else if (h.status === 'Masih Ragu') s.ragu++
    }
    s.belum = s.total - s.filled
    return s
  }, [submissions])

  const sudahHouses = houses.filter((h) => h.filled)
  const belumHouses = houses.filter((h) => !h.filled)

  function StatusBadge({ status }) {
    const meta = status ? STATUS_META[status] || BELUM : BELUM
    const { Icon } = meta
    return (
      <span
        className={`inline-flex items-center gap-1 border-2 rounded-full px-2.5 py-0.5 font-heading font-bold text-[11px] shadow-hard-sm ${meta.cls}`}
      >
        <Icon size={11} strokeWidth={2.5} />
        {meta.label}
      </span>
    )
  }

  function HouseRow({ h }) {
    return (
      <div className="flex items-center gap-3 px-4 py-2.5">
        <span
          className={`flex-shrink-0 inline-flex items-center justify-center min-w-11 px-2 h-8 rounded-lg border-2 font-heading font-extrabold text-xs ${BLOCK_COLORS[h.blok]}`}
        >
          {h.blok}-{h.nomorRumah}
        </span>
        <span className="flex-1 font-body text-sm text-slate-dark truncate">
          {h.namaPemilik}
        </span>
        <StatusBadge status={h.status} />
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-dvh animate-pop-in">
      {/* Sticky top bar */}
      <div className="sticky top-0 z-10 bg-cream/90 backdrop-blur-md border-b-2 border-slate-dark/10 safe-x px-4 py-3 flex items-center gap-3">
        <Link
          to="/kehadiran"
          className="
            flex items-center gap-1.5 font-heading font-bold text-sm
            bg-yellow border-2 border-slate-dark rounded-full px-3 py-1.5
            shadow-hard-sm
            active:translate-x-[1px] active:translate-y-[1px] active:shadow-none
            transition-all
          "
        >
          <ArrowLeft size={16} strokeWidth={2.5} />
          Kembali
        </Link>
        <div className="flex-1 text-center">
          <span className="font-heading font-bold text-sm text-slate-dark/50">
            Rekap Kehadiran
          </span>
        </div>
        <button
          onClick={load}
          disabled={loading}
          aria-label="Muat ulang"
          className="text-violet disabled:opacity-40 active:scale-90 transition-transform"
        >
          <RefreshCw size={20} strokeWidth={2.5} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto safe-x">
        <div className="max-w-lg mx-auto px-4 py-6 space-y-5">

          {error ? (
            <div className="bg-white border-2 border-slate-dark rounded-3xl shadow-hard p-6 text-center">
              <p className="font-body text-sm text-slate-dark/70">{error}</p>
            </div>
          ) : loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <Loader2 size={32} strokeWidth={2.5} className="text-violet animate-spin" />
              <p className="font-body text-sm text-slate-dark/50">Memuat data…</p>
            </div>
          ) : (
            <>
              {/* Summary card */}
              <div className="bg-violet border-2 border-slate-dark rounded-3xl shadow-hard overflow-hidden animate-slide-up stagger-1">
                <div className="px-5 pt-5 pb-4">
                  <p className="font-body text-xs text-white/70 uppercase tracking-widest mb-1">
                    Sudah Konfirmasi
                  </p>
                  <p className="font-heading font-black text-4xl text-white">
                    {stats.filled}
                    <span className="text-2xl text-white/50"> / {stats.total} rumah</span>
                  </p>
                </div>
                <div className="grid grid-cols-4 divide-x-2 divide-slate-dark border-t-2 border-slate-dark bg-white">
                  <div className="px-2 py-3 text-center">
                    <p className="font-heading font-black text-lg text-green">{stats.hadir}</p>
                    <p className="font-body text-[10px] text-slate-dark/50 leading-tight">Hadir</p>
                  </div>
                  <div className="px-2 py-3 text-center">
                    <p className="font-heading font-black text-lg text-red-500">{stats.tidak}</p>
                    <p className="font-body text-[10px] text-slate-dark/50 leading-tight">Tidak</p>
                  </div>
                  <div className="px-2 py-3 text-center">
                    <p className="font-heading font-black text-lg text-orange">{stats.ragu}</p>
                    <p className="font-body text-[10px] text-slate-dark/50 leading-tight">Ragu</p>
                  </div>
                  <div className="px-2 py-3 text-center">
                    <p className="font-heading font-black text-lg text-slate-dark/40">{stats.belum}</p>
                    <p className="font-body text-[10px] text-slate-dark/50 leading-tight">Belum</p>
                  </div>
                </div>
              </div>

              {/* Block filter */}
              <div className="flex flex-wrap gap-2 animate-fade-in stagger-2">
                <button
                  type="button"
                  onClick={() => setSelectedBlok('')}
                  className={`
                    border-2 border-slate-dark rounded-xl px-4 py-2 font-heading font-extrabold text-sm shadow-hard-sm
                    active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all
                    ${selectedBlok === '' ? 'bg-slate-dark text-cream' : 'bg-white text-slate-dark'}
                  `}
                >
                  Semua
                </button>
                {blocks.map((b) => (
                  <button
                    key={b}
                    type="button"
                    onClick={() => setSelectedBlok(b)}
                    className={`
                      border-2 rounded-xl px-4 py-2 font-heading font-extrabold text-sm shadow-hard-sm
                      active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all
                      ${selectedBlok === b ? BLOCK_COLORS[b] : BLOCK_COLORS_UNSELECTED[b]}
                    `}
                  >
                    {b}
                  </button>
                ))}
              </div>

              {/* Sudah konfirmasi */}
              <div className="bg-white border-2 border-slate-dark rounded-3xl shadow-hard overflow-hidden animate-slide-up stagger-3">
                <div className="flex items-center gap-2 px-5 py-3 border-b-2 border-slate-dark/10">
                  <CheckCircle2 size={16} strokeWidth={2.5} className="text-green" />
                  <span className="font-heading font-bold text-sm">Sudah Konfirmasi</span>
                  <span className="ml-auto font-heading font-black text-sm text-green">
                    {sudahHouses.length}
                  </span>
                </div>
                {sudahHouses.length > 0 ? (
                  <div className="divide-y-2 divide-slate-dark/5">
                    {sudahHouses.map((h) => (
                      <HouseRow key={`${h.blok}-${h.nomorRumah}`} h={h} />
                    ))}
                  </div>
                ) : (
                  <p className="px-5 py-4 font-body text-sm text-slate-dark/50 text-center">
                    Belum ada yang konfirmasi.
                  </p>
                )}
              </div>

              {/* Belum konfirmasi */}
              <div className="bg-white border-2 border-slate-dark rounded-3xl shadow-hard overflow-hidden animate-slide-up stagger-4">
                <div className="flex items-center gap-2 px-5 py-3 border-b-2 border-slate-dark/10">
                  <Circle size={16} strokeWidth={2.5} className="text-slate-dark/40" />
                  <span className="font-heading font-bold text-sm">Belum Konfirmasi</span>
                  <span className="ml-auto font-heading font-black text-sm text-slate-dark/40">
                    {belumHouses.length}
                  </span>
                </div>
                {belumHouses.length > 0 ? (
                  <div className="divide-y-2 divide-slate-dark/5">
                    {belumHouses.map((h) => (
                      <HouseRow key={`${h.blok}-${h.nomorRumah}`} h={h} />
                    ))}
                  </div>
                ) : (
                  <p className="px-5 py-4 font-body text-sm text-slate-dark/50 text-center">
                    Semua rumah sudah konfirmasi 🎉
                  </p>
                )}
              </div>

              <p className="text-center font-body text-[11px] text-slate-dark/40 pb-2">
                <ClipboardList size={12} strokeWidth={2.5} className="inline mr-1 -mt-0.5" />
                Nomor WhatsApp & email tidak ditampilkan di sini demi privasi.
              </p>
            </>
          )}

        </div>
      </div>

      <div className="safe-bottom" />
    </div>
  )
}
