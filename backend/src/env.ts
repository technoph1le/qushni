
// Values are read on first use, so the server starts (and tests run) without every secret present.
function required(...keys: string[]): string {
  for (const key of keys) {
    const v = process.env[key];
    if (v) return v;
  }
  throw new Error(`Missing environment variable ${keys.join(' or ')} (see .env.example)`);
}

const optional = (key: string) => process.env[key] || '';

export const env = {
  // The secret key: either the new sb_secret_… (SUPABASE_SECRET_KEY) or the legacy service_role key.
  get supabaseUrl() {
    return required('SUPABASE_URL');
  },
  get supabaseServiceKey() {
    return required('SUPABASE_SECRET_KEY', 'SUPABASE_SERVICE_ROLE_KEY');
  },
  telegram: {
    get token() {
      return required('TELEGRAM_BOT_TOKEN');
    },
    get username() {
      return required('TELEGRAM_BOT_USERNAME').replace(/^@/, '');
    },
    get webhookSecret() {
      return required('TELEGRAM_WEBHOOK_SECRET');
    },
  },
  payme: {
    get merchantId() {
      return optional('PAYME_MERCHANT_ID');
    },
    get key() {
      return optional('PAYME_KEY');
    },
    get testMode() {
      return process.env.PAYME_TEST_MODE !== 'false';
    },
  },
  click: {
    get serviceId() {
      return optional('CLICK_SERVICE_ID');
    },
    get merchantId() {
      return optional('CLICK_MERCHANT_ID');
    },
    get secretKey() {
      return optional('CLICK_SECRET_KEY');
    },
  },
};

export const paymeEnabled = () => Boolean(env.payme.merchantId && env.payme.key);
export const clickEnabled = () => Boolean(env.click.serviceId && env.click.merchantId && env.click.secretKey);
