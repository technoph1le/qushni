import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './app/App';
import { AuthProvider } from './features/auth/AuthProvider';
import { ErrorBoundary } from './components/ErrorBoundary';
import { I18nProvider } from './i18n';
import { CONFIG_MISSING } from './lib/supabase';
import './styles/index.css';

const root = ReactDOM.createRoot(document.getElementById('root')!);

if (CONFIG_MISSING) {
  root.render(
    <div className="page-empty">
      <h1>Qo'shni</h1>
      <p className="muted">Configuration error: VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY and VITE_API_URL must be set for production builds.</p>
    </div>,
  );
} else {
  root.render(
    <React.StrictMode>
      <I18nProvider>
        <ErrorBoundary>
          <AuthProvider>
            <App />
          </AuthProvider>
        </ErrorBoundary>
      </I18nProvider>
    </React.StrictMode>,
  );
}
