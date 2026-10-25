import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

export const supabase = url && anonKey ? createClient(url, anonKey) : null;

const apiUrl = import.meta.env.VITE_API_URL as string | undefined;

/** Without Supabase keys the dev server runs on local demo data so the UI can be developed offline. */
export const DEMO = supabase === null && import.meta.env.DEV;

/** A production build must never silently fall back to demo data. */
export const CONFIG_MISSING = !import.meta.env.DEV && (supabase === null || !apiUrl);

export const API_URL = (apiUrl ?? 'http://localhost:8787').replace(/\/$/, '');

export class ApiError extends Error {
  constructor(public code: string, public status: number, public data: Record<string, unknown> = {}) {
    super(code);
  }
}

export async function apiFetch<T>(path: string, init: { method?: string; body?: unknown } = {}): Promise<T> {
  const headers: Record<string, string> = { 'content-type': 'application/json' };
  const session = supabase ? (await supabase.auth.getSession()).data.session : null;
  if (session) headers.authorization = `Bearer ${session.access_token}`;
  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}`, {
      method: init.method ?? (init.body ? 'POST' : 'GET'),
      headers,
      body: init.body ? JSON.stringify(init.body) : undefined,
    });
  } catch {
    throw new ApiError('network', 0);
  }
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new ApiError(json.error ?? 'generic', res.status, json);
  return json as T;
}
