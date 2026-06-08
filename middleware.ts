import { next } from '@vercel/functions';

export const config = {
  runtime: 'edge',
  matcher: '/(.*)',
};

const COOKIE_NAME = 'reader_session';

function readCookie(header: string | null, name: string): string | null {
  if (!header) return null;
  for (const part of header.split(';')) {
    const index = part.indexOf('=');
    if (index === -1) continue;
    if (part.slice(0, index).trim() === name) {
      return decodeURIComponent(part.slice(index + 1).trim());
    }
  }
  return null;
}

function timingSafeEqual(left: string, right: string): boolean {
  const maxLength = Math.max(left.length, right.length);
  let diff = left.length === right.length ? 0 : 1;

  for (let i = 0; i < maxLength; i += 1) {
    diff |= (left.charCodeAt(i) || 0) ^ (right.charCodeAt(i) || 0);
  }

  return diff === 0;
}

async function expectedSignature(secret: string, message: string): Promise<string> {
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

// A session cookie is "<expiresAt>.<hmac>", signed with the configured password.
// Stateless: no server-side session store, and rotating the password invalidates
// every existing cookie.
async function hasValidSession(token: string | null, user: string, password: string): Promise<boolean> {
  if (!token) return false;
  const separator = token.lastIndexOf('.');
  if (separator === -1) return false;
  const expiresAt = Number(token.slice(0, separator));
  const signature = token.slice(separator + 1);
  if (!Number.isFinite(expiresAt) || expiresAt < Date.now()) return false;
  const expected = await expectedSignature(password, `${user}:${expiresAt}`);
  return timingSafeEqual(signature, expected);
}

export default async function middleware(request: Request) {
  const url = new URL(request.url);

  // The login + logout endpoints must be reachable without a session.
  if (url.pathname === '/api/login' || url.pathname === '/api/logout') {
    return next();
  }

  const expectedUser = process.env.BASIC_AUTH_USER;
  const expectedPassword = process.env.BASIC_AUTH_PASSWORD ?? process.env.APP_PASSWORD;

  if (!expectedUser || !expectedPassword) {
    return new Response('Reader authentication is not configured.', {
      status: 503,
      headers: { 'Cache-Control': 'no-store' },
    });
  }

  const token = readCookie(request.headers.get('cookie'), COOKIE_NAME);
  if (await hasValidSession(token, expectedUser, expectedPassword)) {
    return next();
  }

  // No valid session -> redirect to the login page (no native browser popup,
  // which some in-app browsers like Migaku's never render).
  const loginUrl = new URL('/api/login', url.origin);
  const target = url.pathname + url.search;
  if (target.startsWith('/') && !target.startsWith('//')) {
    loginUrl.searchParams.set('next', target);
  }
  return new Response(null, {
    status: 302,
    headers: { Location: loginUrl.toString(), 'Cache-Control': 'no-store' },
  });
}
