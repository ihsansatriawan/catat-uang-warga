import { Routes, Route } from 'react-router-dom'
import HomePage from './components/HomePage'
import WargaPage from './components/WargaPage'
import LeaderboardView from './components/LeaderboardView'
import BroadcastView from './components/BroadcastView'
import ExpensesView from './components/ExpensesView'

function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/warga/:blok/:nomorRumah" element={<WargaPage />} />
      <Route path="/leaderboard" element={<LeaderboardView />} />
      <Route path="/broadcast" element={<BroadcastView />} />
      <Route path="/pengeluaran" element={<ExpensesView />} />
    </Routes>
  )
}

export default App
