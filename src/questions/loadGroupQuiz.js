import { loadTeamData } from '../api/league';
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

function hashString(s) {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = ((h << 5) - h + s.charCodeAt(i)) | 0;
  }
  return h >>> 0;
}

function sameLeagueAs(team, candidate) {
  if (!candidate.team) return false;
  if (candidate.team.league !== team.league) return false;
  if (team.league === 'Soccer') return candidate.team.competition === team.competition;
  return true;
}

export async function loadGroupQuiz({ groupId, teams, dateStr }) {
  const seed = dateSeed(dateStr) ^ hashString(groupId);
  const rand = createRng(seed);

  const settled = await Promise.all(
    teams.map((t) => loadTeamData(t).catch(() => null)),
  );
  const featuredData = settled.filter(Boolean);
  const allPlayers = featuredData.flatMap((d) => d.players);

  const pool = featuredData.flatMap(({ team, players }) => {
    const otherPlayers = allPlayers.filter(
      (p) => !players.some((fp) => fp.id === p.id) && sameLeagueAs(team, p),
    );
    return buildQuestionPool({ team, players, otherPlayers }, rand);
  });

  if (teams.some((t) => t.league === 'NBA')) {
    try {
      const standings = await getNbaStandings();
      pool.push(...buildNbaTeamStatQuestions(standings, rand));
    } catch { /* optional */ }
  }

  if (teams.some((t) => t.league === 'NHL')) {
    try {
      const standings = await getNhlStandings();
      pool.push(...buildNhlTeamStatQuestions(standings, rand));
    } catch { /* optional */ }
  }

  const soccerCompetitions = [...new Set(
    teams.filter((t) => t.league === 'Soccer').map((t) => t.competition),
  )];
  for (const comp of soccerCompetitions) {
    try {
      const standings = await getSoccerStandings(comp);
      pool.push(...buildSoccerTeamStatQuestions(standings, comp, rand));
    } catch { /* optional */ }
  }

  if (teams.some((t) => t.league === 'MLB')) {
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
