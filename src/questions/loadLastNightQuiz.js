import * as espn from '../api/espn';
import { buildLastNightQuestions, selectByMix } from './generator';
import { createRng, dateSeed, yesterdayEspnDateString } from './seededRandom';

const LEAGUES = [
  { key: 'NBA', sport: 'basketball', league: 'nba' },
  { key: 'NHL', sport: 'hockey', league: 'nhl' },
  { key: 'MLB', sport: 'baseball', league: 'mlb' },
];

function isCompleted(event) {
  return !!event.competitions?.[0]?.status?.type?.completed;
}

function extractTeamPlayers(boxscoreTeam, leagueKey) {
  const players = [];
  if (!boxscoreTeam) return players;

  if (leagueKey === 'NBA') {
    const grp = boxscoreTeam.statistics?.[0];
    if (!grp) return players;
    const ptsIdx = (grp.labels ?? []).indexOf('PTS');
    if (ptsIdx < 0) return players;
    for (const a of grp.athletes ?? []) {
      const name = a.athlete?.displayName;
      const pts = parseInt(a.stats?.[ptsIdx] ?? '', 10);
      if (name && Number.isFinite(pts)) players.push({ name, pts });
    }
  } else if (leagueKey === 'NHL') {
    for (const grp of boxscoreTeam.statistics ?? []) {
      const labels = grp.labels ?? [];
      const gIdx = labels.indexOf('G');
      const aIdx = labels.indexOf('A');
      if (gIdx < 0) continue;
      for (const a of grp.athletes ?? []) {
        const name = a.athlete?.displayName;
        const g = parseInt(a.stats?.[gIdx] ?? '', 10);
        const ast = aIdx >= 0 ? parseInt(a.stats?.[aIdx] ?? '', 10) : 0;
        const pts = (Number.isFinite(g) ? g : 0) + (Number.isFinite(ast) ? ast : 0);
        if (name) players.push({ name, pts });
      }
    }
  } else if (leagueKey === 'MLB') {
    for (const grp of boxscoreTeam.statistics ?? []) {
      const keys = grp.keys ?? [];
      if (!keys.includes('hits') || !keys.includes('atBats')) continue;
      const hitsIdx = keys.indexOf('hits');
      const hrIdx = keys.indexOf('homeRuns');
      for (const a of grp.athletes ?? []) {
        const name = a.athlete?.displayName;
        const hits = parseInt(a.stats?.[hitsIdx] ?? '', 10);
        const hr = hrIdx >= 0 ? parseInt(a.stats?.[hrIdx] ?? '', 10) : 0;
        if (name && Number.isFinite(hits)) {
          players.push({ name, pts: hits + (Number.isFinite(hr) ? hr * 2 : 0) });
        }
      }
      break;
    }
  }

  return players.sort((a, b) => b.pts - a.pts);
}

function teamHomeRunsMlb(boxscoreTeam) {
  let total = 0;
  for (const grp of boxscoreTeam.statistics ?? []) {
    const keys = grp.keys ?? [];
    const hrIdx = keys.indexOf('homeRuns');
    if (hrIdx < 0) continue;
    for (const a of grp.athletes ?? []) {
      const hr = parseInt(a.stats?.[hrIdx] ?? '', 10);
      if (Number.isFinite(hr)) total += hr;
    }
    break;
  }
  return total;
}

async function loadGame(sport, league, event, leagueKey) {
  const comp = event.competitions?.[0];
  const competitors = comp?.competitors ?? [];
  const home = competitors.find((c) => c.homeAway === 'home');
  const away = competitors.find((c) => c.homeAway === 'away');
  if (!home || !away) return null;

  const homeScore = parseInt(home.score ?? '', 10);
  const awayScore = parseInt(away.score ?? '', 10);
  if (!Number.isFinite(homeScore) || !Number.isFinite(awayScore)) return null;

  let summary = null;
  try {
    summary = await espn.getGameSummary(sport, league, event.id);
  } catch {
    return null;
  }

  const players = summary?.boxscore?.players ?? [];
  const homeBox = players.find((p) => String(p.team?.id) === String(home.team?.id));
  const awayBox = players.find((p) => String(p.team?.id) === String(away.team?.id));

  const homePlayers = extractTeamPlayers(homeBox, leagueKey);
  const awayPlayers = extractTeamPlayers(awayBox, leagueKey);
  const homeHRs = leagueKey === 'MLB' && homeBox ? teamHomeRunsMlb(homeBox) : 0;
  const awayHRs = leagueKey === 'MLB' && awayBox ? teamHomeRunsMlb(awayBox) : 0;
  const nbaScorers = leagueKey === 'NBA'
    ? [
        ...homePlayers.map((p) => ({ ...p, team: home.team?.displayName })),
        ...awayPlayers.map((p) => ({ ...p, team: away.team?.displayName })),
      ]
    : [];

  return {
    leagueKey,
    eventId: event.id,
    home: {
      id: home.team?.id,
      name: home.team?.displayName,
      score: homeScore,
      homeRuns: homeHRs,
      players: homePlayers,
    },
    away: {
      id: away.team?.id,
      name: away.team?.displayName,
      score: awayScore,
      homeRuns: awayHRs,
      players: awayPlayers,
    },
    winner: homeScore > awayScore ? 'home' : 'away',
    topScorerHome: homePlayers[0] ?? null,
    topScorerAway: awayPlayers[0] ?? null,
    nbaScorers,
  };
}

export async function loadLastNightQuiz() {
  const dateStr = yesterdayEspnDateString();
  const seed = dateSeed(dateStr);
  const rand = createRng(seed);

  const eventLists = await Promise.all(
    LEAGUES.map(({ sport, league }) =>
      espn.getScoreboardForDate(sport, league, dateStr).catch(() => []),
    ),
  );

  const allGames = [];
  for (let i = 0; i < LEAGUES.length; i++) {
    const { sport, league, key } = LEAGUES[i];
    const events = eventLists[i].filter(isCompleted);
    const gameDetails = await Promise.all(
      events.map((e) => loadGame(sport, league, e, key)),
    );
    for (const g of gameDetails) {
      if (g) allGames.push(g);
    }
  }

  if (allGames.length === 0) {
    throw new Error('No completed games found from yesterday.');
  }

  const pool = buildLastNightQuestions(allGames, rand);
  const questions = selectByMix(pool, { easy: 4, medium: 3, hard: 3 }, rand);
  return { questions, gameCount: allGames.length };
}
