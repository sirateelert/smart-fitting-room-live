import { isPeak } from "../lib/time.js";
import { IN_FLIGHT, SLA_TARGET_MS, STATUS as S, TYPE, isActive } from "../lib/status.js";
import { RUNNER_STATUS, estimateWait } from "../lib/wait.js";

export const activeQueue = (s) => s.queue.filter(isActive).sort((a, b) => a.createdAt - b.createdAt);
export const recentQueue = (s) => s.queue.filter((r) => !isActive(r)).slice().reverse().slice(0, 6);

// Every runner with the orders they currently hold (assigned, claimed or out for delivery)
export const runnerList = (s) =>
  s.runners.map((r) => ({
    ...r,
    activeLoad: s.queue.filter((q) => q.type === TYPE.SIZE && q.runner === r.name && IN_FLIGHT.includes(q.status)).length,
  }));

// Runner who should take the next order: on shift, below capacity, lowest workload (roster order breaks ties)
export const freeRunner = (s) =>
  runnerList(s)
    .filter((r) => r.status === RUNNER_STATUS.ON && r.activeLoad < r.capacity)
    .sort((a, b) => a.activeLoad - b.activeLoad)[0] || null;

// Orders in front of `req`; with no `req`, every order currently in flight (i.e. a request about to be made)
export const ordersAhead = (s, req) =>
  s.queue.filter(
    (r) => r.type === TYPE.SIZE && r !== req && IN_FLIGHT.includes(r.status) && (!req || r.createdAt <= req.createdAt)
  ).length;

// Live estimate. Recomputed on every render, so Auto-Pilot traffic, runner changes and peak hours all move it.
export const estimateFor = (s, req, items = 1) =>
  estimateWait({
    peak: req ? req.peak : isPeak(s.day, s.minutes),
    ahead: req && req.status !== S.PENDING ? 0 : ordersAhead(s, req),
    runners: s.runners,
    items: req ? req.items.length : items,
  });

// Business metrics from real request history. Delivered orders give fulfilment time; open orders already past
// the target also count as breaches. Cancelled / closed requests are ignored. Empty groups return null.
export function metrics(s, clock) {
  const avg = (xs) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null);
  const size = s.queue.filter((r) => r.type === TYPE.SIZE);
  const delivered = size.filter((r) => r.status === S.DELIVERED && r.deliveredAt != null);
  const open = size.filter((r) => IN_FLIGHT.includes(r.status));
  const waits = delivered.map((r) => r.deliveredAt - r.createdAt);
  const total = delivered.length + open.length;
  const breached = waits.filter((w) => w > SLA_TARGET_MS).length + open.filter((r) => clock - r.createdAt > SLA_TARGET_MS).length;
  const byPeak = (flag) => delivered.filter((r) => !!r.peak === flag).map((r) => r.deliveredAt - r.createdAt);
  return {
    delivered: delivered.length,
    avgMs: avg(waits),
    breachPct: total ? Math.round((breached / total) * 100) : null,
    peakMs: avg(byPeak(true)), peakN: byPeak(true).length,
    normalMs: avg(byPeak(false)), normalN: byPeak(false).length,
  };
}
