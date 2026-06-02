import { useState } from 'react'
import { useAppStore } from '../../store/useAppStore'
import { WEBHOOK_URL } from '../../constants/webhook'
import { ArrowIcon, CloseIcon, CheckIcon } from '../icons'
import './MessageForm.css'

export function MessageForm({ message, setMessage, isListening, speechSupported, onStop }) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitStatus, setSubmitStatus] = useState(null) // null | 'success' | 'error'
  const [phoneInput, setPhoneInput] = useState('')

  const t = useAppStore((s) => s.t)
  const dir = useAppStore((s) => s.dir)
  const savedPhone = useAppStore((s) => s.savedPhone)
  const setSavedPhone = useAppStore((s) => s.setSavedPhone)
  const clearSavedPhone = useAppStore((s) => s.clearSavedPhone)

  // The number that will be sent: saved number takes priority until cleared
  const phoneValue = savedPhone || phoneInput

  const handleClearPhone = () => {
    clearSavedPhone()  // removes from store + localStorage immediately
    setPhoneInput('')
  }

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
        body: JSON.stringify({
          message: message.trim(),
          ...(phoneValue.trim() && { phone: phoneValue.trim() }),
        }),
      })

      if (res.ok) {
        // Persist a newly typed phone number after successful send
        if (phoneInput.trim()) {
          setSavedPhone(phoneInput.trim())
          setPhoneInput('')
        }
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

        {/* ── Message textarea ── */}
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

        <div className="card-divider" />

        {/* ── Phone number ── */}
        <label className="card-label" htmlFor="phone">{t.phoneLabel}</label>

        {savedPhone ? (
          <div className="phone-display">
            <span className="phone-check-icon"><CheckIcon /></span>
            <span className="phone-number" dir="ltr">{savedPhone}</span>
            <button
              type="button"
              className="phone-clear-btn"
              onClick={handleClearPhone}
              aria-label={t.phoneClear}
              disabled={isSubmitting}
            >
              <CloseIcon />
            </button>
          </div>
        ) : (
          <input
            type="tel"
            id="phone"
            className="phone-input"
            value={phoneInput}
            onChange={(e) => setPhoneInput(e.target.value)}
            placeholder={t.phonePlaceholder}
            disabled={isSubmitting}
            dir="ltr"
          />
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
        disabled={isSubmitting || !message.trim() || !phoneValue.trim()}
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
