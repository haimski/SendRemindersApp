import { useState, useRef, useCallback } from 'react'
import { SPEECH_LANG } from '../constants/speech'

export function useSpeechRecognition({ lang, getBaseText, onUpdate }) {
  const [isListening, setIsListening] = useState(false)
  const supported = !!(window.SpeechRecognition || window.webkitSpeechRecognition)

  const recognitionRef = useRef(null)
  const finalTextRef = useRef('')

  // Keep callback refs current on every render — avoids stale closures
  // without adding them as useCallback dependencies
  const getBaseTextRef = useRef(getBaseText)
  const onUpdateRef = useRef(onUpdate)
  getBaseTextRef.current = getBaseText
  onUpdateRef.current = onUpdate

  const stop = useCallback(() => {
    recognitionRef.current?.stop()
  }, [])

  const start = useCallback(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SR) return

    const base = getBaseTextRef.current().trim()
    finalTextRef.current = ''

    const recognition = new SR()
    recognition.continuous = true
    recognition.interimResults = false   // finals only — mobile interim results flicker word-by-word
    recognition.lang = SPEECH_LANG[lang]

    recognition.onstart = () => setIsListening(true)

    recognition.onresult = (event) => {
      // Rebuild from all results every event — idempotent, safe on mobile browsers
      // where event.resultIndex is unreliable (often stuck at 0)
      let sessionFinals = ''
      for (let i = 0; i < event.results.length; i++) {
        if (event.results[i].isFinal) {
          sessionFinals += (sessionFinals ? ' ' : '') + event.results[i][0].transcript.trim()
        }
      }
      if (sessionFinals) {
        finalTextRef.current = sessionFinals
        const sep = base && sessionFinals ? ' ' : ''
        onUpdateRef.current(base + sep + sessionFinals)
      }
    }

    recognition.onerror = (event) => {
      if (event.error !== 'no-speech') console.error('Speech error:', event.error)
      setIsListening(false)
      const finals = finalTextRef.current
      onUpdateRef.current(base + (base && finals ? ' ' : '') + finals)
    }

    recognition.onend = () => {
      setIsListening(false)
      const finals = finalTextRef.current
      onUpdateRef.current(base + (base && finals ? ' ' : '') + finals)
    }

    recognitionRef.current = recognition
    recognition.start()
  }, [lang])

  const toggle = useCallback(() => {
    if (isListening) stop()
    else start()
  }, [isListening, start, stop])

  return { isListening, supported, toggle, stop }
}
