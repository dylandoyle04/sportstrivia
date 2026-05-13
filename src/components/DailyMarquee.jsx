import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { getDailyLeaderboard } from '../api/supabase';
import { todayDateString } from '../questions/seededRandom';

const SEPARATOR = '  •  ';
const PIXELS_PER_SECOND = 80;

export default function DailyMarquee() {
  const [leaderName, setLeaderName] = useState(null);
  const [shiftPx, setShiftPx] = useState(0);
  const firstSpanRef = useRef(null);

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
    ? `DO YOU KNOW BALL?${SEPARATOR}TODAY'S TOP BALL KNOWER - ${leaderName.toUpperCase()} (LEADER IN ACCURACY OF DAILY TRIVIA)${SEPARATOR}`
    : `DO YOU KNOW BALL?${SEPARATOR}`;

  const looped = phrase.repeat(3);

  useLayoutEffect(() => {
    const node = firstSpanRef.current;
    if (!node) return;

    let raf = 0;
    const measure = () => {
      const w = node.getBoundingClientRect().width;
      if (w > 0) setShiftPx(w);
    };

    measure();
    // Re-measure once fonts are ready (Press Start 2P loads async on mobile,
    // and the pre-load width is what breaks the seamless wrap).
    if (document.fonts?.ready) {
      document.fonts.ready.then(() => {
        raf = requestAnimationFrame(measure);
      });
    }

    const ro = new ResizeObserver(() => {
      raf = requestAnimationFrame(measure);
    });
    ro.observe(node);

    return () => {
      ro.disconnect();
      if (raf) cancelAnimationFrame(raf);
    };
  }, [looped]);

  const duration = shiftPx > 0 ? shiftPx / PIXELS_PER_SECOND : 30;
  const style = shiftPx > 0
    ? { '--marquee-shift': `${shiftPx}px`, '--marquee-duration': `${duration}s` }
    : { visibility: 'hidden' };

  return (
    <div className="marquee" aria-label={phrase}>
      <div className="marquee-track" style={style}>
        <span ref={firstSpanRef} className="marquee-text">{looped}</span>
        <span className="marquee-text" aria-hidden="true">{looped}</span>
      </div>
    </div>
  );
}
