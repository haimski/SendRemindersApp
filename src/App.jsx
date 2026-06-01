import { useState, useRef, useEffect } from 'react'
import './App.css'

const WEBHOOK_URL = 'https://hook.eu1.make.com/w4jjrpb65n7an75ur1vjqh0u16svpqw7'

const T = {
  en: {
    title: 'Send Reminders to Yourself',
    subtitle: 'Record or type your reminder below',
    label: 'Your reminder',
    placeholder: 'Type your reminder or shopping list here…',
    listeningHint: 'Listening — tap the mic to stop',
    unsupported: 'Voice input is not supported in this browser.',
    send: 'Send to WhatsApp',
    sending: 'Sending…',
    success: 'Message sent successfully!',
    error: 'Something went wrong. Please try again.',
    langLabel: 'English',
  },
  he: {
    title: 'שלחו תזכורות לעצמכם',
    subtitle: 'הקליטו או כתבו את התזכורת שלכם למטה',
    label: 'התזכורת שלך',
    placeholder: 'הזן את התזכורת או רשימת הקניות שלך כאן…',
    listeningHint: 'מאזין — הקש על המיקרופון כדי לעצור',
    unsupported: 'קלט קולי אינו נתמך בדפדפן זה.',
    send: 'שלח ל-WhatsApp',
    sending: 'שולח…',
    success: 'ההודעה נשלחה בהצלחה!',
    error: 'משהו השתבש. אנא נסה שוב.',
    langLabel: 'עברית',
  },
}

const SPEECH_LANG = { en: 'en-US', he: 'he-IL' }

export default function App() {
  const [lang, setLang] = useState('he')
  const [message, setMessage] = useState('')
  const [isListening, setIsListening] = useState(false)
  const [submitStatus, setSubmitStatus] = useState(null) // null | 'success' | 'error'
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [speechSupported, setSpeechSupported] = useState(false)

  const recognitionRef = useRef(null)
  const baseTextRef = useRef('')
  const finalTextRef = useRef('')

  const t = T[lang]
  const dir = lang === 'he' ? 'rtl' : 'ltr'

  useEffect(() => {
    document.documentElement.lang = lang
    document.documentElement.dir = dir
  }, [lang, dir])

  useEffect(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition
    setSpeechSupported(!!SR)
  }, [])

  const startListening = () => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SR) return

    const base = message
    baseTextRef.current = base
    finalTextRef.current = base

    const recognition = new SR()
    recognition.continuous = true
    recognition.interimResults = true
    recognition.lang = SPEECH_LANG[lang]

    recognition.onstart = () => setIsListening(true)

    recognition.onresult = (event) => {
      let finals = ''
      let interim = ''
      for (let i = 0; i < event.results.length; i++) {
        const result = event.results[i]
        if (result.isFinal) finals += result[0].transcript
        else interim += result[0].transcript
      }
      const confirmed = baseTextRef.current + (baseTextRef.current && finals ? ' ' : '') + finals
      finalTextRef.current = confirmed
      setMessage(confirmed + interim)
    }

    recognition.onerror = (event) => {
      if (event.error !== 'no-speech') console.error('Speech error:', event.error)
      setIsListening(false)
      setMessage(finalTextRef.current)
    }

    recognition.onend = () => {
      setIsListening(false)
      setMessage(finalTextRef.current)
    }

    recognitionRef.current = recognition
    recognition.start()
  }

  const stopListening = () => recognitionRef.current?.stop()

  const toggleListening = () => {
    if (isListening) stopListening()
    else startListening()
  }

  const handleLangSwitch = () => {
    if (isListening) stopListening()
    setLang(l => l === 'en' ? 'he' : 'en')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!message.trim() || isSubmitting) return
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
    <div className="app" dir={dir}>

      {/* ── Top navbar ── */}
      <nav className="navbar">
        <button className="lang-switch" onClick={handleLangSwitch} aria-label="Switch language">
          <GlobeIcon />
          <span>{t.langLabel}</span>
        </button>
        <span className="navbar-brand">iRemindMe</span>
      </nav>

      {/* ── Scrollable content ── */}
      <main className="content">

        <div className="hero">
          <h1 className="hero-title">{t.title}</h1>
          <p className="hero-subtitle">{t.subtitle}</p>
        </div>

        <form onSubmit={handleSubmit} className="form" noValidate>
          <div className="card">
            <label className="card-label" htmlFor="message">{t.label}</label>
            <textarea
              id="message"
              className="textarea"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={t.placeholder}
              disabled={isSubmitting}
              dir={dir}
            />
          </div>

          {isListening && (
            <p className="listening-hint">
              <span className="dot" />
              {t.listeningHint}
            </p>
          )}

          {!speechSupported && (
            <p className="unsupported-hint">{t.unsupported}</p>
          )}

          <button
            type="submit"
            className="submit-btn"
            disabled={isSubmitting || !message.trim()}
          >
            {isSubmitting ? t.sending : (
              <>
                <span>{t.send}</span>
                <ArrowIcon />
              </>
            )}
          </button>
        </form>

        {submitStatus === 'success' && (
          <div className="status-msg success">{t.success}</div>
        )}
        {submitStatus === 'error' && (
          <div className="status-msg error">{t.error}</div>
        )}

      </main>

      {/* ── Fixed bottom bar ── */}
      <div className="bottom-bar">
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

    </div>
  )
}

function GlobeIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"
      strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="10" />
      <ellipse cx="12" cy="12" rx="4" ry="10" />
      <line x1="2" y1="12" x2="22" y2="12" />
    </svg>
  )
}

function ArrowIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"
      strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
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
