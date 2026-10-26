import type { Context, MiddlewareHandler } from 'hono';
import { db } from './supabase';

export function clientIp(c: Context): string {
  // Cloudflare tunnel (local dev) and Vercel both set these from the real connection; the client can't forge them.
  const direct = c.req.header('cf-connecting-ip') ?? c.req.header('x-real-ip');
  if (direct) return direct;
  return c.req.header('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
}

/**
 * Fixed-window limit per client IP, counted in the database (table `rate_limits`) because
 * serverless functions don't share memory. If the counter is unreachable, requests are allowed.
 */
export function rateLimit(name: string, opts: { windowSeconds: number; max: number }): MiddlewareHandler {
  return async (c, next) => {
    const { data: allowed, error } = await db.rpc('hit_rate_limit', {
      p_key: `${name}:${clientIp(c)}`,
      p_window_seconds: opts.windowSeconds,
      p_max: opts.max,
    });
    if (error) console.error('rate limit check failed', error.message);
    else if (allowed === false) return c.json({ error: 'too_many_requests', retry_after: opts.windowSeconds }, 429);
    await next();
  };
}
