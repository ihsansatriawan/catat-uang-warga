import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Search, Home, MapPin, Calendar, Trophy } from 'lucide-react'
import { getAvailableBlocks, getLastUpdated } from '../data/helpers'
import { BLOCK_COLORS, BLOCK_COLORS_UNSELECTED } from '../data/constants'

export default function SearchView({ onSearch }) {
  const [blok, setBlok] = useState('')
  const [nomorRumah, setNomorRumah] = useState('')

  const handleSubmit = (e) => {
    e.preventDefault()
    if (blok && nomorRumah) {
      onSearch(blok, nomorRumah)
    }
  }

  const blocks = getAvailableBlocks()

  const lastUpdatedRaw = getLastUpdated()
  const lastUpdateText = lastUpdatedRaw
    ? new Date(lastUpdatedRaw).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })
    : null

  return (
    <div className="flex flex-col min-h-dvh safe-x">
      {/* Top decoration strip */}
      <div className="h-1.5 w-full bg-linear-to-r from-violet via-pink to-yellow" />

      {/* Main content — scrollable, centered vertically on tall screens */}
      <div className="flex-1 flex flex-col items-center justify-center py-10 px-4">

        {/* Badge */}
        <div className="animate-pop-in mb-6">
          <span className="inline-flex items-center gap-1.5 bg-yellow border-2 border-slate-dark rounded-full px-4 py-1 font-heading font-bold text-sm shadow-hard-sm">
            <Home size={14} strokeWidth={2.5} />
            IPL D'talago Regency
          </span>
        </div>

        {/* Hero heading */}
        <div className="text-center mb-6 animate-slide-up stagger-1">
          <h1 className="font-heading text-4xl sm:text-5xl md:text-6xl font-black text-slate-dark leading-tight mb-3">
            Cek Status<br />
            <span className="relative inline-block">
              Pembayaran
              <svg
                className="absolute -bottom-1 left-0 w-full"
                height="8"
                viewBox="0 0 100 8"
                preserveAspectRatio="none"
              >
                <path
                  d="M0 4 Q 12.5 0, 25 4 T 50 4 T 75 4 T 100 4"
                  fill="none"
                  stroke="#8B5CF6"
                  strokeWidth="3"
                  strokeLinecap="round"
                />
              </svg>
            </span>
          </h1>
          <p className="font-body text-base text-slate-dark/60 max-w-xs mx-auto">
            Pilih blok dan nomor rumah kamu untuk melihat status IPL
          </p>
        </div>

        {/* Info Hint - Relocated above search card for better visibility on mobile */}
        <div className="mb-6 animate-fade-in stagger-2 flex justify-center">
          <div className="inline-flex items-center gap-2 bg-white/50 border-2 border-slate-dark/10 rounded-full px-4 py-2 shadow-sm backdrop-blur-sm">
            <Calendar size={14} strokeWidth={2.5} className="text-violet flex-shrink-0" />
            <p className="font-body text-[10px] leading-tight text-slate-dark/60">
              Data diperbarui berkala oleh pengelola
              {lastUpdateText && (
                <>
                  <br />
                  <span className="font-semibold text-slate-dark/80 underline decoration-violet/30 underline-offset-2">Terakhir: {lastUpdateText}</span>
                </>
              )}
            </p>
          </div>
        </div>

        {/* Search Card */}
        <form
          onSubmit={handleSubmit}
          className="bg-white border-2 border-slate-dark rounded-3xl shadow-hard w-full max-w-sm animate-slide-up stagger-3"
        >
          {/* Card header */}
          <div className="flex items-center gap-2 px-5 pt-5 pb-3 border-b-2 border-slate-dark/10">
            <MapPin size={18} strokeWidth={2.5} className="text-violet" />
            <span className="font-heading font-bold text-sm">Lokasi Rumah</span>
          </div>

          <div className="p-5 space-y-5">
            {/* Block selector — tap grid */}
            <div>
              <label className="font-heading font-bold text-xs uppercase tracking-wider text-slate-dark/50 mb-3 block">
                Pilih Blok
              </label>
              <div className="grid grid-cols-3 gap-2">
                {blocks.map((b) => (
                  <button
                    key={b}
                    type="button"
                    onClick={() => setBlok(b)}
                    className={`
                      border-2 rounded-xl py-3 font-heading font-extrabold text-lg
                      transition-all duration-150 shadow-hard-sm
                      active:translate-x-[2px] active:translate-y-[2px] active:shadow-none
                      ${blok === b
                        ? `${BLOCK_COLORS[b]} shadow-hard`
                        : BLOCK_COLORS_UNSELECTED[b]
                      }
                    `}
                  >
                    {b}
                  </button>
                ))}
              </div>
            </div>

            {/* House number — number pad style */}
            <div>
              <label className="font-heading font-bold text-xs uppercase tracking-wider text-slate-dark/50 mb-2 block">
                Nomor Rumah <span className="text-slate-dark/30 normal-case">(1–15)</span>
              </label>
              <input
                type="number"
                inputMode="numeric"
                pattern="[0-9]*"
                min="1"
                max="15"
                value={nomorRumah}
                onChange={(e) => setNomorRumah(e.target.value)}
                placeholder="Masukkan nomor…"
                className="
                  w-full border-2 border-slate-dark rounded-xl px-4 py-3
                  font-heading text-xl font-bold bg-cream
                  focus:outline-none focus:ring-2 focus:ring-violet focus:ring-offset-2
                  placeholder:text-slate-dark/20 placeholder:font-normal placeholder:text-base
                "
              />
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={!blok || !nomorRumah}
              className="
                w-full bg-violet text-white font-heading font-extrabold text-lg
                border-2 border-slate-dark rounded-2xl px-6 py-4
                shadow-hard
                hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-hard-lg
                active:translate-x-0 active:translate-y-0 active:shadow-hard-sm
                transition-all duration-150
                disabled:opacity-40 disabled:cursor-not-allowed disabled:translate-x-0 disabled:translate-y-0 disabled:shadow-hard
                flex items-center justify-center gap-2
              "
            >
              <Search size={20} strokeWidth={2.5} />
              Cari Sekarang
            </button>
          </div>
        </form>

        {/* Leaderboard link */}
        <div className="mt-4 animate-fade-in stagger-4">
          <Link
            to="/leaderboard"
            className="
              inline-flex items-center gap-2
              font-heading font-bold text-sm text-slate-dark/60
              hover:text-violet transition-colors
            "
          >
            <Trophy size={16} strokeWidth={2.5} />
            Lihat Leaderboard
          </Link>
        </div>

      </div>

      {/* Bottom safe area spacer */}
      <div className="safe-bottom" />
    </div>
  )
}
