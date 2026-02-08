import { Redis } from '@upstash/redis';
import type { VercelRequest, VercelResponse } from '@vercel/node';

interface RecentEntry {
  id: string;
  visitedAt: number;
}

const redisUrl = process.env.KV_REST_API_URL ?? process.env.UPSTASH_REDIS_REST_URL;
const redisToken = process.env.KV_REST_API_TOKEN ?? process.env.UPSTASH_REDIS_REST_TOKEN;

const redis = redisUrl && redisToken ? new Redis({ url: redisUrl, token: redisToken }) : null;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!redis) {
    if (req.method === 'GET') return res.json([]);
    if (req.method === 'PUT') return res.json({ ok: true });
    return res.status(405).end();
  }

  if (req.method === 'GET') {
    const recents = await redis.get<RecentEntry[]>('recents') ?? [];
    return res.json(recents);
  }

  if (req.method === 'PUT') {
    const entries: RecentEntry[] = req.body;
    await redis.set('recents', entries);
    return res.json({ ok: true });
  }

  return res.status(405).end();
}
