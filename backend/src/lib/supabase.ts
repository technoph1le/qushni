import { createClient, type SupabaseClient, type User } from '@supabase/supabase-js';
import type { Context } from 'hono';
import { env } from '../env.js';

let client: SupabaseClient | null = null;

/** Service-role client: bypasses row-level security, so it must only ever run on the server. */
export const db = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    client ??= createClient(env.supabaseUrl, env.supabaseServiceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const value = Reflect.get(client, prop);
    return typeof value === 'function' ? value.bind(client) : value;
  },
});

export async function userFromRequest(c: Context): Promise<User | null> {
  const header = c.req.header('authorization') ?? '';
  const jwt = header.startsWith('Bearer ') ? header.slice(7) : '';
  if (!jwt) return null;
  const { data, error } = await db.auth.getUser(jwt);
  return error ? null : data.user;
}
