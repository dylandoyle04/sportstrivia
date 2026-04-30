import { useEffect, useState } from 'react';
import { getDailyLeaderboard } from '../api/supabase';

function formatDuration(ms) {
  if (ms == null) return '—';
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  const r = s % 60;
  return m > 0 ? `${m}m ${r}s` : `${r}s`;
}

export default function DailyLeaderboard({ quizDate, highlightUserId, mode = 'overall' }) {
  const [rows, setRows] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    getDailyLeaderboard(quizDate, mode).then(({ data, error: err }) => {
      if (cancelled) return;
      if (err) setError(err.message);
      else setRows(data ?? []);
    });
    return () => { cancelled = true; };
  }, [quizDate, mode]);

  if (error) return <p className="auth-error">{error}</p>;
  if (!rows) return <p className="sub">Loading leaderboard…</p>;
  if (rows.length === 0) return <p className="sub">No scores yet. Be first.</p>;

  return (
    <div className="leaderboard">
      <h2 className="leaderboard-heading">Today's Leaderboard</h2>
      <ol className="leaderboard-list">
        {rows.map((r, i) => (
          <li
            key={r.user_id}
            className={r.user_id === highlightUserId ? 'leaderboard-row leaderboard-row--me' : 'leaderboard-row'}
          >
            <span className="leaderboard-rank">{i + 1}</span>
            <span className="leaderboard-name">{r.users?.display_name ?? '—'}</span>
            <span className="leaderboard-score">{r.score}/{r.total}</span>
            <span className="leaderboard-time">{formatDuration(r.duration_ms)}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}
