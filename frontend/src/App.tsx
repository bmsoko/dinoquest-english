import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { LangProvider } from './i18n'
import { JungleBackdrop } from './components/JungleBackdrop'
import { Home } from './pages/Home'
import { Profiles } from './pages/Profiles'
import { Play } from './pages/Play'
import { DinoDex } from './pages/DinoDex'
import { ParentZone } from './pages/ParentZone'
import { TestPractice } from './pages/TestPractice'

export default function App() {
  return (
    <LangProvider>
      <JungleBackdrop />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/profiles" element={<Profiles />} />
          <Route path="/play" element={<Play />} />
          <Route path="/dinodex" element={<DinoDex />} />
          <Route path="/parents" element={<ParentZone />} />
          <Route path="/test" element={<TestPractice />} />
        </Routes>
      </BrowserRouter>
    </LangProvider>
  )
}
