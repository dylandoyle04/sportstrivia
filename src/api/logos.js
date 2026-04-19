const LEAGUE_SPORT = {
  NFL: 'nfl',
  NBA: 'nba',
  MLB: 'mlb',
  NHL: 'nhl',
  Soccer: 'soccer',
};

export function teamLogoUrl(team) {
  const sport = LEAGUE_SPORT[team.league];
  if (!sport) return null;
  return `https://a.espncdn.com/i/teamlogos/${sport}/500/${team.id}.png`;
}

export function leagueLogoUrl(league) {
  const lower = LEAGUE_SPORT[league];
  return lower ? `/leagues/${lower}.png` : null;
}

export function leagueLogoFallback(league) {
  const lower = LEAGUE_SPORT[league];
  return lower ? `/leagues/${lower}.svg` : null;
}
