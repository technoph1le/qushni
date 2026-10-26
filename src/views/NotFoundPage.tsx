import { Link } from 'react-router-dom';
import { useI18n } from '../i18n';

export function NotFoundPage() {
  const { t } = useI18n();
  return (
    <div className="container page-empty">
      <h1>{t('notFound.title')}</h1>
      <Link to="/" className="btn btn--dark">{t('notFound.cta')}</Link>
    </div>
  );
}
