import { useAppStore } from '../../store/useAppStore'
import { GlobeIcon } from '../icons'
import './Navbar.css'

export function Navbar() {
  const lang = useAppStore((s) => s.lang)
  const t = useAppStore((s) => s.t)
  const setLang = useAppStore((s) => s.setLang)

  const handleSwitch = () => setLang(lang === 'en' ? 'he' : 'en')

  return (
    <nav className="navbar">
      <button className="lang-switch" onClick={handleSwitch} aria-label="Switch language">
        <GlobeIcon />
        <span>{t.langLabel}</span>
      </button>
      <span className="navbar-brand">iRemindMe</span>
    </nav>
  )
}
