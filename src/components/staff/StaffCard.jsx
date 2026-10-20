import React from "react";
import { STATUS as S, SLA_STYLE, TYPE, sla, waitFmt } from "../../lib/status.js";
import { statusLabel, useT } from "../../lib/i18n.js";
import { SBtn, Silhouette, Tag } from "../ui.jsx";

export default function StaffCard({ s, r, clock, act }) {
  const { t } = useT();
  const wait = clock - r.createdAt;
  const st = SLA_STYLE[sla(wait)];
  const isAssist = r.type === TYPE.ASSIST;
  const isReserve = r.type === TYPE.RESERVE;
  const isSize = r.type === TYPE.SIZE;
  const anyOos = !isAssist && r.items.some((i) => i.oos);
  const canFlag = isSize && (r.status === S.PENDING || r.status === S.CLAIMED);
  const move = (to) => act({ type: "MOVE", id: r.id, to });

  return (
    <li className={`border border-l-4 ${st.border} p-4 space-y-4`}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-base font-medium">{r.room}</p>
          {isAssist && <p className="text-sm text-white/80 mt-1">Assistance: {r.reason}</p>}
          {r.note && <p className="text-xs text-white/50 mt-1">{r.note}</p>}
        </div>
        <div className="text-right shrink-0">
          <p className={`text-sm tabular-nums ${st.text}`}>Waiting: {waitFmt(wait)}</p>
          <p className={`text-[11px] uppercase tracking-[0.14em] mt-1 ${st.text}`}>{st.label}</p>
        </div>
      </div>

      {!isAssist && (
        <ul className="space-y-3">
          {r.items.map((it) => (
            <li key={it.key} className="flex items-center gap-3">
              <Silhouette category={it.category} className="w-9 h-9 shrink-0 text-white/70" />
              <div className="flex-1 min-w-0">
                <p className="text-sm text-white/90">
                  {isReserve ? "Reserve" : "Request"}: {it.category} ({it.sub}), Size {it.size}
                </p>
                <p className="text-[11px] text-white/50 tabular-nums">{it.sku}</p>
              </div>
              {it.oos && <Tag tone="alert">Out of stock</Tag>}
              {canFlag && !it.oos && <SBtn variant="danger" onClick={() => act({ type: "FLAG_OOS", id: r.id, key: it.key })}>{t("act.flag")}</SBtn>}
            </li>
          ))}
        </ul>
      )}

      <div className="flex flex-wrap gap-2">
        {isAssist ? <Tag tone="neutral">Assistance</Tag>
          : isReserve ? <Tag tone="neutral">Staged for next room</Tag>
          : anyOos ? <Tag tone="alert">Out of stock</Tag>
          : <Tag tone="ok">In stock</Tag>}
        {r.status !== S.OOS && <Tag tone="neutral">{statusLabel(t, r)}</Tag>}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {isAssist && r.status === S.PENDING && <SBtn variant="primary" onClick={() => act({ type: "CLAIM", id: r.id })}>{t("act.ack")}</SBtn>}
        {isAssist && r.status === S.CLAIMED && <SBtn variant="primary" onClick={() => move(S.RESOLVED)}>{t("act.resolve")}</SBtn>}

        {isReserve && r.status === S.PENDING && <SBtn variant="primary" onClick={() => move(S.STAGED)}>{t("act.staged", { room: r.room })}</SBtn>}
        {isReserve && r.status === S.STAGED && <SBtn variant="primary" onClick={() => move(S.ARRIVED)}>{t("act.arrived")}</SBtn>}

        {isSize && r.status === S.PENDING && (
          <SBtn variant="primary" disabled={!r.runner} onClick={() => act({ type: "CLAIM", id: r.id })}>{t("act.claim")}</SBtn>
        )}
        {isSize && r.status === S.PENDING && (
          <p className="text-xs text-white/50">{r.runner ? t("staff.assigned", { name: r.runner }) : "All runners are at capacity. Auto-assigns when one frees up."}</p>
        )}
        {isSize && r.status === S.CLAIMED && <SBtn onClick={() => move(S.DELIVERING)}>{t("act.deliver")}</SBtn>}
        {isSize && (r.status === S.CLAIMED || r.status === S.DELIVERING) && (
          <SBtn variant="primary" onClick={() => move(S.DELIVERED)}>{t("act.delivered")}</SBtn>
        )}
        {isSize && r.status === S.OOS && r.mine && <p className="text-xs text-white/50">Customer notified. Waiting for their choice of alternative.</p>}
        {isSize && r.status === S.OOS && !r.mine && <SBtn onClick={() => move(S.CLOSED)}>{t("act.dismiss")}</SBtn>}
      </div>
    </li>
  );
}
