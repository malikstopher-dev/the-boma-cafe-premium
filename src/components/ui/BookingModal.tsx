'use client'

import { useState, FormEvent } from 'react'

interface BookingModalProps {
  isOpen: boolean
  onClose: () => void
}

type FormState = 'idle' | 'submitting' | 'success' | 'error'

export default function BookingModal({ isOpen, onClose }: BookingModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    booking_date: '',
    booking_time: '',
    guests: '2',
    notes: '',
  })
  const [formState, setFormState] = useState<FormState>('idle')
  const [errorMessage, setErrorMessage] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.name.trim()) newErrors.name = 'Name is required'
    if (!formData.phone.trim()) newErrors.phone = 'Phone is required'
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Invalid email address'
    }
    if (!formData.booking_date) newErrors.booking_date = 'Date is required'
    if (!formData.booking_time) newErrors.booking_time = 'Time is required'
    if (!formData.guests || parseInt(formData.guests) < 1) {
      newErrors.guests = 'At least 1 guest required'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!validate()) return
    if (formState === 'submitting') return

    setFormState('submitting')
    setErrorMessage('')

    try {
      const res = await fetch('/api/supabase/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name.trim(),
          phone: formData.phone.trim(),
          email: formData.email.trim(),
          booking_date: formData.booking_date,
          booking_time: formData.booking_time,
          guests: parseInt(formData.guests),
          notes: formData.notes.trim() || null,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to submit booking')
      }

      setFormState('success')
      setFormData({ name: '', phone: '', email: '', booking_date: '', booking_time: '', guests: '2', notes: '' })
    } catch (err) {
      setFormState('error')
      setErrorMessage(err instanceof Error ? err.message : 'Something went wrong')
    }
  }

  if (!isOpen) return null

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <div
        onClick={onClose}
        style={{
          position: 'absolute',
          inset: 0,
          background: 'rgba(0,0,0,0.6)',
        }}
      />
      <div
        style={{
          position: 'relative',
          background: '#fff',
          borderRadius: '20px',
          padding: '2.5rem',
          width: '90%',
          maxWidth: '520px',
          maxHeight: '90vh',
          overflowY: 'auto',
          boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
        }}
      >
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '1rem',
            right: '1rem',
            background: 'none',
            border: 'none',
            fontSize: '1.5rem',
            cursor: 'pointer',
            color: 'var(--text-light)',
            padding: '0.25rem',
          }}
        >
          ✕
        </button>

        {formState === 'success' ? (
          <div style={{ textAlign: 'center', padding: '2rem 1rem' }}>
            <div
              style={{
                width: '80px',
                height: '80px',
                background: 'linear-gradient(135deg, var(--primary), var(--secondary))',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 1.5rem',
                fontSize: '2.5rem',
                color: '#fff',
              }}
            >
              ✓
            </div>
            <h3 style={{ color: 'var(--dark-brown)', marginBottom: '0.75rem', fontSize: '1.5rem' }}>
              Booking Request Sent!
            </h3>
            <p style={{ color: 'var(--text-light)', marginBottom: '1.5rem' }}>
              We&apos;ll confirm your reservation via phone or email shortly.
            </p>
            <button
              onClick={() => { setFormState('idle'); onClose() }}
              style={{
                color: 'var(--primary)',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                textDecoration: 'underline',
                fontSize: '0.95rem',
                fontWeight: 600,
              }}
            >
              Close
            </button>
          </div>
        ) : (
          <>
            <h2
              style={{
                fontSize: '1.5rem',
                color: 'var(--dark-brown)',
                marginBottom: '0.5rem',
                fontFamily: 'var(--font-display)',
              }}
            >
              Book a Table
            </h2>
            <p style={{ color: 'var(--text-light)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
              Reserve your spot at The Boma Café
            </p>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <input
                    type="text"
                    placeholder="Your Name *"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    style={{
                      width: '100%',
                      boxSizing: 'border-box',
                      padding: '0.85rem 1rem',
                      borderRadius: '12px',
                      border: `2px solid ${errors.name ? '#ef4444' : 'transparent'}`,
                      background: 'var(--cream)',
                      fontSize: '0.95rem',
                    }}
                  />
                  {errors.name && <span style={{ color: '#ef4444', fontSize: '0.8rem' }}>{errors.name}</span>}
                </div>
                <div>
                  <input
                    type="tel"
                    placeholder="Phone Number *"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    style={{
                      width: '100%',
                      boxSizing: 'border-box',
                      padding: '0.85rem 1rem',
                      borderRadius: '12px',
                      border: `2px solid ${errors.phone ? '#ef4444' : 'transparent'}`,
                      background: 'var(--cream)',
                      fontSize: '0.95rem',
                    }}
                  />
                  {errors.phone && <span style={{ color: '#ef4444', fontSize: '0.8rem' }}>{errors.phone}</span>}
                </div>
              </div>

              <div>
                <input
                  type="email"
                  placeholder="Email Address *"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  style={{
                    width: '100%',
                    boxSizing: 'border-box',
                    padding: '0.85rem 1rem',
                    borderRadius: '12px',
                    border: `2px solid ${errors.email ? '#ef4444' : 'transparent'}`,
                    background: 'var(--cream)',
                    fontSize: '0.95rem',
                  }}
                />
                {errors.email && <span style={{ color: '#ef4444', fontSize: '0.8rem' }}>{errors.email}</span>}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <input
                    type="date"
                    value={formData.booking_date}
                    onChange={(e) => setFormData({ ...formData, booking_date: e.target.value })}
                    style={{
                      width: '100%',
                      boxSizing: 'border-box',
                      padding: '0.85rem 1rem',
                      borderRadius: '12px',
                      border: `2px solid ${errors.booking_date ? '#ef4444' : 'transparent'}`,
                      background: 'var(--cream)',
                      fontSize: '0.95rem',
                    }}
                  />
                  {errors.booking_date && <span style={{ color: '#ef4444', fontSize: '0.8rem' }}>{errors.booking_date}</span>}
                </div>
                <div>
                  <input
                    type="time"
                    value={formData.booking_time}
                    onChange={(e) => setFormData({ ...formData, booking_time: e.target.value })}
                    style={{
                      width: '100%',
                      boxSizing: 'border-box',
                      padding: '0.85rem 1rem',
                      borderRadius: '12px',
                      border: `2px solid ${errors.booking_time ? '#ef4444' : 'transparent'}`,
                      background: 'var(--cream)',
                      fontSize: '0.95rem',
                    }}
                  />
                  {errors.booking_time && <span style={{ color: '#ef4444', fontSize: '0.8rem' }}>{errors.booking_time}</span>}
                </div>
              </div>

              <div>
                <input
                  type="number"
                  placeholder="Number of Guests *"
                  min="1"
                  max="50"
                  value={formData.guests}
                  onChange={(e) => setFormData({ ...formData, guests: e.target.value })}
                  style={{
                    width: '100%',
                    boxSizing: 'border-box',
                    padding: '0.85rem 1rem',
                    borderRadius: '12px',
                    border: `2px solid ${errors.guests ? '#ef4444' : 'transparent'}`,
                    background: 'var(--cream)',
                    fontSize: '0.95rem',
                  }}
                />
                {errors.guests && <span style={{ color: '#ef4444', fontSize: '0.8rem' }}>{errors.guests}</span>}
              </div>

              <textarea
                placeholder="Special requests or notes (optional)"
                rows={3}
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                style={{
                  width: '100%',
                  boxSizing: 'border-box',
                  padding: '0.85rem 1rem',
                  borderRadius: '12px',
                  border: '2px solid transparent',
                  background: 'var(--cream)',
                  fontSize: '0.95rem',
                  resize: 'vertical',
                }}
              />

              {formState === 'error' && (
                <p style={{ color: '#ef4444', fontSize: '0.9rem', margin: 0 }}>{errorMessage}</p>
              )}

              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button
                  type="button"
                  onClick={onClose}
                  style={{
                    flex: 1,
                    padding: '0.9rem 1.5rem',
                    borderRadius: '12px',
                    border: '2px solid var(--beige-dark)',
                    background: 'var(--white)',
                    color: 'var(--dark-brown)',
                    fontWeight: 600,
                    fontSize: '0.95rem',
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formState === 'submitting'}
                  style={{
                    flex: 2,
                    padding: '0.9rem 1.5rem',
                    borderRadius: '12px',
                    border: 'none',
                    background: formState === 'submitting' ? 'var(--beige-dark)' : 'linear-gradient(135deg, var(--primary), var(--secondary))',
                    color: 'var(--white)',
                    fontWeight: 600,
                    fontSize: '0.95rem',
                    cursor: formState === 'submitting' ? 'not-allowed' : 'pointer',
                  }}
                >
                  {formState === 'submitting' ? 'Submitting...' : 'Request Booking'}
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  )
}
