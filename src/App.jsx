import { Routes, Route } from 'react-router-dom'
import HomePage from './components/HomePage'
import LeaderboardView from './components/LeaderboardView'

function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/leaderboard" element={<LeaderboardView />} />
    </Routes>
  )
}

export default App
