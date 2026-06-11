'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'

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
  pending: { label: 'Accept Order', next: 'confirmed' },
  confirmed: { label: 'Start Preparing', next: 'preparing' },
  preparing: { label: 'Mark Ready', next: 'ready' },
  ready: { label: 'Complete', next: 'completed' },
  completed: null,
  cancelled: null,
}

export default function AdminOrders() {
  const [orders, setOrders] = useState<Order[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [updating, setUpdating] = useState<string | null>(null)

  const loadOrders = useCallback(async () => {
    try {
      const res = await fetch('/api/supabase/orders')
      if (res.ok) {
        const data = await res.json()
        setOrders(data)
      }
    } catch (err) {
      console.error('Error loading orders:', err)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => { loadOrders() }, [loadOrders])

  useEffect(() => {
    const interval = setInterval(loadOrders, 10000)
    return () => clearInterval(interval)
  }, [loadOrders])

  const filtered = useMemo(() => {
    let result = orders
    if (search.trim()) {
      const q = search.toLowerCase()
      result = result.filter(o =>
        o.customer_name.toLowerCase().includes(q) ||
        (o.order_ref && o.order_ref.toLowerCase().includes(q))
      )
    }
    if (statusFilter) {
      result = result.filter(o => o.status === statusFilter)
    }
    return result
  }, [orders, search, statusFilter])

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

  const deleteOrder = async (id: string) => {
    if (!confirm('Delete this order?')) return
    try {
      const res = await fetch(`/api/supabase/orders?id=${id}`, { method: 'DELETE' })
      if (res.ok) {
        setOrders(orders.filter(o => o.id !== id))
      }
    } catch (err) {
      console.error('Error deleting order:', err)
    }
  }

  const displayStatuses = Object.keys(STATUS_LABELS)

  if (isLoading) {
    return <div style={{ padding: '2rem' }}>Loading...</div>
  }

  return (
    <div>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem', color: 'var(--dark-brown)' }}>Orders</h1>
        <p style={{ color: 'var(--text-light)' }}>{filtered.length} order{filtered.length !== 1 ? 's' : ''}</p>
      </div>

      <div style={{ marginBottom: '1.5rem', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
        <input
          type="text"
          placeholder="Search by name or order ref..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{
            width: '100%', maxWidth: '300px', boxSizing: 'border-box',
            padding: '0.75rem 1rem', borderRadius: '10px',
            border: '2px solid var(--beige-dark)', background: 'var(--white)',
            fontSize: '0.95rem',
          }}
        />
        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          style={{
            padding: '0.75rem 1rem', borderRadius: '10px',
            border: '2px solid var(--beige-dark)', background: 'var(--white)',
            fontSize: '0.95rem',
          }}
        >
          <option value="">All statuses</option>
          {displayStatuses.map(s => (
            <option key={s} value={s}>{STATUS_LABELS[s]}</option>
          ))}
        </select>
      </div>

      {filtered.length === 0 ? (
        <div style={{ background: 'var(--white)', padding: '3rem', borderRadius: '16px', textAlign: 'center' }}>
          <p style={{ color: 'var(--text-light)' }}>
            {orders.length === 0
              ? 'No orders yet. Orders from the website will appear here.'
              : 'No orders match your search or filter.'}
          </p>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '1rem' }}>
          {filtered.map(order => {
            let items: any[] = []
            try { items = JSON.parse(order.items_json) } catch {}

            const workflowStep = WORKFLOW[order.status]
            const color = STATUS_COLORS[order.status] || '#6b7280'

            return (
              <div key={order.id} style={{ background: 'var(--white)', padding: '1.5rem', borderRadius: '12px', boxShadow: 'var(--shadow-sm)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.25rem' }}>
                      <h3 style={{ fontSize: '1.1rem', color: 'var(--dark-brown)', margin: 0 }}>{order.customer_name}</h3>
                      {order.order_ref && (
                        <span style={{ fontFamily: 'monospace', fontSize: '0.85rem', color: 'var(--warm)', fontWeight: 600 }}>
                          {order.order_ref}
                        </span>
                      )}
                    </div>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-light)' }}>{order.phone}</p>
                  </div>
                  <span style={{ padding: '0.35rem 0.85rem', borderRadius: '20px', fontSize: '0.85rem', fontWeight: 600, background: `${color}20`, color }}>
                    {STATUS_LABELS[order.status] || order.status}
                  </span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '0.75rem', marginBottom: '1rem', fontSize: '0.9rem' }}>
                  <div><strong>Type:</strong> {order.order_type}</div>
                  <div><strong>Time:</strong> {order.requested_time}</div>
                  <div><strong>Total:</strong> R{order.total}</div>
                  <div><strong>Ordered:</strong> {new Date(order.created_at).toLocaleDateString()}</div>
                </div>
                {items.length > 0 && (
                  <div style={{ marginBottom: '1rem' }}>
                    <strong style={{ fontSize: '0.9rem' }}>Items:</strong>
                    <ul style={{ margin: '0.5rem 0 0', paddingLeft: '1.25rem', fontSize: '0.85rem', color: 'var(--text)' }}>
                      {items.map((item: any, idx: number) => (
                        <li key={idx}>{item.name} x{item.quantity} - R{item.price * item.quantity}</li>
                      ))}
                    </ul>
                  </div>
                )}
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
                  {workflowStep ? (
                    <button
                      onClick={() => updateStatus(order.id, workflowStep.next)}
                      disabled={updating === order.id}
                      style={{
                        minHeight: '44px', minWidth: '44px',
                        padding: '0.65rem 1.25rem', border: 'none', borderRadius: '10px',
                        cursor: updating === order.id ? 'not-allowed' : 'pointer',
                        fontSize: '0.9rem', fontWeight: 600,
                        background: color, color: '#fff',
                        opacity: updating === order.id ? 0.6 : 1,
                        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                        touchAction: 'manipulation',
                      }}
                    >
                      {updating === order.id ? 'Updating...' : workflowStep.label}
                    </button>
                  ) : null}
                  {order.status !== 'cancelled' && order.status !== 'completed' && (
                    <button
                      onClick={() => updateStatus(order.id, 'cancelled')}
                      disabled={updating === order.id}
                      style={{
                        minHeight: '44px', minWidth: '44px',
                        padding: '0.65rem 1.25rem', border: '2px solid #fecaca',
                        borderRadius: '10px', cursor: updating === order.id ? 'not-allowed' : 'pointer',
                        fontSize: '0.85rem', color: '#dc2626',
                        background: 'transparent', fontWeight: 500,
                        opacity: updating === order.id ? 0.6 : 1,
                        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                        touchAction: 'manipulation',
                      }}
                    >
                      Cancel
                    </button>
                  )}
                  <button
                    onClick={() => deleteOrder(order.id)}
                    style={{
                      minHeight: '44px', minWidth: '44px',
                      padding: '0.65rem 1.25rem', border: '2px solid #fecaca',
                      borderRadius: '10px', cursor: 'pointer',
                      fontSize: '0.85rem', color: '#dc2626',
                      background: 'transparent', fontWeight: 500,
                      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                      touchAction: 'manipulation',
                    }}
                  >
                    Delete
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
