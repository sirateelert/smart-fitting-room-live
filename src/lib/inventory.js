import { CATALOG, SIZES, skuFor } from "./catalog.js";
import { STATUS, TYPE, IN_FLIGHT } from "./status.js";

// Stock is tracked per SKU and size: { "SKU-482019|M": 3, ... }
export const stockKey = (sku, size) => `${sku}|${size}`;
export const lineStockKey = (line) => stockKey(line.sku, line.size);

const hash = (str) => {
  let h = 7;
  for (const ch of str) h = (h * 31 + ch.charCodeAt(0)) % 100000;
  return h;
};

// Deterministic starting stock: 1-5 units per size, with roughly one size in seven sold out
export function initialInventory() {
  const inv = {};
  for (const c of CATALOG) {
    for (const s of c.subs) {
      const sku = skuFor(c.name, s);
      for (const z of SIZES) {
        const h = hash(sku + z);
        inv[stockKey(sku, z)] = h % 7 === 0 ? 0 : 1 + (h % 5);
      }
    }
  }
  return inv;
}

// Units already promised to open requests. Delivery (or staging) turns a promise into a stock decrement.
export function committed(queue) {
  const held = {};
  for (const r of queue) {
    const holds =
      r.type === TYPE.SIZE ? IN_FLIGHT.includes(r.status) : r.type === TYPE.RESERVE && r.status === STATUS.PENDING;
    if (!holds) continue;
    for (const it of r.items) {
      if (it.oos) continue;
      const k = lineStockKey(it);
      held[k] = (held[k] || 0) + 1;
    }
  }
  return held;
}

export const available = (inv, held, line) => (inv[lineStockKey(line)] || 0) - (held[lineStockKey(line)] || 0);

// Remove one unit per delivered line (never below zero)
export function consume(inv, items) {
  const next = { ...inv };
  for (const it of items) {
    if (it.oos) continue;
    const k = lineStockKey(it);
    next[k] = Math.max(0, (next[k] || 0) - 1);
  }
  return next;
}

// In-stock alternatives for an unavailable line: nearest sizes of the same style,
// plus other styles in the same category (same size when possible, otherwise the nearest size).
export function alternatives(inv, held, item) {
  const from = SIZES.indexOf(item.size);
  const nearest = [...SIZES].sort(
    (a, b) => Math.abs(SIZES.indexOf(a) - from) - Math.abs(SIZES.indexOf(b) - from) || SIZES.indexOf(b) - SIZES.indexOf(a)
  );
  const inStock = (sku, size) => available(inv, held, { sku, size }) > 0;
  const sizes = nearest.filter((z) => z !== item.size && inStock(item.sku, z)).slice(0, 2);
  const cat = CATALOG.find((c) => c.name === item.category);
  const similar = cat.subs
    .filter((s) => s !== item.sub)
    .map((s) => {
      const sku = skuFor(cat.name, s);
      const size = nearest.find((z) => inStock(sku, z));
      return size ? { sub: s, size, sku } : null;
    })
    .filter(Boolean)
    .slice(0, 4);
  return { sizes, similar };
}
