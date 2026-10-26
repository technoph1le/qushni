import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { LEGAL_UPDATED } from '../config';
import { PRIVACY, TERMS } from '../content/legal';
import { useI18n } from '../i18n';

export function LegalPage({ doc }: { doc: 'privacy' | 'terms' }) {
  const { t, lang, date } = useI18n();
  const content = (doc === 'privacy' ? PRIVACY : TERMS)[lang];

  useEffect(() => {
    document.title = `${content.title} — Qo'shni`;
  }, [content.title]);

  return (
    <article className="container legal">
      <header className="legal__head">
        <p className="eyebrow">{t('legal.eyebrow')}</p>
        <h1>{content.title}</h1>
        <p className="muted">{t('legal.updated', { d: `${date(LEGAL_UPDATED)} ${LEGAL_UPDATED.slice(0, 4)}` })}</p>
        <p className="legal__intro">{content.intro}</p>
      </header>

      <div className="legal__layout">
        <nav className="legal__toc" aria-label={t('legal.toc')}>
          <strong>{t('legal.toc')}</strong>
          <ol>
            {content.sections.map((s) => (
              <li key={s.id}>
                <a href={`#${s.id}`}>{s.heading}</a>
              </li>
            ))}
          </ol>
        </nav>

        <div className="legal__body">
          {content.sections.map((s, i) => (
            <section key={s.id} id={s.id} aria-labelledby={`${s.id}-h`}>
              <h2 id={`${s.id}-h`}>
                <span className="legal__num">{i + 1}.</span> {s.heading}
              </h2>
              {s.paragraphs.map((p) => (
                <p key={p}>{p}</p>
              ))}
              {s.list && (
                <ul>
                  {s.list.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              )}
            </section>
          ))}
          <p className="legal__switch">
            {doc === 'privacy' ? <Link to="/terms">{t('legal.terms')}</Link> : <Link to="/privacy">{t('legal.privacy')}</Link>}
          </p>
        </div>
      </div>
    </article>
  );
}
