import React, { useEffect, useState } from "react";
import { cap } from "./ui.jsx";

export const TOUR = [
  {
    target: "tour-customer", scroll: "top", title: "Customer tablet",
    text: "This is what the shopper sees in the fitting room. Scan a tag or pick a garment, choose up to 3 sizes and press Request. The order reaches staff instantly.",
  },
  {
    target: "demo-drawer", scroll: "none", dark: true, title: "Demo Controls",
    text: "Presenter tools live here, away from the tablet: peak-hours simulator, Auto-Pilot traffic, runners on shift, stock override and offline mode. Wait estimates update as you change them.",
  },
  {
    target: "sec-staff", scroll: "sticky", dark: true, title: "Staff fulfillment queue",
    text: "Every request lands here with a live SLA timer: green under 3 minutes, yellow up to 5, red beyond. Claim an order, then mark it delivered. Try Auto-Pilot for a busy store.",
  },
];

    export default function Spotlight({ tour, index, total, onNext, onSkip }) {
      const [box, setBox] = useState(null);
      const [vp, setVp] = useState({ w: window.innerWidth, h: window.innerHeight });

      // Bring the target into view whenever the step changes
      useEffect(() => {
        const el = document.getElementById(tour.target);
        if (!el) return;
        const narrow = window.innerWidth < 1024;
        if (tour.scroll === "none") return;
        if (tour.scroll === "top") window.scrollTo({ top: 0, behavior: "smooth" });
        else if (narrow) el.scrollIntoView({ behavior: "smooth", block: "start" });
        else if (tour.scroll === "center") el.scrollIntoView({ behavior: "smooth", block: "center" });
      }, [tour.target]);

      // Follow the target every frame so the bubble stays attached during smooth scrolling and resizes
      useEffect(() => {
        let raf, last = "";
        const loop = () => {
          const el = document.getElementById(tour.target);
          if (el) {
            const r = el.getBoundingClientRect();
            const key = [r.top, r.left, r.width, r.height, window.innerWidth, window.innerHeight].map(Math.round).join();
            if (key !== last) {
              last = key;
              setBox({ top: r.top, left: r.left, right: r.right, bottom: r.bottom, width: r.width, height: r.height });
              setVp({ w: window.innerWidth, h: window.innerHeight });
            }
          }
          raf = requestAnimationFrame(loop);
        };
        loop();
        return () => cancelAnimationFrame(raf);
      }, [tour.target]);

      const wide = vp.w >= 1024;
      const W = Math.min(340, vp.w - 32);
      let pos = { left: 16, right: 16, bottom: 16 }; // small screens: dock at the bottom
      let side = null; // which edge of the bubble carries the arrow
      if (wide && box) {
        const toRight = box.left + box.width / 2 < vp.w / 2; // target on the left half -> bubble on its right
        const left = toRight ? box.right + 20 : box.left - W - 20;
        const top = Math.min(Math.max(Math.max(box.top, 72) + 16, 72), vp.h - 300);
        pos = { left: Math.min(Math.max(left, 16), vp.w - W - 16), top, width: W };
        side = toRight ? "left" : "right";
      }

      return (
        <>
          <div className="fixed inset-0 z-[60] bg-black/80 backdrop-blur-sm" aria-hidden="true" />
          <div key={index} className="fixed z-[80] tour-pop" style={pos} role="dialog" aria-modal="true" aria-label="Tutorial">
            <div className="relative bg-white text-ink border border-ink p-5 space-y-4 shadow-2xl">
              {side && (
                <span className={`absolute top-6 h-3.5 w-3.5 bg-white rotate-45 border-ink ${
                  side === "left" ? "-left-[8px] border-l border-b" : "-right-[8px] border-t border-r"
                }`} />
              )}
              <div className="flex items-center justify-between">
                <p className={cap}>Tutorial</p>
                <p className={`${cap} text-mute`}>Step {index + 1} of {total}</p>
              </div>
              <div className="flex gap-1.5">
                {Array.from({ length: total }, (_, i) => (
                  <div key={i} className={`flex-1 h-[3px] ${i <= index ? "bg-ink" : "bg-line"}`} />
                ))}
              </div>
              <div className="space-y-2">
                <h2 className="text-xl font-light leading-snug">{tour.title}</h2>
                <p className="text-sm text-mute leading-relaxed">{tour.text}</p>
              </div>
              <div className="flex items-center justify-between gap-3 pt-1">
                <button onClick={onSkip} className={`${cap} underline underline-offset-4 text-mute hover:text-ink`}>Skip</button>
                <button onClick={onNext} className={`px-5 py-3 border border-ink bg-ink text-white ${cap} hover:bg-black/80 transition-colors`}>
                  {index === total - 1 ? "Done" : "Next"}
                </button>
              </div>
            </div>
          </div>
        </>
      );
    }
