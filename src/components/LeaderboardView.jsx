import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, Trophy, Home, ChevronDown, ChevronUp, MessageCircle } from 'lucide-react'
import { getBlockLeaderboard, getHouseLeaderboard, getAvailableBlocks, formatRupiah, getLastUpdated } from '../data/helpers'
import { BLOCK_COLORS, BLOCK_COLORS_UNSELECTED, BLOCK_BAR_COLORS } from '../data/constants'

export default function LeaderboardView() {
    const [selectedBlok, setSelectedBlok] = useState('')
    const [showBelumBayar, setShowBelumBayar] = useState(false)

    const blockLeaderboard = getBlockLeaderboard()
    const houseLeaderboard = getHouseLeaderboard(selectedBlok || undefined)
    const blocks = getAvailableBlocks()

    const paidHouses = houseLeaderboard.filter((h) => h.totalPaid > 0)
    const unpaidHouses = houseLeaderboard.filter((h) => h.totalPaid === 0)

    const lastUpdatedRaw = getLastUpdated()
    const lastUpdateText = lastUpdatedRaw
        ? new Date(lastUpdatedRaw).toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
        })
        : null

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
                        Leaderboard
                    </span>
                </div>
                <Trophy size={20} strokeWidth={2.5} className="text-yellow" />
            </div>

            {/* Scrollable content */}
            <div className="flex-1 overflow-y-auto safe-x">
                <div className="max-w-lg mx-auto px-4 py-6 space-y-5">

                    {/* Block Ranking Section */}
                    <div className="bg-white border-2 border-slate-dark rounded-3xl shadow-hard overflow-hidden animate-slide-up stagger-1">
                        <div className="px-5 py-4 border-b-2 border-slate-dark flex items-center gap-2">
                            <span className="text-lg">🏆</span>
                            <h2 className="font-heading font-bold text-base">Ranking Blok</h2>
                            <span className="ml-auto font-body text-xs text-slate-dark/40">% rumah lunas</span>
                        </div>

                        <div className="p-4 space-y-3">
                            {blockLeaderboard.map((block, i) => (
                                <div key={block.blok} className="flex items-center gap-2">
                                    {/* Rank medal or number */}
                                    <span className="w-6 text-center font-heading font-bold text-sm flex-shrink-0">
                                        {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}`}
                                    </span>

                                    {/* Block letter */}
                                    <span
                                        className="w-8 h-8 rounded-lg border-2 border-slate-dark flex items-center justify-center font-heading font-extrabold text-sm flex-shrink-0 text-white"
                                        style={{ backgroundColor: BLOCK_BAR_COLORS[block.blok] }}
                                    >
                                        {block.blok}
                                    </span>

                                    {/* Bar */}
                                    <div className="flex-1 h-7 bg-cream border-2 border-slate-dark rounded-lg overflow-hidden relative">
                                        <div
                                            className="h-full rounded-lg progress-bar"
                                            style={{
                                                '--progress-width': `${block.lunasPct}%`,
                                                backgroundColor: BLOCK_BAR_COLORS[block.blok],
                                            }}
                                        />
                                        <span className="absolute right-2 top-1/2 -translate-y-1/2 font-heading font-bold text-xs text-slate-dark">
                                            {block.lunasPct}%
                                        </span>
                                    </div>

                                    {/* House count */}
                                    <span className="font-body text-xs text-slate-dark/50 w-12 text-right flex-shrink-0">
                                        {block.lunasCount}/{block.totalHouses} 🏠
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* House Ranking Section */}
                    <div className="bg-white border-2 border-slate-dark rounded-3xl shadow-hard overflow-hidden animate-slide-up stagger-2">
                        <div className="px-5 py-4 border-b-2 border-slate-dark flex items-center gap-2">
                            <span className="text-lg">🏠</span>
                            <h2 className="font-heading font-bold text-base">Ranking Per Rumah</h2>
                        </div>

                        {/* Block filter chips */}
                        <div className="px-5 py-3 border-b border-slate-dark/10 flex gap-2 overflow-x-auto">
                            <button
                                onClick={() => setSelectedBlok('')}
                                className={`
                  flex-shrink-0 border-2 rounded-full px-3 py-1 font-heading font-bold text-xs
                  transition-all duration-150
                  ${!selectedBlok
                                        ? 'bg-violet text-white border-violet shadow-hard-sm'
                                        : 'bg-white text-slate-dark border-slate-dark hover:bg-violet/10'
                                    }
                `}
                            >
                                Semua
                            </button>
                            {blocks.map((b) => (
                                <button
                                    key={b}
                                    onClick={() => setSelectedBlok(b)}
                                    className={`
                    flex-shrink-0 border-2 rounded-full px-3 py-1 font-heading font-bold text-xs
                    transition-all duration-150
                    ${selectedBlok === b
                                            ? `${BLOCK_COLORS[b]} shadow-hard-sm`
                                            : BLOCK_COLORS_UNSELECTED[b]
                                        }
                  `}
                                >
                                    {b}
                                </button>
                            ))}
                        </div>

                        {/* Paid houses list */}
                        <div>
                            {paidHouses.map((house, i) => (
                                <div
                                    key={`${house.blok}-${house.nomorRumah}`}
                                    className={`
                    flex items-center gap-3 px-5 py-3
                    ${i < paidHouses.length - 1 || unpaidHouses.length > 0 ? 'border-b border-slate-dark/10' : ''}
                  `}
                                >
                                    {/* Rank */}
                                    <span className="w-6 text-center font-heading font-bold text-sm text-slate-dark/50 flex-shrink-0">
                                        {i + 1}
                                    </span>

                                    {/* Block-house badge */}
                                    <span
                                        className="px-2 py-0.5 rounded-lg border-2 border-slate-dark font-heading font-bold text-xs text-white flex-shrink-0"
                                        style={{ backgroundColor: BLOCK_BAR_COLORS[house.blok] }}
                                    >
                                        {house.blok}-{house.nomorRumah}
                                    </span>

                                    {/* Name + secondary info */}
                                    <div className="flex-1 min-w-0">
                                        <p className="font-heading font-bold text-sm text-slate-dark truncate">
                                            {house.namaPemilik}
                                        </p>
                                        <p className="font-body text-xs text-slate-dark/40">
                                            {formatRupiah(house.totalPaid)} · {house.monthsPaid} bln
                                        </p>
                                    </div>

                                    {/* Mini progress bar */}
                                    <div className="w-16 h-3 bg-cream border border-slate-dark/20 rounded-full overflow-hidden flex-shrink-0">
                                        <div
                                            className={`h-full rounded-full ${house.isLunas ? 'bg-green' : 'bg-violet'}`}
                                            style={{ width: `${house.completionPct}%` }}
                                        />
                                    </div>

                                    {/* Percentage */}
                                    <span className={`font-heading font-bold text-xs w-10 text-right flex-shrink-0 ${house.isLunas ? 'text-green' : 'text-violet'}`}>
                                        {house.completionPct}%
                                    </span>
                                </div>
                            ))}
                        </div>

                        {/* Collapsible belum bayar section */}
                        {unpaidHouses.length > 0 && (
                            <div>
                                <button
                                    onClick={() => setShowBelumBayar(!showBelumBayar)}
                                    className="w-full flex items-center justify-between px-5 py-3 bg-cream/50 border-t border-slate-dark/10 hover:bg-cream transition-colors"
                                >
                                    <span className="font-heading font-bold text-sm text-slate-dark/50">
                                        Belum bayar ({unpaidHouses.length})
                                    </span>
                                    {showBelumBayar
                                        ? <ChevronUp size={16} strokeWidth={2.5} className="text-slate-dark/40" />
                                        : <ChevronDown size={16} strokeWidth={2.5} className="text-slate-dark/40" />
                                    }
                                </button>

                                {showBelumBayar && (
                                    <div>
                                        {unpaidHouses.map((house, i) => (
                                            <div
                                                key={`${house.blok}-${house.nomorRumah}`}
                                                className={`
                          flex items-center gap-3 px-5 py-2.5
                          ${i < unpaidHouses.length - 1 ? 'border-b border-slate-dark/5' : ''}
                        `}
                                            >
                                                <span className="w-6 flex-shrink-0" />
                                                <span
                                                    className="px-2 py-0.5 rounded-lg border-2 border-slate-dark/30 font-heading font-bold text-xs text-slate-dark/40 flex-shrink-0"
                                                >
                                                    {house.blok}-{house.nomorRumah}
                                                </span>
                                                <p className="font-body text-sm text-slate-dark/40 truncate">
                                                    {house.namaPemilik}
                                                </p>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Help/Report Data section */}
                    <div className="animate-fade-in stagger-3 flex flex-col items-center bg-cream/50 rounded-2xl py-4 px-4 border-2 border-transparent mt-4">
                        <p className="font-body text-sm text-center text-slate-dark/60 mb-2 font-semibold">
                            Ada data yang tidak sesuai?
                        </p>
                        <a
                            href={`https://wa.me/628111719913?text=${encodeURIComponent('Halo Pengurus, saya mengecek data di Leaderboard IPL dan sepertinya ada data yang kurang sesuai. Mohon bantuannya untuk dilakukan pengecekan.')}`}
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
