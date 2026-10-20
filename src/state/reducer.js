// One reducer owns all shared customer/staff data. Every status change goes through canMove().
// The reducer is pure: randomness and timestamps arrive on the action (`now`, `room`, `line`).
import { isPeak, m } from "../lib/time.js";
import { makeLine } from "../lib/catalog.js";
import { STATUS as S, TYPE, canMove } from "../lib/status.js";
import { available, committed, consume, initialInventory, lineStockKey } from "../lib/inventory.js";
import { RUNNER_NAMES, RUNNER_STATUS, initialRunners } from "../lib/wait.js";
import { BASE_ROOM, ROOM, initialRooms } from "../lib/rooms.js";
import { freeRunner } from "./selectors.js";

export const initialState = (now) => ({
  day: "weekday", minutes: m(12), skew: 0,              // simulated clock (skew = fast-forward, ms)
  queue: [], nextId: 1,
  session: { activeId: null, assistId: null, reserveId: null }, // this tablet's open items
  rooms: initialRooms(now), myRoom: BASE_ROOM,
  inventory: initialInventory(),
  runners: initialRunners(),                            // [{ id, name, status, capacity }]
  autoPilot: { on: false, count: 0 },
  location: "inside",                                    // simulated geofence: "inside" | "outside"
  idleSec: 120,                                          // customer inactivity timeout, 0 = off
});

const find = (s, id) => s.queue.find((r) => r.id === id);
const patch = (s, id, p) => ({ ...s, queue: s.queue.map((r) => (r.id === id ? { ...r, ...p } : r)) });
const setRoom = (s, name, p) => ({ ...s, rooms: s.rooms.map((r) => (r.name === name ? { ...r, ...p } : r)) });
const clamp = (n, lo, hi) => Math.min(hi, Math.max(lo, n));
const dropSession = (s, id) => {
  const session = { ...s.session };
  for (const k of Object.keys(session)) if (session[k] === id) session[k] = null;
  return { ...s, session };
};
// Appends a request and returns [state, request]
const add = (s, a, req) => {
  const full = { id: s.nextId, mine: false, note: null, createdAt: a.now + s.skew, tag: a.tag ?? null, ...req };
  return [{ ...s, nextId: s.nextId + 1, queue: [...s.queue, full] }, full];
};

