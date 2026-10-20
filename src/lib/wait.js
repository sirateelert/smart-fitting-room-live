// Deterministic wait estimate. Inputs: queue length ahead, runners on shift x capacity, peak vs normal.
//
//   slots   = sum of capacity over runners on shift (orders the floor team can carry at once)
//   rounds  = ceil((ahead + 1) / slots)          how many carrying rounds until this order is served
//   minutes = rounds x service time              1.5 min normal, 2.5 min peak, +0.5 min per extra item
//   range   = 0.8x to 1.2x of that, rounded outwards
//
// Empty store, normal hours -> "1-2 min". Peak with 6 orders ahead and 3 runners -> "4-6 min".

export const RUNNER_NAMES = ["Nok", "Beam", "Ploy", "Tan", "Mint", "Ice"];
export const RUNNER_CAPACITY = 2;
export const DEFAULT_RUNNERS_ON_SHIFT = 3;

// Runners are explicit objects: { id, name, status: "on" | "off", capacity }. activeLoad is derived from the queue
// (see runnerList in selectors.js) so it can never drift from the real requests.
export const RUNNER_STATUS = { ON: "on", OFF: "off" };
export const initialRunners = (onShift = DEFAULT_RUNNERS_ON_SHIFT) =>
  RUNNER_NAMES.map((name, i) => ({
    id: `runner-${i + 1}`, name, status: i < onShift ? RUNNER_STATUS.ON : RUNNER_STATUS.OFF, capacity: RUNNER_CAPACITY,
  }));
export const shiftCapacity = (runners) =>
  runners.filter((r) => r.status === RUNNER_STATUS.ON).reduce((sum, r) => sum + r.capacity, 0);

export function estimateWait({ peak, ahead, runners, items = 1 }) {
  const slots = Math.max(1, shiftCapacity(runners));
  const service = (peak ? 2.5 : 1.5) + 0.5 * (items - 1);
  const minutes = Math.ceil((ahead + 1) / slots) * service;
  const lo = Math.max(1, Math.floor(minutes * 0.8));
  const hi = Math.max(lo + 1, Math.ceil(minutes * 1.2));
  return { lo, hi };
}

export const waitText = ({ lo, hi }) => `${lo}–${hi}`;
