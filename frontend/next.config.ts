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
    return [{ source: '/api/:path*', destination: `${api}/api/:path*` }];
  },
  async headers() {
    return [{ source: '/:path*', headers: securityHeaders }];
  },
};

export default config;
