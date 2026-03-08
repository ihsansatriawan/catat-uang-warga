import { useState } from 'react'
import { Search } from 'lucide-react'
import { getAvailableBlocks } from '../data/helpers'

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

  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-4 animate-pop-in">
      {/* Hero Header */}
      <div className="text-center mb-8">
        <h1 className="font-heading text-5xl md:text-6xl font-extrabold text-slate-dark mb-3">
          Cek IPL Perumahan
        </h1>
        <p className="font-body text-lg text-slate-dark/70">
          Masukkan blok dan nomor rumah untuk melihat status pembayaran
        </p>
      </div>

      {/* Sticker Card Search Box */}
      <form
        onSubmit={handleSubmit}
        className="bg-white border-2 border-slate-dark rounded-2xl shadow-hard p-8 w-full max-w-md hover:animate-wiggle transition-transform"
      >
        <div className="space-y-4">
          {/* Blok Dropdown */}
          <div>
            <label className="font-heading font-bold text-sm mb-1 block">
              Blok
            </label>
            <select
              value={blok}
              onChange={(e) => setBlok(e.target.value)}
              className="w-full border-2 border-slate-dark rounded-xl px-4 py-3 font-body text-base bg-cream focus:outline-none focus:ring-2 focus:ring-violet"
            >
              <option value="">Pilih Blok...</option>
              {blocks.map((b) => (
                <option key={b} value={b}>
                  Blok {b}
                </option>
              ))}
            </select>
          </div>

          {/* Nomor Rumah Input */}
          <div>
            <label className="font-heading font-bold text-sm mb-1 block">
              Nomor Rumah
            </label>
            <input
              type="number"
              min="1"
              max="15"
              value={nomorRumah}
              onChange={(e) => setNomorRumah(e.target.value)}
              placeholder="1 - 15"
              className="w-full border-2 border-slate-dark rounded-xl px-4 py-3 font-body text-base bg-cream focus:outline-none focus:ring-2 focus:ring-violet"
            />
          </div>

          {/* Candy Button */}
          <button
            type="submit"
            disabled={!blok || !nomorRumah}
            className="w-full bg-violet text-white font-heading font-bold text-lg border-2 border-slate-dark rounded-full px-6 py-3 shadow-hard hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_0px_#1E293B] active:translate-x-0 active:translate-y-0 active:shadow-hard-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <Search size={20} strokeWidth={2.5} />
            Cari
          </button>
        </div>
      </form>
    </div>
  )
}
