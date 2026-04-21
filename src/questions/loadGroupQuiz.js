import { loadTeamData } from '../api/league';
import { buildQuestionPool, selectByMix } from './generator';
import { createRng, dateSeed } from './seededRandom';

function hashString(s) {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = ((h << 5) - h + s.charCodeAt(i)) | 0;
  }
  return h >>> 0;
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
      (p) => !players.some((fp) => fp.id === p.id),
    );
    return buildQuestionPool({ team, players, otherPlayers }, rand);
  });

  const questions = selectByMix(pool, { easy: 3, medium: 3, hard: 3 }, rand);
  return { questions };
}
