function required(key: string): string {
  const v = process.env[key];
  if (!v) throw new Error(`Missing environment variable ${key} (see .env.example)`);
  return v;
}

const optional = (key: string) => process.env[key] || '';

// FRONTEND_URL may list several origins separated by commas (e.g. "https://qoshni.uz,https://www.qoshni.uz").
// The first one is used for payment return links.
const frontendUrls = (process.env.FRONTEND_URL ?? 'http://localhost:5173')
  .split(',')
  .map((u) => u.trim().replace(/\/$/, ''))
  .filter(Boolean);

export const env = {
  port: Number(process.env.PORT ?? 8787),
  frontendUrl: frontendUrls[0],
  frontendUrls,
  publicApiUrl: optional('PUBLIC_API_URL').replace(/\/$/, ''),
  supabaseUrl: required('SUPABASE_URL'),
  supabaseServiceKey: required('SUPABASE_SERVICE_ROLE_KEY'),
  telegram: {
    token: required('TELEGRAM_BOT_TOKEN'),
    username: required('TELEGRAM_BOT_USERNAME').replace(/^@/, ''),
    webhookSecret: required('TELEGRAM_WEBHOOK_SECRET'),
  },
  payme: {
    merchantId: optional('PAYME_MERCHANT_ID'),
    key: optional('PAYME_KEY'),
    testMode: process.env.PAYME_TEST_MODE !== 'false',
  },
  click: {
    serviceId: optional('CLICK_SERVICE_ID'),
    merchantId: optional('CLICK_MERCHANT_ID'),
    secretKey: optional('CLICK_SECRET_KEY'),
  },
};

export const paymeEnabled = () => Boolean(env.payme.merchantId && env.payme.key);
export const clickEnabled = () => Boolean(env.click.serviceId && env.click.merchantId && env.click.secretKey);
