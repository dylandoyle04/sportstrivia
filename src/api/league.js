import * as espn from './espn';

const LEAGUE_PATHS = {
  NFL: { sport: 'football', league: 'nfl' },
  NBA: { sport: 'basketball', league: 'nba' },
  MLB: { sport: 'baseball', league: 'mlb' },
  NHL: { sport: 'hockey', league: 'nhl' },
};

const SOCCER_PATHS = {
  EPL: { sport: 'soccer', league: 'eng.1' },
  'La Liga': { sport: 'soccer', league: 'esp.1' },
  'Serie A': { sport: 'soccer', league: 'ita.1' },
  Bundesliga: { sport: 'soccer', league: 'ger.1' },
  'Ligue 1': { sport: 'soccer', league: 'fra.1' },
};

function pathFor(team) {
  if (team.league === 'Soccer') return SOCCER_PATHS[team.competition];
  return LEAGUE_PATHS[team.league];
}

function normalizePlayer(athlete) {
  return {
    id: athlete.id,
    name: athlete.displayName ?? athlete.fullName ?? null,
    position: athlete.position?.name ?? null,
    positionAbbr: athlete.position?.abbreviation ?? null,
    jersey: athlete.jersey ?? null,
    age: athlete.age ?? null,
    college: athlete.college?.name ?? null,
  };
}

function normalizeTeam(espnTeam, pickedTeam) {
  return {
    name: pickedTeam.name,
    league: pickedTeam.league,
    competition: pickedTeam.competition ?? null,
    location: espnTeam?.location ?? null,
    abbreviation: espnTeam?.abbreviation ?? null,
  };
}

export async function loadTeamData(pickedTeam) {
  const path = pathFor(pickedTeam);
  if (!path) throw new Error(`No ESPN path for ${pickedTeam.league}`);
  const [teamInfo, roster] = await Promise.all([
    espn.getTeam(path.sport, path.league, pickedTeam.id),
    espn.getRoster(path.sport, path.league, pickedTeam.id),
  ]);
  return {
    team: normalizeTeam(teamInfo, pickedTeam),
    players: roster.map(normalizePlayer).filter((p) => p.name),
  };
}
