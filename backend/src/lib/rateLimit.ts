import type { Context, MiddlewareHandler } from 'hono';

export function clientIp(c: Context): string {
  // Cloudflare (tunnel) and the frontend's proxy set these from the real connection.
  const direct = c.req.header('cf-connecting-ip') ?? c.req.header('x-real-ip');
  if (direct) return direct;
  return c.req.header('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
}

const hits = new Map<string, { start: number; count: number }>();

// Forget windows that have ended so the map doesn't grow forever.
setInterval(() => {
  const now = Date.now();
  for (const [key, w] of hits) if (now - w.start > 60 * 60 * 1000) hits.delete(key);
}, 10 * 60 * 1000).unref();

/**
 * Fixed-window limit per client IP, counted in memory. The backend is one long-running process,
 * so this is exact; if it's ever scaled to several instances, each counts on its own.
 */
export function rateLimit(name: string, opts: { windowSeconds: number; max: number }): MiddlewareHandler {
  return async (c, next) => {
    const key = `${name}:${clientIp(c)}`;
    const now = Date.now();
    const w = hits.get(key);
    if (!w || now - w.start > opts.windowSeconds * 1000) hits.set(key, { start: now, count: 1 });
    else if (++w.count > opts.max) return c.json({ error: 'too_many_requests', retry_after: opts.windowSeconds }, 429);
    await next();
  };
}
