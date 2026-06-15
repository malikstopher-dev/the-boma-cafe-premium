'use client'

import { useState, useEffect } from 'react'

interface Waiter {
  id: string
  name: string
  active: boolean
  created_at: string
}

export default function WaitersPage() {
  const [waiters, setWaiters] = useState<Waiter[]>([])
  const [newName, setNewName] = useState('')
  const [editId, setEditId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [loading, setLoading] = useState(false)

  const loadWaiters = async () => {
    try {
      const res = await fetch('/api/waiters')
      if (res.ok) setWaiters(await res.json())
    } catch { /* */ }
  }

  useEffect(() => { loadWaiters() }, [])

  const addWaiter = async () => {
    if (!newName.trim()) return
    setLoading(true)
    try {
      const res = await fetch('/api/waiters', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newName.trim() }),
      })
      if (res.ok) {
        setNewName('')
        await loadWaiters()
      }
    } catch { /* */ } finally { setLoading(false) }
  }

  const toggleActive = async (id: string, active: boolean) => {
    try {
      await fetch(`/api/waiters?id=${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active: !active }),
      })
      await loadWaiters()
    } catch { /* */ }
  }

  const updateName = async (id: string) => {
    if (!editName.trim()) return
    try {
      await fetch(`/api/waiters?id=${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: editName.trim() }),
      })
      setEditId(null)
      await loadWaiters()
    } catch { /* */ }
  }

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
      <h1 style={{ fontSize: '1.5rem', color: 'var(--dark-brown)', marginBottom: '1.5rem' }}>Waiters</h1>

      {/* Add waiter */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '2rem' }}>
        <input
          type="text"
          placeholder="Waiter name"
          value={newName}
          onChange={e => setNewName(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && addWaiter()}
          style={{
            flex: 1, padding: '0.75rem 1rem', borderRadius: '10px',
            border: '2px solid var(--beige-dark)', fontSize: '1rem',
          }}
        />
        <button
          onClick={addWaiter}
          disabled={loading || !newName.trim()}
          style={{
            padding: '0.75rem 1.5rem', borderRadius: '10px', border: 'none',
            background: loading ? '#ccc' : 'var(--warm)',
            color: '#fff', fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer',
          }}
        >
          + Add
        </button>
      </div>

      {/* List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        {waiters.length === 0 && (
          <p style={{ color: 'var(--text-light)', textAlign: 'center', padding: '2rem' }}>
            No waiters yet. Add one above.
          </p>
        )}
        {waiters.map(w => (
          <div
            key={w.id}
            style={{
              display: 'flex', alignItems: 'center', gap: '1rem',
              padding: '0.75rem 1rem', borderRadius: '10px',
              background: '#fff', border: '1px solid var(--beige-dark)',
              opacity: w.active ? 1 : 0.5,
            }}
          >
            {editId === w.id ? (
              <input
                type="text"
                value={editName}
                onChange={e => setEditName(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') updateName(w.id); if (e.key === 'Escape') setEditId(null) }}
                onBlur={() => updateName(w.id)}
                style={{
                  flex: 1, padding: '0.4rem 0.6rem', borderRadius: '6px',
                  border: '1px solid var(--warm)', fontSize: '0.95rem',
                }}
                autoFocus
              />
            ) : (
              <span
                style={{ flex: 1, fontWeight: 500, color: 'var(--dark-brown)', cursor: 'pointer' }}
                onClick={() => { setEditId(w.id); setEditName(w.name) }}
              >
                {w.name}
              </span>
            )}
            <span style={{ fontSize: '0.8rem', color: w.active ? '#10b981' : '#ef4444', fontWeight: 600, minWidth: '60px' }}>
              {w.active ? 'ON DUTY' : 'OFF DUTY'}
            </span>
            <button
              onClick={() => toggleActive(w.id, w.active)}
              style={{
                padding: '0.4rem 0.75rem', borderRadius: '6px', border: 'none',
                background: w.active ? '#fef2f2' : '#f0fdf4',
                color: w.active ? '#ef4444' : '#10b981',
                fontWeight: 600, cursor: 'pointer', fontSize: '0.8rem',
              }}
            >
              {w.active ? 'Deactivate' : 'Activate'}
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
