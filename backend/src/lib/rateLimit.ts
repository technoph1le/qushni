import type { Context, MiddlewareHandler } from 'hono';

export function clientIp(c: Context): string {
  const cf = c.req.header('cf-connecting-ip');
  if (cf) return cf;
  // The hosting proxy appends the real client address last; earlier entries can be forged by the client.
  const xff = c.req.header('x-forwarded-for');
  if (xff) return xff.split(',').pop()!.trim();
  return c.req.header('x-real-ip') ?? 'unknown';
}

/** Fixed-window limit per client IP. In-memory, which is fine for a single backend instance. */
export function rateLimit(opts: { windowMs: number; max: number }): MiddlewareHandler {
  const hits = new Map<string, { count: number; reset: number }>();
  return async (c, next) => {
    const now = Date.now();
    if (hits.size > 50_000) {
      for (const [k, v] of hits) if (v.reset < now) hits.delete(k);
    }
    const ip = clientIp(c);
    let h = hits.get(ip);
    if (!h || h.reset < now) {
      h = { count: 0, reset: now + opts.windowMs };
      hits.set(ip, h);
    }
    h.count++;
    if (h.count > opts.max) {
      return c.json({ error: 'too_many_requests', retry_after: Math.ceil((h.reset - now) / 1000) }, 429);
    }
    await next();
  };
}
