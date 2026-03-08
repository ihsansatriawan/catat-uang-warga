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
          <div className="bg-white border-2 border-slate-dark rounded-3xl shadow-hard p-8 max-w-sm w-full text-center space-y-3">
            <p className="font-heading text-xl font-bold text-slate-dark">Data tidak ditemukan</p>
            <p className="font-body text-sm text-slate-dark/70">Blok atau nomor rumah tidak terdaftar</p>
            <p className="font-body text-sm text-slate-dark/70">Harap hubungi pengurus untuk informasi lebih lanjut</p>
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
