const rateLimitStore = new Map<string, { count: number; resetAt: number }>()

const WINDOW_MS = 60_000
const DEFAULT_MAX_REQUESTS = 10

export function checkRateLimit(key: string, maxRequests = DEFAULT_MAX_REQUESTS): boolean {
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
