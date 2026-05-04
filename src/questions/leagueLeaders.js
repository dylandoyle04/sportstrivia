import { buildLeaderQuestions, buildMlbLeaderQuestions } from './generator';
import { getEspnLeaders } from '../api/espnLeaders';
import { getMlbLeaders } from '../api/mlb';

export const LAST_SEASON_NFL = 2024;
export const LAST_SEASON_MLB = 2024;
export const LAST_SEASON_NBA = 2025;
export const LAST_SEASON_NHL = 2025;
export const CURRENT_SEASON_NFL = 2025;
export const CURRENT_SEASON_NHL = 2026;

export async function nflLeaderQuestions(rand) {
  const out = [];
  try {
    const last = await getEspnLeaders('football', 'nfl', LAST_SEASON_NFL, [
      'passingTouchdowns', 'passingYards', 'rushingYards', 'receivingYards', 'interceptions', 'sacks',
    ]);
    out.push(...buildLeaderQuestions(last, {
      passingTouchdowns: { prompt: `Who led the NFL in passing touchdowns in ${LAST_SEASON_NFL}?`, difficulty: 'medium' },
      passingYards: { prompt: `Who led the NFL in passing yards in ${LAST_SEASON_NFL}?`, difficulty: 'medium' },
      rushingYards: { prompt: `Who led the NFL in rushing yards in ${LAST_SEASON_NFL}?`, difficulty: 'medium' },
      receivingYards: { prompt: `Who led the NFL in receiving yards in ${LAST_SEASON_NFL}?`, difficulty: 'medium' },
      interceptions: { prompt: `Who led the NFL in interceptions in ${LAST_SEASON_NFL}?`, difficulty: 'hard' },
      sacks: { prompt: `Who led the NFL in sacks in ${LAST_SEASON_NFL}?`, difficulty: 'hard' },
    }, rand));
  } catch { /* optional */ }
  try {
    const cur = await getEspnLeaders('football', 'nfl', CURRENT_SEASON_NFL, [
      'passingTouchdowns', 'sacks', 'interceptions',
    ]);
    out.push(...buildLeaderQuestions(cur, {
      passingTouchdowns: { prompt: 'Who is leading the NFL in passing touchdowns this season?', difficulty: 'medium' },
      sacks: { prompt: 'Who is leading the NFL in sacks this season?', difficulty: 'hard' },
      interceptions: { prompt: 'Who is leading the NFL in interceptions this season?', difficulty: 'hard' },
    }, rand));
  } catch { /* optional */ }
  return out;
}

export async function nbaLeaderQuestions(rand) {
  const out = [];
  try {
    const last = await getEspnLeaders('basketball', 'nba', LAST_SEASON_NBA, [
      'pointsPerGame', 'assistsPerGame', 'reboundsPerGame', 'blocksPerGame', 'stealsPerGame',
    ]);
    out.push(...buildLeaderQuestions(last, {
      pointsPerGame: { prompt: 'Who led the NBA in scoring last season?', difficulty: 'medium' },
      assistsPerGame: { prompt: 'Who led the NBA in assists per game last season?', difficulty: 'hard' },
      reboundsPerGame: { prompt: 'Who led the NBA in rebounds per game last season?', difficulty: 'hard' },
      blocksPerGame: { prompt: 'Who led the NBA in blocks per game last season?', difficulty: 'hard' },
      stealsPerGame: { prompt: 'Who led the NBA in steals per game last season?', difficulty: 'hard' },
    }, rand));
  } catch { /* optional */ }
  return out;
}

export async function nhlLeaderQuestions(rand) {
  const out = [];
  try {
    const last = await getEspnLeaders('hockey', 'nhl', LAST_SEASON_NHL, [
      'goals', 'assists', 'points', 'savePct', 'wins', 'shutouts',
    ]);
    out.push(...buildLeaderQuestions(last, {
      goals: { prompt: 'Who led the NHL in goals last season?', difficulty: 'medium' },
      assists: { prompt: 'Who led the NHL in assists last season?', difficulty: 'hard' },
      points: { prompt: 'Who led the NHL in points last season?', difficulty: 'medium' },
      savePct: { prompt: 'Which goalie led the NHL in save percentage last season?', difficulty: 'hard' },
      wins: { prompt: 'Which goalie led the NHL in wins last season?', difficulty: 'hard' },
      shutouts: { prompt: 'Which goalie led the NHL in shutouts last season?', difficulty: 'hard' },
    }, rand));
  } catch { /* optional */ }
  try {
    const cur = await getEspnLeaders('hockey', 'nhl', CURRENT_SEASON_NHL, [
      'savePct', 'wins',
    ]);
    out.push(...buildLeaderQuestions(cur, {
      savePct: { prompt: 'Which goalie has the highest save percentage this season?', difficulty: 'hard' },
      wins: { prompt: 'Which goalie has the most wins this season?', difficulty: 'hard' },
    }, rand));
  } catch { /* optional */ }
  return out;
}

export async function mlbLastSeasonLeaderQuestions(rand) {
  try {
    const [hr, era] = await Promise.all([
      getMlbLeaders('homeRuns', 'hitting', 10, LAST_SEASON_MLB),
      getMlbLeaders('earnedRunAverage', 'pitching', 10, LAST_SEASON_MLB),
    ]);
    return buildMlbLeaderQuestions({ homeRuns: hr, era }, rand, ` in ${LAST_SEASON_MLB}`);
  } catch {
    return [];
  }
}
