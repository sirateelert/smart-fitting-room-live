import React, { useState } from "react";
import { STATUS as S } from "../../lib/status.js";
import { CATALOG, MAX_ITEMS, skuFor, toggleLine } from "../../lib/catalog.js";
import { available, committed } from "../../lib/inventory.js";
import { ROOM } from "../../lib/rooms.js";
import { useT } from "../../lib/i18n.js";
import { ActionButton, BasketList, Picker, TextButton, cap } from "../ui.jsx";

// "Items staged for your next room": reserve from the phone, staff stage the items, you collect them on arrival.
// The tablet's own room never changes. Geofence (inside / outside the mall) is set from Demo Controls.
export default function Reservation({ s, reservation, online, act, onPreDirty }) {
  const { t } = useT();
  const [cat, setCat] = useState(null);
  const [sub, setSub] = useState(null);
  const [lines, setLines] = useState([]);
  const live = reservation && (reservation.status === S.PENDING || reservation.status === S.STAGED);
  const arrived = reservation && reservation.status === S.ARRIVED;
  const freeRoom = s.rooms.find((r) => r.status === ROOM.AVAILABLE);
  const held = committed(s.queue);
  const isOut = (sz) => cat && sub && available(s.inventory, held, { sku: skuFor(cat.name, sub), size: sz }) <= 0;
  const soldOut = lines.filter((l) => available(s.inventory, held, l) <= 0);
  const canReserve = online && lines.length > 0 && freeRoom && soldOut.length === 0;

  const update = (next) => { setLines(next); onPreDirty?.(next.length > 0); };
  const reserve = () => {
    act({ type: "RESERVE", items: lines });
    setLines([]); setCat(null); setSub(null); onPreDirty?.(false);
  };

  return (
    <section id="sec-presel" className="border border-line p-5 space-y-6">
      <div>
        <p className={cap}>Reserve for your next room</p>
        <p className="text-sm text-mute mt-2">Choose garments from your phone and we stage them in a free cubicle before you arrive.</p>
      </div>

      {live && (
        <div className="border border-ink p-5 space-y-4">
          <p className={`${cap} text-mute`}>Items staged for your next room · {reservation.room}</p>
          <BasketList lines={reservation.items} />
          <p className="text-base text-mute">
            {reservation.status === S.PENDING
              ? `Staff are staging your items in ${reservation.room}.`
              : `Your items are waiting in ${reservation.room}. Show this screen to staff when you arrive.`}
          </p>
          <TextButton onClick={() => act({ type: "MOVE", id: reservation.id, to: S.CANCELLED })}>Cancel reservation</TextButton>
        </div>
      )}

      {arrived && <p className="text-base border-l-2 border-ink pl-3">You have entered {reservation.room}. Enjoy your fitting.</p>}

      {!live && s.location === "outside" && (
        <div role="alert" className="border-l-2 border-alert pl-3 text-base space-y-1">
          <p className="font-medium">Location restriction</p>
          <p className="text-mute">Reservations are only available inside CentralWorld Mall. Please come inside to reserve garments.</p>
        </div>
      )}

      {!live && s.location === "inside" && (
        <div className="space-y-8">
          <Picker
            category={cat} sub={sub} catalog={CATALOG} max={MAX_ITEMS} lines={lines} isOut={isOut}
            onCategory={(c) => { if (cat?.name !== c.name) { setCat(c); setSub(null); } }}
            onSub={setSub}
            onToggleSize={(sz) => update(toggleLine(lines, cat.name, sub, sz, MAX_ITEMS))}
          />
          {lines.length > 0 && (
            <div>
              <p className={`${cap} text-mute mb-3`}>To reserve · {lines.length}/{MAX_ITEMS}</p>
              <BasketList lines={lines} onRemove={(key) => update(lines.filter((x) => x.key !== key))} />
            </div>
          )}
          <div className="space-y-3">
            <ActionButton onClick={reserve} disabled={!canReserve}>{t("act.reserve")}</ActionButton>
            <p className={`${cap} text-mute text-center`}>
              {!online ? "Offline. Reconnect to reserve."
                : soldOut.length ? "Remove sold-out items to continue"
                : freeRoom ? `Next available cubicle: ${freeRoom.name}` : "All fitting rooms are in use right now"}
            </p>
          </div>
        </div>
      )}
    </section>
  );
}