function core(s, a) {
  const t = a.now + s.skew;
  switch (a.type) {
    case "RESET":
      return initialState(a.now);
    case "SET":
      return { ...s, ...a.patch };
    case "FAST_FORWARD":
      return { ...s, skew: s.skew + 60000 };
    case "AUTOPILOT":
      return { ...s, autoPilot: { ...s.autoPilot, on: a.on } };
    case "SET_RUNNERS": {
      const n = clamp(a.n, 1, RUNNER_NAMES.length);
      return { ...s, runners: s.runners.map((r, i) => ({ ...r, status: i < n ? RUNNER_STATUS.ON : RUNNER_STATUS.OFF })) };
    }
    case "SET_STOCK":
      return { ...s, inventory: { ...s.inventory, [a.key]: Math.max(0, a.n) } };
    case "CLEAR":
      return { ...s, session: { ...s.session, [a.key]: null } };

    // Customer swap request. Lines without available stock are flagged out of stock immediately.
    case "CREATE_REQUEST": {
      const held = committed(s.queue);
      const items = a.items.map((l) => ({ ...l, oos: available(s.inventory, held, l) <= 0 }));
      const [next, req] = add(s, a, {
        type: TYPE.SIZE, mine: true, room: s.myRoom, items, peak: isPeak(s.day, s.minutes),
        status: items.some((i) => i.oos) ? S.OOS : S.PENDING,
      });
      return { ...next, session: { ...next.session, activeId: req.id } };
    }

    // Demo / Auto-Pilot request from another room
    case "SPAWN": {
      const line = { ...a.line, oos: available(s.inventory, committed(s.queue), a.line) <= 0 };
      const [next] = add(s, a, {
        type: TYPE.SIZE, room: a.room, items: [line], peak: isPeak(s.day, s.minutes),
        status: line.oos ? S.OOS : S.PENDING,
      });
      return a.auto ? { ...next, autoPilot: { ...next.autoPilot, count: next.autoPilot.count + 1 } } : next;
    }

    case "CREATE_ASSIST": {
      const [next, req] = add(s, a, { type: TYPE.ASSIST, mine: true, room: s.myRoom, reason: a.reason, status: S.PENDING });
      return { ...next, session: { ...next.session, assistId: req.id } };
    }

    // Reserve items for the customer's next room. The room is held; this tablet's room never changes.
    case "RESERVE": {
      const room = s.rooms.find((r) => r.status === ROOM.AVAILABLE);
      const held = committed(s.queue);
      if (!room || !a.items.length || a.items.some((l) => available(s.inventory, held, l) <= 0)) return s;
      const [next, req] = add(s, a, {
        type: TYPE.RESERVE, mine: true, room: room.name, items: a.items.map((l) => ({ ...l, oos: false })), status: S.PENDING,
      });
      return { ...setRoom(next, room.name, { status: ROOM.RESERVED, since: t }), session: { ...next.session, reserveId: req.id } };
    }

    // Size orders are auto-assigned a runner when created (see assignRunners), so claiming just confirms it.
    // An order still waiting for a free runner cannot be claimed. Assistance is simply acknowledged.
    case "CLAIM": {
      const r = find(s, a.id);
      if (!r || !canMove(r.type, r.status, S.CLAIMED)) return s;
      if (r.type !== TYPE.SIZE) return patch(s, r.id, { status: S.CLAIMED });
      return r.runner ? patch(s, r.id, { status: S.CLAIMED, claimedAt: t }) : s;
    }

    case "MOVE": {
      const r = find(s, a.id);
      if (!r || !canMove(r.type, r.status, a.to)) return s;
      if (r.type === TYPE.SIZE && a.to === S.CLAIMED) return s; // size orders go through CLAIM
      let next = patch(s, r.id, { status: a.to, ...(a.to === S.DELIVERED ? { deliveredAt: t } : {}) });
      // Stock leaves the shelf when the items are delivered (or staged in the reserved room)
      if (a.to === S.DELIVERED || a.to === S.STAGED) next = { ...next, inventory: consume(next.inventory, r.items) };
      if (r.type === TYPE.RESERVE && a.to === S.ARRIVED) next = setRoom(next, r.room, { status: ROOM.OCCUPIED, since: t });
      if (r.type === TYPE.RESERVE && a.to === S.CANCELLED) next = setRoom(next, r.room, { status: ROOM.AVAILABLE, since: null });
      if (a.to === S.CANCELLED || a.to === S.CLOSED) next = dropSession(next, r.id);
      return next;
    }

    // Staff found the item missing in the backroom: stock goes to zero and the customer is alerted
    case "FLAG_OOS": {
      const r = find(s, a.id);
      const it = r && r.items?.find((i) => i.key === a.key);
      if (!it || r.type !== TYPE.SIZE || !canMove(r.type, r.status, S.OOS)) return s;
      const items = r.items.map((i) => (i.key === a.key ? { ...i, oos: true } : i));
      return {
        ...patch(s, r.id, { status: S.OOS, items, runner: null }),
        inventory: { ...s.inventory, [lineStockKey(it)]: 0 },
      };
    }

    // Customer swaps an unavailable line for an in-stock alternative
    case "RESOLVE_ITEM": {
      const r = find(s, a.id);
      const old = r && r.items?.find((i) => i.key === a.key);
      if (!old || r.type !== TYPE.SIZE || r.status !== S.OOS) return s;
      const line = makeLine(a.patch.category ?? old.category, a.patch.sub ?? old.sub, a.patch.size ?? old.size);
      line.oos = available(s.inventory, committed(s.queue), line) <= 0;
      const items = r.items.map((i) => (i.key === a.key ? line : i));
      const stillOos = items.some((i) => i.oos);
      return patch(s, r.id, {
        items, note: a.patch.note ?? null,
        status: stillOos ? S.OOS : S.PENDING,
        createdAt: stillOos ? r.createdAt : t,
      });
    }

    case "TOGGLE_ROOM":
      return {
        ...s,
        rooms: s.rooms.map((r) => {
          if (r.name !== a.name || r.status === ROOM.RESERVED || r.name === s.myRoom) return r;
          return r.status === ROOM.AVAILABLE ? { ...r, status: ROOM.OCCUPIED, since: t } : { ...r, status: ROOM.AVAILABLE, since: null };
        }),
      };

    default:
      return s;
  }
}

// Give every unassigned pending order to the eligible runner with the lowest workload, oldest order first.
// Runs after every action, so a runner freeing up (delivery, cancel, shift change) picks up waiting orders.
function assignRunners(s) {
  let next = s;
  const waiting = s.queue
    .filter((r) => r.type === TYPE.SIZE && r.status === S.PENDING && !r.runner)
    .sort((a, b) => a.createdAt - b.createdAt);
  for (const r of waiting) {
    const runner = freeRunner(next);
    if (!runner) break;
    next = patch(next, r.id, { runner: runner.name });
  }
  return next;
}

export function reducer(s, a) {
  if (a.type === "REPLACE") return a.state; // full state from another tab
  const next = core(s, a);
  return next === s ? s : assignRunners(next);
}
