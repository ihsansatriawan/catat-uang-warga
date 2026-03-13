import { Routes, Route } from 'react-router-dom'
import HomePage from './components/HomePage'
import LeaderboardView from './components/LeaderboardView'
import BroadcastView from './components/BroadcastView'

function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/leaderboard" element={<LeaderboardView />} />
      <Route path="/broadcast" element={<BroadcastView />} />
    </Routes>
  )
}

export default App
