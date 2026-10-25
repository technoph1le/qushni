import { createClient, type User } from '@supabase/supabase-js';
import type { Context } from 'hono';
import { env } from '../env.js';

export const db = createClient(env.supabaseUrl, env.supabaseServiceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

export async function userFromRequest(c: Context): Promise<User | null> {
  const header = c.req.header('authorization') ?? '';
  const jwt = header.startsWith('Bearer ') ? header.slice(7) : '';
  if (!jwt) return null;
  const { data, error } = await db.auth.getUser(jwt);
  return error ? null : data.user;
}
