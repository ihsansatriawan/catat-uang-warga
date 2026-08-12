import { MessageCircle } from 'lucide-react'
import {
  IURAN_BULANAN,
  LABEL_IURAN_TAHUN,
  PEMBAYARAN,
  formatRupiah,
  waPengurusUrl,
} from '../config'

export default function PaymentInfoCard({ blok, nomorRumah }) {
  const waText = blok && nomorRumah
    ? `Saya mencari nomor rumah saya: Blok ${blok} No. ${nomorRumah} namun data tidak ditemukan`
    : `Halo Pengurus, saya ingin menanyakan info pembayaran ${LABEL_IURAN_TAHUN}`
  const waUrl = waPengurusUrl(waText)

  return (
    <div className="space-y-4">
      <div className="bg-cream border-2 border-slate-dark/10 rounded-2xl p-4 text-left space-y-2 font-body text-sm text-slate-dark">
        <p>💰 <strong>Iuran {LABEL_IURAN_TAHUN}:</strong> {formatRupiah(IURAN_BULANAN)}</p>
        <p>📱 <strong>Rekening Pembayaran:</strong><br />
          <span className="ml-5">{PEMBAYARAN.bank}: <span className="font-heading font-bold">{PEMBAYARAN.nomorRekening}</span></span><br />
          <span className="ml-5">a.n. {PEMBAYARAN.atasNama}</span>
        </p>
        {PEMBAYARAN.formKonfirmasiUrl && (
          <>
            <p>✅ <strong>Konfirmasi Pembayaran:</strong><br />
              <span className="ml-5">Mohon isi form konfirmasi setelah transfer ya 🙏</span>
            </p>
            <a
              href={PEMBAYARAN.formKonfirmasiUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-violet font-heading font-bold underline underline-offset-2 hover:text-violet/80 transition-colors"
            >
              🔗 Isi Form Konfirmasi
            </a>
          </>
        )}
      </div>

      {waUrl && (
        <div className="border-t-2 border-slate-dark/10 pt-4">
          <p className="font-body text-sm text-slate-dark/70 mb-3">
            Harap hubungi pengurus untuk informasi lebih lanjut
          </p>
          <a
            href={waUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="
              inline-flex items-center justify-center gap-2 w-full
              bg-green text-white font-heading font-bold
              border-2 border-slate-dark rounded-full px-6 py-3
              shadow-hard
              hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-hard-lg
              active:translate-x-0 active:translate-y-0 active:shadow-hard-sm
              transition-all duration-150
            "
          >
            <MessageCircle size={18} strokeWidth={2.5} />
            Hubungi via WhatsApp
          </a>
        </div>
      )}
    </div>
  )
}
