const ELITE_SOCCER_NAMES = [
  'lionel messi',
  'cristiano ronaldo',
  'kylian mbappe',
  'neymar',
  'erling haaland',
  'kevin de bruyne',
  'jude bellingham',
  'mohamed salah',
  'harry kane',
  'vinicius',
];

function normalizeName(name) {
  return (name || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\bjr\.?\b/g, '')
    .replace(/\bjunior\b/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

export function isEliteSoccerPlayer(name) {
  const n = normalizeName(name);
  if (!n) return false;
  return ELITE_SOCCER_NAMES.some((elite) => n === elite || n.includes(elite));
}

function topByStat(players, statKey, fraction = 1 / 3) {
  const withStat = players.filter((p) => p[statKey] != null);
  if (withStat.length < 4) return withStat.length > 0 ? withStat : players;
  const sorted = [...withStat].sort((a, b) => (b[statKey] ?? 0) - (a[statKey] ?? 0));
  const cutoff = Math.max(3, Math.ceil(sorted.length * fraction));
  return sorted.slice(0, cutoff);
}

export function topPercentilePlayers(team, players, fraction = 1 / 3) {
  if (team.league === 'NBA') return topByStat(players, 'ppg', fraction);
  if (team.league === 'NHL') return topByStat(players, 'seasonPoints', fraction);
  if (team.league === 'MLB') return topByStat(players, 'hits', fraction);
  if (team.league === 'NFL') {
    const withFame = players.map((p) => {
      p._nflFame = (p.passingTds ?? 0)
        + (p.rushingYards ?? 0) / 100
        + (p.receivingYards ?? 0) / 100
        + (p.rushingTds ?? 0) * 2
        + (p.receivingTds ?? 0) * 2;
      return p;
    });
    return topByStat(withFame, '_nflFame', fraction);
  }
  return players;
}

export function wellKnownPlayers(team, players) {
  return topPercentilePlayers(team, players, 1 / 3);
}

export function elitePlayers(team, players) {
  return topPercentilePlayers(team, players, 1 / 5);
}

export function selectSubjects(team, players) {
  if (team.league === 'Soccer') {
    return players.filter((p) => isEliteSoccerPlayer(p.name));
  }
  return wellKnownPlayers(team, players);
}

export function sameLeagueAs(team, candidate) {
  if (!candidate.team) return false;
  if (candidate.team.league !== team.league) return false;
  if (team.league === 'Soccer') return candidate.team.competition === team.competition;
  return true;
}
