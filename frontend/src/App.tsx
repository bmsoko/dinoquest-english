import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { LangProvider } from './i18n'
import { Home } from './pages/Home'
import { Profiles } from './pages/Profiles'
import { Play } from './pages/Play'
import { DinoDex } from './pages/DinoDex'
import { ParentZone } from './pages/ParentZone'

export default function App() {
  return (
    <LangProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/profiles" element={<Profiles />} />
          <Route path="/play" element={<Play />} />
          <Route path="/dinodex" element={<DinoDex />} />
          <Route path="/parents" element={<ParentZone />} />
        </Routes>
      </BrowserRouter>
    </LangProvider>
  )
}
