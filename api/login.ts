import type { VercelRequest, VercelResponse } from '@vercel/node';

const COOKIE_NAME = 'reader_session';
const MAX_AGE_SECONDS = 60 * 60 * 24 * 30; // 30 days

async function sign(secret: string, message: string): Promise<string> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(message));
  return Array.from(new Uint8Array(signature))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
}

// Only allow same-origin relative paths as the post-login destination.
function safeNext(value: unknown): string {
  const raw = Array.isArray(value) ? value[0] : value;
  if (typeof raw === 'string' && raw.startsWith('/') && !raw.startsWith('//')) return raw;
  return '/';
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function readForm(req: VercelRequest): Record<string, string> {
  const body: unknown = req.body;
  if (body && typeof body === 'object' && !Buffer.isBuffer(body)) {
    return body as Record<string, string>;
  }
  const raw = typeof body === 'string' ? body : Buffer.isBuffer(body) ? body.toString('utf8') : '';
  return Object.fromEntries(new URLSearchParams(raw));
}

function loginPage(nextPath: string, error: boolean): string {
  const nextAttr = escapeHtml(nextPath);
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<meta name="robots" content="noindex" />
<title>Chinese Reader — Sign in</title>
<style>
  :root { color-scheme: light dark; }
  * { box-sizing: border-box; }
  body { margin: 0; min-height: 100vh; display: grid; place-items: center; padding: 24px;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    background: #f5f5f5; color: #111827; }
  .card { width: 100%; max-width: 360px; background: #fff; border: 1px solid #e5e7eb;
    border-radius: 16px; padding: 28px 24px; box-shadow: 0 10px 30px rgba(0,0,0,.08); }
  h1 { font-size: 18px; margin: 0 0 4px; }
  p.sub { margin: 0 0 18px; font-size: 13px; opacity: .6; }
  label { display: block; font-size: 12px; font-weight: 600; margin: 14px 0 6px; opacity: .8; }
  input { width: 100%; padding: 11px 12px; font-size: 16px; border: 1px solid #d4d4d8;
    border-radius: 10px; background: #fff; color: #111827; }
  input:focus { outline: 2px solid #ef4444; outline-offset: 1px; border-color: transparent; }
  button { width: 100%; margin-top: 20px; padding: 12px; font-size: 15px; font-weight: 600;
    color: #fff; background: #dc2626; border: 0; border-radius: 10px; cursor: pointer; }
  button:active { background: #b91c1c; }
  .error { margin: 14px 0 0; padding: 10px 12px; font-size: 13px; border-radius: 10px;
    background: rgba(220,38,38,.12); color: #dc2626; }
  @media (prefers-color-scheme: dark) {
    body { background: #0b0b0c; color: #f3f4f6; }
    .card { background: #18181b; border-color: #27272a; box-shadow: none; }
    input { background: #0b0b0c; color: #f3f4f6; border-color: #3f3f46; }
  }
</style>
</head>
<body>
  <form class="card" method="POST" action="/api/login">
    <h1>Chinese Reader</h1>
    <p class="sub">Sign in to continue</p>
    <input type="hidden" name="next" value="${nextAttr}" />
    <label for="username">Username</label>
    <input id="username" name="username" autocomplete="username" autocapitalize="none" autocorrect="off" spellcheck="false" required />
    <label for="password">Password</label>
    <input id="password" name="password" type="password" autocomplete="current-password" required />
    ${error ? '<p class="error">Incorrect username or password.</p>' : ''}
    <button type="submit">Sign in</button>
  </form>
</body>
</html>`;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const expectedUser = process.env.BASIC_AUTH_USER;
  const expectedPassword = process.env.BASIC_AUTH_PASSWORD ?? process.env.APP_PASSWORD;

  if (!expectedUser || !expectedPassword) {
    res.setHeader('Cache-Control', 'no-store');
    return res.status(503).send('Reader authentication is not configured.');
  }

  if (req.method === 'GET') {
    const nextPath = safeNext(req.query.next);
    const error = req.query.error === '1';
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 'no-store');
    return res.status(error ? 401 : 200).send(loginPage(nextPath, error));
  }

  if (req.method === 'POST') {
    const form = readForm(req);
    const nextPath = safeNext(form.next);
    const authorized = form.username === expectedUser && form.password === expectedPassword;

    if (!authorized) {
      res.setHeader('Cache-Control', 'no-store');
      res.setHeader('Location', `/api/login?error=1&next=${encodeURIComponent(nextPath)}`);
      return res.status(303).end();
    }

    const expiresAt = Date.now() + MAX_AGE_SECONDS * 1000;
    const signature = await sign(expectedPassword, `${expectedUser}:${expiresAt}`);
    const token = `${expiresAt}.${signature}`;
    res.setHeader(
      'Set-Cookie',
      `${COOKIE_NAME}=${token}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=${MAX_AGE_SECONDS}`,
    );
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('Location', nextPath);
    return res.status(303).end();
  }

  res.setHeader('Allow', 'GET, POST');
  return res.status(405).send('Method not allowed');
}
