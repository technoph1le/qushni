import type { NextConfig } from 'next';

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
  // The API lives in ../backend. Proxying /api/* keeps one origin: no CORS, and Telegram and the
  // payment providers can keep calling https://<site>/api/... .
  async rewrites() {
    const api = (process.env.API_URL || 'http://localhost:8787').replace(/\/$/, '');
    return [
      // Old iOS, Telegram and some bookmark/preview services request these blindly, without reading <head>.
      { source: '/apple-touch-icon-precomposed.png', destination: '/apple-touch-icon.png' },
      { source: '/apple-touch-icon-180x180.png', destination: '/apple-touch-icon.png' },
      { source: '/api/:path*', destination: `${api}/api/:path*` },
    ];
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
