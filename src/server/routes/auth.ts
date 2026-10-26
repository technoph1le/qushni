import { randomBytes } from 'node:crypto';
import { Hono } from 'hono';
import { env } from '../env.js';
import { normalizePhone } from '../lib/phone.js';
import { db, userFromRequest } from '../lib/supabase.js';
import { hashCode, sameHash, sendCode } from '../lib/loginCode.js';
import { pickLang } from '../lib/telegram.js';

const MAX_ATTEMPTS = 5;
const RESEND_SECONDS = 60;

export const auth = new Hono();

// Step 1: the site sends the phone number. Returning users get the code in Telegram right away;
// new users are sent to the bot to share their contact (Telegram confirms the number belongs to them).
auth.post('/telegram/start', async (c) => {
  const body = await c.req.json().catch(() => ({}));
  const phone = normalizePhone(body.phone);
  const lang = pickLang(body.lang);
  if (!phone) return c.json({ error: 'invalid_phone' }, 400);

  const user = await userFromRequest(c);

  // Housekeeping: old login attempts are useless after they expire.
  await db.from('telegram_logins').delete().lt('expires_at', new Date(Date.now() - 86_400_000).toISOString());

  const { data: recent } = await db
    .from('telegram_logins')
    .select('created_at')
    .eq('phone', phone)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (recent) {
    const wait = RESEND_SECONDS - Math.floor((Date.now() - new Date(recent.created_at).getTime()) / 1000);
    if (wait > 0) return c.json({ error: 'too_many_requests', retry_after: wait }, 429);
  }

  const { data: owner } = await db
    .from('profiles')
    .select('id, telegram_id, phone_verified')
    .eq('phone', phone)
    .maybeSingle();

  if (user && owner && owner.id !== user.id && owner.phone_verified) {
    return c.json({ error: 'phone_taken' }, 409);
  }

  const token = randomBytes(24).toString('base64url');
  const row = { token, phone, lang, user_id: user?.id ?? null };

  if (owner?.telegram_id) {
    try {
      const code_hash = await sendCode(token, owner.telegram_id, lang);
      await db.from('telegram_logins').insert({ ...row, telegram_id: owner.telegram_id, code_hash, status: 'code_sent' });
      return c.json({ token, mode: 'code_sent' });
    } catch {
      // The user blocked or deleted the bot — fall back to the contact-sharing flow.
    }
  }

  await db.from('telegram_logins').insert(row);
  return c.json({ token, mode: 'open_bot', link: `https://t.me/${env.telegram.username}?start=${token}` });
});

// Lets the site switch from "open the bot" to "enter the code" as soon as the code has been sent.
auth.get('/telegram/status/:token', async (c) => {
  const { data } = await db
    .from('telegram_logins')
    .select('status, expires_at')
    .eq('token', c.req.param('token'))
    .maybeSingle();
  if (!data || new Date(data.expires_at) < new Date() || data.status === 'consumed') return c.json({ status: 'expired' });
  return c.json({ status: data.status });
});

// Step 2: the user types the code from Telegram.
auth.post('/telegram/verify', async (c) => {
  const body = await c.req.json().catch(() => ({}));
  const token = String(body.token ?? '');
  const code = String(body.code ?? '').replace(/\D/g, '');

  const { data: login } = await db.from('telegram_logins').select('*').eq('token', token).maybeSingle();
  if (!login || login.status !== 'code_sent' || new Date(login.expires_at) < new Date()) {
    return c.json({ error: 'expired' }, 400);
  }
  if (login.attempts >= MAX_ATTEMPTS) return c.json({ error: 'too_many_attempts' }, 400);

  if (!sameHash(login.code_hash, hashCode(token, code))) {
    await db.from('telegram_logins').update({ attempts: login.attempts + 1 }).eq('token', token);
    return c.json({ error: 'invalid_code', attempts_left: MAX_ATTEMPTS - login.attempts - 1 }, 400);
  }

  const { data: claimed } = await db
    .from('telegram_logins')
    .update({ status: 'consumed' })
    .eq('token', token)
    .eq('status', 'code_sent')
    .select()
    .maybeSingle();
  if (!claimed) return c.json({ error: 'expired' }, 400);

  const phoneFields = {
    phone: login.phone,
    phone_verified: true,
    telegram_id: login.telegram_id,
    telegram_username: login.telegram_username,
  };

  // Linking a phone to an account that signed up with Google.
  if (login.user_id) {
    const conflict = await findOtherOwner(login.user_id, login.phone, login.telegram_id);
    if (conflict) return c.json({ error: 'phone_taken' }, 409);
    const { error } = await db.from('profiles').update(phoneFields).eq('id', login.user_id);
    if (error) return c.json({ error: 'update_failed' }, 500);
    return c.json({ status: 'linked' });
  }

  // Signing in (or signing up) with the phone number.
  let userId = await findProfileId(login.telegram_id, login.phone);
  if (!userId) {
    const { data, error } = await db.auth.admin.createUser({
      email: `tg${login.telegram_id}@users.qoshni.uz`,
      email_confirm: true,
      phone: login.phone.slice(1),
      phone_confirm: true,
      user_metadata: { full_name: login.first_name ?? '' },
    });
    if (error || !data.user) return c.json({ error: 'signup_failed' }, 500);
    userId = data.user.id;
  }

  const conflict = await findOtherOwner(userId, login.phone, login.telegram_id);
  if (conflict) return c.json({ error: 'phone_taken' }, 409);
  await db.from('profiles').update(phoneFields).eq('id', userId);

  const { data: userData } = await db.auth.admin.getUserById(userId);
  const email = userData.user?.email;
  if (!email) return c.json({ error: 'signin_failed' }, 500);

  const { data: link, error: linkError } = await db.auth.admin.generateLink({ type: 'magiclink', email });
  if (linkError || !link.properties?.hashed_token) return c.json({ error: 'signin_failed' }, 500);

  return c.json({ status: 'signed_in', token_hash: link.properties.hashed_token });
});

async function findProfileId(telegramId: number, phone: string): Promise<string | null> {
  const byTelegram = await db.from('profiles').select('id').eq('telegram_id', telegramId).maybeSingle();
  if (byTelegram.data) return byTelegram.data.id;
  const byPhone = await db.from('profiles').select('id').eq('phone', phone).maybeSingle();
  return byPhone.data?.id ?? null;
}

async function findOtherOwner(userId: string, phone: string, telegramId: number) {
  const { data } = await db
    .from('profiles')
    .select('id')
    .neq('id', userId)
    .or(`phone.eq.${phone},telegram_id.eq.${telegramId}`)
    .limit(1);
  return (data?.length ?? 0) > 0;
}
