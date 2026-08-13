// In-memory rate limiter — fine for a single-server deploy
const buckets = new Map<string, { count: number; resetAt: number }>()

export function rateLimit(key: string, limit: number, windowMs: number) {
	const now = Date.now()
	if (buckets.size > 10_000) {
		for (const [k, v] of buckets) {
			if (v.resetAt <= now) buckets.delete(k)
		}
	}
	const bucket = buckets.get(key)
	if (!bucket || bucket.resetAt <= now) {
		buckets.set(key, { count: 1, resetAt: now + windowMs })
		return true
	}
	bucket.count += 1
	return bucket.count <= limit
}

export function clientIp(request: Request) {
	// First entry of x-forwarded-for is the client (set by the nginx proxy)
	return (
		request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'
	)
}
