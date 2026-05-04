import * as espn from './espn';
import { getBalldontliePlayers } from './balldontlie';
import { getMlbRosterWithStats } from './mlb';

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
    height: athlete.displayHeight ?? null,
    weight: athlete.displayWeight ?? null,
    college: athlete.college?.name ?? null,
    country: athlete.birthPlace?.country ?? athlete.citizenship ?? null,
    photo: athlete.headshot?.href ?? null,
    draftYear: null,
    draftPick: null,
    draftRound: null,
    teamHistoryString: null,
    draftTeam: null,
    ppg: null,
    apg: null,
    rpg: null,
    lastGamePts: null,
    lastGameOpponent: null,
    homeRuns: null,
    hits: null,
    battingAvg: null,
    era: null,
    seasonGoals: null,
    seasonAssists: null,
    seasonPoints: null,
    lastGameGoals: null,
    lastGameAssists: null,
    passingYards: null,
    passingTds: null,
    rushingYards: null,
    rushingTds: null,
    receivingYards: null,
    receivingTds: null,
    receptions: null,
  };
}

function parseNflAthleteStats(data) {
  const cats = data?.categories ?? [];
  function getLatest(name) {
    const cat = cats.find((c) => c.name === name);
    if (!cat?.statistics?.length) return null;
    const sorted = [...cat.statistics].sort(
      (a, b) => (b.season?.year ?? 0) - (a.season?.year ?? 0),
    );
    return { row: sorted[0], labels: cat.labels ?? [] };
  }
  function val(parsed, label) {
    if (!parsed) return null;
    const idx = parsed.labels.indexOf(label);
    if (idx < 0) return null;
    const raw = (parsed.row.stats?.[idx] ?? '').replace(/,/g, '');
    const v = parseFloat(raw);
    return Number.isFinite(v) ? v : null;
  }
  const passing = getLatest('passing');
  const rushing = getLatest('rushing');
  const receiving = getLatest('receiving');
  return {
    passingYards: val(passing, 'YDS'),
    passingTds: val(passing, 'TD'),
    rushingYards: val(rushing, 'YDS'),
    rushingTds: val(rushing, 'TD'),
    receivingYards: val(receiving, 'YDS'),
    receivingTds: val(receiving, 'TD'),
    receptions: val(receiving, 'REC'),
  };
}

const NFL_SKILL_POSITIONS = new Set(['QB', 'RB', 'WR', 'TE']);

async function enrichNflWithAthleteStats(players, path) {
  const skill = players.filter((p) => p.id && NFL_SKILL_POSITIONS.has(p.positionAbbr));
  await Promise.all(
    skill.map(async (player) => {
      try {
        const data = await espn.getAthleteStats(path.sport, path.league, player.id);
        const parsed = parseNflAthleteStats(data);
        for (const k of ['passingYards', 'passingTds', 'rushingYards', 'rushingTds', 'receivingYards', 'receivingTds', 'receptions']) {
          if (parsed[k] != null) player[k] = parsed[k];
        }
      } catch {
        /* optional */
      }
    }),
  );
}

