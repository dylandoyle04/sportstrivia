import { useEffect, useState } from 'react';
import { getGroupScores } from '../api/supabase';

function aggregate(rows) {
  const byUser = new Map();
  for (const r of rows) {
    const uid = r.user_id;
    const name = r.users?.display_name ?? '—';
    const existing = byUser.get(uid) ?? { userId: uid, name, total: 0, plays: 0, correctOfMax: 0 };
    existing.total += r.score;
    existing.correctOfMax += r.total;
    existing.plays += 1;
    byUser.set(uid, existing);
  }
  return [...byUser.values()].sort((a, b) => {
    if (b.total !== a.total) return b.total - a.total;
    return a.plays - b.plays;
  });
}

export default function GroupLeaderboard({ groupId, highlightUserId }) {
  const [rows, setRows] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    getGroupScores(groupId).then(({ data, error: err }) => {
      if (cancelled) return;
      if (err) setError(err.message);
      else setRows(aggregate(data ?? []));
    });
    return () => { cancelled = true; };
  }, [groupId]);

  if (error) return <p className="auth-error">{error}</p>;
  if (!rows) return <p className="sub">Loading leaderboard…</p>;
  if (rows.length === 0) return <p className="sub">No plays yet. Be first.</p>;

  return (
    <div className="leaderboard">
      <h2 className="leaderboard-heading">All-Time Standings</h2>
      <ol className="leaderboard-list">
        {rows.map((r, i) => (
          <li
            key={r.userId}
            className={r.userId === highlightUserId ? 'leaderboard-row leaderboard-row--me' : 'leaderboard-row'}
          >
            <span className="leaderboard-rank">{i + 1}</span>
            <span className="leaderboard-name">{r.name}</span>
            <span className="leaderboard-score">{r.total}/{r.correctOfMax}</span>
            <span className="leaderboard-time">{r.plays} {r.plays === 1 ? 'play' : 'plays'}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}
