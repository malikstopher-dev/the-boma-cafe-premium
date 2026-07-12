'use client'

import { posTokens as t } from '@/components/pos/DesignSystem'

interface PrepTimeSelectorProps {
  open: boolean
  station: 'kitchen' | 'bar'
  orderRef: string
  onSelect: (minutes: number) => void
  onSkip: () => void
  onClose: () => void
  loading?: boolean
}

const KITCHEN_PRESETS = [
  { label: '5 min', value: 5, emoji: '⚡' },
  { label: '10 min', value: 10, emoji: '🍳' },
  { label: '15 min', value: 15, emoji: '🥘' },
  { label: '20 min', value: 20, emoji: '🍲' },
  { label: '30 min', value: 30, emoji: '🥩' },
  { label: '45 min', value: 45, emoji: '🎂' },
  { label: '60 min', value: 60, emoji: '🕐' },
]

const BAR_PRESETS = [
  { label: '2 min', value: 2, emoji: '⚡' },
  { label: '5 min', value: 5, emoji: '🍹' },
  { label: '8 min', value: 8, emoji: '🍸' },
  { label: '10 min', value: 10, emoji: '🧊' },
  { label: '15 min', value: 15, emoji: '🍷' },
  { label: '20 min', value: 20, emoji: '🥃' },
]

export default function PrepTimeSelector({ open, station, orderRef, onSelect, onSkip, onClose, loading }: PrepTimeSelectorProps) {
  if (!open) return null

  const presets = station === 'bar' ? BAR_PRESETS : KITCHEN_PRESETS
  const accentColor = station === 'bar' ? '#8b5cf6' : '#f59e0b'

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 16,
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: t.colors.bg.surface, borderRadius: 20,
          padding: '28px 24px', width: '100%', maxWidth: 400,
          border: `1px solid ${t.colors.border.default}`,
          boxShadow: t.shadow.lg,
        }}
      >
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 20 }}>
          <div style={{ fontSize: 40, marginBottom: 8 }}>{station === 'bar' ? '🍹' : '🔥'}</div>
          <h2 style={{
            fontSize: t.typography.fontSize.xl, fontWeight: t.typography.fontWeight.extrabold,
            color: t.colors.text.primary, margin: '0 0 4px', fontFamily: t.typography.fontFamily,
          }}>
            Set Prep Time
          </h2>
          <p style={{
            fontSize: t.typography.fontSize.sm, color: t.colors.text.muted, margin: 0,
            fontFamily: t.typography.fontFamily,
          }}>
            {orderRef} — {station === 'bar' ? 'Bar' : 'Kitchen'}
          </p>
        </div>

        {/* Quick-select grid */}
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))',
          gap: 8, marginBottom: 16,
        }}>
          {presets.map(preset => (
            <button
              key={preset.value}
              onClick={() => onSelect(preset.value)}
              disabled={loading}
              style={{
                padding: '14px 8px', borderRadius: t.radius.lg,
                border: `1px solid ${t.colors.border.default}`,
                background: 'rgba(255,255,255,0.04)',
                color: t.colors.text.primary,
                fontSize: t.typography.fontSize.md,
                fontWeight: t.typography.fontWeight.bold,
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.5 : 1,
                fontFamily: t.typography.fontFamily,
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.background = `${accentColor}20`
                e.currentTarget.style.borderColor = accentColor
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = 'rgba(255,255,255,0.04)'
                e.currentTarget.style.borderColor = t.colors.border.default
              }}
            >
              <span style={{ fontSize: 20 }}>{preset.emoji}</span>
              <span>{preset.label}</span>
            </button>
          ))}
        </div>

        {/* Skip button */}
        <button
          onClick={onSkip}
          disabled={loading}
          style={{
            width: '100%', padding: '12px 16px', borderRadius: t.radius.lg,
            border: `1px solid ${t.colors.border.default}`,
            background: 'transparent',
            color: t.colors.text.muted,
            fontSize: t.typography.fontSize.md,
            fontWeight: t.typography.fontWeight.semibold,
            cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.5 : 1,
            fontFamily: t.typography.fontFamily,
            transition: 'all 0.15s ease',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.color = t.colors.text.secondary
            e.currentTarget.style.borderColor = t.colors.border.strong
          }}
          onMouseLeave={e => {
            e.currentTarget.style.color = t.colors.text.muted
            e.currentTarget.style.borderColor = t.colors.border.default
          }}
        >
          Start without time estimate
        </button>

        {loading && (
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            gap: 8, marginTop: 12, color: accentColor,
            fontSize: t.typography.fontSize.sm, fontWeight: t.typography.fontWeight.semibold,
          }}>
            <div style={{
              width: 16, height: 16,
              border: `2px solid ${accentColor}40`, borderTopColor: accentColor,
              borderRadius: '50%', animation: 'spin 0.8s linear infinite',
            }} />
            Starting prep...
          </div>
        )}
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
