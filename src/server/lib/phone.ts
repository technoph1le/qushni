/** Uzbek numbers only (+998 and 9 digits), to keep foreign scam accounts off the platform. */
export function normalizePhone(raw: unknown): string | null {
  const digits = String(raw ?? '').replace(/\D/g, '');
  const full = digits.length === 9 ? `998${digits}` : digits;
  return /^998\d{9}$/.test(full) ? `+${full}` : null;
}
