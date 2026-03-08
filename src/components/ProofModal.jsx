import { X } from 'lucide-react'

export default function ProofModal({ imageUrl, onClose }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-dark/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-white border-2 border-slate-dark rounded-2xl shadow-hard p-4 max-w-lg w-full mx-4 animate-bounce-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <div className="flex justify-end mb-2">
          <button
            onClick={onClose}
            className="bg-pink text-white border-2 border-slate-dark rounded-full p-1 shadow-hard-sm hover:translate-x-[-2px] hover:translate-y-[-2px] transition-all"
          >
            <X size={20} strokeWidth={2.5} />
          </button>
        </div>

        {/* Placeholder image */}
        <div className="bg-cream border-2 border-slate-dark rounded-xl aspect-square flex flex-col items-center justify-center gap-3">
          <div className="text-6xl">🧾</div>
          <p className="font-heading font-bold text-slate-dark/40">Bukti Transfer</p>
          <p className="font-body text-sm text-slate-dark/30 text-center px-4">
            Placeholder — akan menampilkan bukti transfer asli saat data tersedia
          </p>
        </div>
      </div>
    </div>
  )
}
