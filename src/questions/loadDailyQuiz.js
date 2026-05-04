import { loadTeamData } from '../api/league';
import { TEAMS } from '../teams';
import {
  buildQuestionPool,
  selectByMix,
  buildNbaTeamStatQuestions,
  buildNhlTeamStatQuestions,
  buildSoccerTeamStatQuestions,
  buildMlbLeaderQuestions,
} from './generator';
import { createRng, dateSeed } from './seededRandom';
import { getNbaStandings, getNhlStandings, getSoccerStandings } from '../api/standings';
import { getMlbLeaders } from '../api/mlb';

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

function isEliteSoccerPlayer(name) {
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

function wellKnownPlayers(team, players) {
  if (team.league === 'NBA') return topByStat(players, 'ppg');
  if (team.league === 'NHL') return topByStat(players, 'seasonPoints');
  if (team.league === 'MLB') return topByStat(players, 'hits');
  if (team.league === 'NFL') {
    const withStats = players.map((p) => ({
      ...p,
      _nflFame: (p.passingTds ?? 0)
        + (p.rushingYards ?? 0) / 100
        + (p.receivingYards ?? 0) / 100
        + (p.rushingTds ?? 0) * 2
        + (p.receivingTds ?? 0) * 2,
    }));
    return topByStat(withStats, '_nflFame');
  }
  return players;
}

function sameLeagueAs(team, candidate) {
  if (!candidate.team) return false;
  if (candidate.team.league !== team.league) return false;
  if (team.league === 'Soccer') return candidate.team.competition === team.competition;
  return true;
}

const DAILY_TEAM_COUNT = 8;

function seededShuffle(arr, rand) {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export function pickDailyTeams(dateStr, n = DAILY_TEAM_COUNT) {
  const rand = createRng(dateSeed(dateStr) ^ 0xA1B2C3);
  return seededShuffle(TEAMS, rand).slice(0, n);
}

export async function loadDailyQuiz(dateStr) {
  const featured = pickDailyTeams(dateStr);
  const rand = createRng(dateSeed(dateStr));

  const settled = await Promise.all(
    featured.map((t) => loadTeamData(t).catch(() => null)),
  );
  const featuredData = settled.filter(Boolean);

  const wellKnownPerTeam = featuredData.map(({ team, players }) => {
    let subjectPlayers;
    if (team.league === 'Soccer') {
      subjectPlayers = players.filter((p) => isEliteSoccerPlayer(p.name));
    } else {
      subjectPlayers = wellKnownPlayers(team, players);
    }
    return { team, subjectPlayers };
  });
  const wellKnownAll = wellKnownPerTeam.flatMap((d) => d.subjectPlayers);

  const pool = wellKnownPerTeam.flatMap(({ team, subjectPlayers }) => {
    if (subjectPlayers.length === 0) return [];
    const otherPlayers = wellKnownAll.filter(
      (p) => p && !subjectPlayers.some((fp) => fp.id === p.id) && sameLeagueAs(team, p),
    );
    return buildQuestionPool({ team, players: subjectPlayers, otherPlayers }, rand);
  });

  if (featured.some((t) => t.league === 'NBA')) {
    try {
      const standings = await getNbaStandings();
      pool.push(...buildNbaTeamStatQuestions(standings, rand));
    } catch { /* optional */ }
  }

  if (featured.some((t) => t.league === 'NHL')) {
    try {
      const standings = await getNhlStandings();
      pool.push(...buildNhlTeamStatQuestions(standings, rand));
    } catch { /* optional */ }
  }

  const soccerCompetitions = [...new Set(
    featured.filter((t) => t.league === 'Soccer').map((t) => t.competition),
  )];
  for (const comp of soccerCompetitions) {
    try {
      const standings = await getSoccerStandings(comp);
      pool.push(...buildSoccerTeamStatQuestions(standings, comp, rand));
    } catch { /* optional */ }
  }

  if (featured.some((t) => t.league === 'MLB')) {
    try {
      const [hr, ba, era, hits] = await Promise.all([
        getMlbLeaders('homeRuns', 'hitting'),
        getMlbLeaders('battingAverage', 'hitting'),
        getMlbLeaders('earnedRunAverage', 'pitching'),
        getMlbLeaders('hits', 'hitting'),
      ]);
      pool.push(...buildMlbLeaderQuestions({ homeRuns: hr, battingAverage: ba, era, hits }, rand));
    } catch { /* optional */ }
  }

  const questions = selectByMix(pool, { easy: 4, medium: 3, hard: 3 }, rand);
  return { questions };
}
