const BASE = 'https://site.api.espn.com/apis/site/v2/sports';

async function get(path) {
  const res = await fetch(`${BASE}/${path}`);
  if (!res.ok) throw new Error(`ESPN ${res.status}: ${path}`);
  return res.json();
}

export async function getTeams(sport, league) {
  const data = await get(`${sport}/${league}/teams`);
  return data.sports?.[0]?.leagues?.[0]?.teams?.map((t) => t.team) ?? [];
}

export async function getTeam(sport, league, teamId) {
  const data = await get(`${sport}/${league}/teams/${teamId}`);
  return data.team ?? null;
}

export async function getRoster(sport, league, teamId) {
  const data = await get(`${sport}/${league}/teams/${teamId}/roster`);
  if (Array.isArray(data.athletes) && data.athletes[0]?.items) {
    return data.athletes.flatMap((group) => group.items);
  }
  return data.athletes ?? [];
}

export async function getTeamSchedule(sport, league, teamId) {
  const data = await get(`${sport}/${league}/teams/${teamId}/schedule`);
  return data.events ?? [];
}

export async function getScoreboard(sport, league) {
  const data = await get(`${sport}/${league}/scoreboard`);
  return data.events ?? [];
}

export async function getAthleteStats(sport, league, athleteId) {
  const url = `https://site.web.api.espn.com/apis/common/v3/sports/${sport}/${league}/athletes/${athleteId}/stats`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`ESPN athlete stats ${res.status}`);
  return res.json();
}

export async function getGameSummary(sport, league, eventId) {
  const data = await get(`${sport}/${league}/summary?event=${eventId}`);
  return data;
}

export async function getScoreboardForDate(sport, league, dateStr) {
  const data = await get(`${sport}/${league}/scoreboard?dates=${dateStr}`);
  return data.events ?? [];
}
