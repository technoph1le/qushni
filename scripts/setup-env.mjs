// Creates frontend/.env.local and backend/.env from their .env.example files if they don't exist yet,
// with a random Telegram webhook secret. Never overwrites an existing file.
import { randomBytes } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

for (const [dir, name] of [['frontend', '.env.local'], ['backend', '.env']]) {
  const target = path.join(root, dir, name);
  if (fs.existsSync(target)) {
    console.log(`✓ ${dir}/${name} already exists`);
    continue;
  }
  const text = fs
    .readFileSync(path.join(root, dir, '.env.example'), 'utf8')
    .replace(/^TELEGRAM_WEBHOOK_SECRET=$/m, `TELEGRAM_WEBHOOK_SECRET=${randomBytes(32).toString('hex')}`);
  fs.writeFileSync(target, text);
  console.log(`✓ created ${dir}/${name} — fill in the empty values (see GUIDE.md)`);
}
