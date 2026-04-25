const MODES = [
  { key: 'college', title: 'College Mode', desc: '60 seconds. Guess colleges. Unlimited attempts.' },
  { key: 'league', title: 'League Trivia', desc: 'Pick a league. 10 questions. No timer.' },
  { key: 'free-play', title: 'Free Play', desc: 'Pick any team. No timer.' },
];

export default function OtherModes({ onSelect, onBack }) {
  return (
    <div className="home">
      <button className="back-btn" onClick={onBack}>← Home</button>
      <h1>Other Modes</h1>
      <p className="sub">Pick a mode.</p>
      <div className="mode-grid">
        {MODES.map((mode) => (
          <button
            key={mode.key}
            className="mode-card"
            onClick={() => onSelect(mode.key)}
          >
            <span className="mode-card-title">{mode.title}</span>
            <span className="mode-card-desc">{mode.desc}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
