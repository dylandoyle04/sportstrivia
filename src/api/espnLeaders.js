async function resolveAthlete(ref) {
  try {
    const res = await fetch(ref);
    if (!res.ok) return null;
    const data = await res.json();
    return data.displayName ?? data.fullName ?? null;
  } catch {
    return null;
  }
}

export async function getEspnLeaders(sport, league, season, categoryNames) {
  const url = `https://sports.core.api.espn.com/v2/sports/${sport}/leagues/${league}/seasons/${season}/types/2/leaders`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`leaders ${res.status}`);
  const data = await res.json();
  const wanted = new Set(categoryNames);
  const result = {};
  await Promise.all(
    (data.categories ?? [])
      .filter((c) => wanted.has(c.name))
      .map(async (c) => {
        const top = (c.leaders ?? []).slice(0, 8);
        const names = await Promise.all(
          top.map((ldr) => resolveAthlete(ldr.athlete?.$ref)),
        );
        const leaders = top
          .map((ldr, i) => ({ name: names[i], value: ldr.value, displayValue: ldr.displayValue }))
          .filter((l) => l.name);
        if (leaders.length >= 4) result[c.name] = leaders;
      }),
  );
  return result;
}
