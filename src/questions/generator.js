import { TEAMS } from '../teams';

const NBA_TEAM_NAMES = [...new Set(TEAMS.filter((t) => t.league === 'NBA').map((t) => t.name))];
const NHL_TEAM_NAMES = [...new Set(TEAMS.filter((t) => t.league === 'NHL').map((t) => t.name))];

function draftPoolForPlayer(player) {
  const lg = player?.team?.league;
  if (lg === 'NHL') return NHL_TEAM_NAMES;
  return NBA_TEAM_NAMES;
}

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
    count: 1, difficulty: 'medium',
  }, rand));

  pool.push(...buildFieldQuestion({
    players, allPlayers, field: 'age',
    promptFor: (p) => `How old is ${p.name}?`,
    count: 1, difficulty: 'medium',
  }, rand));

  pool.push(...buildFieldQuestion({
    players, allPlayers, field: 'height',
    promptFor: (p) => `How tall is ${p.name}?`,
    count: 1, difficulty: 'medium',
  }, rand));

  pool.push(...buildFieldQuestion({
    players, allPlayers, field: 'country',
    promptFor: (p) => `What country is ${p.name} from?`,
    count: 1, difficulty: 'medium',
  }, rand));

  pool.push(...buildFieldQuestion({
    players, allPlayers, field: 'college',
    promptFor: (p) => `What college did ${p.name} attend?`,
    count: 3, difficulty: 'hard',
  }, rand));

  pool.push(...buildFieldQuestion({
    players, allPlayers, field: 'draftYear',
    promptFor: (p) => `What year was ${p.name} drafted?`,
    count: 2, difficulty: 'hard',
  }, rand));

  pool.push(...buildFieldQuestion({
    players, allPlayers, field: 'draftPick',
    promptFor: (p) => `What was ${p.name}'s overall draft pick?`,
    count: 2, difficulty: 'hard',
  }, rand));

  // "What team drafted {player}?" (NBA + NHL, hard)
  const draftedPlayers = players.filter((p) => p.draftTeam);
  for (const player of pickN(draftedPlayers, 2, rand)) {
    const teamPool = draftPoolForPlayer(player);
    const distractors = pickN(teamPool.filter((n) => n !== player.draftTeam), 3, rand);
    if (distractors.length !== 3) continue;
    pool.push(mcq(
      `What team drafted ${player.name}?`,
      player.draftTeam,
      distractors,
      player,
      'hard',
      rand,
    ));
  }

  // "Who is this player?" using NBA team history — distractors from SAME team
  const historyPlayers = players.filter((p) => p.teamHistoryString);
  for (const player of pickN(historyPlayers, 2, rand)) {
    const sameTeamPool = players.filter((p) => p.name && p.name !== player.name);
    const distractors = pickN(sameTeamPool, 3, rand);
    if (distractors.length !== 3) continue;
    const prompt = `Who is this player?\n\nTeams played for:\n${player.teamHistoryString}`;
    pool.push(mcq(prompt, player.name, distractors.map((p) => p.name), player, 'hard', rand));
  }

  // Stat head-to-head helper (2-choice, same-team opponents)
  function buildStatHeadToHead(field, prompt, minGap, difficulty, count, direction = 'higher') {
    const seen = new Set();
    const out = [];
    const subjects = players.filter((p) => p[field] != null);
    for (const player of pickN(subjects, count ?? 2, rand)) {
      const opponents = players.filter(
        (o) => o.name !== player.name && o[field] != null && Math.abs(o[field] - player[field]) > minGap,
      );
      if (opponents.length === 0) continue;
      const opp = pickN(opponents, 1, rand)[0];
      const [winner, loser] = direction === 'higher'
        ? (player[field] > opp[field] ? [player, opp] : [opp, player])
        : (player[field] < opp[field] ? [player, opp] : [opp, player]);
      const key = [winner.name, loser.name].sort().join('|');
      if (seen.has(key)) continue;
      seen.add(key);
      out.push(mcq(prompt, winner.name, [loser.name], winner, difficulty, rand));
    }
    return out;
  }

  pool.push(...buildStatHeadToHead('ppg', 'Who averages more points per game this season?', 0.5, 'easy', 4));
  pool.push(...buildStatHeadToHead('apg', 'Who averages more assists per game this season?', 0.3, 'hard', 4));
  pool.push(...buildStatHeadToHead('rpg', 'Who averages more rebounds per game this season?', 0.3, 'hard', 4));

  pool.push(...buildStatHeadToHead('homeRuns', 'Who has more home runs this season?', 1, 'medium', 4));
  pool.push(...buildStatHeadToHead('hits', 'Who has more hits this season?', 5, 'medium', 4));
  pool.push(...buildStatHeadToHead('battingAvg', 'Who has the higher batting average this season?', 0.020, 'hard', 3));
  pool.push(...buildStatHeadToHead('era', 'Whose ERA is lower this season?', 0.3, 'medium', 4, 'lower'));

  pool.push(...buildStatHeadToHead('seasonGoals', 'Who has more goals this season?', 2, 'medium', 4));
  pool.push(...buildStatHeadToHead('seasonAssists', 'Who has more assists this season?', 2, 'medium', 4));
  pool.push(...buildStatHeadToHead('seasonPoints', 'Who has more points this season?', 3, 'medium', 4));

  // Soccer top goal scorer last match (4-choice, same team)
  const soccerScorers = players.filter((p) => p.lastGameGoals != null && team.league === 'Soccer');
  if (soccerScorers.length >= 4) {
    const sorted = [...soccerScorers].sort((a, b) => b.lastGameGoals - a.lastGameGoals);
    const top = sorted[0];
    if (top.lastGameGoals > 0 && sorted[1].lastGameGoals < top.lastGameGoals) {
      const distractors = pickN(sorted.slice(1), 3, rand);
      if (distractors.length === 3) {
        const opp = top.lastGameOpponent ? ` vs ${top.lastGameOpponent}` : '';
        pool.push(mcq(
          `Who scored the most goals for the ${team.name} in their most recent match${opp}?`,
          top.name,
          distractors.map((d) => d.name),
          top,
          'medium',
          rand,
        ));
      }
    }
  }

  // Soccer head-to-head goals last match (2-choice, same team, only when ≥1 goal scored)
  const soccerGoalH2H = new Set();
  const soccerGoalSubjects = players.filter(
    (p) => p.lastGameGoals != null && p.lastGameGoals > 0 && team.league === 'Soccer',
  );
  for (const player of pickN(soccerGoalSubjects, 3, rand)) {
    const opponents = players.filter(
      (o) => o.name !== player.name &&
        o.lastGameGoals != null &&
        Math.abs(o.lastGameGoals - player.lastGameGoals) >= 1,
    );
    if (opponents.length === 0) continue;
    const opp = pickN(opponents, 1, rand)[0];
    const [winner, loser] = player.lastGameGoals > opp.lastGameGoals ? [player, opp] : [opp, player];
    const key = [winner.name, loser.name].sort().join('|');
    if (soccerGoalH2H.has(key)) continue;
    soccerGoalH2H.add(key);
    pool.push(mcq(
      'Who scored more goals in their most recent match?',
      winner.name,
      [loser.name],
      winner,
      'hard',
      rand,
    ));
  }

  // Top scorer last game (4-choice, all from same team)
  const lastGameTeamScorers = players.filter((p) => p.lastGamePts != null);
  if (lastGameTeamScorers.length >= 4) {
    const sorted = [...lastGameTeamScorers].sort((a, b) => b.lastGamePts - a.lastGamePts);
    const top = sorted[0];
    if (sorted[1].lastGamePts < top.lastGamePts) {
      const distractors = pickN(sorted.slice(1), 3, rand);
      if (distractors.length === 3) {
        const opp = top.lastGameOpponent ? ` vs ${top.lastGameOpponent}` : '';
        pool.push(mcq(
          `Who scored the most points for the ${team.name} in their most recent game${opp}?`,
          top.name,
          distractors.map((d) => d.name),
          top,
          'medium',
          rand,
        ));
      }
    }
  }

  // Head-to-head last game points
  const lastGamePool = [...players, ...otherPlayers].filter(
    (p) => p.lastGamePts != null && p.name,
  );
  const seenH2H = new Set();
  for (const player of pickN(players.filter((p) => p.lastGamePts != null), 4, rand)) {
    const candidates = lastGamePool.filter(
      (o) => o.name !== player.name && Math.abs(o.lastGamePts - player.lastGamePts) >= 3,
    );
    if (candidates.length === 0) continue;
    const opp = pickN(candidates, 1, rand)[0];
    const [higher, lower] = player.lastGamePts > opp.lastGamePts ? [player, opp] : [opp, player];
    const key = [higher.name, lower.name].sort().join('|');
    if (seenH2H.has(key)) continue;
    seenH2H.add(key);
    pool.push(mcq(
      'Who scored more points in their most recent game?',
      higher.name,
      [lower.name],
      higher,
      'hard',
      rand,
    ));
  }

  // Stat-line "Who is this player?" — NBA averages
  const nbaStatLinePlayers = players.filter(
    (p) => p.name && p.ppg != null && p.apg != null && p.rpg != null,
  );
  for (const player of pickN(nbaStatLinePlayers, 4, rand)) {
    const sameTeamPool = players.filter((p) => p.name && p.name !== player.name);
    const distractors = pickN(sameTeamPool, 3, rand);
    if (distractors.length !== 3) continue;
    const prompt = `Who is this player?\n\nPPG: ${player.ppg}\nAPG: ${player.apg}\nRPG: ${player.rpg}`;
    pool.push(mcq(prompt, player.name, distractors.map((p) => p.name), player, 'hard', rand));
  }

  // Stat-line "Who is this player?" — NHL season totals
  const nhlStatLinePlayers = players.filter(
    (p) => p.name && p.seasonGoals != null && p.seasonAssists != null && p.seasonPoints != null,
  );
  for (const player of pickN(nhlStatLinePlayers, 4, rand)) {
    const sameTeamPool = players.filter((p) => p.name && p.name !== player.name);
    const distractors = pickN(sameTeamPool, 3, rand);
    if (distractors.length !== 3) continue;
    const prompt = `Who is this player?\n\nGoals: ${player.seasonGoals}\nAssists: ${player.seasonAssists}\nPoints: ${player.seasonPoints}`;
    pool.push(mcq(prompt, player.name, distractors.map((p) => p.name), player, 'hard', rand));
  }

  const realNames = new Set(players.map((p) => p.name));
  const fakePool = otherPlayers.filter((p) => !realNames.has(p.name));

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

    const sameTeamPool = players.filter((p) => p.name && p.name !== player.name);
    const distractors = pickN(sameTeamPool, 3, rand);
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

