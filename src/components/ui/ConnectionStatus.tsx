'use client'

import { useState, useEffect } from 'react'
import { getQueueLength, processQueue } from '@/lib/offline-queue'

export default function ConnectionStatus() {
  const [online, setOnline] = useState(true)
  const [pending, setPending] = useState(0)
  const [syncing, setSyncing] = useState(false)

  useEffect(() => {
    const handler = () => {
      setOnline(navigator.onLine)
      if (navigator.onLine) {
        setSyncing(true)
        processQueue().finally(() => {
          setSyncing(false)
          setPending(getQueueLength())
        })
      }
    }
    window.addEventListener('online', handler)
    window.addEventListener('offline', () => { setOnline(false); setPending(getQueueLength()) })
    setOnline(navigator.onLine)
    setPending(getQueueLength())
    return () => {
      window.removeEventListener('online', handler)
      window.removeEventListener('offline', handler)
    }
  }, [])

  // Auto-sync every 10s when online with pending items
  useEffect(() => {
    if (!online || pending === 0) return
    const interval = setInterval(async () => {
      setSyncing(true)
      await processQueue()
      setSyncing(false)
      setPending(getQueueLength())
    }, 10000)
    return () => clearInterval(interval)
  }, [online, pending])

  if (online && pending === 0 && !syncing) return null

  return (
    <div style={{
      position: 'fixed', bottom: '1rem', right: '1rem', zIndex: 9999,
      padding: '0.5rem 1rem', borderRadius: '10px', fontSize: '0.8rem', fontWeight: 600,
      display: 'flex', alignItems: 'center', gap: '0.5rem',
      background: online ? (syncing ? '#f59e0b' : '#10b981') : '#ef4444',
      color: online ? '#000' : '#fff',
      boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
    }}>
      <span style={{ width: 8, height: 8, borderRadius: '50%', background: online ? '#000' : '#fff', display: 'inline-block' }} />
      {!online && `OFFLINE (${pending} pending)`}
      {online && syncing && `SYNCING...`}
      {online && !syncing && pending > 0 && `${pending} pending`}
    </div>
  )
}
