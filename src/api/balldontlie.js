export async function getBalldontliePlayers(bdlTeamId) {
  const all = [];
  let cursor = null;
  for (let page = 0; page < 10; page++) {
    const params = new URLSearchParams({ per_page: '100' });
    params.append('team_ids[]', String(bdlTeamId));
    if (cursor != null) params.set('cursor', String(cursor));
    const res = await fetch(`/api/balldontlie/players?${params.toString()}`);
    if (!res.ok) break;
    const data = await res.json();
    all.push(...(data.data ?? []));
    cursor = data.meta?.next_cursor;
    if (!cursor) break;
  }
  return all;
}
