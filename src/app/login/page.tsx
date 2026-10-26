import type { Metadata } from 'next';
import { Suspense } from 'react';
import { LoginPage } from '../../views/LoginPage';

export const metadata: Metadata = { title: 'Kirish', robots: { index: false } };

export default function Page() {
  return (
    <Suspense>
      <LoginPage />
    </Suspense>
  );
}
