function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function pickN(arr, n) {
  return shuffle(arr).slice(0, n);
}

function mcq(prompt, correct, distractors) {
  const choices = shuffle([correct, ...distractors]);
  return {
    prompt,
    choices: choices.map(String),
    correctIndex: choices.indexOf(correct),
  };
}

export function generateQuestions({ team, players, otherPlayers }) {
  const pool = [];

  const positionPool = [...new Set(
    [...players, ...otherPlayers].map((p) => p.position).filter(Boolean),
  )];
  const playersWithPos = players.filter((p) => p.position);
  for (const player of pickN(playersWithPos, 6)) {
    const distractors = pickN(
      positionPool.filter((p) => p !== player.position),
      3,
    );
    if (distractors.length === 3) {
      pool.push(mcq(
        `What position does ${player.name} play?`,
        player.position,
        distractors,
      ));
    }
  }

  const realNames = new Set(players.map((p) => p.name));
  const fakePool = otherPlayers.filter((p) => !realNames.has(p.name));
  for (const real of pickN(players, 6)) {
    const fakes = pickN(fakePool, 3);
    if (fakes.length === 3) {
      pool.push(mcq(
        `Which of these players is on the ${team.name}?`,
        real.name,
        fakes.map((p) => p.name),
      ));
    }
  }

  const playersWithJersey = players.filter((p) => p.jersey != null);
  const jerseyPool = [...new Set(
    otherPlayers.map((p) => p.jersey).filter((j) => j != null),
  )];
  for (const player of pickN(playersWithJersey, 4)) {
    const distractors = pickN(
      jerseyPool.filter((j) => j !== player.jersey),
      3,
    );
    if (distractors.length === 3) {
      pool.push(mcq(
        `What jersey number does ${player.name} wear?`,
        player.jersey,
        distractors,
      ));
    }
  }

  return shuffle(pool).slice(0, 10);
}
