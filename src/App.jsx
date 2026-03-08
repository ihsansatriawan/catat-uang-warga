import { useState } from 'react'
import { getResident } from './data/helpers'
import SearchView from './components/SearchView'
import DashboardView from './components/DashboardView'

function App() {
  const [resident, setResident] = useState(null)
  const [searched, setSearched] = useState(false)

  const handleSearch = (blok, nomorRumah) => {
    const result = getResident(blok, nomorRumah)
    setResident(result)
    setSearched(true)
  }

  const handleBack = () => {
    setResident(null)
    setSearched(false)
  }

  return (
    <div className="min-h-screen">
      {!searched ? (
        <SearchView onSearch={handleSearch} />
      ) : resident ? (
        <DashboardView resident={resident} onBack={handleBack} />
      ) : (
        <div className="flex flex-col items-center justify-center min-h-screen px-4 animate-pop-in">
          <div className="bg-white border-2 border-slate-dark rounded-3xl shadow-hard p-8 max-w-sm w-full text-center space-y-4">
            <p className="font-heading text-xl font-bold text-slate-dark">Data tidak ditemukan</p>
            <p className="font-body text-sm text-slate-dark/70">
              Mungkin Anda belum melakukan pembayaran IPL.
              <br />Berikut panduannya:
            </p>

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

            <button
              onClick={handleBack}
              className="mt-2 bg-violet text-white font-heading font-bold border-2 border-slate-dark rounded-full px-6 py-2 shadow-hard hover:translate-x-[-2px] hover:translate-y-[-2px] transition-all"
            >
              Coba Lagi
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default App