export function buildMlbLeaderQuestions(leadersByCategory, rand = Math.random) {
  const out = [];
  function add(leaders, prompt, difficulty) {
    if (!leaders || leaders.length < 4) return;
    const top = leaders[0];
    const others = leaders.slice(1).filter((l) => l.name !== top.name);
    const distractors = pickN(others, 3, rand);
    if (distractors.length !== 3) return;
    out.push(mcq(prompt, top.name, distractors.map((d) => d.name), null, difficulty, rand));
  }
  add(leadersByCategory.homeRuns, 'Who is leading MLB in home runs this season?', 'medium');
  add(leadersByCategory.battingAverage, 'Who has the highest batting average in MLB this season?', 'hard');
  add(leadersByCategory.era, 'Who has the lowest ERA in MLB this season?', 'hard');
  add(leadersByCategory.hits, 'Who is leading MLB in hits this season?', 'medium');
  return out;
}

export function buildLastNightQuestions(games, rand = Math.random) {
  const out = [];
  if (!games || games.length === 0) return out;
  const seenPrompts = new Set();
  function add(q) {
    if (!q || seenPrompts.has(q.prompt)) return;
    seenPrompts.add(q.prompt);
    out.push(q);
  }

  // 1. Who won between A and B last night? (easy, 2-choice; bias to non-MLB)
  const nonMlbGames = games.filter((g) => g.leagueKey !== 'MLB');
  const mlbOnly = games.filter((g) => g.leagueKey === 'MLB');
  const winGameOrder = [...shuffle(nonMlbGames, rand), ...shuffle(mlbOnly, rand)];
  for (const g of winGameOrder.slice(0, 4)) {
    const winner = g.winner === 'home' ? g.home : g.away;
    const loser = g.winner === 'home' ? g.away : g.home;
    add(mcq(
      `Who won last night, ${g.home.name} or ${g.away.name}?`,
      winner.name,
      [loser.name],
      null,
      'easy',
      rand,
    ));
  }

  // 6. Final score of A vs B? (medium, 4-choice, same-league distractors)
  for (const g of shuffle(games, rand).slice(0, 3)) {
    const sameLeagueScores = [...new Set(
      games.filter((og) => og.leagueKey === g.leagueKey).flatMap((og) => [
        `${og.home.score}-${og.away.score}`,
        `${og.away.score}-${og.home.score}`,
      ]),
    )];
    const correct = `${g.home.score}-${g.away.score}`;
    const reversed = `${g.away.score}-${g.home.score}`;
    const distractors = pickN(sameLeagueScores.filter((s) => s !== correct && s !== reversed), 3, rand);
    if (distractors.length !== 3) continue;
    add(mcq(
      `What was the final score of last night's ${g.home.name} vs ${g.away.name} game?`,
      correct,
      distractors,
      null,
      'medium',
      rand,
    ));
  }

  // 9. Runs scored by [MLB Team] last night? (hard, 4-choice — only 1)
  const mlbGames = games.filter((g) => g.leagueKey === 'MLB');
  const mlbScores = [...new Set(mlbGames.flatMap((g) => [g.home.score, g.away.score]))];
  for (const g of shuffle(mlbGames, rand).slice(0, 1)) {
    for (const side of ['home', 'away']) {
      const team = g[side];
      const correct = String(team.score);
      const distractors = pickN(mlbScores.filter((s) => String(s) !== correct).map(String), 3, rand);
      if (distractors.length !== 3) continue;
      add(mcq(
        `How many runs did the ${team.name} score last night?`,
        correct,
        distractors,
        null,
        'hard',
        rand,
      ));
      break;
    }
  }

  // 3. Most NBA points last night? (medium, 4-choice)
  const nbaTeams = games.filter((g) => g.leagueKey === 'NBA').flatMap((g) => [
    { name: g.home.name, score: g.home.score },
    { name: g.away.name, score: g.away.score },
  ]);
  if (nbaTeams.length >= 4) {
    const sorted = [...nbaTeams].sort((a, b) => b.score - a.score);
    if (sorted[0].score > sorted[1].score) {
      const top = sorted[0];
      const distractors = pickN(nbaTeams.filter((t) => t.name !== top.name), 3, rand);
      if (distractors.length === 3) {
        add(mcq(
          'Which NBA team scored the most points last night?',
          top.name,
          distractors.map((d) => d.name),
          null,
          'medium',
          rand,
        ));
      }
    }
  }

  // 5. Most MLB HRs last night? (medium, 4-choice)
  const mlbHRs = mlbGames.flatMap((g) => [
    { name: g.home.name, hr: g.home.homeRuns ?? 0 },
    { name: g.away.name, hr: g.away.homeRuns ?? 0 },
  ]);
  if (mlbHRs.length >= 4) {
    const sortedHR = [...mlbHRs].sort((a, b) => b.hr - a.hr);
    if (sortedHR[0].hr > 0 && sortedHR[0].hr > sortedHR[1].hr) {
      const top = sortedHR[0];
      const distractors = pickN(mlbHRs.filter((t) => t.name !== top.name), 3, rand);
      if (distractors.length === 3) {
        add(mcq(
          'Which MLB team hit the most home runs last night?',
          top.name,
          distractors.map((d) => d.name),
          null,
          'medium',
          rand,
        ));
      }
    }
  }

  // 11. Top scorer for [Team] last night (hard, 4-choice; teammates only)
  const topScorerOrder = [
    ...shuffle(nonMlbGames, rand),
    ...shuffle(mlbOnly, rand),
  ];
  for (const g of topScorerOrder.slice(0, 4)) {
    for (const side of ['home', 'away']) {
      const team = g[side];
      const scorer = team?.players?.[0];
      if (!scorer?.name) continue;
      const teammates = (team.players ?? [])
        .slice(1)
        .filter((p) => p?.name && p.name !== scorer.name);
      const distractors = pickN(teammates, 3, rand);
      if (distractors.length !== 3) continue;
      const stat = g.leagueKey === 'NBA' ? 'scoring'
        : g.leagueKey === 'NHL' ? 'points (goals + assists)'
        : 'hitting';
      add(mcq(
        `Who led the ${team.name} in ${stat} last night?`,
        scorer.name,
        distractors.map((d) => d.name),
        null,
        'hard',
        rand,
      ));
      break;
    }
  }

  // 12a. Who led the NBA in scoring last night? (hard, 4-choice)
  const nbaScorerList = games.filter((g) => g.leagueKey === 'NBA').flatMap((g) => g.nbaScorers ?? []);
  if (nbaScorerList.length >= 4) {
    const sortedNba = [...nbaScorerList].sort((a, b) => b.pts - a.pts);
    if (sortedNba[0].pts > sortedNba[1].pts) {
      const top = sortedNba[0];
      const distractors = pickN(sortedNba.slice(1, 15), 3, rand);
      if (distractors.length === 3) {
        add(mcq(
          'Who led the NBA in scoring last night?',
          top.name,
          distractors.map((d) => d.name),
          null,
          'hard',
          rand,
        ));
      }
    }
  }

  // 12b. Who led NHL skaters in points (G+A) last night? (hard, 4-choice)
  const nhlPointsList = games
    .filter((g) => g.leagueKey === 'NHL')
    .flatMap((g) => [g.topScorerHome, g.topScorerAway])
    .filter((s) => s?.name);
  if (nhlPointsList.length >= 4) {
    const sortedNhl = [...nhlPointsList].sort((a, b) => b.pts - a.pts);
    if (sortedNhl[0].pts > sortedNhl[1].pts) {
      const top = sortedNhl[0];
      const distractors = pickN(sortedNhl.slice(1), 3, rand);
      if (distractors.length === 3) {
        add(mcq(
          'Who led NHL skaters in points (goals + assists) last night?',
          top.name,
          distractors.map((d) => d.name),
          null,
          'hard',
          rand,
        ));
      }
    }
  }

  // 12. Which NBA player scored 30+ points last night? (hard, 4-choice)
  const thirtyPlus = nbaScorerList.filter((s) => s.pts >= 30);
  const underThirty = nbaScorerList.filter((s) => s.pts > 5 && s.pts < 30);
  if (thirtyPlus.length > 0 && underThirty.length >= 3) {
    const top = pickN(thirtyPlus, 1, rand)[0];
    const distractors = pickN(underThirty, 3, rand);
    if (distractors.length === 3) {
      add(mcq(
        'Which NBA player scored 30+ points last night?',
        top.name,
        distractors.map((d) => d.name),
        null,
        'hard',
        rand,
      ));
    }
  }

  // 15. Did [top scorer]'s team win last night? (hard, 2-choice)
  for (const g of shuffle(games, rand).slice(0, 3)) {
    const winnerSide = g.winner;
    const candidate = winnerSide === 'home'
      ? (g.topScorerAway ?? g.topScorerHome)
      : (g.topScorerHome ?? g.topScorerAway);
    if (!candidate?.name) continue;
    const playerSide = candidate === g.topScorerHome ? 'home' : 'away';
    const teamWon = playerSide === winnerSide;
    const correct = teamWon ? 'Yes' : 'No';
    const distractor = teamWon ? 'No' : 'Yes';
    add(mcq(
      `Did ${candidate.name}'s team win last night?`,
      correct,
      [distractor],
      null,
      'hard',
      rand,
    ));
    break;
  }

  return shuffle(out, rand);
}

