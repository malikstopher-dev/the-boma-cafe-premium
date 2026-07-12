'use client'

import { createContext, useContext, useState, useCallback, type ReactNode } from 'react'
import styles from './DesignSystem.module.css'

type ToastType = 'success' | 'error' | 'warning' | 'info'

interface Toast {
  id: string
  type: ToastType
  title: string
  message?: string
}

interface ToastContextValue {
  toast: (type: ToastType, title: string, message?: string) => void
  success: (title: string, message?: string) => void
  error: (title: string, message?: string) => void
  warning: (title: string, message?: string) => void
  info: (title: string, message?: string) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within ToastProvider')
  return ctx
}

const iconMap: Record<ToastType, string> = {
  success: '✓',
  error: '✕',
  warning: '⚠',
  info: 'ℹ',
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const remove = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  const add = useCallback((type: ToastType, title: string, message?: string) => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`
    setToasts(prev => [...prev, { id, type, title, message }])
    const duration = type === 'error' || type === 'warning' ? 6000 : 4000
    setTimeout(() => remove(id), duration)
  }, [remove])

  const ctx: ToastContextValue = {
    toast: add,
    success: (t, m) => add('success', t, m),
    error: (t, m) => add('error', t, m),
    warning: (t, m) => add('warning', t, m),
    info: (t, m) => add('info', t, m),
  }

  const variantMap: Record<ToastType, string> = {
    success: styles.toastSuccess,
    error: styles.toastError,
    warning: styles.toastWarning,
    info: styles.toastInfo,
  }

  return (
    <ToastContext.Provider value={ctx}>
      {children}
      {toasts.length > 0 && (
        <div className={styles.toastContainer}>
          {toasts.map(t => (
            <div key={t.id} className={`${styles.toast} ${variantMap[t.type]}`}>
              <span className={styles.toastIcon}>{iconMap[t.type]}</span>
              <div className={styles.toastContent}>
                <div className={styles.toastTitle}>{t.title}</div>
                {t.message && <div className={styles.toastMessage}>{t.message}</div>}
              </div>
              <button className={styles.toastClose} onClick={() => remove(t.id)}>×</button>
            </div>
          ))}
        </div>
      )}
    </ToastContext.Provider>
  )
}
