import type { Metadata } from 'next';
import { TERMS } from '../../../content/legal';
import { getServerLang } from '../../../i18n/server';
import { LegalPage } from '../../../views/LegalPage';

export async function generateMetadata(): Promise<Metadata> {
  const lang = await getServerLang();
  return { title: TERMS[lang].title, alternates: { canonical: '/terms' } };
}

export default function Page() {
  return <LegalPage doc="terms" />;
}
