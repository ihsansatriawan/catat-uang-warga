import { Routes, Route } from 'react-router-dom'
import HomePage from './components/HomePage'
import WargaPage from './components/WargaPage'
import LeaderboardView from './components/LeaderboardView'
import BroadcastView from './components/BroadcastView'
import ExpensesView from './components/ExpensesView'
import AttendanceView from './components/AttendanceView'
import RekapKehadiranView from './components/RekapKehadiranView'
import LombaView from './components/LombaView'
import RekapLombaView from './components/RekapLombaView'

function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/warga/:blok/:nomorRumah" element={<WargaPage />} />
      <Route path="/leaderboard" element={<LeaderboardView />} />
      <Route path="/broadcast" element={<BroadcastView />} />
      <Route path="/pengeluaran" element={<ExpensesView />} />
      <Route path="/kehadiran" element={<AttendanceView />} />
      <Route path="/rekap-kehadiran" element={<RekapKehadiranView />} />
      <Route path="/lomba" element={<LombaView />} />
      <Route path="/rekap-lomba" element={<RekapLombaView />} />
    </Routes>
  )
}

export default App
