import { useParams, useNavigate } from 'react-router-dom'
import { getResident } from '../data/helpers'
import DashboardView from './DashboardView'
import PaymentInfoCard from './PaymentInfoCard'

export default function WargaPage() {
  const { blok, nomorRumah } = useParams()
  const navigate = useNavigate()
  const resident = getResident(blok, nomorRumah)

  if (!resident) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen px-4 animate-pop-in">
        <div className="bg-white border-2 border-slate-dark rounded-3xl shadow-hard p-8 max-w-sm w-full text-center space-y-4">
          <p className="font-heading text-xl font-bold text-slate-dark">Data tidak ditemukan</p>
          <p className="font-body text-sm text-slate-dark/70">
            Mungkin Anda belum melakukan pembayaran IPL.
            <br />Berikut panduannya:
          </p>

          <PaymentInfoCard blok={blok} nomorRumah={nomorRumah} />

          <button
            onClick={() => navigate('/')}
            className="mt-2 bg-violet text-white font-heading font-bold border-2 border-slate-dark rounded-full px-6 py-2 shadow-hard hover:translate-x-[-2px] hover:translate-y-[-2px] transition-all"
          >
            Coba Lagi
          </button>
        </div>
      </div>
    )
  }

  return <DashboardView resident={resident} onBack={() => navigate('/')} />
}
