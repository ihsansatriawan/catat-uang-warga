import { X, FileImage } from 'lucide-react'

export default function ProofModal({ onClose }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-dark/60 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      {/* Bottom sheet on mobile, centered modal on sm+ */}
      <div
        className="
          bg-white border-2 border-slate-dark rounded-t-3xl sm:rounded-3xl shadow-hard
          w-full sm:max-w-sm mx-0 sm:mx-4
          p-4 pb-safe animate-bounce-in
        "
        style={{ paddingBottom: `max(1rem, env(safe-area-inset-bottom))` }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Handle bar (mobile) */}
        <div className="flex justify-center mb-3 sm:hidden">
          <div className="w-10 h-1 bg-slate-dark/20 rounded-full" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <FileImage size={18} strokeWidth={2.5} className="text-violet" />
            <h3 className="font-heading font-bold text-base">Bukti Transfer</h3>
          </div>
          <button
            onClick={onClose}
            className="
              bg-pink text-white border-2 border-slate-dark rounded-full p-1.5
              shadow-hard-sm active:translate-x-[1px] active:translate-y-[1px] active:shadow-none
              transition-all
            "
            aria-label="Tutup"
          >
            <X size={16} strokeWidth={2.5} />
          </button>
        </div>

        {/* Placeholder image area */}
        <div className="bg-cream border-2 border-slate-dark rounded-2xl aspect-[4/3] flex flex-col items-center justify-center gap-3 overflow-hidden">
          <div className="text-5xl select-none">🧾</div>
          <div className="text-center px-6">
            <p className="font-heading font-bold text-sm text-slate-dark/40">Bukti Pembayaran</p>
            <p className="font-body text-xs text-slate-dark/25 mt-1 leading-snug">
              Harap hubungi pengurus untuk melihat bukti transfer yang sudah disubmit
            </p>
          </div>
        </div>

        {/* CTA hint */}
        <p className="text-center font-body text-xs text-slate-dark/30 mt-3">
          Ketuk di luar untuk menutup
        </p>
      </div>
    </div>
  )
}
