import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { DashboardLayout } from '../../views/dashboard/DashboardLayout';

export const metadata: Metadata = { title: 'Kabinet', robots: { index: false } };

export default function Layout({ children }: { children: ReactNode }) {
  return <DashboardLayout>{children}</DashboardLayout>;
}
