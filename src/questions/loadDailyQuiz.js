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
  const allPlayers = featuredData.flatMap((d) => d.players);

  const pool = featuredData.flatMap(({ team, players }) => {
    let subjectPlayers = players;
    if (team.league === 'Soccer') {
      subjectPlayers = players.filter((p) => isEliteSoccerPlayer(p.name));
      if (subjectPlayers.length === 0) return [];
    }
    const otherPlayers = allPlayers.filter(
      (p) => !subjectPlayers.some((fp) => fp.id === p.id),
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

  const questions = selectByMix(pool, { easy: 3, medium: 3, hard: 3 }, rand);
  return { questions };
}
