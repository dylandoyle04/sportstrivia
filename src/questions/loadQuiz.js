import { loadTeamData } from '../api/league';
import { TEAMS } from '../teams';
import { buildQuestionPool } from './generator';

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

function shuffleArr(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Free-Play selector: try to keep each question about a different player
// so the 10-question quiz isn't repetitive about one or two stars.
function selectVariedByMix(pool, mix) {
  const byDiff = {
    easy: shuffleArr(pool.filter((q) => q.difficulty === 'easy')),
    medium: shuffleArr(pool.filter((q) => q.difficulty === 'medium')),
    hard: shuffleArr(pool.filter((q) => q.difficulty === 'hard')),
  };
  const usedPlayers = new Set();
  const result = [];
  const overflow = [];

  for (const diff of ['easy', 'medium', 'hard']) {
    const want = mix[diff] ?? 0;
    const taken = [];
    const skipped = [];
    for (const q of byDiff[diff]) {
      const key = q.player?.name;
      if (taken.length >= want) {
        skipped.push(q);
        continue;
      }
      if (key && usedPlayers.has(key)) {
        skipped.push(q);
        continue;
      }
      taken.push(q);
      if (key) usedPlayers.add(key);
    }
    while (taken.length < want && skipped.length > 0) {
      taken.push(skipped.shift());
    }
    result.push(...taken);
    overflow.push(...skipped);
  }

  const desiredTotal = Object.values(mix).reduce((a, b) => a + b, 0);
  if (result.length < desiredTotal) {
    const seen = new Set(result.map((q) => q.prompt));
    const fillers = shuffleArr(overflow.filter((q) => !seen.has(q.prompt)));
    while (result.length < desiredTotal && fillers.length > 0) {
      result.push(fillers.shift());
    }
  }
  return shuffleArr(result);
}

export async function loadQuiz(pickedTeam) {
  const { team, players } = await loadTeamData(pickedTeam);

  const others = pickOthers(pickedTeam, 3);
  const otherResults = await Promise.all(
    others.map((o) => loadTeamData(o).catch(() => null)),
  );
  const otherPlayers = otherResults.filter(Boolean).flatMap((d) => d.players);

  const pool = buildQuestionPool({ team, players, otherPlayers });
  const questions = selectVariedByMix(pool, { easy: 4, medium: 3, hard: 3 });
  return { team, questions };
}
