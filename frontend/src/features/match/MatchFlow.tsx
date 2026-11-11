'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Icon, type IconName } from '../../components/Icon';
import { useDialog } from '../../components/useDialog';
import { CITIES, REGIONS } from '../../data/places';
import { useI18n, type TKey } from '../../i18n';
import { cx } from '../../lib/utils';
import { BUDGET_PRESETS } from '../listings/filters';
import { EMPTY_ANSWERS, requestMatches, type MatchAnswers, type MatchResult } from './api';

/**
 * "Find my room": one big question per screen, answered with a tap. Every question can be skipped,
 * and the first screen lets people simply write what they want in their own words instead.
 */

type Question = 'city' | 'from' | 'who' | 'budget' | 'note';
type Step = 'intro' | Question | 'thinking';
const QUESTIONS: Question[] = ['city', 'from', 'who', 'budget', 'note'];
const KEYS = 'ABCDEFGHIJKLMNOP';

const IDEAS: TKey[] = ['ai.idea.metro', 'ai.idea.quiet', 'ai.idea.utilities', 'ai.idea.nosmoke', 'ai.idea.ac', 'ai.idea.parking'];

interface Option {
  value: string | number | null;
  label: string;
  sub?: string;
  icon?: IconName;
  big?: boolean;
}

export function MatchFlow({
  roomCount,
  initial,
  onClose,
  onDone,
}: {
  roomCount: number;
  initial?: MatchAnswers;
  onClose: () => void;
  onDone: (answers: MatchAnswers, result: MatchResult | null) => void;
}) {
  const { t, lang, money } = useI18n();
  const [step, setStep] = useState<Step>('intro');
  const [answers, setAnswers] = useState<MatchAnswers>(initial ?? EMPTY_ANSWERS);
  const [picked, setPicked] = useState<string | null>(null);
  const ref = useDialog<HTMLDivElement>(onClose);

  const qIndex = QUESTIONS.indexOf(step as Question);
  const progress = step === 'intro' ? 0 : step === 'thinking' ? 1 : qIndex / QUESTIONS.length;

  const go = (s: Step) => {
    setPicked(null);
    setStep(s);
  };
  const next = () => go(qIndex >= 0 && qIndex < QUESTIONS.length - 1 ? QUESTIONS[qIndex + 1] : 'thinking');
  const back = () => go(qIndex > 0 ? QUESTIONS[qIndex - 1] : 'intro');

  const options: Record<Exclude<Question, 'note'>, Option[]> = {
    city: [
      ...CITIES.map((c, i) => ({ value: c.id, label: c.name[lang], big: i === 0 })),
      { value: null, label: t('ai.any'), icon: 'globe' as const },
    ],
    from: [...REGIONS.map((r) => ({ value: r.id, label: r.name[lang] })), { value: null, label: t('ai.any'), icon: 'globe' as const }],
    who: [
      { value: 'male', label: t('ai.who.male'), icon: 'user' },
      { value: 'female', label: t('ai.who.female'), icon: 'user' },
      { value: 'couple', label: t('ai.who.couple'), icon: 'users' },
    ],
    budget: [
      ...BUDGET_PRESETS.map((b) => ({ value: b, label: t('hero.upTo', { v: money(b) }), icon: 'wallet' as const })),
      { value: null, label: t('ai.any'), icon: 'globe' as const },
    ],
  };
  const field = { city: 'city', from: 'from', who: 'who', budget: 'maxPrice' } as const;

  const choose = (q: Exclude<Question, 'note'>, o: Option) => {
    setAnswers((a) => ({ ...a, [field[q]]: o.value }));
    setPicked(String(o.value));
    // A short beat so the tap visibly "lands" before the next question slides in.
    window.setTimeout(next, 260);
  };

  // Typeform-style: press the letter on a tile to pick it, Enter to continue.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement;
      if (el.tagName === 'TEXTAREA' || el.tagName === 'INPUT' || e.metaKey || e.ctrlKey || e.altKey) return;
      if (step === 'city' || step === 'from' || step === 'who' || step === 'budget') {
        const i = KEYS.indexOf(e.key.toUpperCase());
        const o = options[step][i];
        if (i >= 0 && o && e.key.length === 1) {
          e.preventDefault();
          choose(step, o);
        } else if (e.key === 'Enter' && !picked) {
          e.preventDefault();
          next();
        }
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  });

  const current = (q: Exclude<Question, 'note'>) => String(answers[field[q]]);

  return (
    <div className="mf" role="dialog" aria-modal="true" aria-labelledby="mf-title" ref={ref}>
      <div className="mf__top">
        <span className="mf__brand">
          <Icon name="sparkle" size={18} />
          {t('ai.badge')}
        </span>
        <div className="mf__progress" aria-hidden="true">
          <span style={{ transform: `scaleX(${progress})` }} />
        </div>
        <button className="icon-btn mf__x" onClick={onClose} aria-label={t('pay.close')}>
          <Icon name="x" size={20} />
        </button>
      </div>

      <div className="mf__stage">
        {step === 'intro' && (
          <Screen key="intro">
            <h2 className="mf__title" id="mf-title">{t('ai.intro.t')}</h2>
            <p className="mf__lead">{t('ai.intro.d')}</p>
            <div className="mf__actions">
              <button className="btn btn--accent btn--lg mf__go" onClick={() => go('city')} autoFocus>
                {t('ai.start')}
                <Icon name="arrowRight" size={20} />
              </button>
              <span className="mf__or">{t('ai.orType')}</span>
            </div>
            <form
              className="mf__quick"
              onSubmit={(e) => {
                e.preventDefault();
                if (answers.note.trim()) go('thinking');
              }}
            >
              <textarea
                className="mf__text"
                rows={3}
                maxLength={500}
                value={answers.note}
                placeholder={t('ai.typePh')}
                aria-label={t('ai.orType')}
                onChange={(e) => setAnswers((a) => ({ ...a, note: e.target.value }))}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    e.currentTarget.form?.requestSubmit();
                  }
                }}
              />
              <button className="btn btn--dark mf__send" disabled={!answers.note.trim()} aria-label={t('ai.find')}>
                <Icon name="send" size={18} />
              </button>
            </form>
            <button className="link-btn mf__skip" onClick={onClose}>{t('ai.skip')}</button>
          </Screen>
        )}

        {(step === 'city' || step === 'from' || step === 'who' || step === 'budget') && (
          <Screen key={step}>
            <p className="mf__count">{t('ai.step', { n: qIndex + 1, total: QUESTIONS.length })}</p>
            <h2 className="mf__title" id="mf-title">{t(`ai.q.${step}`)}</h2>
            {step === 'from' && <p className="mf__lead">{t('ai.q.fromHint')}</p>}
            {step === 'budget' && <p className="mf__lead">{t('ai.q.budgetHint')}</p>}
            <div className={cx('mf__tiles', `mf__tiles--${step}`)} role="radiogroup" aria-labelledby="mf-title">
              {options[step].map((o, i) => {
                const on = picked === String(o.value) || (!picked && current(step) === String(o.value) && o.value !== null);
                return (
                  <button
                    key={String(o.value)}
                    role="radio"
                    aria-checked={on}
                    className={cx('mf__tile', o.big && 'mf__tile--big', on && 'is-on')}
                    onClick={() => choose(step, o)}
                  >
                    <kbd className="mf__key" aria-hidden="true">{KEYS[i]}</kbd>
                    {o.icon && <Icon name={o.icon} size={step === 'who' ? 30 : 18} />}
                    <span>{o.label}</span>
                    {on && <Icon name="check" size={18} className="mf__tick" />}
                  </button>
                );
              })}
            </div>
            <Nav onBack={back} onSkip={next} hint={t('ai.pressKey')} />
          </Screen>
        )}

        {step === 'note' && (
          <Screen key="note">
            <p className="mf__count">{t('ai.step', { n: QUESTIONS.length, total: QUESTIONS.length })}</p>
            <h2 className="mf__title" id="mf-title">{t('ai.q.note')}</h2>
            <p className="mf__lead">{t('ai.q.noteHint')}</p>
            <textarea
              className="mf__text mf__text--big"
              rows={3}
              maxLength={500}
              autoFocus
              value={answers.note}
              placeholder={t('ai.notePh')}
              aria-labelledby="mf-title"
              onChange={(e) => setAnswers((a) => ({ ...a, note: e.target.value }))}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  go('thinking');
                }
              }}
            />
            <div className="mf__ideas">
              {IDEAS.map((k) => {
                const idea = t(k);
                const has = answers.note.toLowerCase().includes(idea.toLowerCase());
                return (
                  <button
                    key={k}
                    className={cx('mf__idea', has && 'is-on')}
                    aria-pressed={has}
                    onClick={() =>
                      setAnswers((a) => ({
                        ...a,
                        note: has
                          ? a.note.replace(new RegExp(`(, )?${idea.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`, 'i'), '').replace(/^, /, '')
                          : a.note.trim() ? `${a.note.trim()}, ${idea}` : idea,
                      }))
                    }
                  >
                    {has ? <Icon name="check" size={15} /> : <Icon name="plus" size={15} />}
                    {idea}
                  </button>
                );
              })}
            </div>
            <div className="mf__actions">
              <button className="btn btn--accent btn--lg mf__go" onClick={() => go('thinking')}>
                <Icon name="sparkle" size={20} />
                {t('ai.find')}
              </button>
            </div>
            <Nav onBack={back} hint={t('ai.pressEnter')} />
          </Screen>
        )}

        {step === 'thinking' && <Thinking answers={answers} roomCount={roomCount} onDone={onDone} />}
      </div>
    </div>
  );
}

