import type { VercelRequest, VercelResponse } from '@vercel/node';

const COOKIE_NAME = 'reader_session';

export default function handler(_req: VercelRequest, res: VercelResponse) {
  res.setHeader('Set-Cookie', `${COOKIE_NAME}=; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=0`);
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('Location', '/api/login');
  return res.status(303).end();
}
