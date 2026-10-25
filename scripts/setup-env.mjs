// Creates frontend/.env and backend/.env from the examples if they don't exist yet,
// and fills in a random Telegram webhook secret. Never overwrites existing values.
import { randomBytes } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

for (const app of ['frontend', 'backend']) {
  const env = path.join(root, app, '.env');
  const example = path.join(root, app, '.env.example');
  if (fs.existsSync(env)) {
    console.log(`✓ ${app}/.env already exists`);
    continue;
  }
  let text = fs.readFileSync(example, 'utf8');
  if (app === 'backend') {
    text = text.replace(/^TELEGRAM_WEBHOOK_SECRET=$/m, `TELEGRAM_WEBHOOK_SECRET=${randomBytes(32).toString('hex')}`);
  }
  fs.writeFileSync(env, text);
  console.log(`✓ created ${app}/.env — fill in the empty values (see docs/SETUP.md)`);
}
