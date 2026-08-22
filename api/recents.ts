import { Redis } from '@upstash/redis';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import {
  badRequest,
  methodNotAllowed,
  normalizeRecents,
  syncUnavailable,
} from './_shared.js';

const redisUrl = process.env.KV_REST_API_URL ?? process.env.UPSTASH_REDIS_REST_URL;
const redisToken = process.env.KV_REST_API_TOKEN ?? process.env.UPSTASH_REDIS_REST_TOKEN;

const redis = redisUrl && redisToken ? new Redis({ url: redisUrl, token: redisToken }) : null;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET' && req.method !== 'PUT') {
    return methodNotAllowed(res);
  }

  // Authenticated user data — never cache.
  res.setHeader('Cache-Control', 'no-store');

  // Requests reach here only after the edge middleware has authenticated the
  // session cookie, so Redis being configured is the only requirement.
  if (!redis) {
    if (req.method === 'GET') return syncUnavailable(res, { entries: [], clearedAt: 0 });
    return syncUnavailable(res, { ok: true, synced: false });
  }

  try {
    if (req.method === 'GET') {
      const recents = normalizeRecents(await redis.get<unknown>('recents')) ?? { entries: [], clearedAt: 0 };
      return res.json(recents);
    }

    const recents = normalizeRecents(req.body);
    if (!recents) return badRequest(res);

    await redis.set('recents', recents);
    return res.json({ ok: true, synced: true });
  } catch (err) {
    console.error('[sync] recents failed:', err);
    return res.status(500).json({ error: 'Sync failed' });
  }
}
