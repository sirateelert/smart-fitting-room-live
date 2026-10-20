import React, { useState } from "react";
import { STATUS as S } from "../../lib/status.js";
import { ASSIST_REASONS } from "../../lib/catalog.js";
import { useT } from "../../lib/i18n.js";
import { Chip, TextButton, cap } from "../ui.jsx";

export default function Assist({ assist, online, act }) {
  const { t } = useT();
  const [open, setOpen] = useState(false);
  const live = assist && (assist.status === S.PENDING || assist.status === S.CLAIMED);
  const done = assist && assist.status === S.RESOLVED;

  if (live || done) {
    return (
      <div className="border border-ink p-5 space-y-3">
        <p className={`${cap} text-mute`}>Assistance</p>
        <p className="text-xl font-light">{assist.reason}</p>
        <p className="text-base text-mute">
          {assist.status === S.PENDING && "Staff have been notified."}
          {assist.status === S.CLAIMED && "A team member is on the way."}
          {done && "Resolved. Let us know if you need anything else."}
        </p>
        {live ? (
          <TextButton onClick={() => act({ type: "MOVE", id: assist.id, to: S.CANCELLED })}>Cancel</TextButton>
        ) : (
          <TextButton onClick={() => act({ type: "CLEAR", key: "assistId" })} className="text-ink">Dismiss</TextButton>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <button
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className={`w-full min-h-[56px] border py-4 ${cap} tracking-[0.18em] transition-colors ${open ? "border-ink" : "border-line hover:border-ink"}`}
      >
        {t("act.assist")}
      </button>
      {open && (
        <div className="flex flex-wrap gap-2">
          {ASSIST_REASONS.map((reason) => (
            <Chip key={reason} disabled={!online} onClick={() => { act({ type: "CREATE_ASSIST", reason }); setOpen(false); }}>
              {reason}
            </Chip>
          ))}
        </div>
      )}
    </div>
  );
}
