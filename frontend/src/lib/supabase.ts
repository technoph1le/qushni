import { createClient } from '@supabase/supabase-js';

// Must be written out in full so Next.js can inline them into the browser bundle.
// These are the names Vercel's Supabase integration creates; both values are public by design.
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

/** Browser client. Null only when the deployment is missing its Supabase settings. */
export const supabase = url && publishableKey ? createClient(url, publishableKey) : null;

export const CONFIG_MISSING = supabase === null;

export class ApiError extends Error {
  constructor(
    public code: string,
    public status: number,
    public data: Record<string, unknown> = {},
  ) {
    super(code);
  }
}

/** Calls this app's own API routes (/api/…), sending the signed-in user's token. */
export async function apiFetch<T>(path: string, init: { method?: string; body?: unknown } = {}): Promise<T> {
  const headers: Record<string, string> = { 'content-type': 'application/json' };
  const session = supabase ? (await supabase.auth.getSession()).data.session : null;
  if (session) headers.authorization = `Bearer ${session.access_token}`;
  let res: Response;
  try {
    res = await fetch(`/api${path}`, {
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
