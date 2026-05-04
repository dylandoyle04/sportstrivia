import { loadTeamData } from '../api/league';
import { TEAMS } from '../teams';
import {
  buildQuestionPool,
  selectByMixUniqueTeams,
  buildNbaTeamStatQuestions,
  buildNhlTeamStatQuestions,
  buildSoccerTeamStatQuestions,
  buildMlbLeaderQuestions,
} from './generator';
import { createRng, dateSeed } from './seededRandom';
import { getNbaStandings, getNhlStandings, getSoccerStandings } from '../api/standings';
import { getMlbLeaders } from '../api/mlb';
import { selectSubjects, sameLeagueAs } from './wellKnown';
import {
  nflLeaderQuestions,
  nbaLeaderQuestions,
  nhlLeaderQuestions,
  mlbLastSeasonLeaderQuestions,
} from './leagueLeaders';

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

  const wellKnownPerTeam = featuredData.map(({ team, players }) => ({
    team,
    subjectPlayers: selectSubjects(team, players),
  }));
  const wellKnownAll = wellKnownPerTeam.flatMap((d) => d.subjectPlayers);

  const teamCaps = { easy: 2, medium: 3, hard: 3 };
  const pool = wellKnownPerTeam.flatMap(({ team, subjectPlayers }) => {
    if (subjectPlayers.length === 0) return [];
    const otherPlayers = wellKnownAll.filter(
      (p) => p && !subjectPlayers.some((fp) => fp.id === p.id) && sameLeagueAs(team, p),
    );
    const all = buildQuestionPool({ team, players: subjectPlayers, otherPlayers }, rand);
    const byDiff = { easy: [], medium: [], hard: [] };
    for (const q of all) {
      if (byDiff[q.difficulty]) byDiff[q.difficulty].push(q);
    }
    const seededShuffleLocal = (arr) => {
      const c = [...arr];
      for (let i = c.length - 1; i > 0; i--) {
        const j = Math.floor(rand() * (i + 1));
        [c[i], c[j]] = [c[j], c[i]];
      }
      return c;
    };
    return [
      ...seededShuffleLocal(byDiff.easy).slice(0, teamCaps.easy),
      ...seededShuffleLocal(byDiff.medium).slice(0, teamCaps.medium),
      ...seededShuffleLocal(byDiff.hard).slice(0, teamCaps.hard),
    ];
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

  // Skip soccer team-stat questions in Daily — only the 10 elite player names are allowed.

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
    pool.push(...await mlbLastSeasonLeaderQuestions(rand));
  }

  if (featured.some((t) => t.league === 'NFL')) {
    pool.push(...await nflLeaderQuestions(rand));
  }
  if (featured.some((t) => t.league === 'NBA')) {
    pool.push(...await nbaLeaderQuestions(rand));
  }
  if (featured.some((t) => t.league === 'NHL')) {
    pool.push(...await nhlLeaderQuestions(rand));
  }

  const questions = selectByMixUniqueTeams(pool, { easy: 4, medium: 3, hard: 3 }, rand);
  return { questions };
}
