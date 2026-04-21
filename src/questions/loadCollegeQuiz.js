import { loadTeamData } from '../api/league';
import { TEAMS } from '../teams';

const COLLEGE_TEAM_COUNT = 8;

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export async function loadCollegeQuiz(league) {
  const candidates = TEAMS.filter((t) => t.league === league);
  if (candidates.length === 0) throw new Error(`No teams for ${league}`);
  const selected = shuffle(candidates).slice(0, COLLEGE_TEAM_COUNT);

  const settled = await Promise.all(
    selected.map((t) => loadTeamData(t).catch(() => null)),
  );
  const featuredData = settled.filter(Boolean);
  const allPlayers = featuredData.flatMap((d) => d.players);
  const withCollege = allPlayers.filter((p) => p.college && p.name);
  const collegePool = [...new Set(allPlayers.map((p) => p.college).filter(Boolean))];

  if (withCollege.length === 0 || collegePool.length < 4) {
    throw new Error('Not enough college data for this league.');
  }

  const questions = [];
  for (const player of shuffle(withCollege)) {
    const distractors = shuffle(collegePool.filter((c) => c !== player.college)).slice(0, 3);
    if (distractors.length !== 3) continue;
    const choices = shuffle([player.college, ...distractors]);
    questions.push({
      prompt: `What college did ${player.name} attend?`,
      choices: choices.map(String),
      correctIndex: choices.indexOf(player.college),
      player,
      difficulty: 'medium',
    });
  }

  return { questions };
}
