// Single source of truth for request types, statuses and which status moves are legal.
// The string values are unchanged from the single-file prototype.

export const TYPE = { SIZE: "size", ASSIST: "assist", RESERVE: "reserve" };

export const STATUS = {
  PENDING: "pending",
  CLAIMED: "accepted",       // claimed by a runner (assistance: acknowledged)
  DELIVERING: "delivering",
  DELIVERED: "delivered",
  OOS: "oos",                // waiting for the customer to pick an alternative
  CANCELLED: "cancelled",
  CLOSED: "closed",
  RESOLVED: "resolved",      // assistance finished
  STAGED: "ready",           // reservation: items staged for the customer's next room
  ARRIVED: "entered",        // reservation: customer reached the room
};
const S = STATUS;

// Allowed moves per request type. The reducer refuses anything not listed here.
export const TRANSITIONS = {
  [TYPE.SIZE]: {
    [S.PENDING]: [S.CLAIMED, S.OOS, S.CANCELLED],
    [S.CLAIMED]: [S.DELIVERING, S.DELIVERED, S.OOS, S.CANCELLED],
    [S.DELIVERING]: [S.DELIVERED],
    [S.OOS]: [S.PENDING, S.CANCELLED, S.CLOSED],
  },
  [TYPE.ASSIST]: {
    [S.PENDING]: [S.CLAIMED, S.CANCELLED],
    [S.CLAIMED]: [S.RESOLVED, S.CANCELLED],
  },
  [TYPE.RESERVE]: {
    [S.PENDING]: [S.STAGED, S.CANCELLED],
    [S.STAGED]: [S.ARRIVED, S.CANCELLED],
  },
};
export const canMove = (type, from, to) => TRANSITIONS[type]?.[from]?.includes(to) ?? false;

// Statuses that still need someone's attention (shown in the staff queue)
export const ACTIVE = [S.PENDING, S.CLAIMED, S.DELIVERING, S.OOS, S.STAGED];
export const isActive = (r) => ACTIVE.includes(r.status);
// Size requests that occupy the floor team and hold stock until delivery
export const IN_FLIGHT = [S.PENDING, S.CLAIMED, S.DELIVERING];

export const STATUS_LABEL = {
  [S.PENDING]: "Pending", [S.CLAIMED]: "Claimed by Runner", [S.DELIVERING]: "Out for delivery",
  [S.DELIVERED]: "Delivered", [S.OOS]: "Out of stock", [S.CANCELLED]: "Cancelled", [S.CLOSED]: "Closed",
  [S.RESOLVED]: "Resolved", [S.STAGED]: "Staged", [S.ARRIVED]: "Arrived",
};
export const CUSTOMER_LABEL = {
  [S.PENDING]: "Received", [S.CLAIMED]: "Preparing", [S.DELIVERING]: "On the way", [S.DELIVERED]: "Delivered",
};
export const STEPS = [[S.PENDING, "Request received"], [S.CLAIMED, "Preparing your item"], [S.DELIVERING, "On the way"]];
export const STEP_INDEX = { [S.PENDING]: 0, [S.CLAIMED]: 1, [S.DELIVERING]: 2, [S.DELIVERED]: 2 };

export const statusText = (r) =>
  r.type === TYPE.ASSIST && r.status === S.CLAIMED ? "Acknowledged"
  : r.status === S.CLAIMED && r.runner ? `${STATUS_LABEL[S.CLAIMED]} · ${r.runner}`
  : STATUS_LABEL[r.status];

export const summary = (r) =>
  r.type === TYPE.ASSIST
    ? `Assistance: ${r.reason}`
    : `${r.type === TYPE.RESERVE ? "Reserve: " : ""}${r.items.map((i) => `${i.category} (${i.sub}) ${i.size}`).join(", ")}`;

// ---- SLA: green under 3 min, yellow from 3 to 5 min, red once a request has waited over 5 min ----
const WARN_MS = 3 * 60 * 1000;
const CRIT_MS = 5 * 60 * 1000;
export const sla = (wait) => (wait > CRIT_MS ? "alert" : wait >= WARN_MS ? "hold" : "ok");
export const SLA_STYLE = {
  ok: { border: "border-ok", text: "text-ok", label: "On track" },
  hold: { border: "border-hold", text: "text-hold", label: "At risk" },
  alert: { border: "border-alert", text: "text-alert", label: "SLA breached" },
};

// 01m 12s
export const waitFmt = (ms) => {
  const s = Math.max(0, Math.floor(ms / 1000));
  return `${String(Math.floor(s / 60)).padStart(2, "0")}m ${String(s % 60).padStart(2, "0")}s`;
};

// Business-metric target: a request should be fulfilled within 4 minutes (the card colours above use 3 / 5 min)
export const SLA_TARGET_MS = 4 * 60 * 1000;
// 1m 12s, or 45s; "-" when there is no data
export const durFmt = (ms) => {
  if (ms == null) return "–";
  const s = Math.round(ms / 1000);
  return s < 60 ? `${s}s` : `${Math.floor(s / 60)}m ${String(s % 60).padStart(2, "0")}s`;
};