export function buildSoccerTeamStatQuestions(standings, competition, rand = Math.random) {
  if (!Array.isArray(standings) || standings.length === 0) return [];
  const out = [];
  function leader(teams, key, direction) {
    if (!teams || teams.length === 0) return null;
    return teams.reduce((best, t) => {
      const b = best[key] ?? (direction === 'max' ? -Infinity : Infinity);
      const v = t[key] ?? (direction === 'max' ? -Infinity : Infinity);
      if (direction === 'max') return v > b ? t : best;
      return v < b ? t : best;
    });
  }
  function add(key, direction, prompt, difficulty) {
    const top = leader(standings, key, direction);
    if (!top) return;
    const distractors = pickN(standings.filter((t) => t.id !== top.id), 3, rand);
    if (distractors.length !== 3) return;
    out.push(mcq(prompt, top.name, distractors.map((d) => d.name), null, difficulty, rand));
  }
  add('points', 'max', `Which team has the most points in ${competition} this season?`, 'medium');
  add('pointsFor', 'max', `Which team has scored the most goals in ${competition} this season?`, 'medium');
  add('pointsAgainst', 'min', `Which team has conceded the fewest goals in ${competition} this season?`, 'hard');
  return out;
}

export function buildNhlTeamStatQuestions(standings, rand = Math.random) {
  if (!Array.isArray(standings) || standings.length === 0) return [];
  const east = standings.filter((t) => t.conference === 'Eastern Conference');
  const west = standings.filter((t) => t.conference === 'Western Conference');
  const out = [];

  function leader(teams, key, direction) {
    if (!teams || teams.length === 0) return null;
    return teams.reduce((best, t) => {
      const b = best[key] ?? (direction === 'max' ? -Infinity : Infinity);
      const v = t[key] ?? (direction === 'max' ? -Infinity : Infinity);
      if (direction === 'max') return v > b ? t : best;
      return v < b ? t : best;
    });
  }

  function add(pool, key, direction, prompt, difficulty) {
    const top = leader(pool, key, direction);
    if (!top) return;
    const distractors = pickN(pool.filter((t) => t.id !== top.id), 3, rand);
    if (distractors.length !== 3) return;
    out.push(mcq(prompt, top.name, distractors.map((d) => d.name), null, difficulty, rand));
  }

  add(east, 'points', 'max', 'Which team has the most standings points in the NHL Eastern Conference this season?', 'medium');
  add(west, 'points', 'max', 'Which team has the most standings points in the NHL Western Conference this season?', 'medium');
  add(standings, 'pointsAgainst', 'min', 'Which NHL team has allowed the fewest goals this season?', 'hard');
  add(standings, 'pointsFor', 'max', 'Which NHL team has scored the most goals this season?', 'medium');
  return out;
}

