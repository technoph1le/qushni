import type { Metadata } from 'next';
import { PRIVACY } from '../../../content/legal';
import { getServerLang } from '../../../i18n/server';
import { LegalPage } from '../../../views/LegalPage';

export async function generateMetadata(): Promise<Metadata> {
  const lang = await getServerLang();
  return { title: PRIVACY[lang].title, alternates: { canonical: '/privacy' } };
}

export default function Page() {
  return <LegalPage doc="privacy" />;
}
