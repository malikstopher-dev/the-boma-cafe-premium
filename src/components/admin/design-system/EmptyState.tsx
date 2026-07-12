'use client'

import Button from './Button'
import styles from './DesignSystem.module.css'

export default function EmptyState({ icon, title, description, action, onAction }: {
  icon?: string
  title: string
  description?: string
  action?: string
  onAction?: () => void
}) {
  return (
    <div className={styles.emptyState}>
      {icon && <div className={styles.emptyStateIcon}>{icon}</div>}
      <div className={styles.emptyStateTitle}>{title}</div>
      {description && <div className={styles.emptyStateDescription}>{description}</div>}
      {action && onAction && (
        <Button variant="primary" onClick={onAction}>{action}</Button>
      )}
    </div>
  )
}
