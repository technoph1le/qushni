import type { Metadata } from 'next';
import { Suspense } from 'react';
import { PaymentReturnPage } from '../../../../views/PaymentReturnPage';

export const metadata: Metadata = { robots: { index: false } };

export default function Page() {
  return (
    <Suspense>
      <PaymentReturnPage />
    </Suspense>
  );
}
