import { useState } from 'react';
import { useAuth } from '../../features/auth/AuthProvider';
import { Icon } from '../../components/Icon';
import { PhoneVerify } from '../../features/auth/PhoneVerify';
import { useI18n } from '../../i18n';
import { formatPhone } from '../../lib/utils';

export function ProfilePage() {
  const { t } = useI18n();
  const { user, updateName, signOut } = useAuth();
  const [name, setName] = useState(user?.name ?? '');
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  if (!user) return null;

  return (
    <>
      <div className="dash__head">
        <h1>{t('dash.profile')}</h1>
      </div>
      <div className="profile-grid">
        <form
          className="panel form"
          onSubmit={async (e) => {
            e.preventDefault();
            setError('');
            try {
              await updateName(name.trim());
              setSaved(true);
            } catch {
              setError(t('auth.err.generic'));
            }
          }}
        >
          <label className="input">
            <span>{t('prof.name')}</span>
            <input value={name} onChange={(e) => { setName(e.target.value); setSaved(false); }} maxLength={60} required />
          </label>
          {user.email && (
            <div className="input">
              <span>{t('prof.email')}</span>
              <div className="readonly">{user.email}</div>
            </div>
          )}
          <div className="input">
            <span>{t('prof.phone')}</span>
            <div className="readonly">
              {user.phone ? formatPhone(user.phone) : '—'}
              <span className={user.phoneVerified ? 'status status--on' : 'status status--off'}>
                {user.phoneVerified ? t('prof.phoneVerified') : t('prof.phoneMissing')}
              </span>
            </div>
          </div>
          {error && <p className="form__error" role="alert"><Icon name="info" size={16} />{error}</p>}
          <div className="form__actions">
            <button type="button" className="btn btn--ghost" onClick={() => signOut()}>
              <Icon name="logout" size={16} />
              {t('auth.signOut')}
            </button>
            <button type="submit" className="btn btn--dark">
              {saved ? <><Icon name="check" size={16} />{t('prof.saved')}</> : t('prof.save')}
            </button>
          </div>
        </form>

        {!user.phoneVerified && (
          <div className="panel verify">
            <span className="host-card__icon"><Icon name="phone" size={24} /></span>
            <h3>{t('verify.t')}</h3>
            <p className="muted">{t('verify.d')}</p>
            <PhoneVerify onDone={() => {}} />
          </div>
        )}
      </div>
    </>
  );
}
