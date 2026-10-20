import React from "react";
import { STATUS as S } from "../../lib/status.js";
import { hasLine, skuFor } from "../../lib/catalog.js";
import { alternatives, available, committed } from "../../lib/inventory.js";
import { BasketList, Chip, ItemCard, TextButton, cap } from "../ui.jsx";

// Shown when a line has no stock. Suggestions only list sizes / styles that are actually in stock.
export default function Recovery({ s, request, act }) {
  const held = committed(s.queue);
  const resolve = (key, patch) => act({ type: "RESOLVE_ITEM", id: request.id, key, patch });
  const unavailable = request.items.filter((i) => i.oos);
  const keep = request.items.filter((i) => !i.oos);

  return (
    <section className="border border-ink p-6 space-y-8">
      <p className={`${cap} text-mute`}>Unavailable</p>
      {unavailable.map((it, idx) => {
        const alt = alternatives(s.inventory, held, it);
        const sizes = alt.sizes.filter((sz) => !hasLine(request.items, it.category, it.sub, sz));
        const similar = alt.similar.filter((x) => !hasLine(request.items, it.category, x.sub, x.size));
        return (
          <div key={it.key} className={`space-y-6 ${idx > 0 ? "border-t border-line pt-8" : ""}`}>
            <h2 className="text-2xl font-light leading-snug">Sorry, {it.size} is out of stock.</h2>
            <p className="text-base text-mute">
              {it.category} ({it.sub}) · {it.sku} is not available in size {it.size}.
              {sizes.length ? " Try another size:" : " No other sizes of this style are in stock."}
            </p>
            {sizes.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {sizes.map((sz) => (
                  <Chip key={sz} onClick={() => resolve(it.key, { size: sz, note: `Alternative to size ${it.size}` })}>
                    Try size {sz}
                  </Chip>
                ))}
              </div>
            )}
            {similar.length > 0 ? (
              <div>
                <p className={`${cap} mb-3`}>Similar items in stock</p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {similar.map((x) => (
                    <ItemCard
                      key={x.sub}
                      category={it.category}
                      title={x.sub}
                      caption={`Size ${x.size} in stock`}
                      sku={skuFor(it.category, x.sub)}
                      onClick={() => resolve(it.key, { sub: x.sub, size: x.size, note: `Alternative to ${it.sub}` })}
                    />
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-base text-mute">No similar items are in stock right now. Please ask a team member.</p>
            )}
          </div>
        );
      })}

      {keep.length > 0 && (
        <div className="border-t border-line pt-6">
          <p className={`${cap} text-mute mb-3`}>Still in your request</p>
          <BasketList lines={keep} />
        </div>
      )}

      <TextButton onClick={() => act({ type: "MOVE", id: request.id, to: S.CANCELLED })} className="text-ink">Cancel request</TextButton>
    </section>
  );
}
