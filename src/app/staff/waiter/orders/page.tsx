'use client'

import { useState, useEffect, useCallback } from 'react'
import { createBrowserClient } from '@/lib/supabase'

interface Order {
  id: string
  order_ref: string | null
  customer_name: string
  status: string
  station: string | null
  waiter_name: string | null
  table_number: string | null
  created_at: string
  items_json: string
  cancellation_reason?: string | null
  parent_order_id?: string | null
  source?: string
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString('en-ZA', { hour: '2-digit', minute: '2-digit' })
}

function StationBadge({ station }: { station?: string | null }) {
  if (station === 'bar') return <span style={{ color: '#f59e0b', fontWeight: 600, fontSize: '0.75rem' }}>🍸 Bar</span>
  return <span style={{ color: '#34d399', fontWeight: 600, fontSize: '0.75rem' }}>👨‍🍳 Kitchen</span>
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    pending: '#f59e0b',
    confirmed: '#3b82f6',
    preparing: '#8b5cf6',
    ready: '#10b981',
    served: '#06b6d4',
    completed: '#6b7280',
    cancelled: '#ef4444',
    rejected: '#ef4444',
  }
  return (
    <span style={{
      padding: '0.15rem 0.5rem', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 700,
      background: `${colors[status] || '#6b7280'}22`, color: colors[status] || '#6b7280',
      textTransform: 'uppercase',
    }}>
      {status}
    </span>
  )
}

export default function WaiterOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [updating, setUpdating] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const loadOrders = useCallback(async () => {
    try {
      const res = await fetch('/api/supabase/orders?limit=200')
      if (!res.ok) return
      const data = await res.json()
      setOrders((data || []).filter((o: Order) => o.source === 'waiter'))
    } catch { /* */ }
  }, [])

  useEffect(() => {
    loadOrders()
    let supabase = createBrowserClient()
    let channel: any = null
    try {
      channel = supabase
        .channel('waiter-active-orders')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => loadOrders())
        .subscribe()
    } catch { /* */ }
    return () => { if (channel && supabase) supabase.removeChannel(channel) }
  }, [loadOrders])

  const updateStatus = async (id: string, status: string) => {
    setUpdating(id)
    setError(null)
    try {
      const res = await fetch(`/api/supabase/orders?id=${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })
      if (!res.ok) {
        const d = await res.json().catch(() => ({}))
        setError(d.error || `Failed (${res.status})`)
      }
    } catch {
      setError('Network error')
    } finally {
      setUpdating(null)
    }
  }

  // Group by table number, then by parent_order_id
  const tableGroups = orders.reduce<Record<string, Order[]>>((acc, o) => {
    const key = o.parent_order_id || o.id
    if (!acc[key]) acc[key] = []
    acc[key].push(o)
    return acc
  }, {})

  const tableList = Object.entries(tableGroups).map(([parentId, group]) => {
    const first = group[0]
    const tableNum = first.table_number || first.customer_name?.replace('Table ', '') || '?'
    const allDone = group.every(o => o.status === 'ready' || o.status === 'served' || o.status === 'completed')
    const hasReady = group.some(o => o.status === 'ready')
    const hasServed = group.some(o => o.status === 'served')
    const hasCompleted = group.every(o => o.status === 'completed')
    return { parentId, tableNum, group, allDone, hasReady, hasServed, hasCompleted, first }
  }).filter(t => !t.hasCompleted)

  return (
    <div style={{ padding: '1rem', maxWidth: '600px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h2 style={{ margin: 0, fontSize: '1.3rem', fontWeight: 700, color: '#fff' }}>📋 Active Table Orders</h2>
        <button onClick={loadOrders} style={{ padding: '0.4rem 0.75rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', background: 'transparent', color: 'rgba(255,255,255,0.5)', fontSize: '0.8rem', cursor: 'pointer' }}>Refresh</button>
      </div>

      {error && (
        <div style={{ padding: '0.75rem', marginBottom: '1rem', borderRadius: '10px', background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.3)', color: '#fca5a5', fontSize: '0.85rem' }}>
          {error}
        </div>
      )}

      {tableList.length === 0 && (
        <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'rgba(255,255,255,0.2)', fontSize: '0.9rem' }}>
          No active orders. Place a new order from the waiter page.
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {tableList.map(({ parentId, tableNum, group, hasReady }) => (
          <div key={parentId} style={{
            background: '#1c1c30', borderRadius: '14px', padding: '1rem',
            border: hasReady ? '2px solid rgba(16,185,129,0.3)' : '1px solid rgba(255,255,255,0.06)',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ fontSize: '1.2rem' }}>🍽️</span>
                <span style={{ fontWeight: 800, fontSize: '1.3rem', color: hasReady ? '#10b981' : '#fff' }}>
                  Table {tableNum}
                </span>
              </div>
              <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.35)' }}>
                {group.length} ticket{group.length !== 1 ? 's' : ''}
              </span>
            </div>

            {group.map(order => {
              const items: any[] = []
              try { const p = JSON.parse(order.items_json); (Array.isArray(p) ? p : p?.items || []).forEach((i: any) => items.push(i)) } catch { /* */ }
              return (
                <div key={order.id} style={{
                  padding: '0.5rem 0', borderTop: '1px solid rgba(255,255,255,0.04)',
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <StationBadge station={order.station} />
                      <span style={{ fontFamily: 'monospace', fontSize: '0.8rem', color: 'rgba(255,255,255,0.4)' }}>{order.order_ref}</span>
                      <StatusBadge status={order.status} />
                    </div>
                    <span style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.25)' }}>{formatTime(order.created_at)}</span>
                  </div>

                  {items.length > 0 && (
                    <div style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.6)', marginBottom: '0.25rem' }}>
                      {items.map((item, i) => (
                        <span key={i}>{item.quantity}x {item.name}{i < items.length - 1 ? ', ' : ''}</span>
                      ))}
                    </div>
                  )}

                  {order.cancellation_reason && (
                    <div style={{ padding: '0.4rem 0.6rem', borderRadius: '6px', background: 'rgba(239,68,68,0.1)', color: '#fca5a5', fontSize: '0.8rem', marginBottom: '0.5rem' }}>
                      ❌ Cancelled: {order.cancellation_reason}
                    </div>
                  )}

                  {/* Action buttons for ready/served orders */}
                  {order.status === 'ready' && (
                    <button onClick={() => updateStatus(order.id, 'served')} disabled={updating === order.id} style={{
                      width: '100%', padding: '0.6rem', borderRadius: '8px', border: 'none',
                      background: '#06b6d4', color: '#000', fontSize: '0.9rem', fontWeight: 700, cursor: updating === order.id ? 'not-allowed' : 'pointer',
                      opacity: updating === order.id ? 0.5 : 1,
                    }}>
                      {updating === order.id ? '...' : '✅ Mark Served'}
                    </button>
                  )}
                  {order.status === 'served' && (
                    <button onClick={() => updateStatus(order.id, 'completed')} disabled={updating === order.id} style={{
                      width: '100%', padding: '0.6rem', borderRadius: '8px', border: 'none',
                      background: '#6b7280', color: '#fff', fontSize: '0.9rem', fontWeight: 700, cursor: updating === order.id ? 'not-allowed' : 'pointer',
                      opacity: updating === order.id ? 0.5 : 1,
                    }}>
                      {updating === order.id ? '...' : 'Complete Order'}
                    </button>
                  )}
                </div>
              )
            })}
          </div>
        ))}
      </div>
    </div>
  )
}
