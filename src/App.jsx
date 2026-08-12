import { Routes, Route, Navigate } from 'react-router-dom'
import HomePage from './components/HomePage'
import WargaPage from './components/WargaPage'
import LeaderboardView from './components/LeaderboardView'
import BroadcastView from './components/BroadcastView'
import ExpensesView from './components/ExpensesView'
import AttendanceView from './components/AttendanceView'
import RekapKehadiranView from './components/RekapKehadiranView'
import LombaView from './components/LombaView'
import RekapLombaView from './components/RekapLombaView'
import { FITUR } from './config'

/**
 * Rute yang fiturnya dimatikan di site.config.js dialihkan ke halaman depan,
 * supaya tidak ada halaman "yatim" yang masih bisa dibuka lewat URL langsung.
 */
function Fitur({ aktif, children }) {
  return aktif ? children : <Navigate to="/" replace />
}

function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/warga/:blok/:nomorRumah" element={<WargaPage />} />
      <Route
        path="/leaderboard"
        element={<Fitur aktif={FITUR.leaderboard}><LeaderboardView /></Fitur>}
      />
      <Route
        path="/broadcast"
        element={<Fitur aktif={FITUR.broadcast}><BroadcastView /></Fitur>}
      />
      <Route
        path="/pengeluaran"
        element={<Fitur aktif={FITUR.pengeluaran}><ExpensesView /></Fitur>}
      />
      <Route
        path="/kehadiran"
        element={<Fitur aktif={FITUR.kehadiran}><AttendanceView /></Fitur>}
      />
      <Route
        path="/rekap-kehadiran"
        element={<Fitur aktif={FITUR.kehadiran}><RekapKehadiranView /></Fitur>}
      />
      <Route
        path="/lomba"
        element={<Fitur aktif={FITUR.lomba}><LombaView /></Fitur>}
      />
      <Route
        path="/rekap-lomba"
        element={<Fitur aktif={FITUR.lomba}><RekapLombaView /></Fitur>}
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App
