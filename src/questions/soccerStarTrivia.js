function shuffleSeeded(arr, rand) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function makeMcq(prompt, correct, distractors, difficulty, teamMeta, playerName, rand) {
  const choices = shuffleSeeded([correct, ...distractors], rand);
  return {
    prompt,
    choices: choices.map(String),
    correctIndex: choices.indexOf(correct),
    player: { team: teamMeta, name: playerName },
    difficulty,
  };
}

const ELITES = {
  'Kylian Mbappé': {
    team: { name: 'Real Madrid', league: 'Soccer', competition: 'La Liga' },
    questions: [
      { prompt: 'Which French club did Kylian Mbappé leave to join Real Madrid in 2024?',
        correct: 'Paris Saint-Germain', distractors: ['Lyon', 'Marseille', 'AS Monaco'], difficulty: 'easy' },
      { prompt: 'How old was Mbappé when he won the World Cup with France in 2018?',
        correct: '19', distractors: ['17', '21', '23'], difficulty: 'medium' },
      { prompt: 'What jersey number does Mbappé wear for Real Madrid?',
        correct: '9', distractors: ['7', '10', '11'], difficulty: 'medium' },
      { prompt: 'Which French town did Mbappé grow up in?',
        correct: 'Bondy', distractors: ['Saint-Étienne', 'Rouen', 'Le Havre'], difficulty: 'hard' },
    ],
  },
  'Erling Haaland': {
    team: { name: 'Manchester City', league: 'Soccer', competition: 'EPL' },
    questions: [
      { prompt: 'Which Bundesliga club did Erling Haaland play for before Manchester City?',
        correct: 'Borussia Dortmund', distractors: ['Bayern Munich', 'RB Leipzig', 'Bayer Leverkusen'], difficulty: 'easy' },
      { prompt: 'Which country does Erling Haaland represent internationally?',
        correct: 'Norway', distractors: ['Sweden', 'Denmark', 'Iceland'], difficulty: 'easy' },
      { prompt: "Haaland's father, Alf-Inge, also played in the Premier League. Which club is he most associated with?",
        correct: 'Manchester City', distractors: ['Manchester United', 'Leeds United', 'Liverpool'], difficulty: 'hard' },
      { prompt: 'Haaland set a Premier League single-season goals record. How many league goals did he score in 2022-23?',
        correct: '36', distractors: ['28', '32', '40'], difficulty: 'hard' },
    ],
  },
  'Jude Bellingham': {
    team: { name: 'Real Madrid', league: 'Soccer', competition: 'La Liga' },
    questions: [
      { prompt: 'Which Bundesliga club did Jude Bellingham play for before Real Madrid?',
        correct: 'Borussia Dortmund', distractors: ['Bayern Munich', 'Bayer Leverkusen', 'RB Leipzig'], difficulty: 'easy' },
      { prompt: 'Which English Championship club is Jude Bellingham\'s boyhood team?',
        correct: 'Birmingham City', distractors: ['Aston Villa', 'West Brom', 'Wolves'], difficulty: 'medium' },
      { prompt: 'What jersey number does Bellingham wear for Real Madrid?',
        correct: '5', distractors: ['8', '10', '20'], difficulty: 'medium' },
      { prompt: "Bellingham's older brother Jobe also plays professionally. Which club did Jobe sign with in 2025?",
        correct: 'Borussia Dortmund', distractors: ['Manchester City', 'Real Madrid', 'Sunderland'], difficulty: 'hard' },
    ],
  },
  'Mohamed Salah': {
    team: { name: 'Liverpool', league: 'Soccer', competition: 'EPL' },
    questions: [
      { prompt: 'Which country does Mohamed Salah represent internationally?',
        correct: 'Egypt', distractors: ['Morocco', 'Algeria', 'Tunisia'], difficulty: 'easy' },
      { prompt: 'Which Italian club did Salah play for before Liverpool?',
        correct: 'AS Roma', distractors: ['Juventus', 'Inter Milan', 'AC Milan'], difficulty: 'medium' },
      { prompt: 'What is Mohamed Salah\'s most famous nickname?',
        correct: 'The Egyptian King', distractors: ['The Pharaoh', 'King Mo', 'The Cairo Express'], difficulty: 'medium' },
      { prompt: 'Salah won his first Premier League Golden Boot in his debut season at Liverpool. How many goals did he score?',
        correct: '32', distractors: ['25', '28', '36'], difficulty: 'hard' },
    ],
  },
  'Harry Kane': {
    team: { name: 'Bayern Munich', league: 'Soccer', competition: 'Bundesliga' },
    questions: [
      { prompt: 'Which Premier League club did Harry Kane spend his entire pre-Bayern career with?',
        correct: 'Tottenham Hotspur', distractors: ['Arsenal', 'Chelsea', 'Manchester United'], difficulty: 'easy' },
      { prompt: 'Harry Kane is the all-time leading scorer for which national team?',
        correct: 'England', distractors: ['Scotland', 'Wales', 'Republic of Ireland'], difficulty: 'medium' },
      { prompt: 'In what year did Harry Kane finally win his first major club trophy by lifting the Bundesliga?',
        correct: '2025', distractors: ['2023', '2024', '2026'], difficulty: 'hard' },
      { prompt: 'How many Premier League Golden Boots did Harry Kane win at Tottenham?',
        correct: '3', distractors: ['1', '2', '4'], difficulty: 'medium' },
    ],
  },
  'Kevin De Bruyne': {
    team: { name: 'Manchester City', league: 'Soccer', competition: 'EPL' },
    questions: [
      { prompt: 'Which country does Kevin De Bruyne represent internationally?',
        correct: 'Belgium', distractors: ['Netherlands', 'Germany', 'France'], difficulty: 'easy' },
      { prompt: 'Which Bundesliga club did De Bruyne win the league with before joining Manchester City?',
        correct: 'VfL Wolfsburg', distractors: ['Bayern Munich', 'Borussia Dortmund', 'Bayer Leverkusen'], difficulty: 'medium' },
      { prompt: 'Which Premier League club originally signed De Bruyne in 2012 before he found his form on loan?',
        correct: 'Chelsea', distractors: ['Manchester United', 'Arsenal', 'Liverpool'], difficulty: 'hard' },
      { prompt: 'How many Premier League titles did De Bruyne win during his time with Manchester City?',
        correct: '6', distractors: ['4', '5', '7'], difficulty: 'medium' },
    ],
  },
  'Vinícius Júnior': {
    team: { name: 'Real Madrid', league: 'Soccer', competition: 'La Liga' },
    questions: [
      { prompt: 'Which Brazilian club did Vinícius Júnior leave to join Real Madrid?',
        correct: 'Flamengo', distractors: ['São Paulo', 'Palmeiras', 'Santos'], difficulty: 'easy' },
      { prompt: 'In what year did Vinícius Jr. score the winning goal in a Champions League final for Real Madrid?',
        correct: '2022', distractors: ['2018', '2024', '2017'], difficulty: 'medium' },
      { prompt: "Vinícius is famous for chewing what during matches?",
        correct: 'Gum', distractors: ['Toothpicks', 'Mints', 'His shirt collar'], difficulty: 'hard' },
      { prompt: 'Which jersey number does Vinícius Jr. wear for Real Madrid?',
        correct: '7', distractors: ['9', '10', '11'], difficulty: 'medium' },
    ],
  },
};

// Build a name normalizer to match roster names that may have accents/Jr suffixes
function normalize(name) {
  return (name || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\bjr\.?\b/g, '')
    .replace(/\bjunior\b/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

const NAME_INDEX = new Map();
for (const [eliteName, def] of Object.entries(ELITES)) {
  NAME_INDEX.set(normalize(eliteName), { eliteName, def });
}

export function getSoccerStarTrivia(player, rand = Math.random) {
  if (!player?.name) return [];
  const match = NAME_INDEX.get(normalize(player.name));
  if (!match) return [];
  const teamMeta = player.team
    ? { name: player.team.name, league: 'Soccer', competition: player.team.competition }
    : match.def.team;
  return match.def.questions.map((q) =>
    makeMcq(q.prompt, q.correct, q.distractors, q.difficulty, teamMeta, match.eliteName, rand),
  );
}