export function buildNbaTeamStatQuestions(standings, rand = Math.random) {
  if (!Array.isArray(standings) || standings.length === 0) return [];
  const east = standings.filter((t) => t.conference === 'Eastern Conference');
  const west = standings.filter((t) => t.conference === 'Western Conference');
  const out = [];

  function leader(teams, key, direction = 'max') {
    if (!teams || teams.length === 0) return null;
    return teams.reduce((best, t) => {
      const b = best[key] ?? -Infinity;
      const v = t[key] ?? (direction === 'max' ? -Infinity : Infinity);
      if (direction === 'max') return v > b ? t : best;
      return v < (best[key] ?? Infinity) ? t : best;
    });
  }

  function addLeaderQuestion(pool, keyStat, direction, prompt, difficulty) {
    const top = leader(pool, keyStat, direction);
    if (!top) return;
    const distractors = pickN(pool.filter((t) => t.id !== top.id), 3, rand);
    if (distractors.length !== 3) return;
    out.push(mcq(prompt, top.name, distractors.map((d) => d.name), null, difficulty, rand));
  }

  addLeaderQuestion(east, 'leagueWinPercent', 'max',
    'Which team has the best record in the Eastern Conference this season?', 'medium');
  addLeaderQuestion(west, 'leagueWinPercent', 'max',
    'Which team has the best record in the Western Conference this season?', 'medium');
  addLeaderQuestion(standings, 'avgPointsAgainst', 'min',
    'Which NBA team allows the fewest points per game this season?', 'hard');
  addLeaderQuestion(standings, 'avgPointsFor', 'max',
    'Which NBA team scores the most points per game this season?', 'medium');
  addLeaderQuestion(standings, 'pointDifferential', 'max',
    'Which NBA team has the best point differential this season?', 'hard');

  return out;
}
