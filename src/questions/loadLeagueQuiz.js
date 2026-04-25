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
import { getNbaStandings, getNhlStandings, getSoccerStandings } from '../api/standings';
import { getMlbLeaders } from '../api/mlb';

const TEAM_COUNT = 8;

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export async function loadLeagueQuiz({ league, competition }) {
  const candidates = TEAMS.filter((t) => {
    if (league === 'Soccer') {
      return t.league === 'Soccer' && t.competition === competition;
    }
    return t.league === league;
  });

  if (candidates.length < 2) throw new Error('Not enough teams for this league.');

  const selected = shuffle(candidates).slice(0, TEAM_COUNT);

  const settled = await Promise.all(
    selected.map((t) => loadTeamData(t).catch(() => null)),
  );
  const featuredData = settled.filter(Boolean);
  const allPlayers = featuredData.flatMap((d) => d.players);

  const pool = featuredData.flatMap(({ team, players }) => {
    const otherPlayers = allPlayers.filter(
      (p) => !players.some((fp) => fp.id === p.id),
    );
    return buildQuestionPool({ team, players, otherPlayers });
  });

  if (league === 'NBA') {
    try {
      const standings = await getNbaStandings();
      pool.push(...buildNbaTeamStatQuestions(standings));
    } catch { /* optional */ }
  }

  if (league === 'NHL') {
    try {
      const standings = await getNhlStandings();
      pool.push(...buildNhlTeamStatQuestions(standings));
    } catch { /* optional */ }
  }

  if (league === 'Soccer' && competition) {
    try {
      const standings = await getSoccerStandings(competition);
      pool.push(...buildSoccerTeamStatQuestions(standings, competition));
    } catch { /* optional */ }
  }

  if (league === 'MLB') {
    try {
      const [hr, ba, era, hits] = await Promise.all([
        getMlbLeaders('homeRuns', 'hitting'),
        getMlbLeaders('battingAverage', 'hitting'),
        getMlbLeaders('earnedRunAverage', 'pitching'),
        getMlbLeaders('hits', 'hitting'),
      ]);
      pool.push(...buildMlbLeaderQuestions({ homeRuns: hr, battingAverage: ba, era, hits }));
    } catch { /* optional */ }
  }

  const questions = selectByMix(pool, { easy: 3, medium: 4, hard: 3 });
  return { questions };
}
