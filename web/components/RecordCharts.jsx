"use client";
import { useMemo, useRef, useState } from "react";
import { odds, signed, units as fmtUnits, unitsFromMilli, dayShort, record } from "@/lib/format";
import { isGraded, summarize, runningTotals } from "@/lib/summary";

const LEAGUES = ["All", "NBA", "NHL"];
const STATS = [["all", "All markets"], ["pts", "Points"], ["reb", "Rebounds"], ["ast", "Assists"], ["ml", "NHL moneylines"]];
const graded = isGraded;

// Shared hover/keyboard logic for both charts: one index, a tooltip that follows it.
function useScrub(n) {
  const [i, setI] = useState(null);
  const onKey = (e) => {
    if (!n) return;
    if (e.key === "ArrowRight") { e.preventDefault(); setI((v) => Math.min(n - 1, v == null ? 0 : v + 1)); }
    if (e.key === "ArrowLeft") { e.preventDefault(); setI((v) => Math.max(0, v == null ? n - 1 : v - 1)); }
    if (e.key === "Home") setI(0);
    if (e.key === "End") setI(n - 1);
    if (e.key === "Escape") setI(null);
  };
  return { i, setI, onKey };
}

function Tip({ x, y, w, children }) {
  if (x == null) return null;
  const left = Math.min(Math.max(x - 110, 0), w - 220);
  return <div className="tip" style={{ left, top: Math.max(0, y - 12) }} role="status">{children}</div>;
}

function PickLine({ r }) {
  return (
    <>
      <b>{r.pick}</b>
      <span>{dayShort(r.date)}, {r.game}</span>
      <span>{odds(r.price)} {r.league === "NBA" ? `at ${r.book}` : "median"}, {r.stake}u. <em className={r.result === "Won" ? "pos" : r.result === "Lost" ? "neg" : ""}>{r.result} {r.units != null ? fmtUnits(r.units) : ""}</em></span>
    </>
  );
}

function UnitsCurve({ rows }) {
  const W = 760, H = 300, m = { l: 48, r: 18, t: 18, b: 30 };
  const pts = useMemo(() => runningTotals(rows).map((p) => ({ r: p.r, y: p.units, unitMilli: p.unitMilli })), [rows]);
  const { i, setI, onKey } = useScrub(pts.length);
  const box = useRef(null);
  const svg = useRef(null);
  if (pts.length < 2) return <div className="empty">The units line draws once two picks in this filter are graded.</div>;
  const ys = pts.map((p) => p.y).concat(0);
  let lo = Math.min(...ys), hi = Math.max(...ys); const pad = Math.max(0.5, (hi - lo) * 0.12); lo -= pad; hi += pad;
  const X = (k) => m.l + (k / (pts.length - 1)) * (W - m.l - m.r);
  const Y = (v) => m.t + (1 - (v - lo) / (hi - lo)) * (H - m.t - m.b);
  const raw = (hi - lo) / 4, mag = 10 ** Math.floor(Math.log10(raw)), step = [1, 2, 2.5, 5, 10].map((f) => f * mag).find((v) => v >= raw);
  const ticks = []; for (let t = Math.ceil(lo / step) * step; t <= hi; t += step) ticks.push(Math.round(t * 100) / 100);
  const d = pts.map((p, k) => `${k ? "L" : "M"}${X(k).toFixed(1)},${Y(p.y).toFixed(1)}`).join("");
  const last = pts[pts.length - 1].y, up = last >= 0, col = up ? "var(--win)" : "var(--loss)";
  const move = (e) => {
    const b = e.currentTarget.getBoundingClientRect();
    const k = Math.round((((e.clientX - b.left) / b.width) * W - m.l) / (W - m.l - m.r) * (pts.length - 1));
    setI(Math.max(0, Math.min(pts.length - 1, k)));
  };
  const cur = i != null ? pts[i] : null;
  const svgRect = svg.current?.getBoundingClientRect();
  const hostRect = box.current?.getBoundingClientRect();
  const scale = svgRect ? svgRect.width / W : 1;
  const dx = svgRect && hostRect ? svgRect.left - hostRect.left : 0;
  const dy = svgRect && hostRect ? svgRect.top - hostRect.top : 0;
  const end = unitsFromMilli(pts[pts.length - 1].unitMilli);
  return (
    <div className="chartbox" ref={box}>
      <div className="chart-frame">
        <span className="chart-y">Units won</span>
        <div className="chart-plot">
      <svg ref={svg} className="chart" viewBox={`0 0 ${W} ${H}`} tabIndex={0} onKeyDown={onKey} onMouseMove={move} onMouseLeave={() => setI(null)}
           onTouchStart={(e) => move(e.touches[0] ? { currentTarget: e.currentTarget, clientX: e.touches[0].clientX } : e)}
           role="img" aria-label={`Units won after each pick. ${pts.length} graded picks, ending at ${end}. The horizontal axis is picks. Use the arrow keys to step through picks.`}>
        {ticks.map((t) => (<g key={t}><line x1={m.l} x2={W - m.r} y1={Y(t)} y2={Y(t)} stroke="var(--line)" /><text x={m.l - 8} y={Y(t) + 4} textAnchor="end">{signed(t, step < 1 ? 1 : 0)}</text></g>))}
        <line x1={m.l} x2={W - m.r} y1={Y(0)} y2={Y(0)} stroke="var(--muted)" strokeDasharray="3 4" />
        <path d={`${d}L${X(pts.length - 1)},${Y(0)}L${X(0)},${Y(0)}Z`} fill={col} opacity="0.1" />
        <path d={d} fill="none" stroke={col} strokeWidth="2.5" strokeLinejoin="round" />
        {pts.length <= 120 && pts.map((p, k) => <circle key={k} cx={X(k)} cy={Y(p.y)} r="2.5" fill={p.r.result === "Won" ? "var(--win)" : p.r.result === "Lost" ? "var(--loss)" : "var(--muted)"} />)}
        {cur && (<g><line x1={X(i)} x2={X(i)} y1={m.t} y2={H - m.b} stroke="var(--ink)" strokeOpacity=".35" /><circle cx={X(i)} cy={Y(cur.y)} r="6" fill="var(--surface)" stroke={col} strokeWidth="2.5" /></g>)}
        <text x={m.l} y={H - 8}>Pick 1</text><text x={W - m.r} y={H - 8} textAnchor="end">Pick {pts.length}</text>
      </svg>
        </div>
        <span className="chart-x">Picks</span>
      </div>
      {cur && (
        <Tip x={dx + X(i) * scale} y={dy + Y(cur.y) * scale - 110} w={box.current ? box.current.clientWidth : W}>
          <span className="tip-total">Pick {i + 1}: {unitsFromMilli(cur.unitMilli)} total</span>
          <PickLine r={cur.r} />
        </Tip>
      )}
    </div>
  );
}

