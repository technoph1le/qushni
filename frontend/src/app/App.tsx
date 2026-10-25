import { useEffect } from 'react';
import { BrowserRouter, Outlet, Route, Routes, useLocation } from 'react-router-dom';
import { Footer } from '../components/layout/Footer';
import { Header } from '../components/layout/Header';
import { useAuth } from '../features/auth/AuthProvider';
import { useI18n } from '../i18n';
import { useStore } from '../lib/store';
import { DashboardLayout } from '../pages/dashboard/DashboardLayout';
import { ListingFormPage } from '../pages/dashboard/ListingFormPage';
import { MyListingsPage } from '../pages/dashboard/MyListingsPage';
import { OverviewPage } from '../pages/dashboard/OverviewPage';
import { ProfilePage } from '../pages/dashboard/ProfilePage';
import { HomePage } from '../pages/HomePage';
import { LegalPage } from '../pages/LegalPage';
import { ListingPage } from '../pages/ListingPage';
import { LoginPage } from '../pages/LoginPage';
import { NotFoundPage } from '../pages/NotFoundPage';
import { PaymentReturnPage } from '../pages/PaymentReturnPage';
import { SavedPage } from '../pages/SavedPage';

const DEFAULT_TITLE = "Qo'shni — sherik va xona toping";

function RouteEffects() {
  const { pathname, hash } = useLocation();
  useEffect(() => {
    if (hash) {
      requestAnimationFrame(() => document.getElementById(decodeURIComponent(hash.slice(1)))?.scrollIntoView());
    } else {
      window.scrollTo(0, 0);
    }
  }, [pathname, hash]);
  useEffect(() => {
    // Pages with their own title (legal pages) set it after this runs.
    document.title = DEFAULT_TITLE;
  }, [pathname]);
  return null;
}

function SkipLink() {
  const { t } = useI18n();
  return (
    <a className="skip-link" href="#main">
      {t('a11y.skip')}
    </a>
  );
}

function PublicLayout() {
  const { access } = useAuth();
  const preview = useStore((s) => s.paywallPreview);
  const { t } = useI18n();
  return (
    <>
      {access.paywallOn && preview && <div className="preview-bar">{t('footer.paywallPreview')}</div>}
      <Header />
      <main id="main" tabIndex={-1}>
        <Outlet />
      </main>
      <Footer />
    </>
  );
}

export function App() {
  return (
    <BrowserRouter>
      <SkipLink />
      <RouteEffects />
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route element={<PublicLayout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/listing/:id" element={<ListingPage />} />
          <Route path="/saved" element={<SavedPage />} />
          <Route path="/privacy" element={<LegalPage doc="privacy" />} />
          <Route path="/terms" element={<LegalPage doc="terms" />} />
          <Route path="/payment/return" element={<PaymentReturnPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
        <Route path="/dashboard" element={<DashboardLayout />}>
          <Route index element={<OverviewPage />} />
          <Route path="listings" element={<MyListingsPage />} />
          <Route path="new" element={<ListingFormPage key="new" />} />
          <Route path="edit/:id" element={<ListingFormPage />} />
          <Route path="profile" element={<ProfilePage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
