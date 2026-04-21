export default function Timer({ remaining, total, label = 'TIME' }) {
  const pct = Math.max(0, Math.min(100, (remaining / total) * 100));
  const ratio = total > 0 ? remaining / total : 0;
  const state = ratio <= 0.15 ? 'danger' : ratio <= 0.4 ? 'warn' : 'ok';

  return (
    <div className={`timer timer--${state}`}>
      <div className="timer-row">
        <span className="timer-label">{label}</span>
        <span className="timer-value">{remaining}</span>
      </div>
      <div className="timer-bar">
        <div className="timer-bar-fill" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
