import { loadTeamData } from '../api/league';
import { TEAMS } from '../teams';
import { buildQuestionPool, selectByMix } from './generator';
import {
  nflLeaderQuestions,
  nbaLeaderQuestions,
  nhlLeaderQuestions,
  mlbLastSeasonLeaderQuestions,
} from './leagueLeaders';

function pickOthers(pickedTeam, n) {
  const candidates = TEAMS.filter((t) => {
    if (t.name === pickedTeam.name) return false;
    if (pickedTeam.league === 'Soccer') {
      return t.league === 'Soccer' && t.competition === pickedTeam.competition;
    }
    return t.league === pickedTeam.league;
  });
  const shuffled = [...candidates].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, n);
}

export async function loadQuiz(pickedTeam) {
  const { team, players } = await loadTeamData(pickedTeam);

  const others = pickOthers(pickedTeam, 3);
  const otherResults = await Promise.all(
    others.map((o) => loadTeamData(o).catch(() => null)),
  );
  const otherPlayers = otherResults.filter(Boolean).flatMap((d) => d.players);

  const pool = buildQuestionPool({ team, players, otherPlayers });

  try {
    if (pickedTeam.league === 'NFL') pool.push(...await nflLeaderQuestions());
    else if (pickedTeam.league === 'NBA') pool.push(...await nbaLeaderQuestions());
    else if (pickedTeam.league === 'NHL') pool.push(...await nhlLeaderQuestions());
    else if (pickedTeam.league === 'MLB') pool.push(...await mlbLastSeasonLeaderQuestions());
  } catch { /* optional */ }

  const questions = selectByMix(pool, { easy: 4, medium: 3, hard: 3 });
  return { team, questions };
}
