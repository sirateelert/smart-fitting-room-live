import React, { useState } from "react";
import { CATALOG, SIZES, makeLine, pick, skuFor } from "../lib/catalog.js";
import { CLOSE, HOURS, OPEN, formatTime, hourLabel, isPeak, pct, peakBands } from "../lib/time.js";
import { RUNNER_NAMES, RUNNER_STATUS, shiftCapacity } from "../lib/wait.js";
import { SCENARIO_IDS } from "../lib/scenarios.js";
import { useT } from "../lib/i18n.js";
import { ROOM_COUNT } from "../lib/rooms.js";
import { stockKey } from "../lib/inventory.js";
import { SBtn, Switch, cap } from "./ui.jsx";

const IDLE_OPTIONS = [[0, "Off"], [30, "30s"], [60, "60s"], [120, "2 min"], [300, "5 min"]];
const sel = "border border-white/40 bg-ink text-paper min-h-[44px] px-2 text-sm w-full";

function Row({ title, hint, children }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div className="min-w-0">
        <p className={cap}>{title}</p>
        {hint && <p className="text-xs text-white/50 mt-1">{hint}</p>}
      </div>
      {children}
    </div>
  );
}

// Presenter-only tools. Collapsed by default so the customer tablet stays production-like.
export default function DemoControls({ s, act, open, setOpen, offline, setOffline, spot, scenario }) {
  const { t } = useT();
  const onShift = s.runners.filter((r) => r.status === RUNNER_STATUS.ON).length;
  const [cat, setCat] = useState(CATALOG[0]);
  const [sub, setSub] = useState(CATALOG[0].subs[0]);
  const [size, setSize] = useState("M");
  const peak = isPeak(s.day, s.minutes);
  const key = stockKey(skuFor(cat.name, sub), size);
  const stock = s.inventory[key] ?? 0;

  const spawn = () => {
    const c = pick(CATALOG);
    const room = `Room ${String(1 + Math.floor(Math.random() * ROOM_COUNT)).padStart(2, "0")}`;
    act({ type: "SPAWN", room, line: makeLine(c.name, pick(c.subs), pick(SIZES)) });
  };

  return (
    <div id="demo-drawer" className={`fixed bottom-0 inset-x-0 z-50 bg-ink text-paper border-t border-white ${spot}`}>
      <button
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        className="w-full min-h-[48px] px-6 flex items-center justify-between text-left"
      >
        <span className={`${cap} flex items-center gap-3`}>
          <span className={`h-2 w-2 rounded-full ${s.autoPilot.on ? "bg-ok animate-pulse" : "bg-white/30"}`} />
          {t("demo.title")}
          <span className="text-white/50 normal-case tracking-normal">{peak ? "Peak" : "Normal"} · {formatTime(s.minutes)}</span>
        </span>
        <span className={cap}>{open ? "Hide ▾" : "Show ▴"}</span>
      </button>

      {open && (
        <div className="max-h-[65vh] overflow-y-auto border-t border-white/20">
          <div className="max-w-6xl mx-auto px-6 py-6 grid md:grid-cols-2 gap-x-10 gap-y-8">

            <section className="space-y-4">
              <p className={`${cap} text-white/50`}>Traffic simulator</p>
              <div className="grid grid-cols-2 border border-white/60">
                {[["weekday", "Weekday"], ["weekend", "Weekend"]].map(([v, label]) => (
                  <button
                    key={v}
                    onClick={() => act({ type: "SET", patch: { day: v } })}
                    aria-pressed={s.day === v}
                    className={`min-h-[44px] ${cap} ${s.day === v ? "bg-paper text-ink" : "hover:bg-white/10"}`}
                  >
                    {label}
                  </button>
                ))}
              </div>
              <p className="text-3xl font-light tabular-nums">{formatTime(s.minutes)}</p>
              <input
                type="range" min={OPEN} max={CLOSE} step="15" value={s.minutes}
                onChange={(e) => act({ type: "SET", patch: { minutes: Number(e.target.value) } })}
                aria-label="Time of day"
                className="invert"
              />
              <div className="relative h-9 mx-[7px]">
                <div className="absolute top-0 inset-x-0 h-px bg-white/30" />
                {peakBands(s.day).map(([l, w], i) => (
                  <div key={i} className="absolute top-0 h-[3px] bg-paper" style={{ left: `${l}%`, width: `${w}%` }} />
                ))}
                {HOURS.map((h) => (
                  <div key={h} className="absolute top-0 flex flex-col items-center -translate-x-1/2" style={{ left: `${pct(h * 60)}%` }}>
                    <span className="w-px h-2 bg-white/50" />
                    <span className="text-[10px] text-white/50 mt-1">{hourLabel(h)}</span>
                  </div>
                ))}
              </div>
              <p className="text-[11px] uppercase tracking-[0.14em] text-white/50">Thick line = peak hours</p>
            </section>

            <section className="space-y-5">
              <p className={`${cap} text-white/50`}>Store</p>
              <Row title="Auto-Pilot" hint={s.autoPilot.on ? `Live · ${s.autoPilot.count} generated · every 3–7 s, Rooms 01–${ROOM_COUNT}` : `Off · simulates a busy store across Rooms 01–${ROOM_COUNT}`}>
                <Switch on={s.autoPilot.on} label="Auto-Pilot" onChange={(on) => act({ type: "AUTOPILOT", on })} />
              </Row>
              <Row title="Runners on shift" hint={`${onShift} on shift · ${shiftCapacity(s.runners)} orders at once`}>
                <div className="flex items-center gap-2">
                  <SBtn onClick={() => act({ type: "SET_RUNNERS", n: onShift - 1 })} disabled={onShift <= 1}>−</SBtn>
                  <span className="w-6 text-center tabular-nums">{onShift}</span>
                  <SBtn onClick={() => act({ type: "SET_RUNNERS", n: onShift + 1 })} disabled={onShift >= RUNNER_NAMES.length}>+</SBtn>
                </div>
              </Row>
              <div className="flex flex-wrap items-center gap-2">
                <SBtn onClick={spawn}>+ Request from another room</SBtn>
                <SBtn onClick={() => act({ type: "FAST_FORWARD" })}>Fast-forward 1 min</SBtn>
                {s.skew > 0 && <span className="text-xs text-white/50">Demo clock +{s.skew / 60000} min</span>}
              </div>
            </section>

            <section className="space-y-4">
              <p className={`${cap} text-white/50`}>{t("demo.visitors")}</p>
              <div className="flex flex-wrap gap-2">
                {SCENARIO_IDS.map((n) => (
                  <SBtn key={n} variant={scenario.active === n ? "primary" : "outline"} onClick={() => scenario.run(n)}>
                    {t("demo.visitor", { n })}
                  </SBtn>
                ))}
              </div>
              <p className="text-xs text-white/50">{t("demo.visitorHint")} 1: lunch-rush delivery · 2: out-of-stock recovery · 3: peak crunch with assistance.</p>
            </section>

            <section className="space-y-4">
              <p className={`${cap} text-white/50`}>Stock override</p>
              <div className="grid grid-cols-3 gap-2">
                <select aria-label="Category" className={sel} value={cat.name}
                  onChange={(e) => { const c = CATALOG.find((x) => x.name === e.target.value); setCat(c); setSub(c.subs[0]); }}>
                  {CATALOG.map((c) => <option key={c.name}>{c.name}</option>)}
                </select>
                <select aria-label="Style" className={sel} value={sub} onChange={(e) => setSub(e.target.value)}>
                  {cat.subs.map((x) => <option key={x}>{x}</option>)}
                </select>
                <select aria-label="Size" className={sel} value={size} onChange={(e) => setSize(e.target.value)}>
                  {SIZES.map((z) => <option key={z}>{z}</option>)}
                </select>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm tabular-nums mr-2">{skuFor(cat.name, sub)} · {size}: {stock} in stock</span>
                <SBtn onClick={() => act({ type: "SET_STOCK", key, n: stock - 1 })} disabled={stock <= 0}>−</SBtn>
                <SBtn onClick={() => act({ type: "SET_STOCK", key, n: stock + 1 })}>+</SBtn>
                <SBtn variant="danger" onClick={() => act({ type: "SET_STOCK", key, n: 0 })}>Set to 0</SBtn>
              </div>
            </section>

            <section className="space-y-5">
              <p className={`${cap} text-white/50`}>Tablet</p>
              <Row title="Customer inside mall" hint="Simulated geofence for reservations">
                <Switch on={s.location === "inside"} label="Customer inside mall" onChange={(on) => act({ type: "SET", patch: { location: on ? "inside" : "outside" } })} />
              </Row>
              <Row title="Simulate offline" hint="Pauses new requests on the tablet">
                <Switch on={offline} label="Simulate offline" onChange={setOffline} />
              </Row>
              <Row title="Inactivity timeout" hint="Clears an unfinished selection">
                <select aria-label="Inactivity timeout" className={`${sel} w-28`} value={s.idleSec}
                  onChange={(e) => act({ type: "SET", patch: { idleSec: Number(e.target.value) } })}>
                  {IDLE_OPTIONS.map(([v, label]) => <option key={v} value={v}>{label}</option>)}
                </select>
              </Row>
            </section>
          </div>
        </div>
      )}
    </div>
  );
}
