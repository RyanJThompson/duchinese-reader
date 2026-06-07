import { next } from '@vercel/functions';

export const config = {
  runtime: 'edge',
  matcher: '/(.*)',
};

function decodeBasicCredentials(value: string): [string, string] | null {
  const [scheme, encoded] = value.split(' ');
  if (scheme !== 'Basic' || !encoded) return null;

  try {
    const decoded = atob(encoded);
    const separator = decoded.indexOf(':');
    if (separator === -1) return null;
    return [decoded.slice(0, separator), decoded.slice(separator + 1)];
  } catch {
    return null;
  }
}

function timingSafeEqual(left: string, right: string): boolean {
  const maxLength = Math.max(left.length, right.length);
  let diff = left.length === right.length ? 0 : 1;

  for (let i = 0; i < maxLength; i += 1) {
    diff |= (left.charCodeAt(i) || 0) ^ (right.charCodeAt(i) || 0);
  }

  return diff === 0;
}

function unauthorized() {
  return new Response('Authentication required', {
    status: 401,
    headers: {
      'Cache-Control': 'no-store',
      'WWW-Authenticate': 'Basic realm="Chinese Reader", charset="UTF-8"',
    },
  });
}

export default function middleware(request: Request) {
  const expectedUser = process.env.BASIC_AUTH_USER;
  const expectedPassword = process.env.BASIC_AUTH_PASSWORD ?? process.env.APP_PASSWORD;

  if (!expectedUser || !expectedPassword) {
    return new Response('Reader authentication is not configured.', {
      status: 503,
      headers: { 'Cache-Control': 'no-store' },
    });
  }

  const credentials = decodeBasicCredentials(request.headers.get('authorization') ?? '');
  if (!credentials) return unauthorized();

  const [user, password] = credentials;
  if (!timingSafeEqual(user, expectedUser) || !timingSafeEqual(password, expectedPassword)) {
    return unauthorized();
  }

  return next();
}
