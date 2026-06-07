import fs from 'node:fs/promises';
import path from 'node:path';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { isReaderAuthorized } from './_shared.js';

export const config = {
  includeFiles: '.reader-data/**',
};

const DATA_ROOT = path.join(process.cwd(), '.reader-data');

function safeDataPath(value: unknown): string | null {
  const requested = Array.isArray(value) ? value[0] : value;
  if (typeof requested !== 'string') return null;
  if (!requested.endsWith('.json')) return null;

  const normalized = path.normalize(requested).replace(/^(\.\.(\/|\\|$))+/, '');
  const resolved = path.resolve(DATA_ROOT, normalized);
  if (!resolved.startsWith(path.resolve(DATA_ROOT) + path.sep)) return null;
  return resolved;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!isReaderAuthorized(req)) {
    return res.status(404).json({ error: 'Not found' });
  }

  const filepath = safeDataPath(req.query.path);
  if (!filepath) return res.status(400).json({ error: 'Invalid data path' });

  try {
    const json = await fs.readFile(filepath, 'utf-8');
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Cache-Control', 'private, max-age=300');
    return res.status(200).send(json);
  } catch {
    return res.status(404).json({ error: 'Not found' });
  }
}
