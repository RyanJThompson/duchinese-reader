import { Redis } from '@upstash/redis';
import type { VercelRequest, VercelResponse } from '@vercel/node';

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
    const learned = await redis.get<string[]>('learned') ?? [];
    return res.json(learned);
  }

  if (req.method === 'PUT') {
    const ids: string[] = req.body;
    await redis.set('learned', ids);
    return res.json({ ok: true });
  }

  return res.status(405).end();
}
