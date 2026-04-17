function gradeMessage(pct) {
  if (pct === 100) return 'Perfect. You know your stuff.';
  if (pct >= 80) return 'Strong showing.';
  if (pct >= 60) return 'Not bad.';
  if (pct >= 40) return 'Room to grow.';
  return 'Tough round. Run it back.';
}

export default function ScoreScreen({ team, score, total, onReplay, onPickNew }) {
  const pct = total > 0 ? Math.round((score / total) * 100) : 0;
  return (
    <div className="score">
      <p className="score-team">{team.name}</p>
      <div className="score-number">
        <span className="score-value">{score}</span>
        <span className="score-total">/ {total}</span>
      </div>
      <p className="score-pct">{pct}% accuracy</p>
      <p className="score-message">{gradeMessage(pct)}</p>
      <div className="score-actions">
        <button className="btn-primary" onClick={onReplay}>
          Play again with {team.name}
        </button>
        <button className="btn-secondary" onClick={onPickNew}>
          Pick another team
        </button>
      </div>
    </div>
  );
}