function ClvBars({ rows }) {
  const W = 760, H = 240, m = { l: 48, r: 18, t: 16, b: 30 };
  const data = rows.filter((r) => r.clv != null);
  const { i, setI, onKey } = useScrub(data.length);
  const box = useRef(null);
  if (!data.length) return <div className="empty">No closing prices in this filter yet.</div>;
  const ext = Math.max(2, ...data.map((r) => Math.abs(r.clv))) * 1.15;
  const bw = (W - m.l - m.r) / data.length;
  const Y = (v) => m.t + (1 - (v + ext) / (2 * ext)) * (H - m.t - m.b);
  let s = 0; const avg = data.map((r, k) => (s += r.clv) / (k + 1));
  const line = avg.map((v, k) => `${k ? "L" : "M"}${(m.l + bw * (k + 0.5)).toFixed(1)},${Y(v).toFixed(1)}`).join("");
  const move = (e) => { const b = e.currentTarget.getBoundingClientRect(); const k = Math.floor((((e.clientX - b.left) / b.width) * W - m.l) / bw); setI(Math.max(0, Math.min(data.length - 1, k))); };
  const cur = i != null ? data[i] : null;
  const scale = box.current ? box.current.clientWidth / W : 1;
  const tick = ext > 6 ? 5 : ext > 3 ? 2 : 1;
  const ticks = []; for (let t = -Math.floor(ext / tick) * tick; t <= ext; t += tick) ticks.push(t);
  return (
    <div className="chartbox" ref={box}>
      <svg className="chart" viewBox={`0 0 ${W} ${H}`} tabIndex={0} onKeyDown={onKey} onMouseMove={move} onMouseLeave={() => setI(null)}
           role="img" aria-label={`Closing-line value for ${data.length} picks, average ${signed(avg[avg.length - 1], 2)} points. Use the arrow keys to step through picks.`}>
        {ticks.map((t) => (<g key={t}><line x1={m.l} x2={W - m.r} y1={Y(t)} y2={Y(t)} stroke={t === 0 ? "var(--muted)" : "var(--line)"} /><text x={m.l - 8} y={Y(t) + 4} textAnchor="end">{signed(t, 0)}</text></g>))}
        {data.map((r, k) => {
          const y0 = Y(0), y1 = Y(r.clv);
          return <rect key={k} x={m.l + bw * k + bw * 0.15} width={Math.max(1, bw * 0.7)} y={Math.min(y0, y1)} height={Math.max(1, Math.abs(y1 - y0))}
                       fill={r.clv >= 0 ? "var(--win)" : "var(--loss)"} opacity={i == null || i === k ? 0.85 : 0.35} rx="1.5" />;
        })}
        <path d={line} fill="none" stroke="var(--bronze)" strokeWidth="2.5" />
        <text x={m.l} y={H - 8}>Oldest</text><text x={W - m.r} y={H - 8} textAnchor="end">Newest</text>
      </svg>
      {cur && (
        <Tip x={(m.l + bw * (i + 0.5)) * scale} y={Y(Math.max(cur.clv, 0)) * scale - 110} w={box.current ? box.current.clientWidth : W}>
          <span className="tip-total">CLV {signed(cur.clv, 1)} pts, running average {signed(avg[i], 2)}</span>
          <PickLine r={cur} />
        </Tip>
      )}
    </div>
  );
}

