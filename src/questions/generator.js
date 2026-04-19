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

function uniqueValues(players, key, excludeValue) {
  return [...new Set(
    players.map((p) => p[key]).filter((v) => v != null && v !== excludeValue),
  )];
}

function buildFieldQuestion({
  players,
  allPlayers,
  field,
  promptFor,
  count,
}) {
  const eligible = players.filter((p) => p[field] != null && p.name);
  const out = [];
  for (const player of pickN(eligible, count)) {
    const pool = uniqueValues(allPlayers, field, player[field]);
    const distractors = pickN(pool, 3);
    if (distractors.length === 3) {
      out.push(mcq(promptFor(player), player[field], distractors));
    }
  }
  return out;
}

export function generateQuestions({ team, players, otherPlayers }) {
  const allPlayers = [...players, ...otherPlayers];
  const pool = [];

  pool.push(...buildFieldQuestion({
    players,
    allPlayers,
    field: 'position',
    promptFor: (p) => `What position does ${p.name} play?`,
    count: 5,
  }));

  pool.push(...buildFieldQuestion({
    players,
    allPlayers,
    field: 'jersey',
    promptFor: (p) => `What jersey number does ${p.name} wear?`,
    count: 4,
  }));

  pool.push(...buildFieldQuestion({
    players,
    allPlayers,
    field: 'age',
    promptFor: (p) => `How old is ${p.name}?`,
    count: 3,
  }));

  pool.push(...buildFieldQuestion({
    players,
    allPlayers,
    field: 'height',
    promptFor: (p) => `How tall is ${p.name}?`,
    count: 3,
  }));

  pool.push(...buildFieldQuestion({
    players,
    allPlayers,
    field: 'college',
    promptFor: (p) => `What college did ${p.name} attend?`,
    count: 3,
  }));

  pool.push(...buildFieldQuestion({
    players,
    allPlayers,
    field: 'country',
    promptFor: (p) => `What country is ${p.name} from?`,
    count: 3,
  }));

  const realNames = new Set(players.map((p) => p.name));
  const fakePool = otherPlayers.filter((p) => !realNames.has(p.name));
  for (const real of pickN(players, 5)) {
    const fakes = pickN(fakePool, 3);
    if (fakes.length === 3) {
      pool.push(mcq(
        `Which of these players is on the ${team.name}?`,
        real.name,
        fakes.map((p) => p.name),
      ));
    }
  }

  const ATTR_LABELS = [
    ['Position', 'position'],
    ['Jersey', 'jersey'],
    ['Age', 'age'],
    ['Height', 'height'],
    ['Weight', 'weight'],
    ['College', 'college'],
    ['Country', 'country'],
  ];
  for (const player of pickN(players, 4)) {
    const rows = ATTR_LABELS
      .map(([label, key]) => [label, player[key]])
      .filter(([, v]) => v != null);
    if (rows.length < 3) continue;

    const distractors = pickN(
      fakePool.filter((p) => p.name !== player.name),
      3,
    );
    if (distractors.length !== 3) continue;

    const prompt = [
      'Who is this player?',
      '',
      ...rows.map(([label, value]) => `${label}: ${value}`),
    ].join('\n');
    pool.push(mcq(prompt, player.name, distractors.map((p) => p.name)));
  }

  return shuffle(pool).slice(0, 10);
}
