import { ReactNode } from 'react'
import { OrderStatus } from '@/lib/pos/types'

interface PosCardProps {
  children: ReactNode
  status?: OrderStatus
  elevated?: boolean
  padding?: string
  className?: string
  style?: React.CSSProperties
  onClick?: () => void
}

const STATUS_BORDER_COLORS: Partial<Record<OrderStatus, string>> = {
  pending:   '#f59e0b',
  confirmed: '#3b82f6',
  preparing: '#eab308',
  packing:   '#f97316',
  ready:     '#10b981',
  served:    '#06b6d4',
  completed: '#6b7280',
  cancelled: '#ef4444',
  rejected:  '#ef4444',
}

export default function PosCard({
  children,
  status,
  elevated = false,
  padding = 'var(--pos-space-xl)',
  className,
  style,
  onClick,
}: PosCardProps) {
  const borderColor = status ? STATUS_BORDER_COLORS[status] : undefined
  const isNew = status === 'pending'

  return (
    <div
      className={className}
      onClick={onClick}
      style={{
        background: 'var(--pos-card)',
        borderRadius: 'var(--pos-radius-lg)',
        padding,
        border: borderColor ? `2px solid ${borderColor}30` : '1px solid var(--pos-border)',
        boxShadow: elevated ? 'var(--pos-shadow-md)' : 'var(--pos-shadow-sm)',
        transition: 'all var(--pos-transition)',
        animation: isNew ? 'pos-glow 2s ease-in-out infinite' : 'pos-slide-in-up 0.3s ease',
        cursor: onClick ? 'pointer' : undefined,
        position: 'relative' as const,
        overflow: 'hidden' as const,
        ...style,
      }}
      onMouseEnter={(e) => {
        if (onClick) {
          e.currentTarget.style.transform = 'translateY(-2px)'
          e.currentTarget.style.boxShadow = 'var(--pos-shadow-lg)'
        }
      }}
      onMouseLeave={(e) => {
        if (onClick) {
          e.currentTarget.style.transform = 'translateY(0)'
          e.currentTarget.style.boxShadow = elevated ? 'var(--pos-shadow-md)' : 'var(--pos-shadow-sm)'
        }
      }}
    >
      {borderColor && (
        <div
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            bottom: 0,
            width: '3px',
            background: borderColor,
            borderRadius: '3px 0 0 3px',
          }}
        />
      )}
      {children}
    </div>
  )
}
