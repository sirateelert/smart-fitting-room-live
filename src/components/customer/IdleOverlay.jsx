import React from "react";
import { cap } from "../ui.jsx";

// Warns before the tablet clears an unfinished selection. Any touch (handled by useIdle) keeps the session.
export default function IdleOverlay({ left }) {
  if (left == null) return null;
  return (
    <div className="absolute inset-0 z-30 bg-white/90 flex items-center justify-center p-6" role="alertdialog" aria-live="assertive">
      <div className="border border-ink bg-white p-8 text-center space-y-3 max-w-sm">
        <p className={cap}>Still there?</p>
        <p className="text-xl font-light">Your selection will clear in {left}s.</p>
        <p className="text-base text-mute">Tap anywhere to keep going.</p>
      </div>
    </div>
  );
}
