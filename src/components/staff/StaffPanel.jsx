import React from "react";
import { STATUS as S, sla, summary } from "../../lib/status.js";
import { statusLabel, useT } from "../../lib/i18n.js";
import { activeQueue, recentQueue, runnerList } from "../../state/selectors.js";
import { cap } from "../ui.jsx";
import StaffCard from "./StaffCard.jsx";
import MetricsPanel from "./MetricsPanel.jsx";

export default function StaffPanel({ s, act, clock, spot }) {
  const { t } = useT();
  const queue = activeQueue(s);
  const recent = recentQueue(s);
  const pending = s.queue.filter((r) => r.status === S.PENDING).length;
  const claimed = s.queue.filter((r) => r.status === S.CLAIMED || r.status === S.DELIVERING).length;
  const breached = queue.filter((r) => sla(clock - r.createdAt) === "alert").length;
  const runners = runnerList(s).filter((r) => r.status === "on");

  return (
    <aside id="sec-staff" className={`bg-ink text-paper relative lg:sticky lg:top-14 lg:h-[calc(100vh-3.5rem)] lg:overflow-y-auto lg:self-start ${spot}`}>
      <header className="border-b border-white/15">
        <div className="max-w-xl mx-auto px-6 h-14 flex items-center justify-between">
          <span className="text-[13px] font-medium tracking-[0.28em] uppercase">{t("title.staff")}</span>
          <span className={`${cap} text-white/50`}>{t("staff.active", { a: queue.length, p: pending })}</span>
        </div>
      </header>

      <div className="max-w-xl mx-auto px-6 py-8 space-y-10">
        <section className="grid grid-cols-4 border border-white/20 divide-x divide-white/20">
          {[["staff.inQueue", queue.length], ["staff.pending", pending], ["staff.claimed", claimed], ["staff.breached", breached]].map(([label, v]) => (
            <div key={label} className="p-3">
              <p className={`text-2xl font-light tabular-nums ${label === "staff.breached" && v > 0 ? "text-alert" : ""}`}>{v}</p>
              <p className="text-[11px] uppercase tracking-[0.12em] text-white/50 mt-1">{t(label)}</p>
            </div>
          ))}
        </section>

        <MetricsPanel s={s} clock={clock} />

        <section>
          <p className={`${cap} text-white/50 mb-3`}>{t("staff.runners")}</p>
          <ul className="flex flex-wrap gap-2">
            {runners.map((r) => (
              <li key={r.name} className={`border px-3 py-2 text-sm ${r.activeLoad >= r.capacity ? "border-hold text-hold" : "border-white/30"}`}>
                {r.name} <span className="tabular-nums text-white/60">{r.activeLoad}/{r.capacity}</span>
              </li>
            ))}
          </ul>
        </section>

        <section>
          <p className={`${cap} text-white/50 mb-4`}>{t("staff.queue")}</p>
          {queue.length === 0 ? (
            <p className="text-sm text-white/40 border border-dashed border-white/20 p-6 text-center">
              No active requests. New requests from the tablet appear here instantly.
            </p>
          ) : (
            <ul className="space-y-3">
              {queue.map((r) => <StaffCard key={r.id} s={s} r={r} clock={clock} act={act} />)}
            </ul>
          )}
        </section>

        {recent.length > 0 && (
          <section>
            <p className={`${cap} text-white/50 mb-3`}>{t("staff.recent")}</p>
            <ul className="divide-y divide-white/15 border-y border-white/15">
              {recent.map((r) => (
                <li key={r.id} className="flex justify-between gap-4 py-3 text-xs text-white/60">
                  <span>{r.room} · {summary(r)}</span>
                  <span className="shrink-0">{statusLabel(t, r)}</span>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </aside>
  );
}
