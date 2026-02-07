import { Redis } from '@upstash/redis';
import type { VercelRequest, VercelResponse } from '@vercel/node';

const redis = new Redis({
  url: process.env.KV_REST_API_URL ?? process.env.UPSTASH_REDIS_REST_URL ?? '',
  token: process.env.KV_REST_API_TOKEN ?? process.env.UPSTASH_REDIS_REST_TOKEN ?? '',
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
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
