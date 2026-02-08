import { Redis } from '@upstash/redis';
import type { VercelRequest, VercelResponse } from '@vercel/node';

interface SyncedPreferences {
  showAudioPlayer?: boolean;
}

const redisUrl = process.env.KV_REST_API_URL ?? process.env.UPSTASH_REDIS_REST_URL;
const redisToken = process.env.KV_REST_API_TOKEN ?? process.env.UPSTASH_REDIS_REST_TOKEN;

const redis = redisUrl && redisToken ? new Redis({ url: redisUrl, token: redisToken }) : null;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!redis) {
    if (req.method === 'GET') return res.json({});
    if (req.method === 'PUT') return res.json({ ok: true });
    return res.status(405).end();
  }

  if (req.method === 'GET') {
    const prefs = await redis.get<SyncedPreferences>('preferences') ?? {};
    return res.json(prefs);
  }

  if (req.method === 'PUT') {
    const prefs: SyncedPreferences = req.body;
    await redis.set('preferences', prefs);
    return res.json({ ok: true });
  }

  return res.status(405).end();
}
