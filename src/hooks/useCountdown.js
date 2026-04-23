import { useCallback, useEffect, useRef, useState } from 'react';

export function useCountdown({ seconds, resetKey, active = true, onExpire }) {
  const [remaining, setRemaining] = useState(seconds);
  const onExpireRef = useRef(onExpire);
  onExpireRef.current = onExpire;

  useEffect(() => {
    setRemaining(seconds);
  }, [seconds, resetKey]);

  useEffect(() => {
    if (!active) return undefined;
    const id = setInterval(() => {
      setRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(id);
          onExpireRef.current?.();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [active, resetKey, seconds]);

  const addTime = useCallback((delta) => {
    setRemaining((prev) => Math.max(0, prev + delta));
  }, []);

  return { remaining, addTime };
}
