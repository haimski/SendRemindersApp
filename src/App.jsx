import { useState, useRef, useEffect } from 'react'
import './App.css'

const WEBHOOK_URL = 'https://hook.eu1.make.com/w4jjrpb65n7an75ur1vjqh0u16svpqw7'

const T = {
  en: {
    title: 'Send A Reminder to Yourself',
    label: 'Your message',
    placeholder: 'Type your message here…',
    listeningHint: 'Listening — tap the mic to stop',
    unsupported: 'Voice input is not supported in this browser.',
    send: 'Send Message',
    sending: 'Sending…',
    success: 'Message sent successfully!',
    error: 'Something went wrong. Please try again.',
    langSwitch: 'עב',
  },
  he: {
    title: 'שלח תזכורת לעצמך',
    label: 'ההודעה שלך',
    placeholder: 'הקלד את ההודעה כאן…',
    listeningHint: 'מאזין — הקש על המיקרופון כדי לעצור',
    unsupported: 'קלט קולי אינו נתמך בדפדפן זה.',
    send: 'שלח',
    sending: 'שולח…',
    success: 'ההודעה נשלחה בהצלחה!',
    error: 'משהו השתבש. אנא נסה שוב.',
    langSwitch: 'EN',
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
  }

  const toggleListening = () => {
    if (isListening) {
      stopListening()
    } else {
      startListening()
    }
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
    <div className="page" dir={dir}>
      <div className="card">
        <div className="card-top">
          <h1 className="title">{t.title}</h1>
          <button
            className="lang-btn"
            onClick={handleLangSwitch}
            aria-label="Switch language"
          >
            {t.langSwitch}
          </button>
        </div>

        <form onSubmit={handleSubmit} className="form" noValidate>
          <label className="label" htmlFor="message">
            {t.label}
          </label>

          <div className="textarea-wrap">
            <textarea
              id="message"
              className="textarea"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={t.placeholder}
              disabled={isSubmitting}
              dir={dir}
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
            {isSubmitting ? t.sending : t.send}
          </button>
        </form>

        {submitStatus === 'success' && (
          <div className="status-msg success">{t.success}</div>
        )}
        {submitStatus === 'error' && (
          <div className="status-msg error">{t.error}</div>
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
