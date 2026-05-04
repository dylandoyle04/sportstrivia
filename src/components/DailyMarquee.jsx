import { useEffect, useState } from 'react';
import { getDailyLeaderboard } from '../api/supabase';
import { todayDateString } from '../questions/seededRandom';

export default function DailyMarquee() {
  const [leaderName, setLeaderName] = useState(null);

  useEffect(() => {
    let cancelled = false;
    getDailyLeaderboard(todayDateString()).then(({ data }) => {
      if (cancelled) return;
      const top = data?.[0];
      const name = top?.users?.display_name;
      if (name) setLeaderName(name);
    });
    return () => { cancelled = true; };
  }, []);

  const phrase = leaderName
    ? `DO YOU KNOW BALL?     TODAY'S TOP BALL KNOWER - ${leaderName.toUpperCase()}     `
    : 'DO YOU KNOW BALL?     ';

  const looped = phrase.repeat(3);

  return (
    <div className="marquee" aria-label={phrase}>
      <div className="marquee-track">
        <span className="marquee-text">{looped}</span>
        <span className="marquee-text" aria-hidden="true">{looped}</span>
      </div>
    </div>
  );
}
