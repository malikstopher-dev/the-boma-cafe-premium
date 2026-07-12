'use client'

import { type HTMLAttributes, forwardRef } from 'react'
import styles from './DesignSystem.module.css'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  interactive?: boolean
  selected?: void
}

const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ interactive = false, className = '', children, ...props }, ref) => {
    const classes = [
      styles.card,
      interactive ? styles.cardInteractive : '',
      className,
    ].filter(Boolean).join(' ')

    return (
      <div ref={ref} className={classes} {...props}>
        {children}
      </div>
    )
  }
)

Card.displayName = 'Card'
export default Card

export function StatCard({ value, label, trend, trendDirection }: {
  value: string | number
  label: string
  trend?: string
  trendDirection?: 'up' | 'down'
}) {
  return (
    <div className={styles.statCard}>
      <div className={styles.statCardValue}>{value}</div>
      <div className={styles.statCardLabel}>{label}</div>
      {trend && (
        <div className={`${styles.statCardTrend} ${trendDirection === 'down' ? styles.statCardTrendDown : styles.statCardTrendUp}`}>
          {trendDirection === 'down' ? '↓' : '↑'} {trend}
        </div>
      )}
    </div>
  )
}
