import { useEffect, useRef, useState } from "react";

// Calls onTimeout after `seconds` without touch / pointer / key activity.
// Returns the seconds left once inside the final `warnSeconds`, otherwise null.
export function useIdle({ seconds, enabled, onTimeout, warnSeconds = 10 }) {
  const [left, setLeft] = useState(null);
  const last = useRef(Date.now());
  const cb = useRef(onTimeout);
  cb.current = onTimeout;

  useEffect(() => {
    if (!enabled || !seconds) { setLeft(null); return undefined; }
    last.current = Date.now();
    const bump = () => { last.current = Date.now(); };
    const events = ["pointerdown", "keydown", "touchstart", "wheel"];
    events.forEach((e) => window.addEventListener(e, bump, true));
    const id = setInterval(() => {
      const remaining = Math.ceil(seconds - (Date.now() - last.current) / 1000);
      if (remaining <= 0) { last.current = Date.now(); setLeft(null); cb.current(); }
      else setLeft(remaining <= Math.min(warnSeconds, seconds - 1) ? remaining : null);
    }, 1000);
    return () => {
      clearInterval(id);
      events.forEach((e) => window.removeEventListener(e, bump, true));
      setLeft(null);
    };
  }, [enabled, seconds, warnSeconds]);

  return left;
}