async function enrichMlbWithStats(players, mlbTeamId) {
  try {
    const data = await getMlbRosterWithStats(mlbTeamId);
    const byName = new Map();
    for (const r of data.roster ?? []) {
      const p = r.person ?? {};
      const fullName = p.fullName;
      if (!fullName) continue;
      const stats = { batSide: p.batSide?.description, pitchHand: p.pitchHand?.description };
      for (const sg of p.stats ?? []) {
        const grp = sg.group?.displayName;
        const stat = sg.splits?.[0]?.stat ?? {};
        if (grp === 'hitting') {
          if (stat.homeRuns != null) stats.homeRuns = stat.homeRuns;
          if (stat.hits != null) stats.hits = stat.hits;
          if (stat.avg != null) stats.battingAvg = parseFloat(stat.avg);
        } else if (grp === 'pitching') {
          if (stat.era != null) stats.era = parseFloat(stat.era);
        }
      }
      byName.set(fullName.toLowerCase().trim(), stats);
    }
    for (const player of players) {
      const s = byName.get(player.name?.toLowerCase().trim());
      if (s) {
        if (s.homeRuns != null) player.homeRuns = s.homeRuns;
        if (s.hits != null) player.hits = s.hits;
        if (s.battingAvg != null) player.battingAvg = s.battingAvg;
        if (s.era != null) player.era = s.era;
      }
    }
  } catch {
    /* optional */
  }
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

async function enrichNbaFromBalldontlie(players, bdlTeamId) {
  try {
    const bdl = await getBalldontliePlayers(bdlTeamId);
    const byName = new Map();
    for (const p of bdl) {
      const key = `${p.first_name} ${p.last_name}`.toLowerCase().trim();
      byName.set(key, p);
    }
    for (const player of players) {
      const match = byName.get(player.name?.toLowerCase().trim());
      if (match) {
        player.draftYear = match.draft_year ?? null;
        player.draftPick = match.draft_number ?? null;
        player.draftRound = match.draft_round ?? null;
      }
    }
  } catch {
    /* enrichment is optional; players keep their ESPN-only fields */
  }
}

function currentNbaSeasonYear() {
  const now = new Date();
  return now.getMonth() >= 9 ? now.getFullYear() : now.getFullYear() - 1;
}

function currentNhlSeasonYear() {
  const now = new Date();
  return now.getMonth() >= 9 ? now.getFullYear() : now.getFullYear() - 1;
}

function parseNbaAthleteStats(data) {
  const teams = data?.teams ?? {};
  const avg = (data?.categories ?? []).find((c) => c.name === 'averages');
  if (!avg) return { teamHistoryString: null, latestPpg: null };

  const labels = avg.labels ?? [];
  const ptsIdx = labels.indexOf('PTS');
  const astIdx = labels.indexOf('AST');
  const rebIdx = labels.indexOf('REB');
  const rows = [...(avg.statistics ?? [])].sort(
    (a, b) => (a.season?.year ?? 0) - (b.season?.year ?? 0),
  );
  if (rows.length === 0) return { teamHistoryString: null, latestPpg: null };

  const history = [];
  let current = null;
  for (const row of rows) {
    const slug = row.teamSlug;
    const year = row.season?.year;
    if (!slug || !year) continue;
    if (!teams[slug]) continue;
    if (current && current.slug === slug) {
      current.endYear = year;
    } else {
      if (current) history.push(current);
      current = {
        slug,
        startYear: year,
        endYear: year,
        name: teams[slug].shortDisplayName ?? teams[slug].displayName ?? slug,
      };
    }
  }
  if (current) history.push(current);

  if (history.length === 0) return { teamHistoryString: null, latestPpg: null };

  const currentSeason = currentNbaSeasonYear();
  const lastIdx = history.length - 1;
  const lines = history.map((h, i) => {
    const isLast = i === lastIdx;
    const isCurrent = h.endYear >= currentSeason;
    if (isLast && isCurrent) {
      return `${h.name}: ${h.startYear}-present`;
    }
    if (h.startYear === h.endYear) {
      const shortEnd = String(h.endYear + 1).slice(-2);
      return `${h.name}: ${h.startYear}-${shortEnd}`;
    }
    return `${h.name}: ${h.startYear}-${h.endYear + 1}`;
  });

  const latestRow = rows[rows.length - 1];
  const num = (idx) => {
    if (idx < 0) return null;
    const v = parseFloat(latestRow.stats?.[idx] ?? '');
    return Number.isFinite(v) ? v : null;
  };

  return {
    teamHistoryString: lines.join('\n'),
    teamCount: history.length,
    draftTeamName: history.length > 0 ? history[0].name : null,
    latestPpg: num(ptsIdx),
    latestApg: num(astIdx),
    latestRpg: num(rebIdx),
  };
}

async function enrichNbaWithAthleteStats(players, path) {
  const toFetch = players.slice(0, 8).filter((p) => p.id);
  await Promise.all(
    toFetch.map(async (player) => {
      try {
        const data = await espn.getAthleteStats(path.sport, path.league, player.id);
        const parsed = parseNbaAthleteStats(data);
        if (parsed.teamHistoryString && parsed.teamCount >= 2) {
          player.teamHistoryString = parsed.teamHistoryString;
        }
        if (parsed.draftTeamName) player.draftTeam = parsed.draftTeamName;
        if (parsed.latestPpg != null) player.ppg = parsed.latestPpg;
        if (parsed.latestApg != null) player.apg = parsed.latestApg;
        if (parsed.latestRpg != null) player.rpg = parsed.latestRpg;
      } catch {
        /* optional */
      }
    }),
  );
}

function parseNhlAthleteStats(data) {
  const teams = data?.teams ?? {};
  const cats = data?.categories ?? [];
  const cat = cats.find(
    (c) => Array.isArray(c.statistics) && c.statistics.length > 0 && (c.labels ?? []).indexOf('PTS') >= 0,
  );
  if (!cat) return { teamHistoryString: null };

  const labels = cat.labels ?? [];
  const gIdx = labels.indexOf('G');
  const aIdx = labels.indexOf('A');
  const ptsIdx = labels.indexOf('PTS');
  const rows = [...(cat.statistics ?? [])].sort(
    (a, b) => (a.season?.year ?? 0) - (b.season?.year ?? 0),
  );
  if (rows.length === 0) return { teamHistoryString: null };

  const history = [];
  let current = null;
  for (const row of rows) {
    const slug = row.teamSlug;
    const year = row.season?.year;
    if (!slug || !year || !teams[slug]) continue;
    if (current && current.slug === slug) {
      current.endYear = year;
    } else {
      if (current) history.push(current);
      current = {
        slug,
        startYear: year,
        endYear: year,
        name: teams[slug].shortDisplayName ?? teams[slug].displayName ?? slug,
      };
    }
  }
  if (current) history.push(current);
  if (history.length === 0) return { teamHistoryString: null };

  const currentSeason = currentNhlSeasonYear();
  const lastIdx = history.length - 1;
  const lines = history.map((h, i) => {
    const isLast = i === lastIdx;
    const isCurrent = h.endYear >= currentSeason;
    if (isLast && isCurrent) return `${h.name}: ${h.startYear}-present`;
    if (h.startYear === h.endYear) {
      return `${h.name}: ${h.startYear}-${String(h.endYear + 1).slice(-2)}`;
    }
    return `${h.name}: ${h.startYear}-${h.endYear + 1}`;
  });

  const latestRow = rows[rows.length - 1];
  const num = (idx) => {
    if (idx < 0) return null;
    const v = parseFloat(latestRow.stats?.[idx] ?? '');
    return Number.isFinite(v) ? v : null;
  };

  return {
    teamHistoryString: lines.join('\n'),
    teamCount: history.length,
    draftTeamName: history.length > 0 ? history[0].name : null,
    seasonGoals: num(gIdx),
    seasonAssists: num(aIdx),
    seasonPoints: num(ptsIdx),
  };
}

async function enrichNhlWithAthleteStats(players, path) {
  const toFetch = players.slice(0, 8).filter((p) => p.id);
  await Promise.all(
    toFetch.map(async (player) => {
      try {
        const data = await espn.getAthleteStats(path.sport, path.league, player.id);
        const parsed = parseNhlAthleteStats(data);
        if (parsed.teamHistoryString && parsed.teamCount >= 2) {
          player.teamHistoryString = parsed.teamHistoryString;
        }
        if (parsed.draftTeamName) player.draftTeam = parsed.draftTeamName;
        if (parsed.seasonGoals != null) player.seasonGoals = parsed.seasonGoals;
        if (parsed.seasonAssists != null) player.seasonAssists = parsed.seasonAssists;
        if (parsed.seasonPoints != null) player.seasonPoints = parsed.seasonPoints;
      } catch {
        /* optional */
      }
    }),
  );
}

async function enrichNhlWithLastGame(team, players, path) {
  try {
    const schedule = await espn.getTeamSchedule(path.sport, path.league, team.id);
    const completed = (schedule ?? [])
      .filter((e) => e.competitions?.[0]?.status?.type?.completed)
      .sort((a, b) => new Date(b.date ?? 0) - new Date(a.date ?? 0));
    const lastGame = completed[0];
    if (!lastGame) return;

    const summary = await espn.getGameSummary(path.sport, path.league, lastGame.id);
    const teamBlock = (summary?.boxscore?.players ?? []).find(
      (tb) => String(tb.team?.id) === String(team.id),
    );
    if (!teamBlock) return;

    const opponent = lastGame.competitions?.[0]?.competitors?.find(
      (c) => String(c.team?.id) !== String(team.id),
    )?.team?.displayName ?? 'opponent';

    const ptsByAthleteId = new Map();
    for (const group of teamBlock.statistics ?? []) {
      const labels = group.labels ?? [];
      const gIdx = labels.indexOf('G');
      const aIdx = labels.indexOf('A');
      if (gIdx < 0) continue;
      for (const entry of group.athletes ?? []) {
        const id = entry.athlete?.id;
        const goals = parseInt(entry.stats?.[gIdx] ?? '', 10);
        const assists = aIdx >= 0 ? parseInt(entry.stats?.[aIdx] ?? '', 10) : 0;
        if (id && Number.isFinite(goals)) {
          ptsByAthleteId.set(String(id), goals + (Number.isFinite(assists) ? assists : 0));
        }
      }
    }

    for (const player of players) {
      const pts = ptsByAthleteId.get(String(player.id));
      if (pts != null) {
        player.lastGamePts = pts;
        player.lastGameOpponent = opponent;
      }
    }
  } catch {
    /* optional */
  }
}

async function enrichSoccerWithLastGame(team, players, path) {
  try {
    const schedule = await espn.getTeamSchedule(path.sport, path.league, team.id);
    const completed = (schedule ?? [])
      .filter((e) => e.competitions?.[0]?.status?.type?.completed)
      .sort((a, b) => new Date(b.date ?? 0) - new Date(a.date ?? 0));
    const lastGame = completed[0];
    if (!lastGame) return;

    const summary = await espn.getGameSummary(path.sport, path.league, lastGame.id);
    const teamRoster = (summary?.rosters ?? []).find(
      (tr) => String(tr.team?.id) === String(team.id),
    );
    if (!teamRoster) return;

    const opponent = lastGame.competitions?.[0]?.competitors?.find(
      (c) => String(c.team?.id) !== String(team.id),
    )?.team?.displayName ?? 'opponent';

    const statsByAthleteId = new Map();
    for (const r of teamRoster.roster ?? []) {
      const id = r.athlete?.id;
      if (!id) continue;
      const stats = {};
      for (const s of r.stats ?? []) {
        if (s.name) stats[s.name] = s.value ?? parseFloat(s.displayValue);
      }
      statsByAthleteId.set(String(id), stats);
    }

    for (const player of players) {
      const s = statsByAthleteId.get(String(player.id));
      if (s) {
        player.lastGameGoals = s.totalGoals ?? 0;
        player.lastGameAssists = s.goalAssists ?? 0;
        player.lastGameOpponent = opponent;
      }
    }
  } catch {
    /* optional */
  }
}

async function enrichNbaWithLastGame(team, players, path) {
  try {
    const schedule = await espn.getTeamSchedule(path.sport, path.league, team.id);
    const completed = (schedule ?? [])
      .filter((e) => e.competitions?.[0]?.status?.type?.completed)
      .sort((a, b) => new Date(b.date ?? 0) - new Date(a.date ?? 0));
    const lastGame = completed[0];
    if (!lastGame) return;

    const summary = await espn.getGameSummary(path.sport, path.league, lastGame.id);
    const teamBlock = (summary?.boxscore?.players ?? []).find(
      (tb) => String(tb.team?.id) === String(team.id),
    );
    if (!teamBlock) return;
    const group = teamBlock.statistics?.[0];
    if (!group) return;

    const labels = group.labels ?? [];
    const ptsIdx = labels.indexOf('PTS');
    if (ptsIdx < 0) return;

    const opponent = lastGame.competitions?.[0]?.competitors?.find(
      (c) => String(c.team?.id) !== String(team.id),
    )?.team?.displayName ?? 'opponent';

    const ptsByAthleteId = new Map();
    for (const entry of group.athletes ?? []) {
      const id = entry.athlete?.id;
      const pts = parseInt(entry.stats?.[ptsIdx] ?? '', 10);
      if (id && Number.isFinite(pts)) ptsByAthleteId.set(String(id), pts);
    }

    for (const player of players) {
      const pts = ptsByAthleteId.get(String(player.id));
      if (pts != null) {
        player.lastGamePts = pts;
        player.lastGameOpponent = opponent;
      }
    }
  } catch {
    /* optional */
  }
}

export async function loadTeamData(pickedTeam) {
  const path = pathFor(pickedTeam);
  if (!path) throw new Error(`No ESPN path for ${pickedTeam.league}`);
  const [teamInfo, roster] = await Promise.all([
    espn.getTeam(path.sport, path.league, pickedTeam.id),
    espn.getRoster(path.sport, path.league, pickedTeam.id),
  ]);
  const players = roster
    .map(normalizePlayer)
    .filter((p) => p.name)
    .map((p) => ({ ...p, team: pickedTeam }));

  if (pickedTeam.league === 'NBA') {
    const nbaTasks = [
      enrichNbaWithAthleteStats(players, path),
      enrichNbaWithLastGame(pickedTeam, players, path),
    ];
    if (pickedTeam.bdlId) {
      nbaTasks.push(enrichNbaFromBalldontlie(players, pickedTeam.bdlId));
    }
    await Promise.all(nbaTasks);
  }

  if (pickedTeam.league === 'MLB' && pickedTeam.mlbId) {
    await enrichMlbWithStats(players, pickedTeam.mlbId);
  }

  if (pickedTeam.league === 'NHL') {
    await Promise.all([
      enrichNhlWithAthleteStats(players, path),
      enrichNhlWithLastGame(pickedTeam, players, path),
    ]);
  }

  if (pickedTeam.league === 'Soccer') {
    await enrichSoccerWithLastGame(pickedTeam, players, path);
  }

  if (pickedTeam.league === 'NFL') {
    await enrichNflWithAthleteStats(players, path);
  }

  return {
    team: normalizeTeam(teamInfo, pickedTeam),
    players,
  };
}
