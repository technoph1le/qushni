import { Hono } from 'hono';
import { env } from '../env';
import { db } from '../lib/supabase';
import { botText, pickLang, tg } from '../lib/telegram';
import { normalizePhone } from '../lib/phone';
import { sendCode } from '../lib/loginCode';

interface TgMessage {
  chat: { id: number };
  from?: { id: number; username?: string; first_name?: string; language_code?: string };
  text?: string;
  contact?: { phone_number: string; user_id?: number };
}

export const telegramWebhook = new Hono();

telegramWebhook.post('/', async (c) => {
  if (c.req.header('x-telegram-bot-api-secret-token') !== env.telegram.webhookSecret) {
    return c.body(null, 401);
  }
  const update = (await c.req.json().catch(() => ({}))) as { message?: TgMessage };
  const msg = update.message;
  if (msg?.from) {
    try {
      await handleMessage(msg as TgMessage & { from: NonNullable<TgMessage['from']> });
    } catch (err) {
      console.error('telegram webhook error', err);
    }
  }
  // Always 200 so Telegram doesn't retry the same update forever.
  return c.json({ ok: true });
});

async function handleMessage(msg: TgMessage & { from: NonNullable<TgMessage['from']> }) {
  const chatId = msg.chat.id;
  const fallbackLang = pickLang(msg.from.language_code);

  if (msg.text?.startsWith('/start')) {
    const token = msg.text.split(' ')[1]?.trim();
    if (!token) {
      await tg('sendMessage', { chat_id: chatId, text: botText.welcome[fallbackLang] });
      return;
    }
    const { data: login } = await db
      .from('telegram_logins')
      .select('token, lang, status, expires_at')
      .eq('token', token)
      .maybeSingle();
    if (!login || login.status !== 'pending' || new Date(login.expires_at) < new Date()) {
      await tg('sendMessage', { chat_id: chatId, text: botText.expired[fallbackLang] });
      return;
    }
    await db
      .from('telegram_logins')
      .update({ telegram_id: msg.from.id, telegram_username: msg.from.username ?? null, first_name: msg.from.first_name ?? null })
      .eq('token', token);
    const lang = pickLang(login.lang);
    await tg('sendMessage', {
      chat_id: chatId,
      text: botText.shareContact[lang],
      reply_markup: {
        keyboard: [[{ text: botText.shareButton[lang], request_contact: true }]],
        resize_keyboard: true,
        one_time_keyboard: true,
      },
    });
    return;
  }

  if (msg.contact) {
    const { data: login } = await db
      .from('telegram_logins')
      .select('token, phone, lang')
      .eq('telegram_id', msg.from.id)
      .eq('status', 'pending')
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (!login) {
      await tg('sendMessage', { chat_id: chatId, text: botText.expired[fallbackLang], reply_markup: { remove_keyboard: true } });
      return;
    }
    const lang = pickLang(login.lang);
    // Telegram sets contact.user_id only when the user shares their own card via the button.
    if (msg.contact.user_id !== msg.from.id) {
      await tg('sendMessage', { chat_id: chatId, text: botText.notOwnContact[lang] });
      return;
    }
    if (normalizePhone(msg.contact.phone_number) !== login.phone) {
      await tg('sendMessage', { chat_id: chatId, text: botText.phoneMismatch[lang], reply_markup: { remove_keyboard: true } });
      return;
    }
    const code_hash = await sendCode(login.token, msg.from.id, lang);
    await db.from('telegram_logins').update({ code_hash, status: 'code_sent' }).eq('token', login.token);
    return;
  }

  await tg('sendMessage', { chat_id: chatId, text: botText.welcome[fallbackLang] });
}
