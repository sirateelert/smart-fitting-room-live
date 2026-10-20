import React, { useCallback, useEffect, useMemo, useReducer, useState } from "react";
import { initialState, reducer } from "./state/reducer.js";
import { SIZES, CATALOG, makeLine, pick } from "./lib/catalog.js";
import { ROOM_COUNT } from "./lib/rooms.js";
import { useOnline } from "./hooks/useOnline.js";
import { useBroadcastChannel } from "./hooks/useBroadcastChannel.js";
import { useScenario } from "./hooks/useScenario.js";
import { LangContext, makeT } from "./lib/i18n.js";
import { TopBtn } from "./components/ui.jsx";
import ErrorBoundary from "./components/ErrorBoundary.jsx";
import CustomerTablet from "./components/customer/CustomerTablet.jsx";
import StaffPanel from "./components/staff/StaffPanel.jsx";
import DemoControls from "./components/DemoControls.jsx";
import RoomsModal from "./components/RoomsModal.jsx";
import Spotlight, { TOUR } from "./components/Spotlight.jsx";

export default function App() {
  const [s, dispatch] = useReducer(reducer, undefined, () => initialState(Date.now()));
  // Every action carries the wall-clock time so the reducer stays pure
  const act = useCallback((a) => dispatch({ ...a, now: Date.now() }), []);

  // ?view=customer or ?view=staff shows one screen per browser tab; the tabs share state through BroadcastChannel
  const view = useMemo(() => new URLSearchParams(window.location.search).get("view"), []);
  const showCustomer = view !== "staff";
  const showStaff = view !== "customer";
  const [lang, setLang] = useState("en");
  const i18n = useMemo(() => ({ lang, t: makeT(lang), setLang }), [lang]);
  const { t } = i18n;

  const [now, setNow] = useState(Date.now());
  const [tourOpen, setTourOpen] = useState(false);
  const [tourStep, setTourStep] = useState(0);
  const [roomsOpen, setRoomsOpen] = useState(false);
  const [demoOpen, setDemoOpen] = useState(false);
  const [offlineDemo, setOfflineDemo] = useState(false);
  const [tabletKey, setTabletKey] = useState(0); // remounts the tablet to clear its local selection on reset
  const online = useOnline() && !offlineDemo;
  const clock = now + s.skew;

  useBroadcastChannel("smart-fitting-room", s, useCallback((state) => {
    dispatch({ type: "REPLACE", state });
    if (state.nextId === 1) setTabletKey((k) => k + 1); // another tab reset the demo: clear this tablet's local selection
  }, []));

  // Ticking clock for staff wait timers and room occupancy timers
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  // Auto-Pilot: while on, a random request from Rooms 01-12 every 3 to 7 seconds
  useEffect(() => {
    if (!s.autoPilot.on || !showStaff) return undefined; // only the staff / combined tab generates traffic, so tabs never double-spawn
    const delay = () => 3000 + Math.random() * 4000;
    let nextAt = Date.now() + delay();
    const id = setInterval(() => {
      if (Date.now() < nextAt) return;
      nextAt = Date.now() + delay();
      const cat = pick(CATALOG);
      const room = `Room ${String(1 + Math.floor(Math.random() * ROOM_COUNT)).padStart(2, "0")}`;
      act({ type: "SPAWN", room, auto: true, line: makeLine(cat.name, pick(cat.subs), pick(SIZES)) });
    }, 250);
    return () => clearInterval(id);
  }, [s.autoPilot.on, showStaff, act]);

  // Overlays: Escape closes, page scroll locks
  useEffect(() => {
    if (!tourOpen && !roomsOpen) return undefined;
    const onKey = (e) => { if (e.key === "Escape") { setTourOpen(false); setRoomsOpen(false); } };
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { window.removeEventListener("keydown", onKey); document.body.style.overflow = prev; };
  }, [tourOpen, roomsOpen]);

  // Back to the exact baseline (also the start of every scripted visitor)
  const baseline = useCallback(() => {
    act({ type: "RESET" });
    setTabletKey((k) => k + 1);
    setTourOpen(false); setRoomsOpen(false); setOfflineDemo(false);
  }, [act]);
  const scenario = useScenario({ state: s, act, onStart: baseline });
  const resetAll = () => { scenario.cancel(); baseline(); setTourStep(0); setDemoOpen(false); };
  const openTour = () => { setRoomsOpen(false); setTourStep(0); setDemoOpen(true); setTourOpen(true); };
  const closeTour = () => setTourOpen(false);
  const nextTour = () => (tourStep >= TOUR.length - 1 ? closeTour() : setTourStep((n) => n + 1));
  // Lifts the section currently being explained above the dimmed backdrop
  const spot = (id) => (tourOpen && TOUR[tourStep].target === id ? (TOUR[tourStep].dark ? "tour-spot" : "tour-spot tour-spot-light") : "");

  return (
    <LangContext.Provider value={i18n}>
    <div className="min-h-screen pb-14">
      <div className="border-b border-line bg-white lg:sticky lg:top-0 z-40">
        <div className="px-4 sm:px-6 py-2 lg:py-0 lg:h-14 flex flex-wrap lg:flex-nowrap items-center justify-between gap-2">
          <span className="text-[13px] font-medium tracking-[0.28em] uppercase">Smart Fitting Room</span>
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setLang(lang === "en" ? "th" : "en")}
              aria-label={t("nav.lang")}
              className="px-3 min-h-[40px] border border-line text-[11px] uppercase tracking-[0.1em] hover:border-ink"
            >
              <span className={lang === "th" ? "font-medium underline underline-offset-4" : "text-mute"}>TH</span>
              <span className="text-mute"> / </span>
              <span className={lang === "en" ? "font-medium underline underline-offset-4" : "text-mute"}>EN</span>
            </button>
            <TopBtn onClick={openTour}>{t("nav.tutorial")}</TopBtn>
            <TopBtn onClick={() => { setTourOpen(false); setRoomsOpen(true); }}>{t("nav.rooms", { n: ROOM_COUNT })}</TopBtn>
            <TopBtn active={demoOpen} onClick={() => setDemoOpen((o) => !o)}>{t("nav.demo")}</TopBtn>
            <TopBtn solid onClick={resetAll}>{t("nav.reset")}</TopBtn>
          </div>
        </div>
      </div>

      <div className={`grid ${showCustomer && showStaff ? "lg:grid-cols-2" : ""} divide-y lg:divide-y-0 lg:divide-x divide-line`}>
        {showCustomer && (
          <ErrorBoundary label="customer tablet">
            <CustomerTablet key={tabletKey} s={s} act={act} online={online} paused={tourOpen || roomsOpen} spot={spot("tour-customer")} />
          </ErrorBoundary>
        )}
        {showStaff && (
          <ErrorBoundary label="staff view">
            <StaffPanel s={s} act={act} clock={clock} spot={spot("sec-staff")} />
          </ErrorBoundary>
        )}
      </div>

      <DemoControls
        s={s} act={act} open={demoOpen} setOpen={setDemoOpen}
        offline={offlineDemo} setOffline={setOfflineDemo} spot={spot("demo-drawer")}
        scenario={scenario}
      />
      {roomsOpen && <RoomsModal s={s} act={act} clock={clock} onClose={() => setRoomsOpen(false)} />}
      {tourOpen && <Spotlight tour={TOUR[tourStep]} index={tourStep} total={TOUR.length} onNext={nextTour} onSkip={closeTour} />}
    </div>
    </LangContext.Provider>
  );
}
