// ---- Catalog, sizes, SKUs ----
export const CATALOG = [
  { name: "Top", subs: ["T-shirt", "Polo", "Formal Shirt", "Blouse", "Tank Top", "Sweater", "Cardigan"] },
  { name: "Bottoms", subs: ["Shorts", "Trousers", "Jeans", "Sweatpants", "Leggings", "Chinos", "Skirt"] },
  { name: "Jacket/Outerwear", subs: ["Denim", "Blazer", "Hoodie", "Leather Jacket", "Windbreaker", "Coat"] },
  { name: "Shoes", subs: ["Flats", "Sneakers", "Heels", "Boots", "Loafers", "Sandals"] },
  { name: "Dresses", subs: ["Mini", "Midi", "Maxi", "Sundress"] },
];
export const SIZES = ["XS", "S", "M", "L", "XL"];
export const MAX_ITEMS = 3; // cap per request / reservation

// Deterministic, realistic 6-digit SKU per catalog item (category + style), e.g. SKU-482019
export const skuFor = (category, sub) => {
  let h = 7;
  for (const ch of `${category}|${sub}`) h = (h * 31 + ch.charCodeAt(0)) % 900000;
  return `SKU-${100000 + h}`;
};

// A line = one garment in one size
export const makeLine = (category, sub, size) => ({
  key: `${category}|${sub}|${size}`, category, sub, size, sku: skuFor(category, sub), oos: false,
});
export const hasLine = (lines, c, s, z) => lines.some((l) => l.category === c && l.sub === s && l.size === z);
// Add or remove one line; adding is ignored once the cap is reached
export const toggleLine = (lines, c, s, z, max) => {
  if (hasLine(lines, c, s, z)) return lines.filter((l) => !(l.category === c && l.sub === s && l.size === z));
  return lines.length >= max ? lines : [...lines, makeLine(c, s, z)];
};

// Items the customer brought into the room at baseline
export const WARDROBE = [
  { category: "Dresses", sub: "Midi", size: "S" },
  { category: "Top", sub: "Blouse", size: "M" },
  { category: "Bottoms", sub: "Jeans", size: "M" },
  { category: "Jacket/Outerwear", sub: "Blazer", size: "L" },
];
export const ASSIST_REASONS = ["Need a different color", "Pinning / tailoring requested", "Spill in room", "Other"];

export const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

// "Dresses (Midi)" for one line, "3 items" for several
export const phrase = (items) => (items.length === 1 ? `${items[0].category} (${items[0].sub})` : `${items.length} items`);
export const lineText = (i) => `${i.category} (${i.sub}) · ${i.size}`;
