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
