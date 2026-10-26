"use client";

import { useEffect, useRef, useState } from "react";
import { formatCents } from "@/lib/clv";
import { dayShort, signed } from "@/lib/format";

const H = 260;
const M = { l: 54, r: 14, t: 16, b: 36 };

function domain(values) {
  let lo = Math.min(0, ...values);
  let hi = Math.max(0, ...values);
  if (!Number.isFinite(lo) || !Number.isFinite(hi)) return [-1, 1];
  const pad = Math.max(Math.abs(hi - lo) * 0.12, 0.5);
  lo -= pad;
  hi += pad;
  if (!(hi > lo)) {
    hi += 1;
    lo -= 1;
  }
  return [lo, hi];
}

function axisTicks(lo, hi) {
  const span = hi - lo;
  if (!(span > 0)) return [0];
  const raw = span / 4;
  const mag = 10 ** Math.floor(Math.log10(raw));
  const step = [1, 2, 2.5, 5, 10].map((f) => f * mag).find((v) => v >= raw) || raw;
  const ticks = [];
  for (let t = Math.ceil((lo - 1e-9) / step) * step; t <= hi + step * 1e-6; t += step) {
    ticks.push(Math.round(t * 1000) / 1000);
    if (ticks.length > 8) break;
  }
  return { ticks, step };
}

function tickText(t, kind, step) {
  const d = step < 1 ? 1 : 0;
  if (kind === "roi") return `${signed(t, d)}%`;
  if (kind === "cents") return formatCents(t) || signed(t, d);
  return signed(t, d);
}

function dateMarks(points) {
  const spans = [];
  let start = 0;
  for (let i = 1; i <= points.length; i++) {
    if (i === points.length || points[i].date !== points[start].date) {
      spans.push({ date: points[start].date, mid: (start + (i - 1)) / 2 });
      start = i;
    }
  }
  return spans;
}

export default function LineChart({ points, yLabel, xLabel, kind = "units", tone = "ink", aria, summary, empty }) {
  const plotRef = useRef(null);
  const [width, setWidth] = useState(640);
  const [i, setI] = useState(null);
  useEffect(() => {
    const el = plotRef.current;
    if (!el) return undefined;
    const apply = () => {
      const w = Math.floor(el.clientWidth);
      if (w > 0) setWidth(Math.max(280, w));
    };
    apply();
    const ro = new ResizeObserver(apply);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  if (!points || points.length < 2) {
    return <div className="empty">{empty || "The line draws once two picks are in this chart."}</div>;
  }
  const [lo, hi] = domain(points.map((p) => p.y));
  const { ticks, step } = axisTicks(lo, hi);
  const X = (k) => M.l + (k / (points.length - 1)) * (width - M.l - M.r);
  const Y = (v) => M.t + (1 - (v - lo) / (hi - lo)) * (H - M.t - M.b);
  const d = points.map((p, k) => `${k ? "L" : "M"}${X(k).toFixed(1)},${Y(p.y).toFixed(1)}`).join("");
  const area = `${d}L${X(points.length - 1).toFixed(1)},${Y(0).toFixed(1)}L${X(0).toFixed(1)},${Y(0).toFixed(1)}Z`;
  const last = points[points.length - 1].y;
  const stroke = tone === "result" ? (last >= 0 ? "var(--win)" : "var(--loss)") : tone === "bronze" ? "var(--bronze)" : "var(--ink)";
  const marks = dateMarks(points);
  const kept = [];
  let lastX = -Infinity;
  marks.forEach((s, idx) => {
    const x = X(s.mid);
    const edge = idx === 0 || idx === marks.length - 1;
    if (edge || x - lastX >= 64) {
      kept.push(s);
      lastX = x;
    }
  });
  const scrub = (e) => {
    const b = e.currentTarget.getBoundingClientRect();
    if (!b.width) return;
    const x = ((e.clientX - b.left) / b.width) * width;
    const plot = width - M.l - M.r;
    const k = Math.round(((x - M.l) / plot) * (points.length - 1));
    setI(Math.max(0, Math.min(points.length - 1, k)));
  };
  const onKey = (e) => {
    const n = points.length;
    if (e.key === "ArrowRight") { e.preventDefault(); setI((v) => Math.min(n - 1, v == null ? 0 : v + 1)); }
    if (e.key === "ArrowLeft") { e.preventDefault(); setI((v) => Math.max(0, v == null ? n - 1 : v - 1)); }
    if (e.key === "Home") { e.preventDefault(); setI(0); }
    if (e.key === "End") { e.preventDefault(); setI(n - 1); }
    if (e.key === "Escape") setI(null);
  };
  const cur = i != null ? points[i] : null;
  return (
    <div className="chartbox">
      <div className="chart-frame">
        <span className="chart-y">{yLabel}</span>
        <div className="chart-plot" ref={plotRef}>
          <svg
            className="chart linechart"
            viewBox={`0 0 ${width} ${H}`}
            tabIndex={0}
            role="img"
            aria-label={`${aria} Use the arrow keys to step through picks.`}
            onKeyDown={onKey}
            onPointerMove={scrub}
            onPointerLeave={(e) => { if (e.pointerType === "mouse") setI(null); }}
          >
            {ticks.map((t) => (
              <g key={t}>
                <line x1={M.l} x2={width - M.r} y1={Y(t)} y2={Y(t)} stroke="var(--line)" />
                <text x={M.l - 8} y={Y(t) + 4} textAnchor="end">{tickText(t, kind, step)}</text>
              </g>
            ))}
            <line x1={M.l} x2={width - M.r} y1={Y(0)} y2={Y(0)} stroke="var(--ink)" strokeOpacity="0.28" />
            <path d={area} fill={stroke} opacity="0.08" />
            <path d={d} fill="none" stroke={stroke} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
            <circle cx={X(points.length - 1)} cy={Y(last)} r="3.5" fill={stroke} />
            {cur && (
              <g>
                <line x1={X(i)} x2={X(i)} y1={M.t} y2={H - M.b} stroke="var(--ink)" strokeOpacity="0.35" />
                <circle cx={X(i)} cy={Y(cur.y)} r="6" fill="var(--surface)" stroke={stroke} strokeWidth="2.5" />
              </g>
            )}
            {kept.map((s) => {
              const x = X(s.mid);
              const anchor = x < M.l + 28 ? "start" : x > width - M.r - 28 ? "end" : "middle";
              return <text key={s.date || x} x={x} y={H - 10} textAnchor={anchor}>{dayShort(s.date)}</text>;
            })}
          </svg>
        </div>
        <span className="chart-x">{xLabel}</span>
      </div>
      <p className="scrub" role="status">{cur ? cur.text : summary}</p>
    </div>
  );
}
