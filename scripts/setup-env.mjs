// Creates .env.local from .env.example if it doesn't exist yet, with a random Telegram webhook secret.
// Never overwrites an existing .env.local.
import { randomBytes } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const target = path.join(root, '.env.local');

if (fs.existsSync(target)) {
  console.log('✓ .env.local already exists');
} else {
  const text = fs
    .readFileSync(path.join(root, '.env.example'), 'utf8')
    .replace(/^TELEGRAM_WEBHOOK_SECRET=$/m, `TELEGRAM_WEBHOOK_SECRET=${randomBytes(32).toString('hex')}`);
  fs.writeFileSync(target, text);
  console.log('✓ created .env.local — fill in the empty values (see docs/SETUP.md)');
}
