import type { Context } from 'hono';

/** The public address the request came in on — the live domain, a Vercel preview, or a dev tunnel. */
export function siteOrigin(c: Context): string {
  const url = new URL(c.req.url);
  const host = c.req.header('x-forwarded-host') ?? url.host;
  const proto = c.req.header('x-forwarded-proto') ?? url.protocol.replace(':', '');
  return `${proto}://${host}`;
}
