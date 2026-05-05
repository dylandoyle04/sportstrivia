function shuffle(arr, rand) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function makeMcq(prompt, correct, distractors, difficulty, teamMeta, rand) {
  const choices = shuffle([correct, ...distractors], rand);
  return {
    prompt,
    choices: choices.map(String),
    correctIndex: choices.indexOf(correct),
    player: { team: teamMeta, name: null },
    difficulty,
  };
}

const BILLS_TEAM = { name: 'Buffalo Bills', league: 'NFL' };

const BILLS_QUESTIONS = [
  { prompt: 'How many straight Super Bowls did the Buffalo Bills lose in the early 1990s?',
    correct: '4', distractors: ['2', '3', '5'], difficulty: 'easy' },
  { prompt: "Who is the Bills' infamous 'Wide Right' kicker from Super Bowl XXV?",
    correct: 'Scott Norwood', distractors: ['Adam Vinatieri', 'Lou Groza', 'Stephen Gostkowski'], difficulty: 'medium' },
  { prompt: 'Which team did the Bills lose to in their first Super Bowl appearance?',
    correct: 'New York Giants', distractors: ['Dallas Cowboys', 'Washington', 'San Francisco 49ers'], difficulty: 'medium' },
  { prompt: "What is the Buffalo Bills' all-time Super Bowl record?",
    correct: '0-4', distractors: ['0-2', '1-3', '0-3'], difficulty: 'medium' },
  { prompt: "What is Bills Mafia's signature pre-game tailgate activity?",
    correct: 'Jumping through folding tables', distractors: ['Flipping cars', 'Doing keg stands on cars', 'Setting tires on fire'], difficulty: 'easy' },
  { prompt: 'What year were the Buffalo Bills founded?',
    correct: '1960', distractors: ['1958', '1962', '1965'], difficulty: 'medium' },
  { prompt: 'What jersey number did O.J. Simpson wear with the Bills?',
    correct: '32', distractors: ['12', '24', '22'], difficulty: 'medium' },
  { prompt: "Who is the Bills' all-time leading scorer?",
    correct: 'Steve Christie', distractors: ['Jim Kelly', 'Andre Reed', 'Thurman Thomas'], difficulty: 'hard' },
  { prompt: 'Which Bills cornerback shocked the league by retiring at halftime mid-game in 2018?',
    correct: 'Vontae Davis', distractors: ['Stephon Gilmore', 'E.J. Gaines', 'Kevon Seymour'], difficulty: 'hard' },
  { prompt: 'Which Bills QB became infamous for a 5-interception half against the Chargers in 2017?',
    correct: 'Nathan Peterman', distractors: ['Tyrod Taylor', 'EJ Manuel', 'Trent Edwards'], difficulty: 'hard' },
];

const SABRES_TEAM = { name: 'Buffalo Sabres', league: 'NHL' };

const SABRES_QUESTIONS = [
  { prompt: 'What year were the Buffalo Sabres founded?',
    correct: '1970', distractors: ['1968', '1972', '1975'], difficulty: 'medium' },
  { prompt: 'Which team did the Sabres lose to in the 1999 Stanley Cup Final (aka the "No Goal" series)?',
    correct: 'Dallas Stars', distractors: ['Detroit Red Wings', 'Colorado Avalanche', 'New Jersey Devils'], difficulty: 'medium' },
  { prompt: 'Who scored the controversial "No Goal" in the 1999 Stanley Cup Final?',
    correct: 'Brett Hull', distractors: ['Mike Modano', 'Joe Nieuwendyk', 'Jere Lehtinen'], difficulty: 'hard' },
  { prompt: 'How many Stanley Cups have the Buffalo Sabres won?',
    correct: '0', distractors: ['1', '2', '3'], difficulty: 'easy' },
  { prompt: 'Which Sabres goalie famously fought another goalie in a full-on brawl?',
    correct: 'Ryan Miller', distractors: ['Dominik Hasek', 'Robin Lehner', 'Martin Biron'], difficulty: 'hard' },
  { prompt: 'Which tiny, fast, highly-skilled Sabres player was constantly getting wrecked physically?',
    correct: 'Nathan Gerbe', distractors: ['Tyler Ennis', 'Cody McCormick', 'Marcus Foligno'], difficulty: 'hard' },
  { prompt: 'Who is widely considered the greatest Sabre of all time, an NHL legend?',
    correct: 'Dominik Hasek', distractors: ['Pat LaFontaine', 'Gilbert Perreault', 'Rick Martin'], difficulty: 'medium' },
  { prompt: 'What nickname did Dominik Hasek go by?',
    correct: 'The Dominator', distractors: ['The Wall', 'The Czech Cat', 'Hasekator'], difficulty: 'medium' },
  { prompt: 'Which Sabres captain demanded a trade in 2021, causing major drama?',
    correct: 'Jack Eichel', distractors: ['Ryan O\'Reilly', 'Rasmus Dahlin', 'Sam Reinhart'], difficulty: 'medium' },
  { prompt: 'Who was the longtime Sabres play-by-play announcer that fans loved?',
    correct: 'Rick Jeanneret', distractors: ['Mike Emrick', 'Doc Emrick', 'Sam Rosen'], difficulty: 'medium' },
  { prompt: "Who is the Sabres' all-time leading scorer?",
    correct: 'Gilbert Perreault', distractors: ['Pat LaFontaine', 'Rick Martin', 'Dominik Hasek'], difficulty: 'hard' },
  { prompt: 'What overall pick was Gilbert Perreault in the 1970 NHL Draft?',
    correct: '1st overall', distractors: ['2nd overall', '3rd overall', '5th overall'], difficulty: 'medium' },
];

export function getTeamSpecificQuestions(teamName, rand = Math.random) {
  if (teamName === 'Buffalo Bills') {
    return BILLS_QUESTIONS.map((q) =>
      makeMcq(q.prompt, q.correct, q.distractors, q.difficulty, BILLS_TEAM, rand),
    );
  }
  if (teamName === 'Buffalo Sabres') {
    return SABRES_QUESTIONS.map((q) =>
      makeMcq(q.prompt, q.correct, q.distractors, q.difficulty, SABRES_TEAM, rand),
    );
  }
  return [];
}
