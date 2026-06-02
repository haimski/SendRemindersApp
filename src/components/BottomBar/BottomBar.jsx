import { MicIcon, StopIcon } from '../icons'
import './BottomBar.css'

export function BottomBar({ isListening, supported, onToggle }) {
  return (
    <div className="bottom-bar">
      {supported && (
        <button
          type="button"
          className={`mic-btn${isListening ? ' listening' : ''}`}
          onClick={onToggle}
          aria-label={isListening ? 'Stop voice input' : 'Start voice input'}
        >
          {isListening ? <StopIcon /> : <MicIcon />}
        </button>
      )}
    </div>
  )
}
