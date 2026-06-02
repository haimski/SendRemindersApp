import { useAppStore } from '../../store/useAppStore'
import './Hero.css'

export function Hero() {
  const t = useAppStore((s) => s.t)

  return (
    <div className="hero">
      <h1 className="hero-title">{t.title}</h1>
      <p className="hero-subtitle">{t.subtitle}</p>
    </div>
  )
}
