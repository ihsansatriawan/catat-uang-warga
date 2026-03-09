import { useState } from 'react'
import { ArrowLeft, CheckCircle, XCircle, Receipt, Image, Calendar, MessageCircle } from 'lucide-react'
import { formatRupiah, getLastUpdated } from '../data/helpers'
import ProofModal from './ProofModal'

export default function DashboardView({ resident, onBack }) {
  const [showProof, setShowProof] = useState(false)

  const progressPct = Math.min(100, Math.round((resident.totalPaid / resident.annualTarget) * 100))

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
        <button
          onClick={onBack}
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
        </button>
        <div className="flex-1 text-center">
          <span className="font-heading font-bold text-sm text-slate-dark/50">
            Blok {resident.blok} · No. {resident.nomorRumah}
          </span>
        </div>
        {/* Status badge in top bar */}
        <span className={`
          font-heading font-extrabold text-xs px-2.5 py-1 rounded-full border-2 border-slate-dark shadow-hard-sm
          ${resident.isLunas ? 'bg-green text-white' : 'bg-pink text-white'}
        `}>
          {resident.isLunas ? 'LUNAS' : 'BELUM'}
        </span>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto safe-x">
        <div className="max-w-lg mx-auto px-4 py-6 space-y-5">

          {/* Resident hero card */}
          <div className="bg-white border-2 border-slate-dark rounded-3xl shadow-hard p-5 animate-slide-up stagger-1">
            <div className="flex items-start justify-between gap-3">
              {/* Avatar initial */}
              <div className={`
                w-14 h-14 rounded-2xl border-2 border-slate-dark shadow-hard-sm
                flex items-center justify-center font-heading font-black text-2xl flex-shrink-0
                ${resident.isLunas ? 'bg-green text-white' : 'bg-violet text-white'}
              `}>
                {resident.namaPemilik.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <h1 className="font-heading text-2xl sm:text-3xl font-extrabold text-slate-dark leading-tight truncate">
                  {resident.namaPemilik}
                </h1>
                <p className="font-body text-sm text-slate-dark/50 mt-0.5">
                  Blok {resident.blok} · Nomor {resident.nomorRumah}
                </p>
              </div>
              <div className={`
                flex-shrink-0 mt-0.5
                ${resident.isLunas ? 'text-green' : 'text-pink'}
              `}>
                {resident.isLunas
                  ? <CheckCircle size={24} strokeWidth={2.5} />
                  : <XCircle size={24} strokeWidth={2.5} />
                }
              </div>
            </div>

            {/* Progress section */}
            <div className="mt-4 pt-4 border-t-2 border-slate-dark/10">
              <div className="flex items-end justify-between mb-2">
                <div>
                  <p className="font-heading font-extrabold text-xl text-slate-dark">
                    {formatRupiah(resident.totalPaid)}
                  </p>
                  <p className="font-body text-xs text-slate-dark/40">
                    dari {formatRupiah(resident.annualTarget)} target tahunan
                  </p>
                  <span className="inline-flex items-center gap-1 bg-violet/10 text-violet font-body text-xs font-semibold rounded-full px-2.5 py-0.5 mt-1">
                    💡 Rp 250.000/bulan × 12 bulan
                  </span>
                </div>
                <span className={`
                  font-heading font-black text-2xl
                  ${resident.isLunas ? 'text-green' : 'text-violet'}
                `}>
                  {progressPct}%
                </span>
              </div>

              {/* Progress bar */}
              <div className="h-4 bg-cream border-2 border-slate-dark rounded-full overflow-hidden">
                <div
                  className={`
                    h-full rounded-full progress-bar
                    ${resident.isLunas ? 'bg-green' : 'bg-violet'}
                  `}
                  style={{ '--progress-width': `${progressPct}%` }}
                />
              </div>

              {!resident.isLunas && (
                <p className="font-body text-xs text-pink font-semibold mt-2">
                  Kurang {formatRupiah(resident.annualTarget - resident.totalPaid)} lagi untuk lunas
                </p>
              )}
              {resident.isLunas && (
                <p className="font-body text-xs text-green font-semibold mt-2">
                  Pembayaran tahun 2026 sudah lengkap! 🎉
                </p>
              )}

              {lastUpdateText && (
                <div className="flex items-center gap-1.5 mt-3 pt-3 border-t border-slate-dark/10">
                  <Calendar size={12} strokeWidth={2.5} className="text-slate-dark/30 flex-shrink-0" />
                  <p className="font-body text-xs text-slate-dark/40">
                    Terakhir diperbarui: <span className="font-semibold text-slate-dark/60">{lastUpdateText}</span>
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Help/Report Data section */}
          <div className="animate-slide-up stagger-2 flex flex-col items-center bg-cream/50 rounded-2xl py-2 px-4 border-2 border-transparent">
            <p className="font-body text-sm text-center text-slate-dark/60 mb-2 font-semibold">
              Ada data yang tidak sesuai?
            </p>
            <a
              href={`https://wa.me/628111719913?text=${encodeURIComponent(`Halo Pengurus, saya mengecek data IPL untuk Blok ${resident.blok} No. ${resident.nomorRumah} dan sepertinya ada data yang kurang sesuai. Mohon bantuannya untuk dilakukan pengecekan.`)}`}
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

          {/* Summary pills */}
          <div className="grid grid-cols-2 gap-3 animate-slide-up stagger-3">
            <div className="bg-violet/10 border-2 border-slate-dark rounded-2xl shadow-hard-sm p-4">
              <Receipt size={18} strokeWidth={2.5} className="text-violet mb-2" />
              <p className="font-heading font-extrabold text-lg text-violet leading-tight">
                {resident.transactions.length}
              </p>
              <p className="font-body text-xs text-slate-dark/50 mt-0.5">transaksi</p>
            </div>
            <div className={`
              border-2 border-slate-dark rounded-2xl shadow-hard-sm p-4
              ${resident.isLunas ? 'bg-green/10' : 'bg-pink/10'}
            `}>
              {resident.isLunas
                ? <CheckCircle size={18} strokeWidth={2.5} className="text-green mb-2" />
                : <XCircle size={18} strokeWidth={2.5} className="text-pink mb-2" />
              }
              <p className={`font-heading font-extrabold text-lg leading-tight ${resident.isLunas ? 'text-green' : 'text-pink'}`}>
                {resident.isLunas ? 'LUNAS' : 'BELUM'}
              </p>
              <p className="font-body text-xs text-slate-dark/50 mt-0.5">status IPL</p>
            </div>
          </div>

          {/* Transaction history */}
          <div className="bg-white border-2 border-slate-dark rounded-3xl shadow-hard overflow-hidden animate-slide-up stagger-4">
            <div className="px-5 py-4 border-b-2 border-slate-dark flex items-center gap-2">
              <Calendar size={18} strokeWidth={2.5} className="text-slate-dark/60" />
              <h2 className="font-heading font-bold text-base">Riwayat Pembayaran</h2>
            </div>

            {resident.transactions.length === 0 ? (
              <div className="py-10 text-center">
                <p className="font-body text-sm text-slate-dark/40">Belum ada pembayaran tercatat</p>
              </div>
            ) : (
              <div>
                {resident.transactions.map((tx, i) => (
                  <div
                    key={i}
                    className={`
                      flex items-center justify-between px-5 py-4
                      active:bg-cream/80 transition-colors
                      ${i < resident.transactions.length - 1 ? 'border-b border-slate-dark/10' : ''}
                    `}
                  >
                    {/* Left: amount + date */}
                    <div className="flex items-center gap-3 min-w-0">
                      {/* Color dot */}
                      <div className={`
                        w-2 h-2 rounded-full flex-shrink-0
                        ${i % 3 === 0 ? 'bg-violet' : i % 3 === 1 ? 'bg-pink' : 'bg-yellow'}
                      `} />
                      <div className="min-w-0">
                        <p className="font-heading font-bold text-base text-slate-dark">
                          {formatRupiah(tx.jumlahPembayaran)}
                        </p>
                        <p className="font-body text-xs text-slate-dark/50 truncate">
                          {new Date(tx.timestamp).toLocaleDateString('id-ID', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </p>
                      </div>
                    </div>

                    {/* Right: proof button */}
                    <button
                      onClick={() => setShowProof(true)}
                      className="
                        ml-3 flex-shrink-0
                        w-10 h-10 bg-cream border-2 border-slate-dark rounded-xl shadow-hard-sm
                        active:translate-x-[2px] active:translate-y-[2px] active:shadow-none
                        transition-all flex items-center justify-center
                      "
                      aria-label="Lihat bukti transfer"
                    >
                      <Image size={16} strokeWidth={2.5} className="text-slate-dark/50" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>


        </div>
      </div>

      {/* Bottom safe area */}
      <div className="safe-bottom bg-cream" />

      {/* Proof Modal */}
      {showProof && (
        <ProofModal onClose={() => setShowProof(false)} />
      )}
    </div>
  )
}
