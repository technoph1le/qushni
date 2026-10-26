import type { Metadata } from 'next';
import { SavedPage } from '../../../views/SavedPage';

export const metadata: Metadata = { title: 'Saqlanganlar', robots: { index: false } };

export default function Page() {
  return <SavedPage />;
}
