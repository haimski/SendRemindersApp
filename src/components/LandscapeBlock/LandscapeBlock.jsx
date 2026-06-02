import { useAppStore } from '../../store/useAppStore'
import { RotateIcon } from '../icons'
import './LandscapeBlock.css'

export function LandscapeBlock() {
  const t = useAppStore((s) => s.t)

  return (
    <div className="landscape-block" aria-hidden="true">
      <RotateIcon />
      <p>{t.landscape}</p>
    </div>
  )
}
