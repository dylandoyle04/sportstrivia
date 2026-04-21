import { useEffect, useState } from 'react';
import { getCollegeScores } from '../api/supabase';

function bestPerUser(rows) {
  const seen = new Set();
  const result = [];
  for (const r of rows) {
    if (seen.has(r.user_id)) continue;
    seen.add(r.user_id);
    result.push({
      userId: r.user_id,
      name: r.users?.display_name ?? '—',
      score: r.score,
      attempted: r.attempted,
      league: r.league,
    });
  }
  return result;
}

export default function CollegeLeaderboard({ highlightUserId }) {
  const [rows, setRows] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    getCollegeScores().then(({ data, error: err }) => {
      if (cancelled) return;
      if (err) setError(err.message);
      else setRows(bestPerUser(data ?? []));
    });
    return () => { cancelled = true; };
  }, []);

  if (error) return <p className="auth-error">{error}</p>;
  if (!rows) return <p className="sub">Loading leaderboard…</p>;
  if (rows.length === 0) return <p className="sub">No scores yet. Be first.</p>;

  return (
    <div className="leaderboard">
      <h2 className="leaderboard-heading">College Mode — Top Scores</h2>
      <ol className="leaderboard-list">
        {rows.map((r, i) => (
          <li
            key={r.userId}
            className={r.userId === highlightUserId ? 'leaderboard-row leaderboard-row--me' : 'leaderboard-row'}
          >
            <span className="leaderboard-rank">{i + 1}</span>
            <span className="leaderboard-name">{r.name}</span>
            <span className="leaderboard-score">{r.score}</span>
            <span className="leaderboard-time">{r.league}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}
