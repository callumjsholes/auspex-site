import { signed, unitsFromMilli } from "@/lib/format";

// Cumulative units after each graded pick. Server-rendered SVG, no chart library.
export default function UnitsChart({ points, label = "Cumulative units after each graded pick" }) {
  const W = 720, H = 260, m = { l: 44, r: 16, t: 18, b: 30 };
  if (!points || points.length < 2) {
    return <div className="empty">The units line draws once two picks are graded.</div>;
  }
  const ys = points.map((p) => p.units).concat(0);
  let lo = Math.min(...ys), hi = Math.max(...ys);
  const pad = Math.max(0.5, (hi - lo) * 0.12); lo -= pad; hi += pad;
  const X = (i) => m.l + (i / (points.length - 1)) * (W - m.l - m.r);
  const Y = (v) => m.t + (1 - (v - lo) / (hi - lo)) * (H - m.t - m.b);
  const d = points.map((p, i) => `${i ? "L" : "M"}${X(i).toFixed(1)},${Y(p.units).toFixed(1)}`).join("");
  const area = `${d}L${X(points.length - 1).toFixed(1)},${Y(0).toFixed(1)}L${X(0).toFixed(1)},${Y(0).toFixed(1)}Z`;
  const last = points[points.length - 1];
  const raw = (hi - lo) / 4, mag = 10 ** Math.floor(Math.log10(raw)), step = [1, 2, 2.5, 5, 10].map((f) => f * mag).find((v) => v >= raw);
  const ticks = []; for (let t = Math.ceil(lo / step) * step; t <= hi; t += step) ticks.push(Math.round(t * 100) / 100);
  const up = last.units >= 0;
  const end = last.unitMilli != null ? unitsFromMilli(last.unitMilli) : `${signed(last.units, 2)} units`;
  return (
    <div className="chart-frame">
      <span className="chart-y">Units won</span>
      <div className="chart-plot">
    <svg className="chart" viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`${label}. The vertical axis is units won and the horizontal axis is picks. Latest: ${end} after ${points.length} picks.`}>
      {ticks.map((t, k) => (
        <g key={k}>
          <line x1={m.l} x2={W - m.r} y1={Y(t)} y2={Y(t)} stroke="var(--grid)" />
          <text x={m.l - 8} y={Y(t) + 4} textAnchor="end">{signed(t, 1)}</text>
        </g>
      ))}
      <line x1={m.l} x2={W - m.r} y1={Y(0)} y2={Y(0)} stroke="var(--ink)" strokeOpacity="0.28" />
      <path d={area} fill={up ? "var(--win)" : "var(--loss)"} opacity="0.08" />
      <path d={d} fill="none" stroke={up ? "var(--win)" : "var(--loss)"} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
      <circle cx={X(points.length - 1)} cy={Y(last.units)} r="3.5" fill={up ? "var(--win)" : "var(--loss)"} />
      <text x={m.l} y={H - 8}>Pick 1</text>
      <text x={W - m.r} y={H - 8} textAnchor="end">Pick {points.length}</text>
    </svg>
      </div>
      <span className="chart-x">Picks</span>
    </div>
  );
}
