import React from "react";
import { CATALOG, SIZES, hasLine, skuFor } from "../lib/catalog.js";

// Text styles: `cap` is the touch-friendly size used on the customer tablet, `capS` the denser staff size.
export const cap = "text-[13px] uppercase tracking-[0.12em]";
export const capS = "text-[11px] uppercase tracking-[0.14em]";

// ---- Line-art garment thumbnails (self-contained, no external images) ----
const SIL = {
  "Top": <path d="M22 10 L8 18 L13 28 L19 25 L19 54 L45 54 L45 25 L51 28 L56 18 L42 10 C40 14 24 14 22 10 Z" />,
  "Bottoms": <path d="M18 8 H46 L50 56 H35 L32 28 L29 56 H14 Z" />,
  "Jacket/Outerwear": <path d="M24 8 L14 14 L8 40 L15 42 L17 28 L17 56 L47 56 L47 28 L49 42 L56 40 L50 14 L40 8 L32 22 Z M32 22 V56" />,
  "Shoes": <path d="M8 40 C8 34 14 34 18 32 L22 26 L28 30 C32 33 40 34 48 36 C56 38 58 42 58 46 V48 H8 Z M8 44 H58" />,
  "Dresses": <path d="M26 8 L28 14 H36 L38 8 M28 14 L25 26 L14 56 H50 L39 26 L36 14 M25 26 H39" />,
};

export function Silhouette({ category, className = "" }) {
  return (
    <svg viewBox="0 0 64 64" className={className} fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" strokeLinecap="round">
      {SIL[category]}
    </svg>
  );
}

// Decorative barcode drawn from the SKU digits
export function Barcode({ code, className = "" }) {
  let x = 0;
  const bars = [];
  for (const ch of code.replace(/\D/g, "")) {
    const d = Number(ch);
    [(d % 3) + 1, ((d + 1) % 2) + 1, ((d >> 1) % 3) + 1, (d % 2) + 1].forEach((w, i) => {
      if (i % 2 === 0) bars.push(<rect key={x} x={x} y="0" width={w} height="24" />);
      x += w;
    });
  }
  return (
    <svg viewBox={`0 0 ${x} 24`} preserveAspectRatio="none" className={className} fill="currentColor" aria-hidden="true">
      {bars}
    </svg>
  );
}

export function ItemCard({ category, title, caption, sku, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`text-left border transition-colors ${active ? "border-ink" : "border-line hover:border-ink"}`}
    >
      <div className="bg-paper aspect-[4/5] flex items-center justify-center">
        <Silhouette category={category} className="w-1/2 text-ink" />
      </div>
      <div className="p-3 space-y-1">
        <p className={cap}>{title}</p>
        <p className="text-sm text-mute">{caption}</p>
        <p className="text-xs text-mute tabular-nums tracking-wider">{sku}</p>
        <Barcode code={sku} className="h-3 w-full text-ink" />
      </div>
    </button>
  );
}

export function Chip({ active, onClick, disabled, sub, children }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      aria-pressed={active}
      className={`px-5 py-3 min-h-[48px] border ${cap} transition-colors ${
        disabled
          ? "bg-white text-mute border-line opacity-50 cursor-not-allowed"
          : active
          ? "bg-ink text-white border-ink"
          : "bg-white text-ink border-line hover:border-ink"
      }`}
    >
      {children}
      {sub && (
        <span className={`block mt-0.5 text-[11px] tracking-[0.08em] normal-case tabular-nums ${active ? "text-white/60" : "text-mute"}`}>
          {sub}
        </span>
      )}
    </button>
  );
}

export function StepTitle({ n, right, children }) {
  return (
    <p className={`${cap} flex gap-3 mb-3 items-baseline`}>
      <span className="text-mute">{n}</span>
      <span>{children}</span>
      {right && <span className="ml-auto text-mute normal-case tracking-normal text-sm">{right}</span>}
    </p>
  );
}

// Full-width primary / secondary action used all over the customer tablet
export function ActionButton({ onClick, disabled, solid = true, children }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`w-full min-h-[56px] py-4 border ${cap} tracking-[0.18em] transition-colors ${
        disabled
          ? "text-mute border-line cursor-not-allowed"
          : solid
          ? "bg-ink text-white border-ink hover:bg-black/80"
          : "border-ink hover:bg-ink hover:text-white"
      }`}
    >
      {children}
    </button>
  );
}

export function TextButton({ onClick, className = "", children }) {
  return (
    <button onClick={onClick} className={`min-h-[44px] ${cap} underline underline-offset-4 text-mute hover:text-ink ${className}`}>
      {children}
    </button>
  );
}

