import { useNavigate } from 'react-router-dom'
import SearchView from './SearchView'

export default function HomePage() {
  const navigate = useNavigate()

  const handleSearch = (blok, nomorRumah) => {
    navigate(`/warga/${blok}/${nomorRumah}`)
  }

  return <SearchView onSearch={handleSearch} />
}
