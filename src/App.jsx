import { useState, useEffect } from 'react'
import { useAppStore } from './store/useAppStore'
import { useSpeechRecognition } from './hooks/useSpeechRecognition'
import { Navbar } from './components/Navbar/Navbar'
import { Hero } from './components/Hero/Hero'
import { MessageForm } from './components/MessageForm/MessageForm'
import { BottomBar } from './components/BottomBar/BottomBar'
import { LandscapeBlock } from './components/LandscapeBlock/LandscapeBlock'
import './App.css'

export default function App() {
  const lang = useAppStore((s) => s.lang)
  const dir = useAppStore((s) => s.dir)

  const [message, setMessage] = useState('')

  // Sync HTML element direction and language with the store
  useEffect(() => {
    document.documentElement.lang = lang
    document.documentElement.dir = dir
  }, [lang, dir])

  // Best-effort portrait lock (Android Chrome only — iOS ignores silently)
  useEffect(() => {
    screen.orientation?.lock?.('portrait').catch(() => {})
  }, [])

  const { isListening, supported, toggle, stop } = useSpeechRecognition({
    lang,
    getBaseText: () => message,
    onUpdate: setMessage,
  })

  return (
    <div className="app" dir={dir}>
      <LandscapeBlock />
      <Navbar />
      <main className="content">
        <Hero />
        <MessageForm
          message={message}
          setMessage={setMessage}
          isListening={isListening}
          speechSupported={supported}
          onStop={stop}
        />
      </main>
      <BottomBar
        isListening={isListening}
        supported={supported}
        onToggle={toggle}
      />
    </div>
  )
}
