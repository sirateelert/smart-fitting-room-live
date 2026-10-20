import { useEffect, useRef } from "react";

// Mirrors a state object between tabs of the same origin.
//  - Local changes are posted as the full state (last write wins).
//  - A remote state is handed to `onRemote`, which must store that exact object. Because the effect below skips
//    the object it just received, applying a remote state never posts it back (no echo loops).
//  - A new tab says "hello"; any open tab answers with its current state.
export function useBroadcastChannel(name, state, onRemote) {
  const channel = useRef(null);
  const self = useRef(Math.random().toString(36).slice(2));
  const latest = useRef(state);
  latest.current = state;
  const callback = useRef(onRemote);
  callback.current = onRemote;
  const initial = useRef(state);   // never broadcast the untouched starting state
  const received = useRef(null);   // last state applied from another tab

  useEffect(() => {
    if (typeof BroadcastChannel === "undefined") return undefined;
    const ch = new BroadcastChannel(name);
    channel.current = ch;
    ch.onmessage = (e) => {
      const msg = e.data;
      if (!msg || msg.from === self.current) return;
      if (msg.kind === "hello") ch.postMessage({ kind: "state", from: self.current, state: latest.current });
      else if (msg.kind === "state" && msg.state) { received.current = msg.state; callback.current(msg.state); }
    };
    ch.postMessage({ kind: "hello", from: self.current });
    return () => { ch.onmessage = null; ch.close(); channel.current = null; };
  }, [name]);

  useEffect(() => {
    if (!channel.current || state === initial.current || state === received.current) return;
    channel.current.postMessage({ kind: "state", from: self.current, state });
  }, [state]);
}
