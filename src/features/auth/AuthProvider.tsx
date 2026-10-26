import type { Session } from '@supabase/supabase-js';
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { repo, type Access } from '../../data/repo';
import { apiFetch, DEMO, supabase } from '../../lib/supabase';
import { getState, setState, useStore } from '../../lib/store';
import type { Lang } from '../../types';

export interface AppUser {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  phoneVerified: boolean;
  avatar: string | null;
}

export interface PhoneStart {
  token: string;
  mode: 'code_sent' | 'open_bot';
  link?: string;
}

interface AuthContext {
  ready: boolean;
  user: AppUser | null;
  access: { paywallOn: boolean; accessUntil: string | null; has: boolean };
  refreshAccess: () => Promise<void>;
  signInWithGoogle: (next: string) => Promise<void>;
  startPhone: (phone: string, lang: Lang) => Promise<PhoneStart>;
  phoneStatus: (token: string) => Promise<'pending' | 'code_sent' | 'expired'>;
  verifyCode: (token: string, code: string) => Promise<'signed_in' | 'linked'>;
  updateName: (name: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const Ctx = createContext<AuthContext | null>(null);

// Phone-only accounts get a placeholder email that is never shown.
const realEmail = (email?: string | null) => (email && !email.endsWith('@users.qoshni.uz') ? email : null);

async function loadProfile(session: Session): Promise<AppUser> {
  const { data } = await supabase!.from('profiles').select('*').eq('id', session.user.id).maybeSingle();
  const meta = session.user.user_metadata ?? {};
  return {
    id: session.user.id,
    name: data?.full_name || meta.full_name || meta.name || '',
    email: realEmail(session.user.email),
    phone: data?.phone ?? null,
    phoneVerified: data?.phone_verified ?? false,
    avatar: data?.avatar_url ?? meta.avatar_url ?? null,
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(DEMO);
  const [sbUser, setSbUser] = useState<AppUser | null>(null);
  const [access, setAccess] = useState<Access>({ paywall: false, accessUntil: null });
  const demoUser = useStore((s) => s.demoUser);
  const preview = useStore((s) => s.paywallPreview);

  useEffect(() => {
    if (!supabase) return;
    let alive = true;
    const apply = async (session: Session | null) => {
      const u = session ? await loadProfile(session).catch(() => null) : null;
      if (alive) {
        setSbUser(u);
        setReady(true);
      }
    };
    supabase.auth.getSession().then(({ data }) => apply(data.session));
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (event !== 'INITIAL_SESSION') setTimeout(() => apply(session), 0);
    });
    return () => {
      alive = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  const user = useMemo<AppUser | null>(
    () => (DEMO ? demoUser && { ...demoUser, phoneVerified: !!demoUser.phone, avatar: null } : sbUser),
    [demoUser, sbUser],
  );

  const refreshAccess = useCallback(async () => {
    try {
      setAccess(await repo.getAccess());
    } catch (err) {
      console.error(err);
    }
  }, []);

  useEffect(() => {
    refreshAccess();
  }, [refreshAccess, user?.id]);

  const refreshProfile = useCallback(async () => {
    if (!supabase) return;
    const { data } = await supabase.auth.getSession();
    if (data.session) setSbUser(await loadProfile(data.session));
  }, []);

  const value = useMemo<AuthContext>(() => {
    const paywallOn = access.paywall || preview;
    const valid = access.accessUntil !== null && new Date(access.accessUntil) > new Date();
    return {
      ready,
      user,
      access: { paywallOn, accessUntil: valid ? access.accessUntil : null, has: !paywallOn || valid },
      refreshAccess,

      async signInWithGoogle(next) {
        if (!supabase) {
          setState({ demoUser: { id: 'demo-user', name: 'Aziza', email: 'aziza@gmail.com', phone: getState().demoUser?.phone ?? null } });
          return;
        }
        const { error } = await supabase.auth.signInWithOAuth({
          provider: 'google',
          // Come back to /login so an OAuth error can be shown there; on success it forwards to `next`.
          options: { redirectTo: `${window.location.origin}/login?next=${encodeURIComponent(next)}` },
        });
        if (error) throw error;
      },

      async startPhone(phone, lang) {
        if (DEMO) return { token: `demo:${phone}`, mode: 'code_sent' };
        return apiFetch<PhoneStart>('/auth/telegram/start', { body: { phone, lang } });
      },

      async phoneStatus(token) {
        if (DEMO) return 'code_sent';
        const res = await apiFetch<{ status: 'pending' | 'code_sent' | 'expired' }>(`/auth/telegram/status/${encodeURIComponent(token)}`);
        return res.status;
      },

      async verifyCode(token, code) {
        if (DEMO) {
          const phone = token.slice('demo:'.length);
          const cur = getState().demoUser;
          setState({ demoUser: cur ? { ...cur, phone } : { id: 'demo-user', name: '', email: null, phone } });
          return cur ? 'linked' : 'signed_in';
        }
        const res = await apiFetch<{ status: 'signed_in' | 'linked'; token_hash?: string }>('/auth/telegram/verify', {
          body: { token, code },
        });
        if (res.status === 'signed_in' && res.token_hash) {
          const { error } = await supabase!.auth.verifyOtp({ token_hash: res.token_hash, type: 'email' });
          if (error) throw error;
        } else {
          await refreshProfile();
        }
        return res.status;
      },

      async updateName(name) {
        if (!supabase) {
          const cur = getState().demoUser;
          if (cur) setState({ demoUser: { ...cur, name } });
          return;
        }
        if (!user) return;
        const { error } = await supabase.from('profiles').update({ full_name: name }).eq('id', user.id);
        if (error) throw error;
        await refreshProfile();
      },

      async signOut() {
        if (!supabase) {
          setState({ demoUser: null });
          return;
        }
        await supabase.auth.signOut();
      },
    };
  }, [ready, user, access, preview, refreshAccess, refreshProfile]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAuth() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