function Screen({ children }: { children: ReactNode }) {
  return <div className="mf__screen">{children}</div>;
}

function Nav({ onBack, onSkip, hint }: { onBack: () => void; onSkip?: () => void; hint: string }) {
  const { t } = useI18n();
  return (
    <div className="mf__nav">
      <button className="btn btn--ghost" onClick={onBack}>
        <Icon name="chevronLeft" size={18} />
        {t('form.back')}
      </button>
      <span className="mf__hint">{hint}</span>
      {onSkip && (
        <button className="btn btn--ghost" onClick={onSkip}>
          {t('ai.skipQ')}
          <Icon name="chevronRight" size={18} />
        </button>
      )}
    </div>
  );
}

/** The AI call usually takes a few seconds; show what it's doing so the wait feels like work, not lag. */
function Thinking({ answers, roomCount, onDone }: { answers: MatchAnswers; roomCount: number; onDone: (a: MatchAnswers, r: MatchResult | null) => void }) {
  const { t, lang } = useI18n();
  const [phase, setPhase] = useState(0);
  const started = useRef(false);
  const steps = [t('ai.think.1', { n: roomCount }), t('ai.think.2'), t('ai.think.3')];

  useEffect(() => {
    const timer = window.setInterval(() => setPhase((p) => Math.min(p + 1, steps.length - 1)), 1800);
    return () => window.clearInterval(timer);
  }, [steps.length]);

  useEffect(() => {
    if (started.current) return; // React strict mode runs effects twice in development
    started.current = true;
    const minWait = new Promise((r) => setTimeout(r, 2400));
    requestMatches(answers, lang)
      .then(async (r) => {
        await minWait;
        onDone(answers, r);
      })
      .catch(async (err) => {
        console.error(err);
        await minWait;
        onDone(answers, null);
      });
  }, [answers, lang, onDone]);

  return (
    <div className="mf__screen mf__thinking" role="status" aria-live="polite">
      <div className="mf__orb" aria-hidden="true">
        <Icon name="sparkle" size={40} />
      </div>
      <h2 className="mf__title" id="mf-title">{t('ai.thinkTitle')}</h2>
      <ol className="mf__phases">
        {steps.map((s, i) => (
          <li key={i} className={cx(i < phase && 'is-done', i === phase && 'is-now')}>
            {i < phase ? <Icon name="check" size={18} /> : <span className="mf__dot" />}
            {s}
          </li>
        ))}
      </ol>
    </div>
  );
}
