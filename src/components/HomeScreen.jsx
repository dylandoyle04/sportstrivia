const MODES = [
  { key: 'daily', title: 'Daily Trivia', desc: '9 questions. One shot a day.' },
  { key: 'group', title: 'Group', desc: 'Play with your friend group.' },
  { key: 'leaderboard', title: 'Leaderboard', desc: 'Daily and group rankings.' },
  { key: 'other', title: 'Other Modes', desc: 'College mode and more.' },
];

export default function HomeScreen({ onSelect }) {
  return (
    <div className="home">
      <h1>Super Fan</h1>
      <p className="sub">Choose your game mode.</p>
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
