'use client'

import { useState, useEffect, useCallback } from 'react'
import PinKeypad from './PinKeypad'
import { posTokens as t } from '@/components/pos/DesignSystem'

interface LockScreenProps {
  staffName: string
  employeeId: string
  role: string
  onUnlock: (pin: string) => Promise<boolean>
  onSignOut: () => void
  onManagerOverride?: () => void
}

export default function LockScreen({ staffName, employeeId, role, onUnlock, onSignOut, onManagerOverride }: LockScreenProps) {
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [idleTime, setIdleTime] = useState(0)

  // Track idle time
  useEffect(() => {
    const interval = setInterval(() => {
      setIdleTime(prev => prev + 1)
    }, 1000)
    return () => clearInterval(interval)
  }, [])

  const handlePinComplete = async (pin: string) => {
    setSubmitting(true)
    setError(null)
    try {
      const success = await onUnlock(pin)
      if (!success) {
        setError('Invalid PIN')
      }
    } catch {
      setError('Connection error')
    } finally {
      setSubmitting(false)
    }
  }

  const formatIdleTime = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`
    const minutes = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${minutes}m ${secs}s`
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      background: t.colors.bg.primary,
      backdropFilter: 'blur(20px)',
    }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } } @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }`}</style>

      {/* Staff info */}
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, marginBottom: 40,
        animation: 'fadeIn 0.3s ease',
      }}>
        <div style={{
          width: 80, height: 80, borderRadius: '50%',
          background: 'rgba(245,158,11,0.12)', border: '2px solid rgba(245,158,11,0.3)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 36,
        }}>
          {role === 'waiter' ? '👤' : role === 'kitchen' ? '👨‍🍳' : role === 'bar' ? '🍸' : '👤'}
        </div>
        <div style={{ textAlign: 'center' }}>
          <h2 style={{ fontSize: 24, fontWeight: t.typography.fontWeight.bold, color: t.colors.text.primary, margin: 0 }}>{staffName}</h2>
          <p style={{ fontSize: 13, color: t.colors.text.dim, fontFamily: t.typography.fontFamilyMono, marginTop: 4 }}>{employeeId}</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 12px', borderRadius: t.radius.full, background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.2)' }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#EF4444' }} />
          <span style={{ fontSize: 12, color: '#EF4444', fontWeight: t.typography.fontWeight.semibold }}>Locked</span>
          <span style={{ fontSize: 11, color: t.colors.text.dim, marginLeft: 4 }}>{formatIdleTime(idleTime)}</span>
        </div>
      </div>

      {/* PIN entry */}
      <div style={{ width: '100%', maxWidth: 360 }}>
        <PinKeypad
          pinLength={6}
          onPinComplete={handlePinComplete}
          disabled={submitting}
          error={error}
          onClearError={() => setError(null)}
        />
      </div>

      {/* Actions */}
      <div style={{ marginTop: 32, display: 'flex', flexDirection: 'column', gap: 12, alignItems: 'center' }}>
        <button
          onClick={onSignOut}
          style={{
            padding: '10px 24px', borderRadius: t.radius.lg,
            border: `1px solid rgba(239,68,68,0.3)`, background: 'transparent',
            color: '#EF4444', fontSize: 14, fontWeight: t.typography.fontWeight.semibold,
            cursor: 'pointer', fontFamily: t.typography.fontFamily,
          }}
        >
          Sign out completely
        </button>
        {onManagerOverride && (
          <button
            onClick={onManagerOverride}
            style={{
              padding: '8px 16px', borderRadius: t.radius.sm,
              border: 'none', background: 'transparent',
              color: t.colors.text.dim, fontSize: 12, cursor: 'pointer',
              fontFamily: t.typography.fontFamily,
            }}
          >
            Manager override
          </button>
        )}
      </div>
    </div>
  )
}
