import { Analytics } from '@vercel/analytics/next';
import { SpeedInsights } from '@vercel/speed-insights/next';
import type { Metadata, Viewport } from 'next';
import { Manrope } from 'next/font/google';
import type { ReactNode } from 'react';
import { getServerLang, serverT } from '../i18n/server';
import { siteUrl } from '../lib/site';
import { Providers } from './providers';
import '../styles/index.css';

const manrope = Manrope({
  subsets: ['latin', 'latin-ext', 'cyrillic'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-manrope',
  display: 'swap',
});

const OG_LOCALE = { uz: 'uz_UZ', ru: 'ru_RU', en: 'en_US' } as const;

const ICONS: Metadata['icons'] = {
  icon: [
    // ?v= busts browsers' favicon cache; bump it here and in site.webmanifest whenever the icons change.
    // sizes="32x32" (not the ICO's full 16/32/48 list) keeps Chrome from preferring the ICO over the SVG.
    { url: '/favicon.ico?v=3', sizes: '32x32' },
    { url: '/favicon.svg?v=3', type: 'image/svg+xml' },
  ],
  apple: { url: '/apple-touch-icon.png?v=3', sizes: '180x180', type: 'image/png' },
};

// In the visitor's language; link-preview bots send no language and get Uzbek.
export async function generateMetadata(): Promise<Metadata> {
  const lang = await getServerLang();
  const title = serverT(lang, 'meta.title');
  const description = serverT(lang, 'meta.description');
  const images = [{ url: '/og-image.png?v=3', width: 1200, height: 630, alt: serverT(lang, 'meta.ogAlt') }];
  return {
    metadataBase: new URL(siteUrl()),
    title: { default: title, template: "%s — Qo'shni" },
    description,
    applicationName: "Qo'shni",
    authors: [{ name: 'Mir2Dos' }],
    creator: 'Mir2Dos',
    formatDetection: { telephone: false },
    appleWebApp: { title: "Qo'shni" },
    openGraph: {
      type: 'website',
      siteName: "Qo'shni",
      locale: OG_LOCALE[lang],
      alternateLocale: Object.values(OG_LOCALE).filter((l) => l !== OG_LOCALE[lang]),
      title,
      description,
      images,
    },
    twitter: { card: 'summary_large_image', title, description, images },
    icons: ICONS,
    manifest: '/site.webmanifest?v=3',
  };
}

export const viewport: Viewport = { themeColor: '#00006E' };

export default async function RootLayout({ children }: { children: ReactNode }) {
  const lang = await getServerLang();
  return (
    <html lang={lang} className={manrope.variable}>
      <body>
        <Providers lang={lang}>{children}</Providers>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
