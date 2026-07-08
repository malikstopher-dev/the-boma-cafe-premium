'use client'

import { useState, useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'

const FcmRegistration = dynamic(() => import('@/components/staff/FcmRegistration'), { ssr: false })

const NAV_ITEMS: Record<string, { label: string; icon: string }[]> = {
  admin: [
    { label: 'Dashboard', icon: '📊' },
    { label: 'Orders', icon: '📋' },
    { label: 'Messages', icon: '💬' },
    { label: 'Staff', icon: '👥' },
  ],
  kitchen: [
    { label: 'Orders', icon: '👨‍🍳' },
    { label: 'Messages', icon: '💬' },
  ],
  waiter: [
    { label: 'Orders', icon: '📋' },
    { label: 'Tables', icon: '🪑' },
    { label: 'Messages', icon: '💬' },
  ],
}

export default function StaffLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const [role, setRole] = useState<string | null>(null)
  const [authed, setAuthed] = useState(false)
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    fetch('/api/admin/auth')
      .then(r => r.json())
      .then(data => {
        if (data.authenticated && data.role) {
          setAuthed(true)
          setRole(data.role)
        } else {
          setAuthed(false)
          setRole(null)
        }
      })
      .catch(() => { setAuthed(false) })
      .finally(() => setChecking(false))

    // Ensure user_id exists in localStorage for FCM push registration
    ;(async () => {
      if (!localStorage.getItem('boma_staff_user_id')) {
        const { v4: uuidv4 } = await import('uuid')
        localStorage.setItem('boma_staff_user_id', uuidv4())
      }
    })()
  }, [])

  const handleLogout = async () => {
    await fetch('/api/admin/auth', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'logout' }) })
    setAuthed(false)
    setRole(null)
    router.push('/staff/login')
  }

  const isLoginPage = pathname === '/staff/login'
  const isInstallPage = pathname === '/staff/install'

  if (checking) {
    return (
      <div style={{ minHeight: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0f0f1a', color: 'rgba(255,255,255,0.5)' }}>
        Loading...
      </div>
    )
  }

  if (!authed && !isLoginPage) {
    if (typeof window !== 'undefined') router.push('/staff/login')
    return null
  }

  const nav = role ? NAV_ITEMS[role] || [] : []
  const showNav = authed && !isLoginPage && !isInstallPage

  return (
    <div style={{ minHeight: '100dvh', background: '#0f0f1a', color: '#fff', display: 'flex', flexDirection: 'column', fontFamily: "'Inter', -apple-system, sans-serif", overflow: 'hidden', maxHeight: '100dvh' }}>
      <FcmRegistration />
      {/* Top bar */}
      {authed && !isLoginPage && !isInstallPage && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem 1rem', background: '#16162a', borderBottom: '1px solid rgba(255,255,255,0.06)', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span style={{ fontSize: '1.2rem', fontWeight: 800, color: '#f59e0b', letterSpacing: '-0.02em' }}>Boma</span>
            <span style={{ padding: '0.15rem 0.5rem', borderRadius: '4px', background: role === 'admin' ? 'rgba(59,130,246,0.2)' : role === 'kitchen' ? 'rgba(139,92,246,0.2)' : 'rgba(16,185,129,0.2)', color: role === 'admin' ? '#60a5fa' : role === 'kitchen' ? '#a78bfa' : '#34d399', fontWeight: 600, textTransform: 'uppercase', fontSize: '0.65rem' }}>
              {role}
            </span>
          </div>
          <button onClick={handleLogout} style={{ padding: '0.35rem 0.75rem', borderRadius: '8px', border: '1px solid rgba(239,68,68,0.3)', background: 'transparent', color: '#ef4444', fontSize: '0.8rem', cursor: 'pointer' }}>
            Sign Out
          </button>
        </div>
      )}

      {/* Content */}
      <div style={{ flex: 1, overflow: 'auto', WebkitOverflowScrolling: 'touch' }}>
        {children}
      </div>

      {/* Bottom nav */}
      {showNav && (
        <div style={{ display: 'flex', background: '#16162a', borderTop: '1px solid rgba(255,255,255,0.06)', flexShrink: 0, paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
          {nav.map((item) => {
            const href = item.label === 'Orders' ? (role === 'kitchen' ? '/staff/kitchen' : '/staff/admin') :
              item.label === 'Dashboard' ? '/staff/admin' :
              item.label === 'Tables' ? '/staff/waiter' :
              item.label === 'Messages' ? '/staff/messages' :
              item.label === 'Staff' ? '/staff/admin' : '#'
            const active = pathname === href
            return (
              <button
                key={item.label}
                onClick={() => router.push(href)}
                style={{
                  flex: 1, padding: '0.6rem 0.25rem', border: 'none', background: 'transparent',
                  color: active ? '#f59e0b' : 'rgba(255,255,255,0.4)', cursor: 'pointer',
                  fontSize: '0.65rem', fontWeight: active ? 700 : 500, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.15rem',
                  transition: 'color 0.15s',
                }}
              >
                <span style={{ fontSize: '1.2rem' }}>{item.icon}</span>
                <span>{item.label}</span>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
