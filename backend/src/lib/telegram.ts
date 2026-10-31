import { env } from '../env';

export async function tg<T = unknown>(method: string, body: Record<string, unknown>): Promise<T> {
  const res = await fetch(`https://api.telegram.org/bot${env.telegram.token}/${method}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
  const json = (await res.json()) as { ok: boolean; result: T; description?: string };
  if (!json.ok) throw new Error(`Telegram ${method} failed: ${json.description}`);
  return json.result;
}

export type Lang = 'uz' | 'ru' | 'en';

export const botText = {
  shareContact: {
    uz: "Qo'shni saytiga kirish uchun pastdagi tugma orqali telefon raqamingizni yuboring.\n\nAgar kirishni siz boshlamagan bo'lsangiz, bu xabarni e'tiborsiz qoldiring.",
    ru: 'Чтобы войти на сайт Qo\'shni, отправьте свой номер телефона кнопкой ниже.\n\nЕсли вход начали не вы, просто проигнорируйте это сообщение.',
    en: "To sign in to Qo'shni, send your phone number with the button below.\n\nIf you didn't start this sign-in, ignore this message.",
  },
  shareButton: { uz: '📱 Raqamni yuborish', ru: '📱 Отправить номер', en: '📱 Share my number' },
  code: {
    uz: (code: string) => `Qo'shni uchun tasdiqlash kodi: <b>${code}</b>\n\nKod 10 daqiqa amal qiladi. Uni hech kimga bermang — Qo'shni xodimlari ham so'ramaydi.`,
    ru: (code: string) => `Код подтверждения для Qo'shni: <b>${code}</b>\n\nКод действует 10 минут. Никому его не сообщайте — сотрудники Qo'shni его не спрашивают.`,
    en: (code: string) => `Your Qo'shni verification code: <b>${code}</b>\n\nValid for 10 minutes. Never share it — Qo'shni staff will never ask for it.`,
  },
  phoneMismatch: {
    uz: "Bu Telegram akkauntidagi raqam saytda kiritilgan raqamga mos emas. Saytda to'g'ri raqamni kiriting.",
    ru: 'Номер этого Telegram-аккаунта не совпадает с номером, введённым на сайте. Введите правильный номер на сайте.',
    en: "This Telegram account's number doesn't match the number entered on the site. Enter the correct number on the site.",
  },
  notOwnContact: {
    uz: "Iltimos, tugma orqali o'z raqamingizni yuboring.",
    ru: 'Пожалуйста, отправьте свой номер кнопкой.',
    en: 'Please send your own number using the button.',
  },
  expired: {
    uz: "Havola eskirgan. Saytda «Telegram orqali kirish»ni qaytadan bosing.",
    ru: 'Ссылка устарела. Нажмите «Войти через Telegram» на сайте ещё раз.',
    en: 'This link has expired. Press "Sign in with Telegram" on the site again.',
  },
  welcome: {
    uz: "Assalomu alaykum! Bu Qo'shni saytining rasmiy boti. Kirish kodlari shu yerga keladi.",
    ru: "Здравствуйте! Это официальный бот сайта Qo'shni. Сюда приходят коды для входа.",
    en: "Hello! This is the official Qo'shni bot. Sign-in codes arrive here.",
  },
};

export function pickLang(v: unknown): Lang {
  return v === 'ru' || v === 'en' ? v : 'uz';
}
