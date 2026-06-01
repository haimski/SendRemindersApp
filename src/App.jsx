import { useState, useRef, useEffect } from 'react'
import './App.css'

const WEBHOOK_URL = 'https://hook.eu2.make.com/wpc9k58nm6rjhlk2p28lr7u1y0wm4ryw'

export default function App() {
  const [message, setMessage] = useState('')
  const [isListening, setIsListening] = useState(false)
  const [submitStatus, setSubmitStatus] = useState(null) // null | 'success' | 'error'
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [speechSupported, setSpeechSupported] = useState(false)

  const recognitionRef = useRef(null)
  const baseTextRef = useRef('')   // text in textarea when voice started
  const finalTextRef = useRef('')  // accumulated confirmed final speech

  useEffect(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition
    setSpeechSupported(!!SR)
  }, [])

  const startListening = () => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SR) return

    // Snapshot current text so we can prepend it to speech output
    const base = message
    baseTextRef.current = base
    finalTextRef.current = base

    const recognition = new SR()
    recognition.continuous = true
    recognition.interimResults = true
    recognition.lang = navigator.language || 'en-US'

    recognition.onstart = () => setIsListening(true)

    recognition.onresult = (event) => {
      let finals = ''
      let interim = ''

      for (let i = 0; i < event.results.length; i++) {
        const result = event.results[i]
        if (result.isFinal) {
          finals += result[0].transcript
        } else {
          interim += result[0].transcript
        }
      }

      const confirmed = baseTextRef.current + (baseTextRef.current && finals ? ' ' : '') + finals
      finalTextRef.current = confirmed
      setMessage(confirmed + interim)
    }

    recognition.onerror = (event) => {
      if (event.error !== 'no-speech') {
        console.error('Speech error:', event.error)
      }
      setIsListening(false)
      // Revert to only confirmed final text (drop any dangling interim)
      setMessage(finalTextRef.current)
    }

    recognition.onend = () => {
      setIsListening(false)
      setMessage(finalTextRef.current)
    }

    recognitionRef.current = recognition
    recognition.start()
  }

  const stopListening = () => {
    recognitionRef.current?.stop()
    // State + message update happens in onend / onerror
  }

  const toggleListening = () => {
    if (isListening) {
      stopListening()
    } else {
      startListening()
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!message.trim() || isSubmitting) return

    // Stop voice if still active
    if (isListening) stopListening()

    setIsSubmitting(true)
    setSubmitStatus(null)

    try {
      const res = await fetch(WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: message.trim() }),
      })

      if (res.ok) {
        setSubmitStatus('success')
        setMessage('')
      } else {
        setSubmitStatus('error')
      }
    } catch {
      setSubmitStatus('error')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="page">
      <div className="card">
        <h1 className="title">Send a Message</h1>

        <form onSubmit={handleSubmit} className="form" noValidate>
          <label className="label" htmlFor="message">
            Your message
          </label>

          <div className="textarea-wrap">
            <textarea
              id="message"
              className="textarea"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Type your message here…"
              disabled={isSubmitting}
            />

            {speechSupported && (
              <button
                type="button"
                className={`mic-btn${isListening ? ' listening' : ''}`}
                onClick={toggleListening}
                aria-label={isListening ? 'Stop voice input' : 'Start voice input'}
                disabled={isSubmitting}
              >
                {isListening ? <StopIcon /> : <MicIcon />}
              </button>
            )}
          </div>

          {isListening && (
            <p className="listening-hint">
              <span className="dot" />
              Listening — tap the mic to stop
            </p>
          )}

          {!speechSupported && (
            <p className="unsupported-hint">
              Voice input is not supported in this browser.
            </p>
          )}

          <button
            type="submit"
            className="submit-btn"
            disabled={isSubmitting || !message.trim()}
          >
            {isSubmitting ? 'Sending…' : 'Send Message'}
          </button>
        </form>

        {submitStatus === 'success' && (
          <div className="status-msg success">
            Message sent successfully!
          </div>
        )}
        {submitStatus === 'error' && (
          <div className="status-msg error">
            Something went wrong. Please try again.
          </div>
        )}
      </div>
    </div>
  )
}

function MicIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 14a3 3 0 0 0 3-3V5a3 3 0 0 0-6 0v6a3 3 0 0 0 3 3z" />
      <path d="M19 11a1 1 0 0 0-2 0 5 5 0 0 1-10 0 1 1 0 0 0-2 0 7 7 0 0 0 6 6.93V20H9a1 1 0 0 0 0 2h6a1 1 0 0 0 0-2h-2v-2.07A7 7 0 0 0 19 11z" />
    </svg>
  )
}

function StopIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <rect x="6" y="6" width="12" height="12" rx="2" />
    </svg>
  )
}
