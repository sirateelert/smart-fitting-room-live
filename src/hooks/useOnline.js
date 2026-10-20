import { useEffect, useState } from "react";

// Browser connectivity. (The Demo Controls "offline" switch is combined with this in App.)
export function useOnline() {
  const [online, setOnline] = useState(typeof navigator === "undefined" || navigator.onLine !== false);
  useEffect(() => {
    const up = () => setOnline(true);
    const down = () => setOnline(false);
    window.addEventListener("online", up);
    window.addEventListener("offline", down);
    return () => { window.removeEventListener("online", up); window.removeEventListener("offline", down); };
  }, []);
  return online;
}
