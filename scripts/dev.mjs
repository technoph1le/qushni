// `npm run dev` — starts the backend, the website and (if cloudflared is installed) a public tunnel.
// The tunnel link can be shared with teammates, and the Telegram bot is pointed at it automatically,
// so phone login works locally. `npm run dev -- --no-tunnel` skips the tunnel.
import { spawn, spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const WEB_PORT = 5173;
const API_PORT = 8787;
const withTunnel = !process.argv.includes('--no-tunnel');
const isWin = process.platform === 'win32';
const children = [];

const color = { api: '\x1b[35m', web: '\x1b[36m', tunnel: '\x1b[33m', dev: '\x1b[32m', reset: '\x1b[0m' };
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

function run(tag, command, args, cwd, onLine) {
  const env = { ...process.env, FORCE_COLOR: '1' };
  // On Windows npm is a .cmd script and needs a shell; pass one quoted command line to it.
  const quote = (s) => (/\s/.test(s) ? `"${s}"` : s);
  const child = isWin
    ? spawn([command, ...args].map(quote).join(' '), { cwd, shell: true, env })
    : spawn(command, args, { cwd, env });
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
  if (isWin) {
    candidates.push('C:\\Program Files (x86)\\cloudflared\\cloudflared.exe', 'C:\\Program Files\\cloudflared\\cloudflared.exe');
  }
  for (const c of candidates) {
    const r = spawnSync(c, ['--version'], { stdio: 'ignore' });
    if (r.status === 0) return c;
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
  const env = readEnv(path.join(root, 'backend', '.env'));
  if (!env?.TELEGRAM_BOT_TOKEN || !env.TELEGRAM_WEBHOOK_SECRET) {
    log('dev', 'Telegram bot not configured in backend/.env — phone login is disabled.');
    return;
  }
  // The website proxies /api to the backend, so one tunnel serves both the site and the bot.
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
  log('dev', 'Could not point the Telegram bot at the tunnel. Phone login will not work until you restart.');
}

let shuttingDown = false;
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

for (const app of ['frontend', 'backend']) {
  if (!fs.existsSync(path.join(root, app, 'node_modules'))) {
    console.error(`Dependencies are missing. Run "npm run setup" first.`);
    process.exit(1);
  }
  if (!fs.existsSync(path.join(root, app, '.env'))) {
    console.error(`${app}/.env is missing. Run "npm run setup" first, then fill it in (docs/SETUP.md).`);
    process.exit(1);
  }
}

run('api', 'npm', ['run', 'dev'], path.join(root, 'backend'));
run('web', 'npm', ['run', 'dev', '--', '--port', String(WEB_PORT), '--strictPort'], path.join(root, 'frontend'));

const apiUp = await waitFor(`http://localhost:${API_PORT}/health`, 40);
if (!apiUp) log('dev', `Backend did not start on port ${API_PORT} — check the [api] lines above.`);

let shareUrl = null;
if (withTunnel) {
  const cloudflared = findCloudflared();
  if (!cloudflared) {
    log('dev', 'cloudflared is not installed, so there is no share link and phone login is off.');
    log('dev', 'Install it once: winget install Cloudflare.cloudflared (Windows) or brew install cloudflared (macOS).');
  } else {
    await new Promise((resolve) => {
      let settled = false;
      const done = () => {
        if (!settled) {
          settled = true;
          resolve();
        }
      };
      const tunnel = run('tunnel', cloudflared, ['tunnel', '--no-autoupdate', '--url', `http://localhost:${WEB_PORT}`], root, (line) => {
        const url = line.match(/https:\/\/[a-z0-9-]+\.trycloudflare\.com/)?.[0];
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
console.log(`  Website:     http://localhost:${WEB_PORT}`);
console.log(`  Backend:     http://localhost:${API_PORT}`);
if (shareUrl) console.log(`  Share link:  ${shareUrl}   (works while this terminal is open)`);
console.log(`  Stop:        Ctrl+C`);
console.log(`${color.dev}${line}${color.reset}\n`);
