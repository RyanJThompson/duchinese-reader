import { Redis } from '@upstash/redis';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import {
  badRequest,
  methodNotAllowed,
  normalizePreferences,
  syncUnavailable,
} from './_shared.js';

const redisUrl = process.env.KV_REST_API_URL ?? process.env.UPSTASH_REDIS_REST_URL;
const redisToken = process.env.KV_REST_API_TOKEN ?? process.env.UPSTASH_REDIS_REST_TOKEN;

const redis = redisUrl && redisToken ? new Redis({ url: redisUrl, token: redisToken }) : null;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET' && req.method !== 'PUT') {
    return methodNotAllowed(res);
  }

  // Requests reach here only after the edge middleware has authenticated the
  // session cookie, so Redis being configured is the only requirement.
  if (!redis) {
    if (req.method === 'GET') return syncUnavailable(res, {});
    return syncUnavailable(res, { ok: true, synced: false });
  }

  if (req.method === 'GET') {
    const prefs = normalizePreferences(await redis.get<unknown>('preferences')) ?? {};
    return res.json(prefs);
  }

  const prefs = normalizePreferences(req.body);
  if (!prefs) return badRequest(res);

  await redis.set('preferences', prefs);
  return res.json({ ok: true, synced: true });
}
