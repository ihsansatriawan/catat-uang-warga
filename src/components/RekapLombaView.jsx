import { useState, useEffect, useMemo, useCallback } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowLeft,
  ClipboardList,
  RefreshCw,
  Loader2,
  ChevronDown,
  Trophy,
  Share2,
  Sparkles,
  CheckCircle2,
  Circle,
} from 'lucide-react'
import { getAttendanceHouses } from '../data/helpers'
import {
  LOMBA_EVENT,
  LOMBA_LIST,
  LOMBA_BY_KEY,
  UMUR_GROUPS,
  UMUR_GROUP_UNKNOWN,
  getUmurGroup,
  parseUmur,
  isRegistrationClosed,
} from '../data/lomba'
import { trackEvent } from '../utils/tracking'
import { BLOCK_BAR_COLORS } from '../data/constants'

// Endpoint spreadsheet lomba (terpisah dari IPL/kehadiran) — lihat LombaView.
const ENDPOINT = import.meta.env.VITE_LOMBA_ENDPOINT || ''

const TABS = [
  { key: 'lomba', label: 'Per Lomba' },
  { key: 'rumah', label: 'Per Rumah' },
]

const URUT_OPTIONS = [
  { key: 'semua', label: 'Semua' },
  { key: 'umur', label: 'Kelompok umur' },
]

const ALL_UMUR_GROUPS = [...UMUR_GROUPS, UMUR_GROUP_UNKNOWN]

/**
 * Pecah daftar peserta ke kelompok umur, urut sesuai UMUR_GROUPS dan yang
 * tanpa umur ditaruh paling bawah. Kelompok kosong tidak ikut dikembalikan.
 */
function groupByUmur(peserta) {
  const bucket = {}
  for (const r of peserta) {
    const g = getUmurGroup(r.umur)
    if (!bucket[g.key]) bucket[g.key] = []
    bucket[g.key].push(r)
  }
  return ALL_UMUR_GROUPS.filter((g) => bucket[g.key]?.length).map((g) => ({
    ...g,
    // Dalam satu kelompok, urut dari yang paling muda biar gampang dibaca.
    peserta: bucket[g.key].sort((a, b) => (parseUmur(a.umur) ?? 0) - (parseUmur(b.umur) ?? 0)),
  }))
}

