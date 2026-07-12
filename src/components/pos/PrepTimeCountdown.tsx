'use client'

import { useState, useEffect } from 'react'
import { posTokens as t } from '@/components/pos/DesignSystem'

interface PrepTimeCountdownProps {
  estimatedReadyAt: string | null
  prepStartedAt: string | null
  estimatedPrepMinutes: number | null
  status: string
  size?: 'sm' | 'md' | 'lg'
}

function formatCountdown(ms: number): string {
  if (ms <= 0) return 'Ready soon'
  const totalSeconds = Math.floor(ms / 1000)
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  if (minutes > 0) return `${minutes}m ${seconds}s`
  return `${seconds}s`
}

function getUrgency(remainingMs: number, totalMs: number): { color: string; bg: string; label: string } {
  if (remainingMs <= 0) return { color: '#10b981', bg: 'rgba(16,185,129,0.15)', label: 'Ready now' }
  const ratio = remainingMs / totalMs
  if (ratio > 0.3) return { color: '#10b981', bg: 'rgba(16,185,129,0.12)', label: 'On track' }
  if (ratio > 0) return { color: '#f59e0b', bg: 'rgba(245,158,11,0.12)', label: 'Almost ready' }
  return { color: '#ef4444', bg: 'rgba(239,68,68,0.12)', label: 'Overdue' }
}

const SIZE_MAP = {
  sm: { fontSize: '11px', padding: '3px 7px', gap: '4px', iconSize: '12px' },
  md: { fontSize: '13px', padding: '5px 10px', gap: '5px', iconSize: '14px' },
  lg: { fontSize: '15px', padding: '8px 14px', gap: '6px', iconSize: '16px' },
}

export default function PrepTimeCountdown({ estimatedReadyAt, prepStartedAt, estimatedPrepMinutes, status, size = 'md' }: PrepTimeCountdownProps) {
  const [now, setNow] = useState(Date.now())

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(interval)
  }, [])

  // Don't show for completed/cancelled orders
  if (['completed', 'cancelled', 'rejected'].includes(status)) return null

  // If order is ready or served, show completion
  if (status === 'ready' || status === 'served') {
    const sizeStyle = SIZE_MAP[size]
    return (
      <span style={{
        display: 'inline-flex', alignItems: 'center', gap: sizeStyle.gap,
        padding: sizeStyle.padding, fontSize: sizeStyle.fontSize,
        fontWeight: 700, fontFamily: t.typography.fontFamilyMono,
        color: '#10b981', background: 'rgba(16,185,129,0.12)',
        borderRadius: t.radius.sm, border: '1px solid rgba(16,185,129,0.25)',
        whiteSpace: 'nowrap',
      }}>
        ✅ Ready
      </span>
    )
  }

  // If no prep time set, don't show
  if (!estimatedReadyAt && !estimatedPrepMinutes) return null

  const sizeStyle = SIZE_MAP[size]

  // If we have estimated_ready_at, show countdown
  if (estimatedReadyAt) {
    const readyTime = new Date(estimatedReadyAt).getTime()
    const startTime = prepStartedAt ? new Date(prepStartedAt).getTime() : now
    const totalMs = readyTime - startTime
    const remainingMs = readyTime - now
    const urgency = getUrgency(remainingMs, totalMs)

    return (
      <span
        role="timer"
        aria-label={`Prep time: ${formatCountdown(remainingMs)}. ${urgency.label}`}
        style={{
          display: 'inline-flex', alignItems: 'center', gap: sizeStyle.gap,
          padding: sizeStyle.padding, fontSize: sizeStyle.fontSize,
          fontWeight: 700, fontFamily: t.typography.fontFamilyMono,
          color: urgency.color, background: urgency.bg,
          borderRadius: t.radius.sm, border: `1px solid ${urgency.color}30`,
          animation: remainingMs <= 0 ? 'pos-pulse 1.5s ease-in-out infinite' : undefined,
          whiteSpace: 'nowrap',
        }}
      >
        <span style={{ fontSize: sizeStyle.iconSize }}>
          {remainingMs <= 0 ? '✅' : '⏱️'}
        </span>
        {remainingMs <= 0 ? 'Ready now' : formatCountdown(remainingMs)}
      </span>
    )
  }

  // Fallback: show estimated minutes
  if (estimatedPrepMinutes) {
    return (
      <span style={{
        display: 'inline-flex', alignItems: 'center', gap: sizeStyle.gap,
        padding: sizeStyle.padding, fontSize: sizeStyle.fontSize,
        fontWeight: 700, fontFamily: t.typography.fontFamilyMono,
        color: '#3b82f6', background: 'rgba(59,130,246,0.12)',
        borderRadius: t.radius.sm, border: '1px solid rgba(59,130,246,0.25)',
        whiteSpace: 'nowrap',
      }}>
        ⏱️ ~{estimatedPrepMinutes}m
      </span>
    )
  }

  return null
}
