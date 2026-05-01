import { MessageCircle } from 'lucide-react'

export default function PaymentInfoCard({ blok, nomorRumah }) {
  const waText = blok && nomorRumah
    ? `Saya mencari nomor rumah saya: Blok ${blok} No. ${nomorRumah} namun data tidak ditemukan`
    : `Halo Pengurus, saya ingin menanyakan info pembayaran IPL 2026`

  return (
    <div className="space-y-4">
      <div className="bg-cream border-2 border-slate-dark/10 rounded-2xl p-4 text-left space-y-2 font-body text-sm text-slate-dark">
        <p>💰 <strong>Iuran IPL 2026:</strong> Rp 250.000</p>
        <p>📱 <strong>Rekening Pembayaran:</strong><br />
          <span className="ml-5">Bank Jago: <span className="font-heading font-bold">503795009221</span></span><br />
          <span className="ml-5">a.n. Ihsan Satriawan</span>
        </p>
        <p>✅ <strong>Konfirmasi Pembayaran:</strong><br />
          <span className="ml-5">Mohon isi form konfirmasi setelah transfer ya 🙏</span>
        </p>
        <a
          href="https://forms.gle/u8XSmBgTKN46rSLp7"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-violet font-heading font-bold underline underline-offset-2 hover:text-violet/80 transition-colors"
        >
          🔗 Isi Form Konfirmasi
        </a>
      </div>

      <div className="border-t-2 border-slate-dark/10 pt-4">
        <p className="font-body text-sm text-slate-dark/70 mb-3">
          Harap hubungi pengurus untuk informasi lebih lanjut
        </p>
        <a
          href={`https://wa.me/628111719913?text=${encodeURIComponent(waText)}`}
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
    </div>
  )
}
