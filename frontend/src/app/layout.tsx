import type { Metadata, Viewport } from 'next';
import { Manrope } from 'next/font/google';
import type { ReactNode } from 'react';
import { getServerLang } from '../i18n/server';
import { siteUrl } from '../lib/site';
import { Providers } from './providers';
import '../styles/index.css';

const manrope = Manrope({
  subsets: ['latin', 'cyrillic'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-manrope',
  display: 'swap',
});

const description =
  "Qo'shni — O'zbekistonda ishonchli sherik va xona topish platformasi. Metro va universitetlar yaqinida, vositachisiz.";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl()),
  title: { default: "Qo'shni — sherik va xona toping", template: "%s — Qo'shni" },
  description,
  applicationName: "Qo'shni",
  authors: [{ name: 'Mir2Dos' }],
  openGraph: {
    type: 'website',
    siteName: "Qo'shni",
    title: "Qo'shni — sherik va xona toping",
    description: 'Metro va universitetlar yaqinidagi xonalar va sheriklar — vositachisiz, komissiyasiz.',
    images: [{ url: '/og-image.png', width: 1200, height: 630 }],
  },
  twitter: { card: 'summary_large_image' },
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: '48x48' },
      { url: '/favicon.svg', type: 'image/svg+xml' },
    ],
    apple: '/apple-touch-icon.png',
  },
  manifest: '/site.webmanifest',
};

export const viewport: Viewport = { themeColor: '#0f1f3d' };

export default async function RootLayout({ children }: { children: ReactNode }) {
  const lang = await getServerLang();
  return (
    <html lang={lang} className={manrope.variable}>
      <body>
        <Providers lang={lang}>{children}</Providers>
      </body>
    </html>
  );
}
