'use client'

import { useState } from 'react'
import PinKeypad from './PinKeypad'
import { posTokens as t } from '@/components/pos/DesignSystem'

interface ManagerOverrideProps {
  action: string
  description: string
  onApprove: (managerId: string, reason: string) => void
  onCancel: () => void
}

export default function ManagerOverride({ action, description, onApprove, onCancel }: ManagerOverrideProps) {
  const [step, setStep] = useState<'reason' | 'pin'>('reason')
  const [reason, setReason] = useState('')
  const [managerEmployeeId, setManagerEmployeeId] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const handleReasonSubmit = () => {
    if (!reason.trim()) {
      setError('Please enter a reason')
      return
    }
    setStep('pin')
    setError(null)
  }

  const handlePinComplete = async (pin: string) => {
    if (!managerEmployeeId.trim()) {
      setError('Please enter Manager Employee ID')
      return
    }

    setSubmitting(true)
    setError(null)

    try {
      // Verify manager PIN
      const res = await fetch('/api/staff/pin-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employee_id: managerEmployeeId.trim(),
          pin,
        }),
      })

      if (res.ok) {
        const data = await res.json()
        if (data.staff.role === 'admin' || data.staff.role === 'manager') {
          onApprove(data.staff.id, reason)
        } else {
          setError('Only managers can approve this action')
        }
      } else {
        const data = await res.json().catch(() => ({}))
        setError(data.error || 'Invalid manager credentials')
      }
    } catch {
      setError('Connection error')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 2000,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)',
      padding: 16,
    }}>
      <div style={{
        background: t.colors.bg.surface, borderRadius: 24,
        padding: '32px 24px', width: '100%', maxWidth: 400,
        border: `1px solid ${t.colors.border.default}`,
        boxShadow: t.shadow.lg,
      }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>⚠️</div>
          <h2 style={{ fontSize: 20, fontWeight: t.typography.fontWeight.bold, color: t.colors.text.primary, margin: 0 }}>Manager Required</h2>
          <p style={{ fontSize: 13, color: t.colors.text.muted, marginTop: 8 }}>{description}</p>
        </div>

        {step === 'reason' ? (
          /* Step 1: Reason */
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: t.typography.fontWeight.semibold, color: t.colors.text.muted, marginBottom: 8 }}>Reason *</label>
            <textarea
              value={reason}
              onChange={e => { setReason(e.target.value); setError(null) }}
              placeholder="Enter reason for this action..."
              rows={3}
              style={{
                width: '100%', padding: '12px 14px', borderRadius: t.radius.lg,
                border: `2px solid ${error ? '#EF4444' : t.colors.border.default}`,
                background: 'rgba(255,255,255,0.05)', color: t.colors.text.primary,
                fontSize: 14, fontFamily: t.typography.fontFamily, outline: 'none',
                resize: 'vertical', boxSizing: 'border-box',
              }}
            />
            {error && <p style={{ color: '#EF4444', fontSize: 12, marginTop: 4 }}>{error}</p>}

            <div style={{ display: 'flex', gap: 12, marginTop: 20 }}>
              <button
                onClick={onCancel}
                style={{
                  flex: 1, padding: '12px 16px', borderRadius: t.radius.lg,
                  border: `1px solid ${t.colors.border.default}`, background: 'transparent',
                  color: t.colors.text.muted, fontSize: 14, fontWeight: t.typography.fontWeight.semibold,
                  cursor: 'pointer', fontFamily: t.typography.fontFamily,
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleReasonSubmit}
                style={{
                  flex: 1, padding: '12px 16px', borderRadius: t.radius.lg,
                  border: 'none', background: '#F59E0B', color: '#000',
                  fontSize: 14, fontWeight: t.typography.fontWeight.bold,
                  cursor: 'pointer', fontFamily: t.typography.fontFamily,
                }}
              >
                Continue →
              </button>
            </div>
          </div>
        ) : (
          /* Step 2: Manager PIN */
          <div>
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: t.typography.fontWeight.semibold, color: t.colors.text.muted, marginBottom: 8 }}>Manager Employee ID</label>
              <input
                type="text"
                value={managerEmployeeId}
                onChange={e => { setManagerEmployeeId(e.target.value.toUpperCase()); setError(null) }}
                placeholder="e.g., M001"
                style={{
                  width: '100%', padding: '12px 14px', borderRadius: t.radius.lg,
                  border: `2px solid ${t.colors.border.default}`,
                  background: 'rgba(255,255,255,0.05)', color: t.colors.text.primary,
                  fontSize: 16, fontFamily: t.typography.fontFamilyMono, outline: 'none',
                  textTransform: 'uppercase', letterSpacing: 2, boxSizing: 'border-box',
                }}
              />
            </div>

            <div style={{ textAlign: 'center', marginBottom: 16 }}>
              <p style={{ fontSize: 13, color: t.colors.text.muted }}>Enter manager PIN to approve</p>
            </div>

            <PinKeypad
              pinLength={6}
              onPinComplete={handlePinComplete}
              disabled={submitting}
              error={error}
              onClearError={() => setError(null)}
            />

            <button
              onClick={() => { setStep('reason'); setError(null) }}
              style={{
                width: '100%', marginTop: 16, padding: '10px 16px', borderRadius: t.radius.sm,
                border: 'none', background: 'transparent', color: t.colors.text.dim,
                fontSize: 13, cursor: 'pointer', fontFamily: t.typography.fontFamily,
              }}
            >
              ← Back to reason
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
