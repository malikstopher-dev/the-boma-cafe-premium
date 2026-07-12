'use client'

import { useState, useEffect, useMemo } from 'react'
import { PageHeader } from '@/components/admin/design-system/PageHeader'
import Button from '@/components/admin/design-system/Button'
import { Input, Select } from '@/components/admin/design-system/Input'
import Badge from '@/components/admin/design-system/Badge'
import { SkeletonCard } from '@/components/admin/design-system/Skeleton'
import EmptyState from '@/components/admin/design-system/EmptyState'
import ConfirmDialog from '@/components/admin/design-system/ConfirmDialog'
import { useToast } from '@/components/admin/design-system/Toast'

interface Booking {
  id: string; name: string; phone: string; email: string
  booking_date: string; booking_time: string; guests: number
  notes: string | null; status: string; created_at: string
}

export default function AdminBookings() {
  const [bookings, setBookings] = useState<Booking[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [deleteTarget, setDeleteTarget] = useState<Booking | null>(null)
  const { success, error: showError } = useToast()

  useEffect(() => {
    fetch('/api/supabase/bookings').then(r => r.json()).then(setBookings).catch(() => showError('Failed to load bookings')).finally(() => setIsLoading(false))
  }, [])

  const filtered = useMemo(() => {
    let result = bookings
    if (search.trim()) { const q = search.toLowerCase(); result = result.filter(b => b.name.toLowerCase().includes(q)) }
    if (statusFilter) { result = result.filter(b => b.status === statusFilter) }
    return result
  }, [bookings, search, statusFilter])

  const updateStatus = async (id: string, status: string) => {
    try {
      const res = await fetch(`/api/supabase/bookings?id=${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status }) })
      if (res.ok) { setBookings(bookings.map(b => b.id === id ? { ...b, status } : b)); success(`Booking ${status}`) }
    } catch { showError('Failed to update booking') }
  }

  const deleteBooking = async () => {
    if (!deleteTarget) return
    try {
      const res = await fetch(`/api/supabase/bookings?id=${deleteTarget.id}`, { method: 'DELETE' })
      if (res.ok) { setBookings(bookings.filter(b => b.id !== deleteTarget.id)); success('Booking deleted') }
    } catch { showError('Failed to delete') }
    setDeleteTarget(null)
  }

  const statusVariant = (s: string) => {
    const map: Record<string, 'warning' | 'success' | 'danger' | 'default'> = { pending: 'warning', confirmed: 'success', cancelled: 'danger', completed: 'default' }
    return map[s] || 'default'
  }

  const statusOptions = [{ value: '', label: 'All Statuses' }, ...['pending', 'confirmed', 'cancelled', 'completed'].map(s => ({ value: s, label: s.charAt(0).toUpperCase() + s.slice(1) }))]

  return (
    <div>
      <PageHeader title="Bookings" description={`${filtered.length} bookings`} />

      <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: 200 }}><Input placeholder="Search by name..." value={search} onChange={e => setSearch(e.target.value)} /></div>
        <div style={{ minWidth: 160 }}><Select options={statusOptions} value={statusFilter} onChange={e => setStatusFilter(e.target.value)} /></div>
      </div>

      {isLoading ? <div style={{ display: 'grid', gap: 12 }}><SkeletonCard /><SkeletonCard /></div>
      : filtered.length === 0 ? <EmptyState icon="📅" title={bookings.length === 0 ? 'No bookings yet' : 'No matches'} description={bookings.length === 0 ? 'Bookings from the website will appear here' : 'Try adjusting your search'} />
      : (
        <div style={{ display: 'grid', gap: 8 }}>
          {filtered.map(booking => (
            <div key={booking.id} style={{ background: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: 12, padding: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12, flexWrap: 'wrap', gap: 8 }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <span style={{ fontSize: 15, fontWeight: 600, color: '#0F172A' }}>{booking.name}</span>
                    <Badge variant={statusVariant(booking.status)}>{booking.status}</Badge>
                  </div>
                  <span style={{ fontSize: 13, color: '#94A3B8' }}>{booking.email} · {booking.phone}</span>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 8, marginBottom: 12, fontSize: 13, color: '#475569' }}>
                <div><strong>Date:</strong> {booking.booking_date}</div>
                <div><strong>Time:</strong> {booking.booking_time}</div>
                <div><strong>Guests:</strong> {booking.guests}</div>
                <div><strong>Booked:</strong> {new Date(booking.created_at).toLocaleDateString()}</div>
              </div>
              {booking.notes && <p style={{ fontSize: 13, color: '#475569', fontStyle: 'italic', marginBottom: 12 }}>Notes: {booking.notes}</p>}
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {booking.status === 'pending' && (
                  <>
                    <Button variant="primary" size="sm" onClick={() => updateStatus(booking.id, 'confirmed')}>Confirm</Button>
                    <Button variant="ghost" size="sm" onClick={() => updateStatus(booking.id, 'cancelled')} style={{ color: '#EF4444' }}>Cancel</Button>
                  </>
                )}
                {booking.status === 'confirmed' && <Button variant="ghost" size="sm" onClick={() => updateStatus(booking.id, 'completed')}>Mark Completed</Button>}
                <Button variant="ghost" size="sm" onClick={() => setDeleteTarget(booking)} style={{ color: '#EF4444' }}>Delete</Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <ConfirmDialog open={!!deleteTarget} title="Delete Booking" message={`Delete booking for "${deleteTarget?.name}"?`} confirmLabel="Delete" onConfirm={deleteBooking} onCancel={() => setDeleteTarget(null)} />
    </div>
  )
}
