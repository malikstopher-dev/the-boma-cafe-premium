'use client'

import { useState, useCallback } from 'react'

interface PinKeypadProps {
  pinLength?: number
  onPinComplete: (pin: string) => void
  disabled?: boolean
  error?: string | null
  onClearError?: () => void
}

export default function PinKeypad({ pinLength = 6, onPinComplete, disabled = false, error, onClearError }: PinKeypadProps) {
  const [pin, setPin] = useState('')

  const handleDigit = useCallback((digit: string) => {
    if (disabled) return
    if (pin.length >= pinLength) return
    onClearError?.()
    const newPin = pin + digit
    setPin(newPin)
    if (newPin.length === pinLength) {
      onPinComplete(newPin)
    }
  }, [pin, pinLength, disabled, onPinComplete, onClearError])

  const handleBackspace = useCallback(() => {
    if (disabled) return
    onClearError?.()
    setPin(prev => prev.slice(0, -1))
  }, [disabled, onClearError])

  const handleClear = useCallback(() => {
    if (disabled) return
    onClearError?.()
    setPin('')
  }, [disabled, onClearError])

  const digits = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', 'del']

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 24 }}>
      {/* PIN display */}
      <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
        {Array.from({ length: pinLength }).map((_, i) => (
          <div
            key={i}
            style={{
              width: 16,
              height: 16,
              borderRadius: '50%',
              background: i < pin.length ? '#F59E0B' : 'rgba(255,255,255,0.15)',
              border: `2px solid ${error ? '#EF4444' : i < pin.length ? '#F59E0B' : 'rgba(255,255,255,0.2)'}`,
              transition: 'all 0.15s ease',
              transform: i < pin.length ? 'scale(1.1)' : 'scale(1)',
            }}
          />
        ))}
      </div>

      {/* Error message */}
      {error && (
        <div style={{ color: '#EF4444', fontSize: 14, fontWeight: 500, textAlign: 'center', minHeight: 20 }}>
          {error}
        </div>
      )}
      {!error && <div style={{ minHeight: 20 }} />}

      {/* Keypad grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, width: '100%', maxWidth: 280 }}>
        {digits.map((digit, i) => {
          if (digit === '') return <div key={i} />
          if (digit === 'del') {
            return (
              <button
                key={i}
                onClick={handleBackspace}
                disabled={disabled || pin.length === 0}
                style={{
                  width: 72,
                  height: 72,
                  borderRadius: 16,
                  border: '1px solid rgba(255,255,255,0.1)',
                  background: 'rgba(255,255,255,0.05)',
                  color: '#94A3B8',
                  fontSize: 20,
                  fontWeight: 600,
                  cursor: disabled || pin.length === 0 ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontFamily: 'Inter, -apple-system, sans-serif',
                  opacity: disabled || pin.length === 0 ? 0.4 : 1,
                  transition: 'all 0.15s',
                }}
              >
                ⌫
              </button>
            )
          }
          return (
            <button
              key={i}
              onClick={() => handleDigit(digit)}
              disabled={disabled || pin.length >= pinLength}
              style={{
                width: 72,
                height: 72,
                borderRadius: 16,
                border: '1px solid rgba(255,255,255,0.1)',
                background: 'rgba(255,255,255,0.05)',
                color: '#F8F9FB',
                fontSize: 28,
                fontWeight: 700,
                cursor: disabled || pin.length >= pinLength ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontFamily: 'Inter, -apple-system, sans-serif',
                transition: 'all 0.15s',
              }}
              onMouseDown={e => {
                if (!disabled) {
                  const el = e.currentTarget as any
                  el.style.background = 'rgba(255,255,255,0.15)'
                  el.style.transform = 'scale(0.95)'
                }
              }}
              onMouseUp={e => {
                const el = e.currentTarget as any
                el.style.background = 'rgba(255,255,255,0.05)'
                el.style.transform = 'scale(1)'
              }}
              onMouseLeave={e => {
                const el = e.currentTarget as any
                el.style.background = 'rgba(255,255,255,0.05)'
                el.style.transform = 'scale(1)'
              }}
            >
              {digit}
            </button>
          )
        })}
      </div>

      {/* Clear button */}
      <button
        onClick={handleClear}
        disabled={disabled || pin.length === 0}
        style={{
          padding: '8px 24px',
          borderRadius: 8,
          border: '1px solid rgba(255,255,255,0.1)',
          background: 'transparent',
          color: '#94A3B8',
          fontSize: 13,
          fontWeight: 500,
          cursor: disabled || pin.length === 0 ? 'not-allowed' : 'pointer',
          fontFamily: 'Inter, -apple-system, sans-serif',
          opacity: disabled || pin.length === 0 ? 0.4 : 1,
        }}
      >
        Clear
      </button>
    </div>
  )
}
