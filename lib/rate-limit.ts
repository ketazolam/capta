// Simple in-memory rate limiter — per serverless instance.
// Good enough to block burst abuse on warm instances.
// For multi-instance protection, replace store with Upstash Redis.

interface Bucket {
  count: number
  resetAt: number
}

const store = new Map<string, Bucket>()

// Prune expired entries every 5 minutes to avoid memory leak
if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const now = Date.now()
    for (const [key, bucket] of store.entries()) {
      if (bucket.resetAt < now) store.delete(key)
    }
  }, 5 * 60 * 1000)
}

/**
 * Returns true if the request should be rate-limited (limit exceeded).
 * @param key     Unique key (e.g. IP address)
 * @param limit   Max requests allowed per window
 * @param windowMs Window duration in milliseconds
 */
export function isRateLimited(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now()
  const bucket = store.get(key)

  if (!bucket || bucket.resetAt < now) {
    store.set(key, { count: 1, resetAt: now + windowMs })
    return false
  }

  if (bucket.count >= limit) return true
  bucket.count++
  return false
}
