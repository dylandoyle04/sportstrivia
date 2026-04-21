import { loadTeamData } from '../api/league';
import { TEAMS } from '../teams';
import { buildQuestionPool, selectByMix } from './generator';
import { createRng, dateSeed } from './seededRandom';

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
    const otherPlayers = allPlayers.filter(
      (p) => !players.some((fp) => fp.id === p.id),
    );
    return buildQuestionPool({ team, players, otherPlayers }, rand);
  });

  const questions = selectByMix(pool, { easy: 3, medium: 3, hard: 3 }, rand);
  return { questions };
}
