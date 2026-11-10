import path from 'node:path';
import type { NextConfig } from 'next';

/**
 * Where to proxy /api/*. Unset (production on Vercel) → the API runs in this app, see
 * src/app/api/[...path]/route.ts. Pointing it at the site itself would loop, so that is ignored.
 */
function apiProxyTarget(): string | null {
  const raw = process.env.API_URL?.trim().replace(/\/$/, '');
  if (!raw) return null;
  const host = (u: string) => {
    try {
      return new URL(u).hostname.replace(/^www\./, '');
    } catch {
      return '';
    }
  };
  const site = process.env.NEXT_PUBLIC_SITE_URL;
  const vercel = process.env.VERCEL_URL;
  if ((site && host(raw) === host(site)) || (vercel && host(raw) === vercel)) return null;
  return raw;
}

const securityHeaders = [
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(self)' },
];

const config: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  // Lets teammates open the dev server through a Cloudflare quick tunnel (npm run dev).
  allowedDevOrigins: ['*.trycloudflare.com'],
  // The API code lives in ../backend. It is served at /api/* either by proxying to a separate backend
  // process (local dev) or by the route handler in this app (Vercel). One origin either way: no CORS,
  // and Telegram and the payment providers call https://<site>/api/... .
  experimental: { externalDir: true },
  outputFileTracingRoot: path.join(__dirname, '..'),
  webpack(cfg) {
    // Backend files import each other as './x.js' (Node ESM style). Their packages come from
    // ../backend/node_modules, which this app's postinstall installs.
    cfg.resolve.extensionAlias = { '.js': ['.ts', '.js'] };
    return cfg;
  },
  async rewrites() {
    const api = apiProxyTarget();
    return {
      beforeFiles: api ? [{ source: '/api/:path*', destination: `${api}/api/:path*` }] : [],
      afterFiles: [
        // Old iOS, Telegram and some bookmark/preview services request these blindly, without reading <head>.
        { source: '/apple-touch-icon-precomposed.png', destination: '/apple-touch-icon.png' },
        { source: '/apple-touch-icon-180x180.png', destination: '/apple-touch-icon.png' },
      ],
      fallback: [],
    };
  },
  async headers() {
    return [
      { source: '/:path*', headers: securityHeaders },
      {
        // Icons are fetched on every visit otherwise (Vercel defaults public/ to max-age=0). The ?v= in
        // layout.tsx and site.webmanifest changes the URL when the icons change, so a week is safe.
        source: '/:file(favicon\\.ico|favicon\\.svg|apple-touch-icon\\.png|icon-192\\.png|icon-512\\.png|icon-maskable-512\\.png|site\\.webmanifest)',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=604800, stale-while-revalidate=86400' }],
      },
    ];
  },
};

export default config;
