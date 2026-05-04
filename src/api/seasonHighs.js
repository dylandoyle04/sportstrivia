function currentMlbSeason() {
  const now = new Date();
  return now.getMonth() >= 10 ? now.getFullYear() - 1 : now.getFullYear();
}

const LAST_SEASONS = {
  NBA: 2025,
  NHL: 2025,
  NFL: 2024,
};
const LAST_MLB_SEASON = 2025;

async function fetchMlbGameHigh(playerId, season) {
  try {
    const url = `/api/mlb/api/v1/people/${playerId}/stats?stats=gameLog&season=${season}&group=hitting`;
    const res = await fetch(url);
    if (!res.ok) return null;
    const data = await res.json();
    const splits = data.stats?.[0]?.splits ?? [];
    let max = 0;
    for (const s of splits) {
      const h = s.stat?.hits ?? 0;
      if (h > max) max = h;
    }
    return max > 0 ? max : null;
  } catch {
    return null;
  }
}

export async function enrichMlbSeasonHighs(players) {
  const cur = currentMlbSeason();
  const last = LAST_MLB_SEASON;
  await Promise.all(
    players.map(async (player) => {
      if (!player.id) return;
      const [curMax, lastMax] = await Promise.all([
        fetchMlbGameHigh(player.id, cur),
        fetchMlbGameHigh(player.id, last),
      ]);
      if (curMax) player.seasonHighHits = curMax;
      if (lastMax) player.lastSeasonHighHits = lastMax;
    }),
  );
}

async function fetchGamelog(sport, league, athleteId, season) {
  const seasonParam = season ? `?season=${season}` : '';
  const url = `https://site.web.api.espn.com/apis/common/v3/sports/${sport}/${league}/athletes/${athleteId}/gamelog${seasonParam}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`gamelog ${res.status}`);
  return res.json();
}

function maxStat(data, labelsToValue) {
  const labels = data.labels ?? [];
  let max = 0;
  for (const stype of data.seasonTypes ?? []) {
    for (const cat of stype.categories ?? []) {
      for (const ev of cat.events ?? []) {
        const v = labelsToValue(ev.stats ?? [], labels);
        if (Number.isFinite(v) && v > max) max = v;
      }
    }
  }
  return max;
}

const ptsExtractor = (stats, labels) => {
  const idx = labels.indexOf('PTS');
  if (idx < 0) return NaN;
  return parseInt(stats[idx] ?? '', 10);
};

const nhlPointsExtractor = (stats, labels) => {
  const gIdx = labels.indexOf('G');
  const aIdx = labels.indexOf('A');
  if (gIdx < 0) return NaN;
  const g = parseInt(stats[gIdx] ?? '', 10);
  const a = aIdx >= 0 ? parseInt(stats[aIdx] ?? '', 10) : 0;
  return (Number.isFinite(g) ? g : 0) + (Number.isFinite(a) ? a : 0);
};

async function enrichEspnGamelog(players, sport, league, extractor, currentField, lastField, lastSeason) {
  await Promise.all(
    players.map(async (player) => {
      if (!player.id) return;
      const tasks = [
        fetchGamelog(sport, league, player.id).then((d) => maxStat(d, extractor)).catch(() => 0),
        fetchGamelog(sport, league, player.id, lastSeason).then((d) => maxStat(d, extractor)).catch(() => 0),
      ];
      const [curMax, lastMax] = await Promise.all(tasks);
      if (curMax > 0) player[currentField] = curMax;
      if (lastMax > 0) player[lastField] = lastMax;
    }),
  );
}

export async function enrichNbaSeasonHighs(players) {
  await enrichEspnGamelog(players, 'basketball', 'nba', ptsExtractor, 'seasonHighPts', 'lastSeasonHighPts', LAST_SEASONS.NBA);
}

export async function enrichNhlSeasonHighs(players) {
  await enrichEspnGamelog(players, 'hockey', 'nhl', nhlPointsExtractor, 'seasonHighPoints', 'lastSeasonHighPoints', LAST_SEASONS.NHL);
}

export async function enrichNflSeasonHighs(players) {
  await Promise.all(
    players.map(async (player) => {
      if (!player.id) return;
      const pos = player.positionAbbr;
      let targetName = null;
      let curField = null;
      let lastField = null;
      if (pos === 'QB') {
        targetName = 'passingYards';
        curField = 'seasonHighPassingYards';
        lastField = 'lastSeasonHighPassingYards';
      } else if (pos === 'RB') {
        targetName = 'rushingYards';
        curField = 'seasonHighRushingYards';
        lastField = 'lastSeasonHighRushingYards';
      } else if (pos === 'WR' || pos === 'TE') {
        targetName = 'receivingYards';
        curField = 'seasonHighReceivingYards';
        lastField = 'lastSeasonHighReceivingYards';
      } else {
        return;
      }
      async function maxYards(season) {
        try {
          const data = await fetchGamelog('football', 'nfl', player.id, season);
          const names = data.names ?? [];
          const idx = names.indexOf(targetName);
          if (idx < 0) return 0;
          let max = 0;
          for (const stype of data.seasonTypes ?? []) {
            for (const cat of stype.categories ?? []) {
              for (const ev of cat.events ?? []) {
                const raw = ev.stats?.[idx];
                if (raw == null) continue;
                const v = parseFloat(String(raw).replace(/,/g, ''));
                if (Number.isFinite(v) && v > max) max = v;
              }
            }
          }
          return max;
        } catch {
          return 0;
        }
      }
      const [cur, last] = await Promise.all([maxYards(null), maxYards(LAST_SEASONS.NFL)]);
      if (cur > 0) player[curField] = cur;
      if (last > 0) player[lastField] = last;
    }),
  );
}
