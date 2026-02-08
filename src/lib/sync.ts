export async function fetchRemoteLearned(): Promise<string[]> {
  const res = await fetch('/api/learned');
  if (!res.ok) return [];
  return res.json();
}

export async function pushRemoteLearned(ids: string[]): Promise<void> {
  await fetch('/api/learned', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(ids),
  });
}

export interface RecentEntry {
  id: string;
  visitedAt: number;
}

export async function fetchRemoteRecents(): Promise<RecentEntry[]> {
  const res = await fetch('/api/recents');
  if (!res.ok) return [];
  return res.json();
}

export async function pushRemoteRecents(entries: RecentEntry[]): Promise<void> {
  await fetch('/api/recents', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(entries),
  });
}
