'use client';

import { Icon } from '../../components/Icon';
import { useDialog } from '../../components/useDialog';
import { useI18n } from '../../i18n';
import type { FilterState } from './filters';
import { FiltersPanel } from './FiltersPanel';

/** Filters as a slide-in panel on phones and tablets. */
export function FiltersDrawer({
  value,
  onChange,
  resultCount,
  onClose,
}: {
  value: FilterState;
  onChange: (f: FilterState) => void;
  resultCount: number;
  onClose: () => void;
}) {
  const { t } = useI18n();
  const ref = useDialog<HTMLDivElement>(onClose);

  return (
    <div className="drawer" onClick={onClose}>
      <div
        ref={ref}
        className="drawer__panel"
        role="dialog"
        aria-modal="true"
        aria-label={t('list.filters')}
        onClick={(e) => e.stopPropagation()}
      >
        <button className="icon-btn drawer__x" onClick={onClose} aria-label={t('common.close')}>
          <Icon name="x" />
        </button>
        <FiltersPanel value={value} onChange={onChange} />
        <button className="btn btn--dark btn--block btn--lg drawer__apply" onClick={onClose}>
          {t('list.apply', { n: resultCount })}
        </button>
      </div>
    </div>
  );
}
