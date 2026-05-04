function currentMlbSeason() {
  const now = new Date();
  return now.getMonth() >= 10 ? now.getFullYear() - 1 : now.getFullYear();
}

export async function getMlbRosterWithStats(mlbTeamId) {
  const season = currentMlbSeason();
  const url = `/api/mlb/api/v1/teams/${mlbTeamId}/roster?rosterType=active&season=${season}&hydrate=person(stats(group=[hitting,pitching],type=season,season=${season}))`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`MLB roster ${res.status}`);
  return res.json();
}

export async function getMlbLeaders(category, statGroup, limit = 10, season = null) {
  const yr = season ?? currentMlbSeason();
  const params = new URLSearchParams({
    leaderCategories: category,
    statGroup,
    season: String(yr),
    limit: String(limit),
  });
  const res = await fetch(`/api/mlb/api/v1/stats/leaders?${params.toString()}`);
  if (!res.ok) throw new Error(`MLB leaders ${res.status}`);
  const data = await res.json();
  const block = (data.leagueLeaders ?? [])[0];
  return (block?.leaders ?? []).map((l) => ({
    name: l.person?.fullName,
    teamName: l.team?.name,
    value: l.value,
    rank: l.rank,
  }));
}