// Category -> Style -> multi-size picker. Sizes toggle lines on/off up to `max`.
export function Picker({ category, sub, onCategory, onSub, lines, onToggleSize, max, hint, catalog = CATALOG, isOut = () => false }) {
  const full = lines.length >= max;
  const on = (sz) => hasLine(lines, category?.name, sub, sz);
  return (
    <div className="space-y-10">
      <section>
        <StepTitle n="01">Category</StepTitle>
        <div className="flex flex-wrap gap-2">
          {catalog.map((cat) => (
            <Chip key={cat.name} active={category?.name === cat.name} onClick={() => onCategory(cat)}>
              {cat.name}
            </Chip>
          ))}
        </div>
      </section>

      {category && (
        <section>
          <StepTitle n="02">Style</StepTitle>
          <div className="flex flex-wrap gap-2">
            {category.subs.map((s) => (
              <Chip key={s} active={sub === s} onClick={() => onSub(s)} sub={skuFor(category.name, s)}>{s}</Chip>
            ))}
          </div>
        </section>
      )}

      {category && sub && (
        <section>
          <StepTitle n="03" right={`${lines.length}/${max} selected`}>Size</StepTitle>
          {hint && <p className="text-sm text-mute -mt-1 mb-3">{hint}</p>}
          <div className="flex flex-wrap gap-2">
            {SIZES.map((sz) => (
              <Chip
                key={sz}
                active={on(sz)}
                disabled={(full && !on(sz)) || isOut(sz)}
                sub={isOut(sz) ? "Sold out" : undefined}
                onClick={() => onToggleSize(sz)}
              >
                {sz}
              </Chip>
            ))}
          </div>
          <p className="text-sm text-mute mt-3">
            {full ? `Maximum of ${max} items reached. Remove one to add another.` : `Tap several sizes to try them together (up to ${max}).`}
          </p>
        </section>
      )}
    </div>
  );
}

export function BasketList({ lines, onRemove }) {
  return (
    <ul className="divide-y divide-line border-y border-line">
      {lines.map((l) => (
        <li key={l.key} className="flex items-center gap-3 py-3">
          <Silhouette category={l.category} className="w-9 h-9 shrink-0 text-ink" />
          <div className="flex-1 min-w-0">
            <p className="text-base">{l.category} ({l.sub}) · Size {l.size}</p>
            <p className="text-xs text-mute tabular-nums">{l.sku}</p>
          </div>
          <Barcode code={l.sku} className="h-4 w-14 text-ink hidden sm:block" />
          {onRemove && (
            <button
              onClick={() => onRemove(l.key)}
              aria-label={`Remove ${l.sub} ${l.size}`}
              className="w-11 h-11 shrink-0 text-2xl leading-none text-mute hover:text-ink"
            >
              ×
            </button>
          )}
        </li>
      ))}
    </ul>
  );
}

export function TopBtn({ onClick, solid, active, children }) {
  return (
    <button
      onClick={onClick}
      aria-pressed={active}
      className={`px-3 min-h-[40px] border ${capS} tracking-[0.1em] whitespace-nowrap transition-colors ${
        solid || active ? "bg-ink text-white border-ink hover:bg-black/80" : "border-ink hover:bg-ink hover:text-white"
      }`}
    >
      {children}
    </button>
  );
}

// On/off switch used by the Demo Controls drawer
export function Switch({ on, onChange, label }) {
  return (
    <button
      role="switch"
      aria-checked={on}
      aria-label={label}
      onClick={() => onChange(!on)}
      className={`shrink-0 w-12 h-7 border border-ink flex items-center px-0.5 transition-colors ${on ? "bg-ink justify-end" : "bg-white justify-start"}`}
    >
      <span className={`h-5 w-5 ${on ? "bg-white" : "bg-ink"}`} />
    </button>
  );
}

// ---- Staff-side (dark panel) pieces ----
export function Tag({ tone, children }) {
  const tones = {
    ok: "border-ok text-ok",
    alert: "bg-alert border-alert text-white",
    neutral: "border-white/40 text-white/80",
  };
  return <span className={`inline-block border px-2 py-1 text-[11px] uppercase tracking-[0.14em] ${tones[tone]}`}>{children}</span>;
}

export function SBtn({ onClick, variant = "outline", disabled, children }) {
  const v = {
    primary: "bg-paper text-ink border-paper hover:bg-white",
    outline: "border-white/40 text-paper hover:border-white",
    danger: "border-alert text-alert hover:bg-alert hover:text-white",
  }[variant];
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`px-3 min-h-[44px] border ${capS} transition-colors ${v} ${disabled ? "opacity-40 cursor-not-allowed" : ""}`}
    >
      {children}
    </button>
  );
}
