function shuffle(arr, rand = Math.random) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function pickN(arr, n, rand) {
  return shuffle(arr, rand).slice(0, n);
}

function mcq(prompt, correct, distractors, player, difficulty, rand) {
  const choices = shuffle([correct, ...distractors], rand);
  return {
    prompt,
    choices: choices.map(String),
    correctIndex: choices.indexOf(correct),
    player,
    difficulty,
  };
}

function uniqueValues(players, key, excludeValue) {
  return [...new Set(
    players.map((p) => p[key]).filter((v) => v != null && v !== excludeValue),
  )];
}

function buildFieldQuestion({ players, allPlayers, field, promptFor, count, difficulty }, rand) {
  const eligible = players.filter((p) => p[field] != null && p.name);
  const out = [];
  for (const player of pickN(eligible, count, rand)) {
    const pool = uniqueValues(allPlayers, field, player[field]);
    const distractors = pickN(pool, 3, rand);
    if (distractors.length === 3) {
      out.push(mcq(promptFor(player), player[field], distractors, player, difficulty, rand));
    }
  }
  return out;
}

export function selectByMix(pool, mix, rand = Math.random) {
  const byDiff = {
    easy: shuffle(pool.filter((q) => q.difficulty === 'easy'), rand),
    medium: shuffle(pool.filter((q) => q.difficulty === 'medium'), rand),
    hard: shuffle(pool.filter((q) => q.difficulty === 'hard'), rand),
  };

  const result = [];
  const overflow = [];
  for (const diff of ['easy', 'medium', 'hard']) {
    const want = mix[diff] ?? 0;
    result.push(...byDiff[diff].slice(0, want));
    overflow.push(...byDiff[diff].slice(want));
  }

  const needed = Object.values(mix).reduce((a, b) => a + b, 0) - result.length;
  if (needed > 0) {
    result.push(...shuffle(overflow, rand).slice(0, needed));
  }
  return shuffle(result, rand);
}

export function buildQuestionPool({ team, players, otherPlayers }, rand = Math.random) {
  const allPlayers = [...players, ...otherPlayers];
  const pool = [];

  pool.push(...buildFieldQuestion({
    players, allPlayers, field: 'position',
    promptFor: (p) => `What position does ${p.name} play?`,
    count: 5, difficulty: 'easy',
  }, rand));

  pool.push(...buildFieldQuestion({
    players, allPlayers, field: 'jersey',
    promptFor: (p) => `What jersey number does ${p.name} wear?`,
    count: 4, difficulty: 'medium',
  }, rand));

  pool.push(...buildFieldQuestion({
    players, allPlayers, field: 'age',
    promptFor: (p) => `How old is ${p.name}?`,
    count: 3, difficulty: 'medium',
  }, rand));

  pool.push(...buildFieldQuestion({
    players, allPlayers, field: 'height',
    promptFor: (p) => `How tall is ${p.name}?`,
    count: 3, difficulty: 'medium',
  }, rand));

  pool.push(...buildFieldQuestion({
    players, allPlayers, field: 'country',
    promptFor: (p) => `What country is ${p.name} from?`,
    count: 3, difficulty: 'medium',
  }, rand));

  pool.push(...buildFieldQuestion({
    players, allPlayers, field: 'college',
    promptFor: (p) => `What college did ${p.name} attend?`,
    count: 3, difficulty: 'hard',
  }, rand));

  const realNames = new Set(players.map((p) => p.name));
  const fakePool = otherPlayers.filter((p) => !realNames.has(p.name));
  for (const real of pickN(players, 5, rand)) {
    const fakes = pickN(fakePool, 3, rand);
    if (fakes.length === 3) {
      pool.push(mcq(
        `Which of these players is on the ${team.name}?`,
        real.name,
        fakes.map((p) => p.name),
        real,
        'easy',
        rand,
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
  for (const player of pickN(players, 4, rand)) {
    const rows = ATTR_LABELS
      .map(([label, key]) => [label, player[key]])
      .filter(([, v]) => v != null);
    if (rows.length < 3) continue;

    const distractors = pickN(
      fakePool.filter((p) => p.name !== player.name),
      3,
      rand,
    );
    if (distractors.length !== 3) continue;

    const prompt = [
      'Who is this player?',
      '',
      ...rows.map(([label, value]) => `${label}: ${value}`),
    ].join('\n');
    pool.push(mcq(prompt, player.name, distractors.map((p) => p.name), player, 'hard', rand));
  }

  return pool;
}

export function generateQuestions(data, options = {}) {
  const rand = options.rand ?? Math.random;
  const pool = buildQuestionPool(data, rand);
  if (options.mix) return selectByMix(pool, options.mix, rand);
  return shuffle(pool, rand).slice(0, options.count ?? 10);
}
