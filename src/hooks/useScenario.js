import { useCallback, useEffect, useRef, useState } from "react";
import { SCENARIOS } from "../lib/scenarios.js";

// Plays a scripted visitor with fixed timers. `onStart` must reset the app to a clean baseline first.
export function useScenario({ state, act, onStart }) {
  const timers = useRef([]);
  const latest = useRef(state);
  latest.current = state;
  const [active, setActive] = useState(null);

  const cancel = useCallback(() => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
    setActive(null);
  }, []);
  useEffect(() => cancel, [cancel]);

  const run = useCallback((id) => {
    cancel();
    onStart();
    const steps = SCENARIOS[id];
    if (!steps) return;
    setActive(id);
    steps.forEach((step) => {
      timers.current.push(setTimeout(() => {
        const action = { ...step.do };
        if (step.tag) action.tag = step.tag;
        if (step.on) {
          const req = latest.current.queue.find((r) => r.tag === step.on);
          if (!req) return; // target was cancelled or the state was reset
          action.id = req.id;
        }
        act(action);
      }, step.at));
    });
    const end = Math.max(...steps.map((s) => s.at)) + 300;
    timers.current.push(setTimeout(() => setActive(null), end));
  }, [act, cancel, onStart]);

  return { run, cancel, active };
}
