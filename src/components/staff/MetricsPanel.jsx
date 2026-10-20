import React from "react";
import { durFmt } from "../../lib/status.js";
import { useT } from "../../lib/i18n.js";
import { metrics } from "../../state/selectors.js";
import { cap } from "../ui.jsx";

// Compact presentation metrics, recomputed from the real request history on every render.
export default function MetricsPanel({ s, clock }) {
  const { t } = useT();
  const m = metrics(s, clock);
  const cells = [
    [t("m.avg"), durFmt(m.avgMs), t("m.delivered", { n: m.delivered })],
    [t("m.breach"), m.breachPct == null ? "–" : `${m.breachPct}%`, null, m.breachPct > 0],
  ];
  return (
    <section aria-label={t("m.title")}>
      <p className={`${cap} text-white/50 mb-3`}>{t("m.title")}</p>
      <div className="grid grid-cols-3 border border-white/20 divide-x divide-white/20">
        {cells.map(([label, value, sub, bad]) => (
          <div key={label} className="p-3">
            <p className={`text-xl font-light tabular-nums ${bad ? "text-alert" : ""}`}>{value}</p>
            <p className="text-[11px] uppercase tracking-[0.1em] text-white/50 mt-1">{label}</p>
            {sub && <p className="text-[11px] text-white/40 mt-0.5">{sub}</p>}
          </div>
        ))}
        <div className="p-3">
          <p className="text-sm tabular-nums">
            <span className="text-white/50">{t("m.peak")} </span>{durFmt(m.peakMs)}
          </p>
          <p className="text-sm tabular-nums mt-0.5">
            <span className="text-white/50">{t("m.normal")} </span>{durFmt(m.normalMs)}
          </p>
          <p className="text-[11px] uppercase tracking-[0.1em] text-white/50 mt-1">{t("m.latency")}</p>
        </div>
      </div>
      {m.delivered === 0 && m.breachPct == null && <p className="text-xs text-white/40 mt-2">{t("m.none")}</p>}
    </section>
  );
}
