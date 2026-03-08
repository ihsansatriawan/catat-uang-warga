import { useState } from 'react'
import { ArrowLeft, CheckCircle, XCircle, Receipt, Image } from 'lucide-react'
import { formatRupiah } from '../data/helpers'
import ProofModal from './ProofModal'

export default function DashboardView({ resident, onBack }) {
  const [modalImage, setModalImage] = useState(null)

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 animate-pop-in">
      {/* Back Button */}
      <button
        onClick={onBack}
        className="flex items-center gap-2 font-heading font-bold text-sm mb-6 bg-yellow border-2 border-slate-dark rounded-full px-4 py-2 shadow-hard-sm hover:translate-x-[-2px] hover:translate-y-[-2px] transition-all"
      >
        <ArrowLeft size={18} strokeWidth={2.5} />
        Kembali
      </button>

      {/* Resident Header */}
      <div className="mb-8 text-center">
        <h1 className="font-heading text-4xl md:text-5xl font-extrabold text-slate-dark inline-block">
          {resident.namaPemilik}
        </h1>
        {/* Squiggle underline */}
        <svg className="mx-auto mt-2" width="200" height="12" viewBox="0 0 200 12">
          <path
            d="M0 6 Q 10 0, 20 6 T 40 6 T 60 6 T 80 6 T 100 6 T 120 6 T 140 6 T 160 6 T 180 6 T 200 6"
            fill="none"
            stroke="#8B5CF6"
            strokeWidth="3"
            strokeLinecap="round"
          />
        </svg>
        <p className="font-body text-slate-dark/60 mt-2">
          Blok {resident.blok} No. {resident.nomorRumah}
        </p>
      </div>

      {/* Summary Pills */}
      <div className="flex flex-col sm:flex-row gap-4 mb-8">
        <div className="flex-1 bg-white border-2 border-slate-dark rounded-2xl shadow-hard p-5">
          <div className="flex items-center gap-2 mb-2">
            <Receipt size={20} strokeWidth={2.5} className="text-violet" />
            <span className="font-heading font-bold text-sm">Total Terbayar</span>
          </div>
          <p className="font-heading text-2xl font-extrabold text-violet">
            {formatRupiah(resident.totalPaid)}
          </p>
          <p className="font-body text-xs text-slate-dark/50 mt-1">
            dari {formatRupiah(resident.annualTarget)}
          </p>
        </div>

        <div className={`flex-1 border-2 border-slate-dark rounded-2xl shadow-hard p-5 ${
          resident.isLunas ? 'bg-green/10' : 'bg-pink/10'
        }`}>
          <div className="flex items-center gap-2 mb-2">
            {resident.isLunas ? (
              <CheckCircle size={20} strokeWidth={2.5} className="text-green" />
            ) : (
              <XCircle size={20} strokeWidth={2.5} className="text-pink" />
            )}
            <span className="font-heading font-bold text-sm">Status</span>
          </div>
          <p className={`font-heading text-2xl font-extrabold ${
            resident.isLunas ? 'text-green' : 'text-pink'
          }`}>
            {resident.isLunas ? 'LUNAS' : 'BELUM LUNAS'}
          </p>
          <p className="font-body text-xs text-slate-dark/50 mt-1">
            {resident.isLunas
              ? 'Pembayaran tahun ini sudah lengkap'
              : `Kurang ${formatRupiah(resident.annualTarget - resident.totalPaid)}`}
          </p>
        </div>
      </div>

      {/* Transaction History */}
      <div className="bg-white border-2 border-slate-dark rounded-2xl shadow-hard overflow-hidden">
        <div className="px-5 py-4 border-b-2 border-slate-dark">
          <h2 className="font-heading font-bold text-lg">Riwayat Pembayaran</h2>
        </div>
        <div className="divide-y-2 divide-slate-dark/10">
          {resident.transactions.map((tx, i) => (
            <div
              key={i}
              className="flex items-center justify-between px-5 py-4 hover:bg-cream/50 transition-colors"
              style={{ animationDelay: `${i * 0.1}s` }}
            >
              <div>
                <p className="font-heading font-bold text-base">
                  {formatRupiah(tx.jumlahPembayaran)}
                </p>
                <p className="font-body text-sm text-slate-dark/60">
                  {new Date(tx.timestamp).toLocaleDateString('id-ID', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })}
                </p>
              </div>
              {/* Proof thumbnail */}
              <button
                onClick={() => setModalImage(tx.buktiTransfer)}
                className="w-12 h-12 bg-cream border-2 border-slate-dark rounded-lg shadow-hard-sm hover:translate-x-[-2px] hover:translate-y-[-2px] transition-all flex items-center justify-center"
              >
                <Image size={20} strokeWidth={2.5} className="text-slate-dark/40" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Proof Modal */}
      {modalImage && (
        <ProofModal imageUrl={modalImage} onClose={() => setModalImage(null)} />
      )}
    </div>
  )
}
