'use client'

import { useState, useEffect, useCallback } from 'react'

interface Order {
  id: string
  order_ref: string | null
  customer_name: string
  phone: string
  order_type: string
  requested_time: string
  items_json: string
  total: number
  status: string
  created_at: string
}

const STATUS_LABELS: Record<string, string> = {
  pending: 'New',
  confirmed: 'Accepted',
  preparing: 'Preparing',
  ready: 'Ready',
  completed: 'Completed',
  cancelled: 'Cancelled',
}

const STATUS_COLORS: Record<string, string> = {
  pending: '#f59e0b',
  confirmed: '#3b82f6',
  preparing: '#8b5cf6',
  ready: '#10b981',
  completed: '#6b7280',
  cancelled: '#ef4444',
}

const WORKFLOW: Record<string, { label: string; next: string } | null> = {
  pending: { label: 'Accept', next: 'confirmed' },
  confirmed: { label: 'Start Preparing', next: 'preparing' },
  preparing: { label: 'Mark Ready', next: 'ready' },
  ready: { label: 'Complete', next: 'completed' },
  completed: null,
  cancelled: null,
}

const ACTIVE_STATUSES = ['pending', 'confirmed', 'preparing', 'ready']

export default function KitchenDisplay() {
  const [orders, setOrders] = useState<Order[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [updating, setUpdating] = useState<string | null>(null)
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date())

  const loadOrders = useCallback(async () => {
    try {
      const res = await fetch('/api/supabase/orders')
      if (res.ok) {
        const data = await res.json()
        setOrders(data)
        setLastRefresh(new Date())
      }
    } catch (err) {
      console.error('Error loading orders:', err)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => { loadOrders() }, [loadOrders])

  useEffect(() => {
    const interval = setInterval(loadOrders, 8000)
    return () => clearInterval(interval)
  }, [loadOrders])

  const updateStatus = async (id: string, status: string) => {
    setUpdating(id)
    try {
      const res = await fetch(`/api/supabase/orders?id=${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })
      if (res.ok) {
        setOrders(orders.map(o => o.id === id ? { ...o, status } : o))
      }
    } catch (err) {
      console.error('Error updating order:', err)
    } finally {
      setUpdating(null)
    }
  }

  const activeOrders = orders.filter(o => ACTIVE_STATUSES.includes(o.status))

  const formatTime = (iso: string) => {
    const d = new Date(iso)
    return d.toLocaleTimeString('en-ZA', { hour: '2-digit', minute: '2-digit' })
  }

  if (isLoading) {
    return <div style={{ padding: '2rem', fontSize: '1.2rem' }}>Loading...</div>
  }

  return (
    <div style={{ minHeight: '100vh', background: '#1a1a2e', color: '#fff', padding: '1.5rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '0.5rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 700, margin: 0 }}>👨‍🍳 Kitchen</h1>
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.9rem', marginTop: '0.25rem' }}>
            {activeOrders.length} active order{activeOrders.length !== 1 ? 's' : ''}
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <span style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.4)' }}>
            Last refresh: {lastRefresh.toLocaleTimeString()}
          </span>
          <button
            onClick={loadOrders}
            style={{
              minHeight: '44px', padding: '0.5rem 1.25rem',
              background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)',
              borderRadius: '10px', color: '#fff', fontSize: '0.9rem', cursor: 'pointer',
            }}
          >
            Refresh
          </button>
        </div>
      </div>

      {/* Empty state */}
      {activeOrders.length === 0 && (
        <div style={{ textAlign: 'center', padding: '4rem 2rem' }}>
          <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>✅</div>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>All caught up!</h2>
          <p style={{ color: 'rgba(255,255,255,0.5)' }}>No active orders right now.</p>
        </div>
      )}

      {/* Order Cards */}
      <div style={{ display: 'grid', gap: '1rem', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 420px), 1fr))' }}>
        {activeOrders.map(order => {
          let items: any[] = []
          try { items = JSON.parse(order.items_json) } catch {}

          const workflowStep = WORKFLOW[order.status]
          const color = STATUS_COLORS[order.status] || '#6b7280'
          const displayRef = order.order_ref || `#${order.id.slice(0, 8).toUpperCase()}`

          return (
            <div
              key={order.id}
              style={{
                background: '#16213e',
                borderRadius: '16px',
                padding: '1.5rem',
                border: `2px solid ${color}40`,
                boxShadow: `0 4px 20px ${color}20`,
              }}
            >
              {/* Top row: Order ref + Status */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <span style={{ fontSize: '1.5rem', fontWeight: 700, fontFamily: 'monospace', color: 'rgba(255,255,255,0.9)' }}>
                  {displayRef}
                </span>
                <span style={{
                  padding: '0.4rem 1rem', borderRadius: '20px', fontSize: '1rem',
                  fontWeight: 600, background: `${color}30`, color,
                }}>
                  {STATUS_LABELS[order.status] || order.status}
                </span>
              </div>

              {/* Customer name */}
              <h2 style={{ fontSize: '1.35rem', fontWeight: 600, margin: '0 0 0.75rem' }}>
                {order.customer_name}
              </h2>

              {/* Meta info */}
              <div style={{ display: 'flex', gap: '1rem', fontSize: '0.85rem', color: 'rgba(255,255,255,0.5)', marginBottom: '1rem', flexWrap: 'wrap' }}>
                <span>📋 {order.order_type}</span>
                <span>🕐 {order.requested_time || 'ASAP'}</span>
                <span>⏱️ Ordered {formatTime(order.created_at)}</span>
              </div>

              {/* Items */}
              {items.length > 0 && (
                <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: '12px', padding: '1rem', marginBottom: '1.25rem' }}>
                  <p style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.5)', marginBottom: '0.5rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Items
                  </p>
                  {items.map((item: any, idx: number) => (
                    <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.4rem 0', fontSize: '1.05rem', borderBottom: idx < items.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none' }}>
                      <span>
                        <strong style={{ color: '#fff' }}>{item.quantity}x</strong> {item.name}
                      </span>
                      <span style={{ color: color }}>R{item.price * item.quantity}</span>
                    </div>
                  ))}
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.5rem', paddingTop: '0.5rem', borderTop: '1px solid rgba(255,255,255,0.1)', fontSize: '1.1rem', fontWeight: 700 }}>
                    <span>Total</span>
                    <span style={{ color: '#10b981' }}>R{order.total}</span>
                  </div>
                </div>
              )}

              {/* Action buttons */}
              <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                {workflowStep ? (
                  <button
                    onClick={() => updateStatus(order.id, workflowStep.next)}
                    disabled={updating === order.id}
                    style={{
                      flex: 1, minHeight: '52px', minWidth: '52px',
                      padding: '0.75rem 1.5rem', border: 'none',
                      borderRadius: '12px', cursor: updating === order.id ? 'not-allowed' : 'pointer',
                      fontSize: '1.1rem', fontWeight: 700,
                      background: color, color: '#fff',
                      opacity: updating === order.id ? 0.6 : 1,
                      touchAction: 'manipulation',
                    }}
                  >
                    {updating === order.id ? '...' : workflowStep.label}
                  </button>
                ) : null}
                {order.status !== 'cancelled' && order.status !== 'completed' && (
                  <button
                    onClick={() => updateStatus(order.id, 'cancelled')}
                    disabled={updating === order.id}
                    style={{
                      minHeight: '52px', minWidth: '52px',
                      padding: '0.75rem 1.25rem', border: '2px solid rgba(239,68,68,0.3)',
                      borderRadius: '12px', cursor: updating === order.id ? 'not-allowed' : 'pointer',
                      fontSize: '1rem', color: '#ef4444',
                      background: 'transparent', fontWeight: 600,
                      opacity: updating === order.id ? 0.6 : 1,
                      touchAction: 'manipulation',
                    }}
                  >
                    Cancel
                  </button>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