function Breakdown({ rows, by, label }) {
  const groups = useMemo(() => {
    const g = new Map();
    for (const r of rows) { const k = by(r); if (!k) continue; if (!g.has(k)) g.set(k, []); g.get(k).push(r); }
    return [...g.entries()].map(([k, v]) => ({ k, s: summarize(v) })).filter((x) => x.s.bets || x.s.clvN).sort((a, b) => b.s.bets - a.s.bets);
  }, [rows, by]);
  if (!groups.length) return null;
  return (
    <div className="tablewrap"><table>
      <thead><tr><th>{label}</th><th className="r">Record</th><th className="r">Units</th><th className="r">ROI</th><th className="r">Avg CLV</th></tr></thead>
      <tbody>{groups.map(({ k, s }) => (
        <tr key={k}><td>{k}</td><td className="r num">{record(s)}</td><td className={"r num " + (s.units > 0 ? "pos" : s.units < 0 ? "neg" : "")}>{s.bets ? unitsFromMilli(s.unitMilli) : "–"}</td>
          <td className="r num">{s.roi != null ? `${signed(s.roi, 1)}%` : "–"}</td><td className="r num">{s.avgClv != null ? signed(s.avgClv, 2) : "–"}</td></tr>))}</tbody>
    </table></div>
  );
}

const STAT_NAME = { pts: "Points", reb: "Rebounds", ast: "Assists", ml: "NHL moneyline" };

export default function RecordCharts({ rows }) {
  const [league, setLeague] = useState("All");
  const [stat, setStat] = useState("all");
  const [view, setView] = useState("units");
  const chrono = useMemo(() => [...rows].sort((a, b) => (a.date + (a.locked || "")).localeCompare(b.date + (b.locked || ""))), [rows]);
  const shown = useMemo(() => chrono.filter((r) => (league === "All" || r.league === league) && (stat === "all" || r.stat === stat)), [chrono, league, stat]);
  const done = shown.filter((r) => graded(r.result));
  const s = summarize(shown);
  const filtered = league !== "All" || stat !== "all";
  const statOpts = STATS.filter(([k]) => k === "all" || (league === "NHL" ? k === "ml" : league === "NBA" ? k !== "ml" : true));
  return (
    <section className="block" id="charts" aria-labelledby="charts-h" style={{ paddingTop: 40 }}>
      <div className="head">
        <div><h2 id="charts-h">Explore the record</h2><p className="lede">Filter by league and market. Hover or tap the chart, or use the arrow keys, to see each pick.{filtered ? "" : " With no filter, the totals match the top of this page."}</p></div>
      </div>
      <div className="filters">
        <div className="tabs" role="group" aria-label="League">
          {LEAGUES.map((l) => <button key={l} aria-pressed={league === l} onClick={() => { setLeague(l); setStat("all"); }}>{l === "All" ? "All picks" : l}</button>)}
        </div>
        <label>Market <select value={stat} onChange={(e) => setStat(e.target.value)}>{statOpts.map(([k, n]) => <option key={k} value={k}>{n}</option>)}</select></label>
        <div className="tabs" role="group" aria-label="Chart">
          <button aria-pressed={view === "units"} onClick={() => setView("units")}>Units</button>
          <button aria-pressed={view === "clv"} onClick={() => setView("clv")}>Closing-line value</button>
        </div>
      </div>
      <div className={filtered ? "split" : ""}>
        <div className="panel">{view === "units" ? <UnitsCurve rows={done} /> : <ClvBars rows={shown} />}</div>
        {filtered && (
          <div>
            <h3 className="filter-h">This filter</h3>
            <div className="stats">
              <div className="stat"><b className="num">{record(s)}</b><span>Record</span></div>
              <div className="stat"><b className={"num " + (s.units > 0 ? "pos" : s.units < 0 ? "neg" : "")}>{s.bets ? unitsFromMilli(s.unitMilli) : "–"}</b><span>Units</span></div>
              <div className="stat"><b className="num">{s.roi != null ? `${signed(s.roi, 1)}%` : "–"}</b><span>ROI at the posted price</span></div>
              <div className="stat"><b className="num">{s.beatClose != null ? `${s.beatClose.toFixed(0)}%` : "–"}</b><span>Beat the closing line{s.clvN ? `, ${s.clvN} picks` : ""}</span></div>
            </div>
          </div>
        )}
      </div>
      <div className="two-tables">
        <div><h3>By market</h3><Breakdown rows={shown} by={(r) => STAT_NAME[r.stat]} label="Market" /></div>
        <div><h3>By sportsbook</h3><Breakdown rows={shown.filter((r) => r.league === "NBA")} by={(r) => r.book} label="Book" /></div>
      </div>
    </section>
  );
}
