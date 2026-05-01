import { useEffect } from 'react'
import { X, Info } from 'lucide-react'
import { trackEvent } from '../utils/tracking'
import PaymentInfoCard from './PaymentInfoCard'

export default function PaymentInfoModal({ onClose }) {
  useEffect(() => {
    trackEvent('open_payment_info_modal')
  }, [])

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-dark/60 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <div
        className="
          bg-white border-2 border-slate-dark rounded-t-3xl sm:rounded-3xl shadow-hard
          w-full sm:max-w-sm mx-0 sm:mx-4
          p-4 animate-bounce-in
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
            <Info size={18} strokeWidth={2.5} className="text-violet" />
            <h3 className="font-heading font-bold text-base">Info Pembayaran IPL</h3>
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

        <PaymentInfoCard />

        <p className="text-center font-body text-xs text-slate-dark/55 mt-3">
          Ketuk di luar untuk menutup
        </p>
      </div>
    </div>
  )
}
