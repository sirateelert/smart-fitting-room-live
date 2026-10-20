import React from "react";
import { ROOM, ROOM_COUNT, minsText } from "../lib/rooms.js";
import { cap } from "./ui.jsx";

const TONE = {
  [ROOM.AVAILABLE]: ["border-ok bg-ok/10", "bg-ok", "text-green-700", "Available"],
  [ROOM.OCCUPIED]: ["border-alert bg-alert/10", "bg-alert", "text-red-700", "Occupied"],
  [ROOM.RESERVED]: ["border-hold bg-hold/10", "bg-hold", "text-yellow-700", "Reserved"],
};

export default function RoomsModal({ s, act, clock, onClose }) {
  const count = (st) => s.rooms.filter((r) => r.status === st).length;
  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4" onClick={onClose}>
      <div
        role="dialog" aria-modal="true" aria-label="Fitting rooms status"
        className="bg-white w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-ink p-6 space-y-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className={cap}>Fitting Rooms Status ({ROOM_COUNT} Rooms)</p>
            <p className="text-base text-mute mt-2">
              {count(ROOM.AVAILABLE)} available · {count(ROOM.OCCUPIED)} occupied
              {count(ROOM.RESERVED) > 0 && ` · ${count(ROOM.RESERVED)} reserved`}
            </p>
          </div>
          <button onClick={onClose} className={`min-h-[44px] px-2 ${cap} underline underline-offset-4`}>Close</button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {s.rooms.map((room) => {
            const tone = TONE[room.status];
            const elapsed = room.since != null ? minsText(clock - room.since) : null;
            const locked = room.status === ROOM.RESERVED || room.name === s.myRoom;
            return (
              <button
                key={room.name}
                onClick={() => act({ type: "TOGGLE_ROOM", name: room.name })}
                disabled={locked}
                className={`text-left border p-4 space-y-3 min-h-[44px] ${tone[0]} ${locked ? "cursor-default" : "hover:brightness-95"}`}
              >
                <div className="flex items-center justify-between">
                  <p className="text-base font-medium">{room.name}</p>
                  <span className={`h-2.5 w-2.5 rounded-full ${tone[1]}`} />
                </div>
                <p className={`${cap} ${tone[2]}`}>{tone[3]}</p>
                <p className="text-base text-ink">
                  {room.status === ROOM.AVAILABLE && "Ready for the next customer"}
                  {room.status === ROOM.OCCUPIED && `Occupied for ${elapsed}`}
                  {room.status === ROOM.RESERVED && `Held for ${elapsed}`}
                </p>
                {room.name === s.myRoom && <p className={`${cap} text-mute`}>You are here</p>}
              </button>
            );
          })}
        </div>
        <p className="text-xs text-mute">Tap a room to flip it between available and occupied.</p>
      </div>
    </div>
  );
}
