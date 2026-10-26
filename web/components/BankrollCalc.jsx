"use client";
import { useMemo, useState } from "react";

// "What if I'd followed every pick?" Runs in the browser on the public graded record only.
// Each graded pick's `units` is its profit in units at the posted price (stake included), so a
// dollar result is units × unit size. "Grows with bankroll" resizes the unit before every pick.
const graded = (r) => r === "Won" || r === "Lost" || r === "Push";
const money = (v) => (v < 0 ? "−$" : "$") + Math.abs(v).toLocaleString("en-US", { maximumFractionDigits: 0 });

export function simulate(rows, { bankroll, pct, mode }) {
  const picks = rows
    .filter((r) => graded(r.result) && r.units != null)
    .sort((a, b) => (a.date + (a.locked || "")).localeCompare(b.date + (b.locked || "")));
  let bank = bankroll;
  let peak = bankroll;
  let worst = 0;
  const path = [bankroll];
  for (const r of picks) {
    const unit = (mode === "grow" ? bank : bankroll) * (pct / 100);
    bank += r.units * unit;
    path.push(bank);
    peak = Math.max(peak, bank);
    worst = Math.min(worst, bank - peak);
  }
  return { picks: picks.length, end: bank, profit: bank - bankroll, ret: bankroll ? (100 * (bank - bankroll)) / bankroll : 0, worst, path };
}

function Spark({ path, start }) {
  if (path.length < 3) return null;
  const W = 640, H = 120, pad = 6;
  const lo = Math.min(...path), hi = Math.max(...path);
  const span = hi - lo || 1;
  const x = (i) => pad + (i * (W - 2 * pad)) / (path.length - 1);
  const y = (v) => H - pad - ((v - lo) * (H - 2 * pad)) / span;
  const d = path.map((v, i) => `${i ? "L" : "M"}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(" ");
  return (
    <svg className="chart" viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Bankroll after each pick" style={{ marginTop: 16 }}>
      <line x1={pad} x2={W - pad} y1={y(start)} y2={y(start)} stroke="var(--line)" strokeDasharray="4 4" />
      <path d={d} fill="none" stroke={path[path.length - 1] >= start ? "var(--win)" : "var(--loss)"} strokeWidth="2" />
    </svg>
  );
}

export default function BankrollCalc({ rows }) {
  const [bankroll, setBankroll] = useState(1000);
  const [pct, setPct] = useState(1);
  const [mode, setMode] = useState("flat");
  const ok = bankroll > 0 && pct > 0 && pct <= 10;
  const r = useMemo(() => (ok ? simulate(rows, { bankroll, pct, mode }) : null), [rows, bankroll, pct, mode, ok]);
  return (
    <section className="block" id="calculator" aria-labelledby="calc-h">
      <div className="head">
        <div>
          <h2 id="calc-h">If you'd followed every pick</h2>
          <p className="lede">Pick a bankroll and a unit size. This replays the graded picks in the filter above, at the posted prices, in order.</p>
        </div>
      </div>
      <div className="calc">
        <div className="inputs">
          <label>Starting bankroll ($)<input type="number" min="1" step="50" value={bankroll} onChange={(e) => setBankroll(Number(e.target.value))} /></label>
          <label>1 unit (% of bankroll)<input type="number" min="0.1" max="10" step="0.5" value={pct} onChange={(e) => setPct(Number(e.target.value))} /></label>
          <label>Unit size<select value={mode} onChange={(e) => setMode(e.target.value)}><option value="flat">Stays the same</option><option value="grow">Grows with bankroll</option></select></label>
        </div>
        {!ok ? <div className="empty">Use a bankroll above $0 and a unit between 0.1% and 10%.</div>
          : !r.picks ? <div className="empty">No graded picks in this filter yet.</div> : (
          <>
            <div className="out">
              <div><b className="num">{money(r.end)}</b><span>Bankroll now</span></div>
              <div><b className={"num " + (r.profit > 0 ? "pos" : r.profit < 0 ? "neg" : "")}>{r.profit >= 0 ? "+" : ""}{money(r.profit)}</b><span>Profit</span></div>
              <div><b className={"num " + (r.ret > 0 ? "pos" : r.ret < 0 ? "neg" : "")}>{r.ret >= 0 ? "+" : "−"}{Math.abs(r.ret).toFixed(1)}%</b><span>Return on bankroll</span></div>
              <div><b className="num">{r.worst < 0 ? money(r.worst) : "$0"}</b><span>Worst drop from a high</span></div>
            </div>
            <Spark path={r.path} start={bankroll} />
            <p className="note">{r.picks} graded pick{r.picks === 1 ? "" : "s"}. NBA props are graded at the best price across the books we track, so a single book can pay less. Past results don't guarantee future ones; bet only what you can afford to lose.</p>
          </>
        )}
      </div>
    </section>
  );
}
