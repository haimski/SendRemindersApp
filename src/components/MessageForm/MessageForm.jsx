import { useState } from 'react'
import { useAppStore } from '../../store/useAppStore'
import { WEBHOOK_URL } from '../../constants/webhook'
import { ArrowIcon } from '../icons'
import './MessageForm.css'

export function MessageForm({ message, setMessage, isListening, speechSupported, onStop }) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitStatus, setSubmitStatus] = useState(null) // null | 'success' | 'error'

  const t = useAppStore((s) => s.t)
  const dir = useAppStore((s) => s.dir)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!message.trim() || isSubmitting) return
    if (isListening) onStop()

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
        console.error('Webhook error:', res.status, res.statusText)
        setSubmitStatus('error')
      }
    } catch (err) {
      console.error('Webhook failed:', err.name, err.message)
      setSubmitStatus('error')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
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

      {submitStatus === 'success' && (
        <div className="status-msg success">{t.success}</div>
      )}
      {submitStatus === 'error' && (
        <div className="status-msg error">{t.error}</div>
      )}
    </form>
  )
}
