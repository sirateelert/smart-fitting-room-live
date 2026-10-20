import React from "react";
import { STATUS as S, STEPS, STEP_INDEX } from "../../lib/status.js";
import { phrase } from "../../lib/catalog.js";
import { waitText } from "../../lib/wait.js";
import { estimateFor } from "../../state/selectors.js";
import { useT } from "../../lib/i18n.js";
import { BasketList, TextButton, ActionButton, cap } from "../ui.jsx";

// Live progress for the customer's open request. Status changes come from the staff panel via the reducer.
export default function Tracking({ s, request, act, onDone }) {
  const { t } = useT();
  const stepIndex = STEP_INDEX[request.status] ?? 0;
  const n = request.items.length;
  const what = phrase(request.items);
  const done = request.status === S.DELIVERED;
  const est = waitText(estimateFor(s, request));

  return (
    <section className="border border-ink p-6 space-y-7">
      <div className="flex gap-1.5">
        {STEPS.map(([key, name], i) => (
          <div key={key} className="flex-1">
            <div className={`h-[3px] ${i <= stepIndex ? "bg-ink" : "bg-line"} ${i === stepIndex && !done ? "animate-pulse" : ""}`} />
            <p className={`mt-2 text-[11px] uppercase tracking-[0.12em] ${i <= stepIndex ? "text-ink" : "text-mute"}`}>
              {"0" + (i + 1)} {name}
            </p>
          </div>
        ))}
      </div>

      <div>
        {request.note && <p className={`${cap} text-mute mb-2`}>{request.note}</p>}
        <h2 className="text-2xl font-light leading-snug">
          {request.status === S.PENDING && `Your request for ${what} has been received.`}
          {request.status === S.CLAIMED && `Preparing your ${what}.`}
          {request.status === S.DELIVERING && `Your ${what} ${n === 1 ? "is" : "are"} on the way.`}
          {done && `Your ${what} ${n === 1 ? "has" : "have"} been delivered.`}
        </h2>
        <p className="mt-2 text-base text-mute">{done ? "Delivered" : `Estimated wait: ${est} minutes`}</p>
        {request.status === S.PENDING && <p className="mt-1 text-base text-mute">{request.runner ? "Waiting for the runner to start." : "Waiting for a free runner."}</p>}
        {request.runner && !done && (
          <p className="mt-1 text-base text-mute">
            {request.status === S.PENDING ? `Runner ${request.runner} is assigned to your order.` : `Claimed by runner ${request.runner}.`}
          </p>
        )}
        {request.peak && !done && (
          <p className="mt-4 text-base border-l-2 border-ink pl-3">Staff are currently handling high volumes. Thank you for your patience.</p>
        )}
      </div>

      <BasketList lines={request.items} />

      {request.status === S.DELIVERING || done ? (
        <ActionButton onClick={onDone}>{t("act.another")}</ActionButton>
      ) : (
        <TextButton onClick={() => act({ type: "MOVE", id: request.id, to: S.CANCELLED })}>{t("act.cancel")}</TextButton>
      )}
    </section>
  );
}
