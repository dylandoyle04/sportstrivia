async function fetchStandings(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`standings ${res.status}`);
  const data = await res.json();
  const teams = [];
  for (const conf of data.children ?? []) {
    const conference = conf.name;
    for (const e of conf.standings?.entries ?? []) {
      const stats = {};
      for (const s of e.stats ?? []) {
        const num = s.value != null ? s.value : parseFloat(s.displayValue);
        stats[s.name] = Number.isFinite(num) ? num : s.displayValue;
      }
      teams.push({
        id: e.team.id,
        name: e.team.displayName,
        abbreviation: e.team.abbreviation,
        conference,
        ...stats,
      });
    }
  }
  return teams;
}

export function getNbaStandings() {
  return fetchStandings('https://site.api.espn.com/apis/v2/sports/basketball/nba/standings');
}

export function getNhlStandings() {
  return fetchStandings('https://site.api.espn.com/apis/v2/sports/hockey/nhl/standings');
}

const SOCCER_LEAGUE_PATHS = {
  EPL: 'eng.1',
  'La Liga': 'esp.1',
  'Serie A': 'ita.1',
  Bundesliga: 'ger.1',
  'Ligue 1': 'fra.1',
};

export async function getSoccerStandings(competition) {
  const code = SOCCER_LEAGUE_PATHS[competition];
  if (!code) throw new Error(`Unknown soccer competition: ${competition}`);
  return fetchStandings(`https://site.api.espn.com/apis/v2/sports/soccer/${code}/standings`);
}
