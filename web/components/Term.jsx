"use client";
import { useId, useRef, useState } from "react";
import { TERMS } from "@/lib/terms";

// A dotted word. Click or tap toggles the definition. Keyboard focus opens it,
// Escape or a second click closes it. A fine pointer also opens it on hover.
export default function Term({ k, children }) {
  const def = TERMS[k];
  const tipId = `tip-${useId().replace(/:/g, "")}`;
  const btn = useRef(null);
  const tip = useRef(null);
  const [open, setOpen] = useState(false);
  if (!def) return children;

  const place = () => {
    const b = btn.current;
    const el = tip.current;
    if (!b || !el) return;
    const r = b.getBoundingClientRect();
    const width = Math.min(260, window.innerWidth - 24);
    const left = Math.min(Math.max(12, r.left), Math.max(12, window.innerWidth - 12 - width));
    el.style.width = `${width}px`;
    el.style.left = `${left}px`;
    el.style.top = `${r.bottom + 6}px`;
    const height = el.offsetHeight || 72;
    if (r.bottom + 6 + height > window.innerHeight - 8) {
      el.style.top = `${Math.max(8, r.top - height - 6)}px`;
    }
  };

  const show = () => {
    const el = tip.current;
    if (!el || typeof el.showPopover !== "function") return;
    place();
    if (!el.matches(":popover-open")) el.showPopover();
    place();
  };
  const hide = () => {
    const el = tip.current;
    if (el && el.matches(":popover-open")) el.hidePopover();
  };
  const fine = () => window.matchMedia("(hover: hover) and (pointer: fine)").matches;

  return (
    <span className="term">
      <button
        type="button"
        className="term-btn"
        ref={btn}
        aria-expanded={open}
        aria-controls={tipId}
        aria-description={def.tip}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          const isOpen = tip.current?.matches(":popover-open");
          // A mouse click lands after hover has already opened the tip. Keep it open.
          // Touch and keyboard toggle, which is how those devices show and dismiss it.
          if (fine() && e.detail > 0) { if (!isOpen) show(); return; }
          if (isOpen) hide(); else show();
        }}
        onMouseEnter={() => { if (fine()) show(); }}
        onMouseLeave={(e) => {
          if (!fine()) return;
          if (tip.current && e.relatedTarget instanceof Node && tip.current.contains(e.relatedTarget)) return;
          hide();
        }}
        onFocus={(e) => { if (e.currentTarget.matches(":focus-visible")) show(); }}
        onBlur={() => {
          requestAnimationFrame(() => {
            if (document.activeElement !== btn.current) hide();
          });
        }}
        onKeyDown={(e) => { if (e.key === "Escape") { e.stopPropagation(); hide(); } }}
      >{children}</button>
      <span
        id={tipId}
        ref={tip}
        popover="auto"
        role="tooltip"
        className="term-tip"
        onToggle={(e) => { const next = e.newState === "open"; setOpen(next); if (next) place(); }}
        onMouseLeave={() => { if (fine()) hide(); }}
      >{def.tip}</span>
    </span>
  );
}
