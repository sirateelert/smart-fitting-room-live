// Scripted visitors. Each scenario is a fixed list of timed reducer actions, so a run always plays out the same way.
//   at  - milliseconds after the run starts
//   do  - reducer action (the customer's scan / size pick / submit collapses into one CREATE_REQUEST with fixed lines)
//   tag - names the request an action creates
//   on  - applies the action to the request created by that tag
// Every run starts from a clean RESET (see App), and each scenario sets the stock it relies on, so repeated runs
// never stack inventory or requests.
import { makeLine } from "./catalog.js";
import { lineStockKey } from "./inventory.js";
import { m } from "./time.js";
import { STATUS as S } from "./status.js";

const stock = (lines, n = 5) => lines.map((l) => ({ at: 0, do: { type: "SET_STOCK", key: lineStockKey(l), n } }));

const POLO = makeLine("Top", "Polo", "M");
const JEANS = makeLine("Bottoms", "Jeans", "L");
const SNEAKER_M = makeLine("Shoes", "Sneakers", "M");
const SNEAKER_S = makeLine("Shoes", "Sneakers", "S");
const SNEAKER_L = makeLine("Shoes", "Sneakers", "L");
const MIDI = makeLine("Dresses", "Midi", "S");
const RUSH = [
  ["Room 02", makeLine("Top", "T-shirt", "S")], ["Room 05", makeLine("Bottoms", "Chinos", "M")],
  ["Room 08", makeLine("Jacket/Outerwear", "Hoodie", "L")], ["Room 09", makeLine("Shoes", "Loafers", "M")],
  ["Room 11", makeLine("Dresses", "Maxi", "XS")],
];

export const SCENARIOS = {
  // 1. Happy path in the weekday lunch rush: two sizes requested, delivered start to finish
  1: [
    { at: 0, do: { type: "SET", patch: { day: "weekday", minutes: m(12, 30) } } },
    ...stock([POLO, JEANS]),
    { at: 800, tag: "v1", do: { type: "CREATE_REQUEST", items: [POLO, JEANS] } },
    { at: 3000, on: "v1", do: { type: "CLAIM" } },
    { at: 5500, on: "v1", do: { type: "MOVE", to: S.DELIVERING } },
    { at: 8500, on: "v1", do: { type: "MOVE", to: S.DELIVERED } },
  ],
  // 2. Weekend: the runner cannot find the sneakers, the customer is offered in-stock alternatives
  2: [
    { at: 0, do: { type: "SET", patch: { day: "weekend", minutes: m(15) } } },
    ...stock([SNEAKER_M], 2), ...stock([SNEAKER_S, SNEAKER_L], 3),
    { at: 800, tag: "v2", do: { type: "CREATE_REQUEST", items: [SNEAKER_M] } },
    { at: 3000, on: "v2", do: { type: "CLAIM" } },
    { at: 5500, on: "v2", do: { type: "FLAG_OOS", key: SNEAKER_M.key } },
  ],
  // 3. Evening peak, two runners: five other rooms queue first, then the customer asks and calls for help
  3: [
    { at: 0, do: { type: "SET", patch: { day: "weekday", minutes: m(18) } } },
    { at: 0, do: { type: "SET_RUNNERS", n: 2 } },
    ...stock([...RUSH.map(([, l]) => l), JEANS, MIDI]),
    ...RUSH.map(([room, line], i) => ({ at: 300 + i * 300, tag: `rush${i}`, do: { type: "SPAWN", room, line } })),
    { at: 2500, tag: "v3", do: { type: "CREATE_REQUEST", items: [JEANS, MIDI] } },
    { at: 4000, tag: "help", do: { type: "CREATE_ASSIST", reason: "Spill in room" } },
    { at: 5000, on: "rush0", do: { type: "CLAIM" } },
    { at: 7000, on: "help", do: { type: "CLAIM" } },
    { at: 8000, on: "rush0", do: { type: "MOVE", to: S.DELIVERED } },
    { at: 10000, on: "help", do: { type: "MOVE", to: S.RESOLVED } },
  ],
};
export const SCENARIO_IDS = Object.keys(SCENARIOS).map(Number);
