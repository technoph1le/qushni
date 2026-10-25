import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../auth/AuthProvider';
import { Icon } from '../../components/Icon';
import { Photo } from '../../components/ui';
import { districtName } from '../../data/places';
import { repo } from '../../data/repo';
import { reloadListings } from '../../data/useListings';
import { useI18n } from '../../i18n';
import type { Listing } from '../../types';
import { cx } from '../../lib/utils';


export function useMyListings() {
  const { user } = useAuth();
  const [list, setList] = useState<Listing[] | null>(null);
  const reload = useCallback(async () => {
    if (!user) return;
    try {
      setList(await repo.myListings(user.id));
    } catch (err) {
      console.error(err);
      setList([]);
    }
  }, [user]);
  useEffect(() => {
    reload();
  }, [reload]);
  return { list, reload };
}

export function PhoneBanner() {
  const { t } = useI18n();
  const { user } = useAuth();
  if (!user || user.phoneVerified) return null;
  return (
    <Link to="/dashboard/profile" className="tip tip--warn">
      <Icon name="phone" size={18} />
      <div>
        <strong>{t('verify.t')}</strong>
        <p>{t('verify.d')}</p>
      </div>
    </Link>
  );
}

export function MyListingsTable({ list, reload }: { list: Listing[] | null; reload: () => Promise<void> }) {
  const { t, lt, lang, money, num } = useI18n();

  const run = async (fn: () => Promise<void>) => {
    try {
      await fn();
    } finally {
      await reload();
      reloadListings();
    }
  };

  if (list === null) return <div className="empty empty--panel"><span className="spinner" /></div>;

  if (list.length === 0) {
    return (
      <div className="empty empty--panel">
        <Icon name="home" size={28} />
        <strong>{t('dash.empty')}</strong>
        <span className="muted">{t('dash.emptyHint')}</span>
        <Link to="/dashboard/new" className="btn btn--lime">
          <Icon name="plus" size={16} />
          {t('nav.post')}
        </Link>
      </div>
    );
  }

  return (
    <div className="panel">
      <div className="mylist">
        <div className="mylist__row mylist__row--head">
          <span>{t('dash.col.listing')}</span>
          <span>{t('dash.col.price')}</span>
          <span>{t('dash.col.stats')}</span>
          <span>{t('dash.col.status')}</span>
          <span />
        </div>
        {list.map((l) => (
          <div key={l.id} className="mylist__row">
            <Link to={`/listing/${l.id}`} className="mylist__item">
              <Photo src={l.photos[0]} alt="" className="mylist__thumb" />
              <span>
                <strong>{lt(l.title)}</strong>
                <small className="muted">{districtName(l.city, l.district, lang)} · {t(`room.${l.roomType}`)}</small>
              </span>
            </Link>
            <span className="mylist__price">{money(l.price)}</span>
            <span className="mylist__stats">
              <Icon name="eye" size={15} />{num(l.views)}
              <Icon name="phone" size={15} />{num(l.contacts)}
            </span>
            <span>
              <span className={cx('status', l.status === 'active' ? 'status--on' : 'status--off')}>
                {l.status === 'active' ? t('dash.active') : l.status === 'blocked' ? t('dash.blocked') : t('dash.paused')}
              </span>
            </span>
            <span className="mylist__actions">
              <Link to={`/dashboard/edit/${l.id}`} className="icon-btn" title={t('dash.edit')} aria-label={t('dash.edit')}>
                <Icon name="edit" size={17} />
              </Link>
              {l.status !== 'blocked' && (
                <button
                  className="icon-btn"
                  onClick={() => run(() => repo.setStatus(l.id, l.status === 'active' ? 'paused' : 'active'))}
                  title={l.status === 'active' ? t('dash.pause') : t('dash.resume')}
                  aria-label={l.status === 'active' ? t('dash.pause') : t('dash.resume')}
                >
                  <Icon name={l.status === 'active' ? 'pause' : 'play'} size={17} />
                </button>
              )}
              <button
                className="icon-btn icon-btn--danger"
                onClick={() => window.confirm(t('dash.confirmDelete')) && run(() => repo.deleteListing(l.id))}
                title={t('dash.delete')}
                aria-label={t('dash.delete')}
              >
                <Icon name="trash" size={17} />
              </button>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
