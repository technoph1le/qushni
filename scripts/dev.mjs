// `npm run dev` — starts Next.js and (if cloudflared is installed) a public tunnel.
// The tunnel link can be shared with teammates, and the Telegram bot in .env.local is pointed at it
// automatically, so phone sign-in works locally. `npm run dev -- --no-tunnel` skips the tunnel.
import { spawn, spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PORT = 5173;
const withTunnel = !process.argv.includes('--no-tunnel');
const isWin = process.platform === 'win32';
const children = [];

const color = { next: '\x1b[36m', tunnel: '\x1b[33m', dev: '\x1b[32m', reset: '\x1b[0m' };
const log = (tag, line) => console.log(`${color[tag]}[${tag}]${color.reset} ${line}`);

function readEnv(file) {
  if (!fs.existsSync(file)) return null;
  const env = {};
  for (const line of fs.readFileSync(file, 'utf8').split(/\r?\n/)) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (m) env[m[1]] = m[2].trim();
  }
  return env;
}

let shuttingDown = false;

function run(tag, command, args, onLine) {
  const env = { ...process.env, FORCE_COLOR: '1' };
  // On Windows npx is a .cmd script and needs a shell; pass one quoted command line to it.
  const quote = (s) => (/\s/.test(s) ? `"${s}"` : s);
  const child = isWin
    ? spawn([command, ...args].map(quote).join(' '), { cwd: root, shell: true, env })
    : spawn(command, args, { cwd: root, env });
  children.push(child);
  const pipe = (stream) => {
    let buf = '';
    stream.on('data', (chunk) => {
      buf += chunk.toString();
      const lines = buf.split(/\r?\n/);
      buf = lines.pop();
      for (const line of lines) {
        if (onLine?.(line) === false) continue;
        if (line.trim()) log(tag, line);
      }
    });
  };
  pipe(child.stdout);
  pipe(child.stderr);
  child.on('exit', (code) => {
    if (!shuttingDown) log(tag, `stopped (exit code ${code})`);
  });
  return child;
}

function findCloudflared() {
  const candidates = ['cloudflared'];
  if (isWin) candidates.push('C:\\Program Files (x86)\\cloudflared\\cloudflared.exe', 'C:\\Program Files\\cloudflared\\cloudflared.exe');
  for (const c of candidates) {
    if (spawnSync(c, ['--version'], { stdio: 'ignore' }).status === 0) return c;
  }
  return null;
}

async function waitFor(url, seconds) {
  for (let i = 0; i < seconds; i++) {
    try {
      if ((await fetch(url)).ok) return true;
    } catch {
      /* not up yet */
    }
    await new Promise((r) => setTimeout(r, 1000));
  }
  return false;
}

async function pointBotAt(tunnelUrl) {
  const env = readEnv(path.join(root, '.env.local'));
  if (!env?.TELEGRAM_BOT_TOKEN || !env.TELEGRAM_WEBHOOK_SECRET) {
    log('dev', 'Telegram bot not configured in .env.local — phone sign-in is off.');
    return;
  }
  const webhook = `${tunnelUrl}/api/telegram/webhook`;
  for (let attempt = 1; attempt <= 10; attempt++) {
    try {
      const res = await fetch(`https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/setWebhook`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ url: webhook, secret_token: env.TELEGRAM_WEBHOOK_SECRET, allowed_updates: ['message'] }),
      });
      const json = await res.json();
      if (json.ok) {
        log('dev', `Telegram bot @${env.TELEGRAM_BOT_USERNAME} now delivers to this computer.`);
        return;
      }
      log('dev', `Telegram webhook not set yet: ${json.description}`);
    } catch (err) {
      log('dev', `Telegram webhook attempt ${attempt} failed: ${err.message}`);
    }
    await new Promise((r) => setTimeout(r, 3000));
  }
  log('dev', 'Could not point the Telegram bot at the tunnel. Phone sign-in will not work until you restart.');
}

function shutdown() {
  if (shuttingDown) return;
  shuttingDown = true;
  for (const child of children) {
    if (child.exitCode !== null) continue;
    if (isWin) spawnSync('taskkill', ['/pid', String(child.pid), '/T', '/F'], { stdio: 'ignore' });
    else child.kill('SIGINT');
  }
  process.exit(0);
}
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

// ---------------------------------------------------------------- start

if (!fs.existsSync(path.join(root, 'node_modules'))) {
  console.error('Dependencies are missing. Run "npm run setup" first.');
  process.exit(1);
}
if (!fs.existsSync(path.join(root, '.env.local'))) {
  console.error('.env.local is missing. Run "npm run setup" first, then fill it in (docs/SETUP.md).');
  process.exit(1);
}

run('next', 'npx', ['next', 'dev', '-p', String(PORT)]);

// The API route compiles on first request, so this also warms it up.
if (!(await waitFor(`http://localhost:${PORT}/api/health`, 90))) {
  log('dev', `Next.js did not start on port ${PORT} — check the [next] lines above.`);
}

let shareUrl = null;
if (withTunnel) {
  const cloudflared = findCloudflared();
  if (!cloudflared) {
    log('dev', 'cloudflared is not installed, so there is no share link and phone sign-in is off.');
    log('dev', 'Install it once: winget install Cloudflare.cloudflared (Windows) or brew install cloudflared (macOS).');
  } else {
    // Cloudflare's free quick tunnels sometimes refuse a request; a retry usually works.
    for (let attempt = 1; attempt <= 3 && !shareUrl; attempt++) {
      if (attempt > 1) log('dev', `Retrying the tunnel (attempt ${attempt} of 3)…`);
      await new Promise((resolve) => {
        let settled = false;
        const done = () => {
          if (!settled) {
            settled = true;
            resolve();
          }
        };
        const tunnel = run('tunnel', cloudflared, ['tunnel', '--no-autoupdate', '--url', `http://localhost:${PORT}`], (line) => {
          // Error lines mention api.trycloudflare.com, which is Cloudflare's service, not our link.
          const url = /failed|error/i.test(line) ? undefined : line.match(/https:\/\/(?!api\.)[a-z0-9-]+\.trycloudflare\.com/)?.[0];
          if (url && !shareUrl) {
            shareUrl = url;
            done();
          }
          // cloudflared is chatty; show only problems.
          return /ERR|failed/i.test(line) ? undefined : false;
        });
        tunnel.on('exit', done);
        setTimeout(done, 60000);
      });
    }
    if (shareUrl) {
      await waitFor(`${shareUrl}/api/health`, 30);
      await pointBotAt(shareUrl);
    } else {
      log('dev', 'Cloudflare did not hand out a tunnel address. Run "npm run dev" again in a minute.');
    }
  }
}

const line = '─'.repeat(64);
console.log(`\n${color.dev}${line}${color.reset}`);
console.log(`  Qo'shni is running`);
console.log(`  Local:       http://localhost:${PORT}`);
if (shareUrl) console.log(`  Share link:  ${shareUrl}   (works while this terminal is open)`);
console.log(`  Stop:        Ctrl+C`);
console.log(`${color.dev}${line}${color.reset}\n`);
