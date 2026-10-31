import { createHash, randomInt, timingSafeEqual } from 'node:crypto';
import { botText, tg, type Lang } from './telegram';

/** Codes are stored only as a hash bound to their login token. */
export const hashCode = (token: string, code: string) => createHash('sha256').update(`${token}:${code}`).digest('hex');

export function sameHash(a: string, b: string) {
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
}

/** Sends a fresh 6-digit code to the user's Telegram chat and returns its hash. */
export async function sendCode(token: string, telegramId: number, lang: Lang) {
  const code = String(randomInt(100000, 1000000));
  await tg('sendMessage', {
    chat_id: telegramId,
    text: botText.code[lang](code),
    parse_mode: 'HTML',
    reply_markup: { remove_keyboard: true },
  });
  return hashCode(token, code);
}
