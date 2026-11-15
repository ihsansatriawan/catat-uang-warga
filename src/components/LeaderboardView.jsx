import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, Activity, MessageCircle, ChevronRight } from 'lucide-react'
import { getComplexSummary, getHousesByBlock, formatRupiah, getLastUpdated } from '../data/helpers'
import { trackEvent } from '../utils/tracking'
import { BLOCK_BAR_COLORS } from '../data/constants'

// "sesuai" disembunyikan di Desember karena identik dengan "lengkap".
const STATUSES = [
    { key: 'lengkap', label: 'Lengkap 12 bulan', tile: 'bg-green' },
    { key: 'sesuai', label: 'Sesuai jadwal', tile: 'bg-[#86EFAC]' },
    { key: 'belumSesuai', label: 'Belum sesuai jadwal', tile: 'bg-yellow' },
    { key: 'belum', label: 'Belum ada pembayaran', tile: 'bg-white' },
]
const STATUS_BY_KEY = Object.fromEntries(STATUSES.map((s) => [s.key, s]))

const MONTH_NAMES = ['', 'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember']

const sameHouse = (a, b) => a && b && a.blok === b.blok && a.nomorRumah === b.nomorRumah

export default function LeaderboardView() {
    const [filter, setFilter] = useState(null)
    const [selected, setSelected] = useState(null)

    useEffect(() => {
        trackEvent('open_leaderboard')
    }, [])

    const summary = getComplexSummary()
    const blocks = getHousesByBlock()
    const { counts, currentMonth } = summary
    const visibleStatuses = STATUSES.filter((s) => s.key !== 'sesuai' || currentMonth < 12)

    const lastUpdatedRaw = getLastUpdated()
    const lastUpdateText = lastUpdatedRaw
        ? new Date(lastUpdatedRaw).toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
        })
        : null

    // Lingkaran progres
    const R = 54
    const CIRC = 2 * Math.PI * R
    const offset = CIRC * (1 - summary.collectionPct / 100)

    const toggleFilter = (key) => setFilter((f) => (f === key ? null : key))
    const toggleHouse = (house) => setSelected((s) => (sameHouse(s, house) ? null : house))

    return (
        <div className="flex flex-col min-h-dvh animate-pop-in">
            {/* Sticky top bar */}
            <div className="sticky top-0 z-10 bg-cream/90 backdrop-blur-md border-b-2 border-slate-dark/10 safe-x px-4 py-3 flex items-center gap-3">
                <Link
                    to="/"
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
                        Kondisi IPL
                    </span>
                </div>
                <Activity size={20} strokeWidth={2.5} className="text-violet" />
            </div>

            <div className="flex-1 safe-x">
                <div className="max-w-lg mx-auto px-4 py-6 space-y-5">

                    {/* Title */}
                    <div className="px-1 animate-slide-up stagger-1">
                        <h1 className="font-heading font-extrabold text-2xl leading-tight">Kondisi IPL 2026</h1>
                        <p className="font-body text-sm text-slate-dark/50 mt-1">
                            Gambaran pembayaran IPL seluruh komplek
                        </p>
                    </div>

                    {/* Complex summary */}
                    <div className="bg-white border-2 border-slate-dark rounded-3xl shadow-hard p-4 flex items-center gap-4 animate-slide-up stagger-1">
                        <svg width="130" height="130" viewBox="0 0 130 130" className="flex-shrink-0" role="img" aria-label={`${summary.collectionPct}% terkumpul`}>
                            <circle cx="65" cy="65" r={R} fill="none" stroke="#FFFDF5" strokeWidth="16" />
                            <circle
                                cx="65" cy="65" r={R} fill="none" stroke="#8B5CF6" strokeWidth="16"
                                strokeLinecap="round" strokeDasharray={CIRC} strokeDashoffset={offset}
                                transform="rotate(-90 65 65)"
                            />
                            <text x="65" y="64" textAnchor="middle" fontSize="30" fontWeight="800" className="font-heading" fill="#1E293B">
                                {summary.collectionPct}%
                            </text>
                            <text x="65" y="82" textAnchor="middle" fontSize="10" fill="#64748b">terkumpul</text>
                        </svg>
                        <div className="min-w-0">
                            <p className="font-heading font-bold text-lg leading-tight">{formatRupiah(summary.totalCollected)}</p>
                            <p className="font-body text-xs text-slate-dark/50">dari target {formatRupiah(summary.totalTarget)}</p>
                            <p className="font-body text-xs mt-2 leading-relaxed">
                                Sekarang <b>bulan ke-{currentMonth}</b> dari 12
                                {currentMonth > 0 && <><br />Selaras jadwal ≈ <b>{summary.expectedPct}%</b></>}
                            </p>
                        </div>
                    </div>

                    {/* Status tiles (also act as filter) */}
                    <div className="grid grid-cols-2 gap-2 animate-slide-up stagger-2">
                        {visibleStatuses.map((s) => {
                            const active = filter === s.key
                            return (
                                <button
                                    key={s.key}
                                    type="button"
                                    onClick={() => toggleFilter(s.key)}
                                    aria-pressed={active}
                                    className={`
                    flex items-center gap-3 text-left border-2 border-slate-dark rounded-2xl px-3 py-2.5
                    transition-all duration-150
                    ${active ? 'bg-slate-dark text-white' : 'bg-white'}
                    ${filter && !active ? 'opacity-45' : ''}
                  `}
                                >
                                    <span className={`w-3.5 h-3.5 rounded border-[1.5px] border-slate-dark flex-shrink-0 ${s.tile}`} />
                                    <span>
                                        <span className="block font-heading font-extrabold text-xl leading-none">{counts[s.key]}</span>
                                        <span className="block font-body text-[11px] mt-0.5">{s.label}</span>
                                    </span>
                                </button>
                            )
                        })}
                    </div>

                    {/* House status map */}
                    <div className="bg-white border-2 border-slate-dark rounded-3xl shadow-hard overflow-hidden animate-slide-up stagger-3">
                        <div className="px-5 py-4 border-b-2 border-slate-dark flex items-center gap-2">
                            <h2 className="font-heading font-bold text-base">Status Tiap Rumah</h2>
                            <span className="ml-auto font-body text-xs text-slate-dark/40">angka = bulan terbayar</span>
                        </div>

                        <div className="p-4 space-y-4">
                            <p className="font-body text-xs text-slate-dark/60 leading-relaxed">
                                <b>Sesuai jadwal</b> = pembayaran sudah sampai bulan berjalan
                                {currentMonth > 0 && <> ({MONTH_NAMES[currentMonth]})</>}.
                                Ketuk kotak status di atas untuk menyorot, ketuk rumah untuk melihat detail.
                            </p>

                            {blocks.map((block) => (
                                <div key={block.blok}>
                                    <div className="flex items-center gap-2 mb-2">
                                        <span
                                            className={`w-[22px] h-[22px] rounded-lg border-2 border-slate-dark flex items-center justify-center font-heading font-extrabold text-[11px] ${block.blok === 'C' ? 'text-slate-dark' : 'text-white'}`}
                                            style={{ backgroundColor: BLOCK_BAR_COLORS[block.blok] }}
                                        >
                                            {block.blok}
                                        </span>
                                        <h3 className="font-heading font-bold text-sm">Blok {block.blok}</h3>
                                        <span className="ml-auto font-body text-xs text-slate-dark/50">
                                            {block.lengkapCount} dari {block.totalHouses} rumah lengkap 12 bln
                                        </span>
                                    </div>

                                    <div className="grid grid-cols-5 gap-1.5">
                                        {block.houses.map((house) => {
                                            const dimmed = filter && filter !== house.status
                                            return (
                                                <button
                                                    key={house.nomorRumah}
                                                    type="button"
                                                    onClick={() => toggleHouse(house)}
                                                    aria-label={`Rumah ${house.blok}-${house.nomorRumah}, ${STATUS_BY_KEY[house.status].label}`}
                                                    className={`
                            border-2 border-slate-dark rounded-[10px] py-1.5 text-center
                            font-heading font-bold text-[11px] leading-tight transition-all duration-150
                            ${STATUS_BY_KEY[house.status].tile}
                            ${dimmed ? 'opacity-20' : ''}
                            ${sameHouse(selected, house) ? 'outline-3 outline-violet outline-offset-1' : ''}
                          `}
                                                >
                                                    {house.nomorRumah}
                                                    <span className="block font-body font-semibold text-[9px] opacity-75">
                                                        {house.monthsPaid} bln
                                                    </span>
                                                </button>
                                            )
                                        })}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Selected house detail — sticks to the bottom so it's visible from any tile */}
                    {selected && (
                        <Link
                            to={`/warga/${selected.blok}/${selected.nomorRumah}`}
                            className="sticky bottom-4 z-10 flex items-center gap-3 bg-white border-2 border-slate-dark rounded-2xl shadow-hard px-3 py-2.5 animate-pop-in"
                        >
                            <span
                                className={`px-2 py-0.5 rounded-lg border-2 border-slate-dark font-heading font-bold text-xs flex-shrink-0 ${selected.blok === 'C' ? 'text-slate-dark' : 'text-white'}`}
                                style={{ backgroundColor: BLOCK_BAR_COLORS[selected.blok] }}
                            >
                                {selected.blok}-{selected.nomorRumah}
                            </span>
                            <div className="flex-1 min-w-0">
                                <p className="font-heading font-bold text-sm truncate">{selected.namaPemilik}</p>
                                <p className="font-body text-xs text-slate-dark/50">
                                    {selected.monthsPaid}/12 bln · {formatRupiah(selected.totalPaid)} · {STATUS_BY_KEY[selected.status].label}
                                </p>
                            </div>
                            <span className="flex items-center font-heading font-bold text-xs text-violet flex-shrink-0">
                                Detail <ChevronRight size={14} strokeWidth={2.5} />
                            </span>
                        </Link>
                    )}

                    {/* Help/Report Data section */}
                    <div className="animate-fade-in stagger-3 flex flex-col items-center bg-cream/50 rounded-2xl py-4 px-4 border-2 border-transparent mt-4">
                        <p className="font-body text-sm text-center text-slate-dark/60 mb-2 font-semibold">
                            Ada data yang tidak sesuai?
                        </p>
                        <a
                            href={`https://wa.me/628111719913?text=${encodeURIComponent('Halo Pengurus, saya mengecek data di halaman Kondisi IPL dan sepertinya ada data yang kurang sesuai. Mohon bantuannya untuk dilakukan pengecekan.')}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="
                                flex items-center justify-center gap-2 w-full max-w-[280px]
                                bg-green text-white font-heading font-bold
                                border-2 border-slate-dark rounded-full px-5 py-2.5
                                shadow-hard-sm text-sm
                                hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-hard
                                active:translate-x-0 active:translate-y-0 active:shadow-none
                                transition-all duration-150
                            "
                        >
                            <MessageCircle size={16} strokeWidth={2.5} />
                            Hubungi via WhatsApp
                        </a>
                    </div>

                    {/* Last updated */}
                    {lastUpdateText && (
                        <div className="text-center animate-fade-in stagger-4 mt-2">
                            <p className="font-body text-xs text-slate-dark/40">
                                Data diperbarui: <span className="font-semibold text-slate-dark/60">{lastUpdateText}</span>
                            </p>
                        </div>
                    )}

                </div>
            </div>

            {/* Bottom safe area */}
            <div className="safe-bottom bg-cream" />
        </div>
    )
}
