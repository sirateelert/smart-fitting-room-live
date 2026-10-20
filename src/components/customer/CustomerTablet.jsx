import React, { useEffect, useState } from "react";
import { CATALOG, MAX_ITEMS, WARDROBE, lineText, pick, skuFor, toggleLine } from "../../lib/catalog.js";
import { useT } from "../../lib/i18n.js";
import { STATUS as S, CUSTOMER_LABEL, TYPE } from "../../lib/status.js";
import { available, committed } from "../../lib/inventory.js";
import { waitText } from "../../lib/wait.js";
import { estimateFor } from "../../state/selectors.js";
import { useIdle } from "../../hooks/useIdle.js";
import { ActionButton, BasketList, ItemCard, Picker, cap } from "../ui.jsx";
import Tracking from "./Tracking.jsx";
import Recovery from "./Recovery.jsx";
import Reservation from "./Reservation.jsx";
import Assist from "./Assist.jsx";
import IdleOverlay from "./IdleOverlay.jsx";

// Production-style tablet: selection, tracking, recovery, reservation, assistance. No demo tooling lives here.
export default function CustomerTablet({ s, act, online, paused, spot }) {
  const { t } = useT();
  const [category, setCategory] = useState(null);
  const [sub, setSub] = useState(null);
  const [basket, setBasket] = useState([]);
  const [scanning, setScanning] = useState(false);
  const [scanned, setScanned] = useState(false);
  const [preDirty, setPreDirty] = useState(false);

  const request = s.queue.find((r) => r.id === s.session.activeId) || null;
  const assist = s.queue.find((r) => r.id === s.session.assistId) || null;
  const reservation = s.queue.find((r) => r.id === s.session.reserveId) || null;
  const myRequests = s.queue.filter((r) => r.type === TYPE.SIZE && r.mine && r.id !== s.session.activeId && CUSTOMER_LABEL[r.status]);
  const brought = WARDROBE.find((w) => w.category === category?.name && w.sub === sub);

  const held = committed(s.queue);
  const isOut = (sz) => category && sub && available(s.inventory, held, { sku: skuFor(category.name, sub), size: sz }) <= 0;
  const est = waitText(estimateFor(s, null, Math.max(1, basket.length)));

  const clearLocal = () => { setCategory(null); setSub(null); setBasket([]); setScanned(false); setScanning(false); };
  const dirty = !request && (!!category || basket.length > 0);
  const idleLeft = useIdle({ seconds: s.idleSec, enabled: (dirty || preDirty) && !paused, onTimeout: () => { clearLocal(); } });

  // QR scan simulation: after a short delay, pick a random item
  useEffect(() => {
    if (!scanning) return undefined;
    const t = setTimeout(() => {
      const cat = pick(CATALOG);
      setCategory(cat); setSub(pick(cat.subs)); setScanned(true); setScanning(false);
    }, 900);
    return () => clearTimeout(t);
  }, [scanning]);

  const pickCategory = (cat) => { if (category?.name !== cat.name) { setCategory(cat); setSub(null); setScanned(false); } };
  const pickWardrobe = (w) => { setCategory(CATALOG.find((c) => c.name === w.category)); setSub(w.sub); setScanned(false); };
  const send = () => { act({ type: "CREATE_REQUEST", items: basket }); clearLocal(); };
  const startOver = () => { act({ type: "CLEAR", key: "activeId" }); clearLocal(); };

  return (
    <div id="tour-customer" className={`relative bg-white ${spot}`}>
      <header className="border-b border-line">
        <div className="max-w-xl mx-auto px-6 h-14 flex items-center justify-between">
          <span className="text-[13px] font-medium tracking-[0.28em] uppercase">{t("title.customer")}</span>
          <span className={`${cap} text-mute`}>{s.myRoom}</span>
        </div>
      </header>

      {!online && (
        <div role="alert" className="bg-ink text-white px-6 py-3 text-center text-sm">
          You're offline. New requests are paused until the connection returns. Staff already have your open requests.
        </div>
      )}

      <main className="max-w-xl mx-auto px-6 py-10 space-y-12 text-base">
        <div className="space-y-12">
          {!request && (
            <>
              <section>
                <button
                  onClick={() => setScanning(true)}
                  disabled={scanning}
                  className={`w-full min-h-[56px] flex items-center justify-center gap-3 border border-ink py-4 ${cap} tracking-[0.18em] hover:bg-ink hover:text-white transition-colors disabled:opacity-60`}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
                    <path d="M3 8V4h4M17 4h4v4M21 16v4h-4M7 20H3v-4M7 12h10" />
                  </svg>
                  <span className={scanning ? "animate-pulse" : ""}>{scanning ? "Scanning tag…" : "Scan item tag"}</span>
                </button>
                {scanned && category && sub && (
                  <p className={`${cap} text-mute mt-3`}>Tag detected: {category.name} / {sub} · {skuFor(category.name, sub)}</p>
                )}
              </section>

              <section>
                <div className="flex items-baseline justify-between mb-3">
                  <p className={cap}>In your room</p>
                  <p className="text-xs text-mute">Tap an item to swap its size</p>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {WARDROBE.map((w) => (
                    <ItemCard
                      key={w.category + w.sub}
                      category={w.category} title={w.sub} caption={`Size ${w.size}`} sku={skuFor(w.category, w.sub)}
                      active={category?.name === w.category && sub === w.sub}
                      onClick={() => pickWardrobe(w)}
                    />
                  ))}
                </div>
              </section>

              <Picker
                category={category} sub={sub} catalog={CATALOG} max={MAX_ITEMS} lines={basket} isOut={isOut}
                onCategory={pickCategory} onSub={(x) => { setSub(x); setScanned(false); }}
                onToggleSize={(sz) => setBasket((b) => toggleLine(b, category.name, sub, sz, MAX_ITEMS))}
                hint={brought ? `You brought this in size ${brought.size}.` : null}
              />

              <section className="space-y-4">
                {basket.length > 0 && (
                  <div>
                    <p className={`${cap} text-mute mb-3`}>Your request · {basket.length}/{MAX_ITEMS}</p>
                    <BasketList lines={basket} onRemove={(key) => setBasket((b) => b.filter((l) => l.key !== key))} />
                  </div>
                )}
                <ActionButton onClick={send} disabled={!basket.length || !online}>
                  {basket.length > 1 ? t("act.requestMany", { n: basket.length }) : t("act.requestOne")}
                </ActionButton>
                <p className={`${cap} text-mute text-center`}>
                  {!online ? "Offline. Reconnect to send"
                    : basket.length ? `Estimated wait: ${est} min`
                    : "Select category, style and at least one size"}
                </p>
              </section>
            </>
          )}

          {request?.status === S.OOS && <Recovery s={s} request={request} act={act} />}
          {request && request.status !== S.OOS && <Tracking s={s} request={request} act={act} onDone={startOver} />}
        </div>

        <Reservation s={s} reservation={reservation} online={online} act={act} onPreDirty={setPreDirty} />

        <Assist assist={assist} online={online} act={act} />

        {myRequests.length > 0 && (
          <section>
            <p className={`${cap} text-mute mb-3`}>Your requests</p>
            <ul className="divide-y divide-line border-y border-line">
              {myRequests.map((r) => (
                <li key={r.id} className="flex justify-between gap-4 py-3 text-base">
                  <span>{r.items.map(lineText).join(", ")}</span>
                  <span className="text-mute shrink-0">{t(`cust.${r.status}`)}</span>
                </li>
              ))}
            </ul>
          </section>
        )}
      </main>
      <IdleOverlay left={idleLeft} />
    </div>
  );
}
