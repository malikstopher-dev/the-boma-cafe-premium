const QUEUE_KEY = 'boma_offline_queue'

export interface QueueItem {
  id: string
  type: 'CREATE_ORDER' | 'UPDATE_ORDER' | 'PAYMENT' | 'ASSIGN_TABLE'
  payload: any
  timestamp: number
  synced: boolean
  retries: number
}

function getQueue(): QueueItem[] {
  try {
    const raw = localStorage.getItem(QUEUE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function saveQueue(queue: QueueItem[]) {
  try {
    localStorage.setItem(QUEUE_KEY, JSON.stringify(queue))
  } catch { /* storage full - clear oldest */ }
}

export function enqueueAction(type: QueueItem['type'], payload: any) {
  const queue = getQueue()
  queue.push({
    id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
    type,
    payload,
    timestamp: Date.now(),
    synced: false,
    retries: 0,
  })
  saveQueue(queue)
}

export function getPendingActions(): QueueItem[] {
  return getQueue().filter((q) => !q.synced)
}

export function markSynced(id: string) {
  const queue = getQueue().map((q) => q.id === id ? { ...q, synced: true } : q)
  saveQueue(queue)
}

export function clearSynced() {
  saveQueue(getQueue().filter((q) => !q.synced))
}

export function getQueueLength(): number {
  return getQueue().filter((q) => !q.synced).length
}

export async function processQueue(): Promise<{ synced: number; failed: number }> {
  const pending = getPendingActions()
  let synced = 0
  let failed = 0

  for (const item of pending) {
    // Exponential backoff: skip if not enough time has passed since last retry
    const backoffMs = Math.min(1000 * Math.pow(2, item.retries), 60000)
    if (item.retries > 0 && Date.now() - item.timestamp < backoffMs) {
      continue
    }

    try {
      let res: Response | null = null

      if (item.type === 'CREATE_ORDER') {
        res = await fetch('/api/supabase/orders', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(item.payload),
        })
      } else if (item.type === 'UPDATE_ORDER' || item.type === 'PAYMENT') {
        const { id, ...body } = item.payload
        if (!id) { markSynced(item.id); failed++; continue }
        res = await fetch(`/api/supabase/orders?id=${id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        })
      } else if (item.type === 'ASSIGN_TABLE') {
        const { id, ...body } = item.payload
        if (!id) { markSynced(item.id); failed++; continue }
        res = await fetch(`/api/supabase/orders?id=${id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        })
      }

      if (res && res.ok) {
        markSynced(item.id)
        synced++
      } else {
        // Increment retry count
        const queue = getQueue().map((q) => q.id === item.id ? { ...q, retries: q.retries + 1 } : q)
        saveQueue(queue)
        failed++
      }
    } catch {
      const queue = getQueue().map((q) => q.id === item.id ? { ...q, retries: q.retries + 1 } : q)
      saveQueue(queue)
      failed++
    }
  }

  clearSynced()
  return { synced, failed }
}

export function useOfflineStatus(interval = 5000) {
  if (typeof window === 'undefined') return { online: true, pendingCount: 0 }
  const online = navigator.onLine
  const pendingCount = getQueueLength()
  return { online, pendingCount }
}