export default function RekapLombaView() {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [tab, setTab] = useState('lomba')
  const [openLomba, setOpenLomba] = useState(null)
  const [urut, setUrut] = useState('semua')

  const closed = isRegistrationClosed()

  const load = useCallback(async () => {
    if (!ENDPOINT) {
      setError('Rekap belum aktif — endpoint Google Sheet belum diatur.')
      setLoading(false)
      return
    }
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`${ENDPOINT}?form=lomba`, { method: 'GET' })
      const json = await res.json()
      setRows(Array.isArray(json?.data) ? json.data : [])
    } catch {
      setError('Gagal memuat data. Cek koneksi lalu coba lagi.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    trackEvent('open_rekap_lomba')
    load()
  }, [load])

  const stats = useMemo(() => {
    const rumah = new Set()
    let pendaftaran = 0
    for (const r of rows) {
      rumah.add(`${r.blok}-${r.nomorRumah}`)
      pendaftaran += Array.isArray(r.lomba) ? r.lomba.length : 0
    }
    return { peserta: rows.length, rumah: rumah.size, pendaftaran }
  }, [rows])

  // Peserta per lomba, urut dari yang paling ramai
  const perLomba = useMemo(() => {
    return LOMBA_LIST.map((l) => {
      const peserta = rows.filter((r) => Array.isArray(r.lomba) && r.lomba.includes(l.key))
      return { ...l, peserta, grupUmur: groupByUmur(peserta) }
    }).sort((a, b) => b.peserta.length - a.peserta.length)
  }, [rows])

  const maxPeserta = Math.max(1, ...perLomba.map((l) => l.peserta.length))

  // Gabungkan master rumah dengan data pendaftaran
  const perRumah = useMemo(() => {
    const map = {}
    for (const r of rows) {
      const key = `${r.blok}-${r.nomorRumah}`
      if (!map[key]) map[key] = []
      map[key].push(r)
    }
    return getAttendanceHouses().map((h) => ({
      ...h,
      peserta: map[`${h.blok}-${h.nomorRumah}`] || [],
    }))
  }, [rows])

  const rumahSudah = perRumah.filter((h) => h.peserta.length > 0)
  const rumahBelum = perRumah.filter((h) => h.peserta.length === 0)

  // Peserta yang ikut pentas seni — buat nyusun rundown acara
  const pentasSeni = useMemo(
    () => rows.filter((r) => Array.isArray(r.lomba) && r.lomba.includes('pentas')),
    [rows]
  )

  function handleShare() {
    let msg = `🏆 *Rekap Pendaftaran Lomba 17-an*\n📅 ${LOMBA_EVENT.dateLabel}\n\n`
    msg += `👥 ${stats.peserta} peserta dari ${stats.rumah} rumah\n`
    msg += `📝 ${stats.pendaftaran} pendaftaran lomba\n\n`
    msg += `*Peserta per lomba:*\n`
    for (const l of perLomba) {
      msg += `• ${l.label}: ${l.peserta.length} orang\n`
    }
    msg += `\n⬜ Belum daftar: ${rumahBelum.length} rumah\n`
    msg += closed
      ? `\nPendaftaran sudah ditutup ${LOMBA_EVENT.deadlineLabel}. Rekap lengkapnya di:\nhttps://ipl-talago.netlify.app/rekap-lomba`
      : `\nDaftar sampai ${LOMBA_EVENT.deadlineLabel} di:\nhttps://ipl-talago.netlify.app/lomba`
    trackEvent('share_rekap_lomba')
    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank', 'noopener,noreferrer')
  }

  function PesertaRow({ r }) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 border-t-2 border-slate-dark/10">
        <span
          className="flex-shrink-0 w-9 text-center font-heading font-black text-[10px] text-white border-2 border-slate-dark rounded px-1 py-0.5"
          style={{ backgroundColor: BLOCK_BAR_COLORS[r.blok] || '#1E293B' }}
        >
          {r.blok}-{r.nomorRumah}
        </span>
        <span className="flex-1 min-w-0 font-heading font-bold text-sm truncate">{r.nama}</span>
        <span className="font-body text-[11px] text-slate-dark/50 flex-shrink-0">
          {r.peran}
          {r.umur !== '' && r.umur != null && ` · ${r.umur} th`}
        </span>
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-dvh animate-pop-in">
      <div className="sticky top-0 z-10 bg-cream/90 backdrop-blur-md border-b-2 border-slate-dark/10 safe-x px-4 py-3 flex items-center gap-3">
        <Link
          to="/lomba"
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
          <span className="font-heading font-bold text-sm text-slate-dark/50">Rekap Lomba</span>
        </div>
        <button
          onClick={load}
          disabled={loading}
          className="p-1.5 disabled:opacity-40"
          aria-label="Muat ulang"
        >
          <RefreshCw
            size={18}
            strokeWidth={2.5}
            className={`text-orange ${loading ? 'animate-spin' : ''}`}
          />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto safe-x">
        <div className="max-w-lg mx-auto px-4 py-6 space-y-5">

          {/* Statistik */}
          <div className="grid grid-cols-3 gap-2 animate-slide-up stagger-1">
            {[
              { n: stats.pendaftaran, label: 'Pendaftaran', cls: 'bg-orange text-white' },
              { n: stats.peserta, label: 'Peserta', cls: 'bg-violet text-white' },
              { n: stats.rumah, label: 'Rumah', cls: 'bg-green text-white' },
            ].map((s) => (
              <div
                key={s.label}
                className={`${s.cls} border-2 border-slate-dark rounded-2xl shadow-hard px-3 py-4 text-center`}
              >
                <div className="font-heading font-black text-2xl leading-none">{s.n}</div>
                <div className="font-heading font-bold text-[10px] uppercase tracking-wider opacity-80 mt-1">
                  {s.label}
                </div>
              </div>
            ))}
          </div>

          {loading && (
            <div className="flex items-center justify-center gap-2 py-10">
              <Loader2 size={20} strokeWidth={2.5} className="animate-spin text-orange" />
              <span className="font-heading font-bold text-sm text-slate-dark/60">Memuat…</span>
            </div>
          )}

          {error && !loading && (
            <p className="font-body text-sm text-red-500 bg-red-50 border-2 border-red-200 rounded-xl px-3 py-2">
              {error}
            </p>
          )}

          {!loading && !error && rows.length === 0 && (
            <div className="bg-white border-2 border-slate-dark rounded-3xl shadow-hard p-6 text-center">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-cream border-2 border-slate-dark mb-3">
                <Trophy size={26} strokeWidth={2.5} className="text-orange" />
              </div>
              <h2 className="font-heading font-black text-lg mb-1">Belum ada yang daftar</h2>
              <p className="font-body text-sm text-slate-dark/60 mb-4">
                {closed
                  ? `Pendaftaran sudah ditutup ${LOMBA_EVENT.deadlineLabel}.`
                  : 'Jadilah yang pertama daftarin keluarga.'}
              </p>
              {!closed && (
                <Link
                  to="/lomba"
                  className="
                    inline-flex items-center justify-center gap-2
                    bg-orange text-white font-heading font-extrabold text-sm
                    border-2 border-slate-dark rounded-2xl px-5 py-3 shadow-hard
                    active:translate-x-[1px] active:translate-y-[1px] active:shadow-hard-sm
                    transition-all
                  "
                >
                  <Trophy size={15} strokeWidth={2.5} />
                  Daftar Lomba
                </Link>
              )}
            </div>
          )}

          {!loading && !error && rows.length > 0 && (
            <>
              {/* Tab */}
              <div className="flex gap-2">
                {TABS.map((t) => (
                  <button
                    key={t.key}
                    onClick={() => setTab(t.key)}
                    className={`
                      flex-1 border-2 border-slate-dark rounded-full px-4 py-2
                      font-heading font-bold text-sm transition-all
                      ${tab === t.key ? 'bg-slate-dark text-cream shadow-hard-sm' : 'bg-white hover:bg-cream'}
                    `}
                  >
                    {t.label}
                  </button>
                ))}
              </div>

              {tab === 'lomba' && (
                <div className="flex items-center gap-2">
                  <span className="font-heading font-bold text-[10px] uppercase tracking-wider text-slate-dark/40 flex-shrink-0">
                    Tampilkan
                  </span>
                  <div className="flex gap-1.5">
                    {URUT_OPTIONS.map((o) => (
                      <button
                        key={o.key}
                        onClick={() => {
                          setUrut(o.key)
                          trackEvent('rekap_lomba_tampilan', { mode: o.key })
                        }}
                        className={`
                          border-2 border-slate-dark rounded-full px-3 py-1
                          font-heading font-bold text-[11px] transition-all
                          ${
                            urut === o.key
                              ? 'bg-violet text-white shadow-hard-sm'
                              : 'bg-white text-slate-dark/60 hover:bg-cream'
                          }
                        `}
                      >
                        {o.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {tab === 'lomba' && (
                <div className="bg-white border-2 border-slate-dark rounded-3xl shadow-hard overflow-hidden animate-slide-up">
                  {perLomba.map((l, i) => {
                    const terbuka = openLomba === l.key
                    const pct = Math.round((l.peserta.length / maxPeserta) * 100)
                    return (
                      <div key={l.key} className={i > 0 ? 'border-t-2 border-slate-dark/10' : ''}>
                        <button
                          onClick={() => setOpenLomba(terbuka ? null : l.key)}
                          className="w-full px-4 py-3 text-left hover:bg-cream transition-colors"
                        >
                          <div className="flex items-baseline gap-2 mb-1.5">
                            <span className="flex-1 font-heading font-bold text-sm leading-snug">
                              {l.label}
                            </span>
                            <span className="font-heading font-black text-base text-orange flex-shrink-0">
                              {l.peserta.length}
                            </span>
                            <ChevronDown
                              size={16}
                              strokeWidth={2.5}
                              className={`text-slate-dark/40 flex-shrink-0 transition-transform ${
                                terbuka ? 'rotate-180' : ''
                              }`}
                            />
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="flex-1 h-2.5 bg-cream border-2 border-slate-dark rounded-full overflow-hidden">
                              <div
                                className="h-full bg-orange transition-all duration-500"
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                            <span className="font-heading font-bold text-[10px] uppercase tracking-wider text-slate-dark/40 flex-shrink-0">
                              {l.kategori}
                            </span>
                          </div>
                          {urut === 'umur' && l.grupUmur.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-1.5">
                              {l.grupUmur.map((g) => (
                                <span
                                  key={g.key}
                                  className="font-heading font-bold text-[10px] bg-violet/15 text-violet border-2 border-violet/20 rounded-full px-2 py-0.5"
                                >
                                  {g.label} {g.peserta.length}
                                </span>
                              ))}
                            </div>
                          )}
                        </button>

                        {terbuka && (
                          <div className="bg-cream/50 pb-2">
                            {l.peserta.length === 0 ? (
                              <p className="px-4 py-3 font-body text-sm text-slate-dark/50 border-t-2 border-slate-dark/10">
                                Belum ada peserta.
                              </p>
                            ) : urut === 'umur' ? (
                              l.grupUmur.map((g) => (
                                <div key={g.key}>
                                  <div className="flex items-baseline gap-2 px-3 py-1.5 border-t-2 border-slate-dark/10 bg-violet/10">
                                    <span className="font-heading font-black text-[11px] uppercase tracking-wider text-violet">
                                      {g.label}
                                    </span>
                                    {g.note && (
                                      <span className="font-body text-[10px] text-slate-dark/40">
                                        {g.note}
                                      </span>
                                    )}
                                    <span className="flex-1" />
                                    <span className="font-heading font-black text-[11px] text-slate-dark/50">
                                      {g.peserta.length}
                                    </span>
                                  </div>
                                  {g.peserta.map((r, j) => (
                                    <PesertaRow
                                      key={`${r.blok}-${r.nomorRumah}-${r.nama}-${j}`}
                                      r={r}
                                    />
                                  ))}
                                </div>
                              ))
                            ) : (
                              l.peserta.map((r, j) => (
                                <PesertaRow key={`${r.blok}-${r.nomorRumah}-${r.nama}-${j}`} r={r} />
                              ))
                            )}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}

              {tab === 'rumah' && (
                <div className="space-y-4 animate-slide-up">
                  <div className="bg-white border-2 border-slate-dark rounded-3xl shadow-hard overflow-hidden">
                    <div className="flex items-center gap-2 px-4 py-3 border-b-2 border-slate-dark bg-green/15">
                      <CheckCircle2 size={16} strokeWidth={2.5} className="text-green" />
                      <span className="font-heading font-bold text-sm flex-1">Sudah daftar</span>
                      <span className="font-heading font-black text-sm">{rumahSudah.length}</span>
                    </div>
                    {rumahSudah.map((h) => (
                      <div key={`${h.blok}-${h.nomorRumah}`} className="border-t-2 border-slate-dark/10 px-4 py-3">
                        <div className="flex items-center gap-2 mb-1.5">
                          <span
                            className="flex-shrink-0 font-heading font-black text-[10px] text-white border-2 border-slate-dark rounded px-1.5 py-0.5"
                            style={{ backgroundColor: BLOCK_BAR_COLORS[h.blok] || '#1E293B' }}
                          >
                            {h.blok}-{h.nomorRumah}
                          </span>
                          <span className="flex-1 min-w-0 font-heading font-bold text-sm truncate">
                            {h.namaPemilik}
                          </span>
                          <span className="font-body text-[11px] text-slate-dark/50 flex-shrink-0">
                            {h.peserta.length} peserta
                          </span>
                        </div>
                        <ul className="space-y-1 pl-1">
                          {h.peserta.map((r, j) => (
                            <li key={j} className="font-body text-xs text-slate-dark/70 leading-snug">
                              <span className="font-bold text-slate-dark">{r.nama}</span>
                              {r.umur !== '' && r.umur != null && ` (${r.umur} th)`} —{' '}
                              {(r.lomba || []).map((k) => LOMBA_BY_KEY[k]?.label || k).join(', ') ||
                                'belum pilih lomba'}
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>

                  <div className="bg-white border-2 border-slate-dark rounded-3xl shadow-hard overflow-hidden">
                    <div className="flex items-center gap-2 px-4 py-3 border-b-2 border-slate-dark bg-cream">
                      <Circle size={16} strokeWidth={2.5} className="text-slate-dark/30" />
                      <span className="font-heading font-bold text-sm flex-1">Belum daftar</span>
                      <span className="font-heading font-black text-sm">{rumahBelum.length}</span>
                    </div>
                    <div className="px-4 py-3 flex flex-wrap gap-1.5">
                      {rumahBelum.map((h) => (
                        <span
                          key={`${h.blok}-${h.nomorRumah}`}
                          className="font-heading font-bold text-[11px] bg-cream border-2 border-slate-dark/20 rounded-full px-2.5 py-1 text-slate-dark/60"
                        >
                          {h.blok}-{h.nomorRumah}
                        </span>
                      ))}
                      {rumahBelum.length === 0 && (
                        <span className="font-body text-sm text-slate-dark/50">
                          Semua rumah sudah daftar 🎉
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Rundown pentas seni */}
              {pentasSeni.length > 0 && (
                <div className="bg-white border-2 border-slate-dark rounded-3xl shadow-hard overflow-hidden animate-slide-up">
                  <div className="flex items-center gap-2 px-4 py-3 border-b-2 border-slate-dark bg-violet/15">
                    <Sparkles size={16} strokeWidth={2.5} className="text-violet" />
                    <span className="font-heading font-bold text-sm flex-1">Pentas Seni</span>
                    <span className="font-heading font-black text-sm">{pentasSeni.length}</span>
                  </div>
                  {pentasSeni.map((r, j) => (
                    <div
                      key={`pentas-${j}`}
                      className="border-t-2 border-slate-dark/10 px-4 py-2.5 flex items-center gap-2"
                    >
                      <span
                        className="flex-shrink-0 font-heading font-black text-[10px] text-white border-2 border-slate-dark rounded px-1.5 py-0.5"
                        style={{ backgroundColor: BLOCK_BAR_COLORS[r.blok] || '#1E293B' }}
                      >
                        {r.blok}-{r.nomorRumah}
                      </span>
                      <span className="font-heading font-bold text-sm flex-shrink-0">{r.nama}</span>
                      <span className="flex-1 min-w-0 font-body text-xs text-slate-dark/60 truncate text-right">
                        {r.detailPentas || '—'}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={handleShare}
                  className="
                    inline-flex items-center justify-center gap-1.5
                    bg-green text-white border-2 border-slate-dark rounded-2xl px-4 py-3
                    font-heading font-bold text-sm shadow-hard
                    active:translate-x-[1px] active:translate-y-[1px] active:shadow-hard-sm
                    transition-all
                  "
                >
                  <Share2 size={15} strokeWidth={2.5} />
                  Bagikan
                </button>
                <Link
                  to="/lomba"
                  className="
                    inline-flex items-center justify-center gap-1.5
                    bg-orange text-white border-2 border-slate-dark rounded-2xl px-4 py-3
                    font-heading font-bold text-sm shadow-hard
                    active:translate-x-[1px] active:translate-y-[1px] active:shadow-hard-sm
                    transition-all
                  "
                >
                  <Trophy size={15} strokeWidth={2.5} />
                  {closed ? 'Info Lomba' : 'Daftar'}
                </Link>
              </div>
            </>
          )}

          <p className="font-body text-[11px] text-slate-dark/40 text-center flex items-center justify-center gap-1.5">
            <ClipboardList size={12} strokeWidth={2.5} />
            Nomor WhatsApp tidak ditampilkan di halaman ini.
          </p>
        </div>
      </div>

      <div className="safe-bottom" />
    </div>
  )
}
