import DailyMarquee from './DailyMarquee';

const MODES = [
  { key: 'daily', title: 'Daily Trivia', desc: '9 questions. One shot a day.' },
  { key: 'last-night', title: 'Last Night', desc: 'Yesterday\'s games. One shot a day.' },
  { key: 'group', title: 'Group', desc: 'Play with your friend group.' },
  { key: 'leaderboard', title: 'Leaderboard', desc: 'Daily and group rankings.' },
  { key: 'other', title: 'Other Modes', desc: 'College mode and more.' },
];

export default function HomeScreen({ onSelect }) {
  return (
    <div className="home">
      <div className="home-spline">
        <iframe
          src="https://my.spline.design/spaceball-gqeZYnVEu6uYYOAqAr1RMz35/"
          title="Space Baseball"
          frameBorder="0"
          loading="lazy"
          allow="autoplay; fullscreen"
        />
      </div>
      <img src="/logo.png" alt="You Know Ball?" className="home-logo" />
      <DailyMarquee />
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
