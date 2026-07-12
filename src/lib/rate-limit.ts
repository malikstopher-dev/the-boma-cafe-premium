const rateLimitStore = new Map<string, { count: number; resetAt: number }>()

const WINDOW_MS = 60_000
const DEFAULT_MAX_REQUESTS = 10
const CLEANUP_INTERVAL = 5 * 60_000 // 5 minutes

let lastCleanup = Date.now()

function cleanup() {
  const now = Date.now()
  if (now - lastCleanup < CLEANUP_INTERVAL) return
  lastCleanup = now
  const entries = Array.from(rateLimitStore.entries())
  for (const [key, entry] of entries) {
    if (now > entry.resetAt) {
      rateLimitStore.delete(key)
    }
  }
}

export function checkRateLimit(key: string, maxRequests = DEFAULT_MAX_REQUESTS): boolean {
  cleanup()
  const now = Date.now()
  const entry = rateLimitStore.get(key)

  if (!entry || now > entry.resetAt) {
    rateLimitStore.set(key, { count: 1, resetAt: now + WINDOW_MS })
    return true
  }

  if (entry.count >= maxRequests) {
    return false
  }

  entry.count++
  return true
}

export function checkRateLimitByWaiter(waiterName: string): boolean {
  return checkRateLimit(`waiter-order:${waiterName}`, 60)
}
