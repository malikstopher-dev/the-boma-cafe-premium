'use client'

import { useEffect, useState } from 'react'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export default function StaffInstall() {
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [installed, setInstalled] = useState(false)
  const [supportsPWA, setSupportsPWA] = useState(false)

  useEffect(() => {
    setSupportsPWA('serviceWorker' in navigator && 'BeforeInstallPromptEvent' in window)

    const handler = (e: Event) => {
      e.preventDefault()
      setInstallPrompt(e as BeforeInstallPromptEvent)
    }
    window.addEventListener('beforeinstallprompt', handler)

    window.addEventListener('appinstalled', () => {
      setInstalled(true)
      setInstallPrompt(null)
    })

    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  const handleInstall = async () => {
    if (!installPrompt) return
    installPrompt.prompt()
    const result = await installPrompt.userChoice
    if (result.outcome === 'accepted') setInstalled(true)
    setInstallPrompt(null)
  }

  return (
    <div style={{ minHeight: '100dvh', padding: '2rem 1.5rem', background: '#0f0f1a', color: '#fff' }}>
      <div style={{ maxWidth: '500px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <div style={{ fontSize: '4rem', marginBottom: '0.75rem' }}>📲</div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#f59e0b', margin: 0, letterSpacing: '-0.02em' }}>Install Boma Staff App</h1>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.9rem', marginTop: '0.5rem', lineHeight: 1.5 }}>
            Get the fastest access to your staff dashboard — works offline, feels like a real app.
          </p>
        </div>

        {installed && (
          <div style={{ padding: '1rem', borderRadius: '12px', background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)', textAlign: 'center', marginBottom: '2rem' }}>
            <span style={{ color: '#34d399', fontWeight: 700, fontSize: '1rem' }}>✓ Boma Staff App is installed</span>
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '2rem' }}>
          {/* Android */}
          <div style={{ padding: '1.25rem', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.06)', background: '#16162a' }}>
            <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🤖</div>
            <h3 style={{ margin: '0 0 0.25rem', fontSize: '1rem', fontWeight: 700 }}>Android</h3>
            <ol style={{ margin: '0.5rem 0 0', padding: '0 0 0 1.25rem', color: 'rgba(255,255,255,0.5)', fontSize: '0.85rem', lineHeight: 1.8 }}>
              <li>Tap the <strong>⋮</strong> menu (Chrome)</li>
              <li>Select <strong>Install app</strong> or <strong>Add to Home screen</strong></li>
              <li>The app installs and opens like any native app</li>
            </ol>
          </div>

          {/* iPhone */}
          <div style={{ padding: '1.25rem', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.06)', background: '#16162a' }}>
            <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🍎</div>
            <h3 style={{ margin: '0 0 0.25rem', fontSize: '1rem', fontWeight: 700 }}>iPhone / iPad</h3>
            <ol style={{ margin: '0.5rem 0 0', padding: '0 0 0 1.25rem', color: 'rgba(255,255,255,0.5)', fontSize: '0.85rem', lineHeight: 1.8 }}>
              <li>Tap the <strong>Share</strong> icon <span style={{ fontSize: '1rem' }}>⎙</span></li>
              <li>Scroll down and tap <strong>Add to Home Screen</strong></li>
              <li>Tap <strong>Add</strong> in the top right</li>
            </ol>
          </div>

          {/* Windows */}
          <div style={{ padding: '1.25rem', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.06)', background: '#16162a' }}>
            <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>💻</div>
            <h3 style={{ margin: '0 0 0.25rem', fontSize: '1rem', fontWeight: 700 }}>Windows / Desktop</h3>
            <ol style={{ margin: '0.5rem 0 0', padding: '0 0 0 1.25rem', color: 'rgba(255,255,255,0.5)', fontSize: '0.85rem', lineHeight: 1.8 }}>
              <li>Click the <strong>⊕</strong> install icon in the address bar</li>
              <li>Click <strong>Install</strong></li>
              <li>Opens from Start Menu as "Boma Staff POS"</li>
            </ol>
          </div>
        </div>

        {installPrompt && !installed && (
          <button
            onClick={handleInstall}
            style={{
              width: '100%', padding: '1.25rem', border: 'none', borderRadius: '16px',
              background: '#f59e0b', color: '#000', fontSize: '1.2rem', fontWeight: 800,
              cursor: 'pointer', marginBottom: '1rem',
            }}
          >
            📲 Install Boma Staff App
          </button>
        )}

        <a href="/staff/login" style={{ display: 'block', textAlign: 'center', color: 'rgba(255,255,255,0.3)', fontSize: '0.9rem', textDecoration: 'underline', textUnderlineOffset: '2px' }}>
          Back to Login
        </a>
      </div>
    </div>
  )
}
