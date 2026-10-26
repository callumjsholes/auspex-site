"use client";

import { useEffect, useRef, useState } from "react";

const H = 260;
const M = { l: 52, r: 16, t: 16, b: 36 };

function usePlotWidth() {
  const ref = useRef(null);
  const [width, setWidth] = useState(640);
  useEffect(() => {
    const el = ref.current;
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
  return [ref, width];
}

function ticks(lo, hi, count) {
  if (!(hi > lo)) return [lo];
  const step = (hi - lo) / count;
  const out = [];
  for (let i = 0; i <= count; i++) out.push(lo + step * i);
  return out;
}

export function BetaChart({ density, price, mean, aria }) {
  const [ref, width] = usePlotWidth();
  if (!density?.length) return <div className="empty">No hit-rate posterior in this publish.</div>;
  const xs = density.map((d) => d.x);
  const ys = density.map((d) => d.y);
  const lo = Math.min(...xs);
  const hi = Math.max(...xs);
  const top = Math.max(...ys, 1e-9);
  const X = (x) => M.l + ((x - lo) / (hi - lo)) * (width - M.l - M.r);
  const Y = (y) => M.t + (1 - y / top) * (H - M.t - M.b);
  const line = density.map((d, i) => `${i ? "L" : "M"}${X(d.x).toFixed(1)},${Y(d.y).toFixed(1)}`).join("");
  const area = `${line}L${X(density[density.length - 1].x).toFixed(1)},${Y(0).toFixed(1)}L${X(density[0].x).toFixed(1)},${Y(0).toFixed(1)}Z`;
  const xTicks = ticks(lo, hi, 4);
  return (
    <div className="chartbox">
      <div className="chart-frame">
        <span className="chart-y">Density</span>
        <div className="chart-plot" ref={ref}>
          <svg className="chart linechart" viewBox={`0 0 ${width} ${H}`} role="img" aria-label={aria}>
            {xTicks.map((t) => (
              <text key={t} x={X(t)} y={H - 12} textAnchor="middle">{`${Math.round(t * 100)}%`}</text>
            ))}
            <path d={area} fill="var(--bronze)" opacity="0.18" />
            <path d={line} fill="none" stroke="var(--ink)" strokeWidth="2" />
            {price != null && <line x1={X(price)} x2={X(price)} y1={M.t} y2={H - M.b} stroke="var(--bronze)" strokeDasharray="4 4" />}
            {mean != null && <line x1={X(mean)} x2={X(mean)} y1={M.t} y2={H - M.b} stroke="var(--ink)" strokeOpacity="0.45" />}
          </svg>
        </div>
        <span className="chart-x">Hit rate</span>
      </div>
    </div>
  );
}

export function FanChart({ fan, aria }) {
  const [ref, width] = usePlotWidth();
  if (!fan?.p50?.length) return <div className="empty">The fan draws once two picks are graded.</div>;
  const series = [fan.p5, fan.p25, fan.p50, fan.p75, fan.p95];
  const flat = series.flat();
  let lo = Math.min(0, ...flat);
  let hi = Math.max(0, ...flat);
  const pad = Math.max((hi - lo) * 0.08, 1);
  lo -= pad;
  hi += pad;
  const n = fan.p50.length;
  const X = (i) => M.l + (i / (n - 1)) * (width - M.l - M.r);
  const Y = (v) => M.t + (1 - (v - lo) / (hi - lo)) * (H - M.t - M.b);
  const band = (a, b) => {
    const top = a.map((v, i) => `${i ? "L" : "M"}${X(i).toFixed(1)},${Y(v).toFixed(1)}`).join("");
    const bot = b.map((v, i) => `L${X(n - 1 - i).toFixed(1)},${Y(b[n - 1 - i]).toFixed(1)}`).join("");
    return `${top}${bot}Z`;
  };
  const mid = fan.p50.map((v, i) => `${i ? "L" : "M"}${X(i).toFixed(1)},${Y(v).toFixed(1)}`).join("");
  const yTicks = ticks(lo, hi, 4);
  const xAt = [0, Math.round((n - 1) / 2), n - 1];
  return (
    <div className="chartbox">
      <div className="chart-frame">
        <span className="chart-y">Units</span>
        <div className="chart-plot" ref={ref}>
          <svg className="chart linechart" viewBox={`0 0 ${width} ${H}`} role="img" aria-label={aria}>
            {yTicks.map((t) => (
              <g key={t}>
                <line x1={M.l} x2={width - M.r} y1={Y(t)} y2={Y(t)} stroke="var(--line)" />
                <text x={M.l - 8} y={Y(t) + 4} textAnchor="end">{Math.round(t)}</text>
              </g>
            ))}
            <line x1={M.l} x2={width - M.r} y1={Y(0)} y2={Y(0)} stroke="var(--ink)" strokeOpacity="0.35" />
            <path d={band(fan.p95, fan.p5)} fill="var(--bronze)" opacity="0.16" />
            <path d={band(fan.p75, fan.p25)} fill="var(--bronze)" opacity="0.32" />
            <path d={mid} fill="none" stroke="var(--ink)" strokeWidth="2" />
            {xAt.map((i) => (
              <text key={i} x={X(i)} y={H - 12} textAnchor={i === 0 ? "start" : i === n - 1 ? "end" : "middle"}>{i + 1}</text>
            ))}
          </svg>
        </div>
        <span className="chart-x">Picks ahead, reshuffled from this record</span>
      </div>
    </div>
  );
}

export function FunnelChart({ funnel, aria }) {
  const [ref, width] = usePlotWidth();
  const points = funnel?.points || [];
  const limits = funnel?.limits || [];
  if (points.length < 2 || !limits.length) return <div className="empty">The funnel needs at least two splits.</div>;
  const ys = [...points.map((p) => p.roi), ...limits.flatMap((r) => [r.lo, r.hi]), funnel.center];
  let lo = Math.min(...ys);
  let hi = Math.max(...ys);
  const pad = Math.max((hi - lo) * 0.08, 1);
  lo -= pad;
  hi += pad;
  const ns = points.map((p) => p.n);
  const nLo = Math.max(1, Math.min(...ns, ...limits.map((r) => r.n)));
  const nHi = Math.max(...ns, ...limits.map((r) => r.n));
  const logN = (n) => Math.log(Math.max(n, 1));
  const span = logN(nHi) - logN(nLo);
  const X = (n) => M.l + (span > 0 ? (logN(n) - logN(nLo)) / span : 0.5) * (width - M.l - M.r);
  const Y = (v) => M.t + (1 - (v - lo) / (hi - lo)) * (H - M.t - M.b);
  const curve = (key) => limits.map((r, i) => `${i ? "L" : "M"}${X(r.n).toFixed(1)},${Y(r[key]).toFixed(1)}`).join("");
  const yTicks = ticks(lo, hi, 4);
  const xTicks = [...new Set([nLo, Math.exp((logN(nLo) + logN(nHi)) / 2), nHi].map((n) => Math.max(1, Math.round(n))))];
  return (
    <div className="chartbox">
      <div className="chart-frame">
        <span className="chart-y">ROI</span>
        <div className="chart-plot" ref={ref}>
          <svg className="chart linechart" viewBox={`0 0 ${width} ${H}`} role="img" aria-label={aria}>
            {yTicks.map((t) => (
              <g key={t}>
                <line x1={M.l} x2={width - M.r} y1={Y(t)} y2={Y(t)} stroke="var(--line)" />
                <text x={M.l - 8} y={Y(t) + 4} textAnchor="end">{`${Math.round(t)}%`}</text>
              </g>
            ))}
            <path d={curve("hi")} fill="none" stroke="var(--bronze)" strokeDasharray="5 4" />
            <path d={curve("lo")} fill="none" stroke="var(--bronze)" strokeDasharray="5 4" />
            <line x1={M.l} x2={width - M.r} y1={Y(funnel.center)} y2={Y(funnel.center)} stroke="var(--ink)" strokeOpacity="0.45" />
            {points.map((p) => {
              const lim = limits.reduce((best, row) => (Math.abs(row.n - p.n) < Math.abs(best.n - p.n) ? row : best), limits[0]);
              const out = p.outside != null ? p.outside : p.roi < lim.lo || p.roi > lim.hi;
              return (
                <circle key={p.key} cx={X(p.n)} cy={Y(p.roi)} r={out ? 5 : 3.5} fill={out ? "var(--surface)" : "var(--ink)"} stroke="var(--ink)" strokeWidth={out ? 2 : 0}>
                  <title>{`${p.key}, ${p.n} graded, ${Math.round(p.roi)}% ROI`}</title>
                </circle>
              );
            })}
            {xTicks.map((n) => (
              <text key={n} x={X(n)} y={H - 12} textAnchor="middle">{n}</text>
            ))}
          </svg>
        </div>
        <span className="chart-x">Graded picks in the split</span>
      </div>
    </div>
  );
}
