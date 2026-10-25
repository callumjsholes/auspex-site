"use client";
import { useMemo, useState } from "react";
import { odds, dayShort, resultLabel, resultTone, units, signed, centsBetter } from "@/lib/format";
import Term from "@/components/Term";
import { matchupPath } from "@/lib/teams";

// Price shopping in the table: NBA shows the typical book price, NHL the best single-book price at lock.
function shopSub(r) {
  const other = r.league === "NBA" ? r.typical : r.best;
  if (other == null || other === r.price) return null;
  const c = r.league === "NBA" ? centsBetter(r.price, other) : centsBetter(other, r.price);
  return <span className="sub">{r.league === "NBA" ? `typical ${odds(other)}` : `best ${odds(other)}`}{c > 0 ? `, ${c}¢` : ""}</span>;
}

export default function RecordTable({ rows }) {
  const [result, setResult] = useState("All");
  const shown = useMemo(() => rows.filter((r) => result === "All" || r.result === result), [rows, result]);
  const csv = () => {
    const head = ["date", "league", "game", "pick", "price", "book", "typical_price", "best_price", "stake", "result", "units", "clv_pts", "locked_at"];
    const lines = [head.join(",")].concat(shown.map((r) => [r.date, r.league, r.game, r.pick, r.price, r.book, r.typical ?? "", r.best ?? "", r.stake, r.result, r.units ?? "", r.clv ?? "", r.locked].map((v) => `"${String(v ?? "").replace(/"/g, '""')}"`).join(",")));
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([lines.join("\n")], { type: "text/csv" }));
    a.download = "auspex-record.csv"; a.click();
  };
  return (
    <>
      <div className="filters">
        <label>Result <select value={result} onChange={(e) => setResult(e.target.value)}><option>All</option><option>Won</option><option>Lost</option><option>Push</option><option value="Pending">Open</option><option>Void</option></select></label>
        <button className="btn line sm" onClick={csv}>Download CSV</button>
        <span className="count">{shown.length} pick{shown.length === 1 ? "" : "s"}</span>
      </div>
      <p className="note glossary">
        <Term k="odds">Price</Term> is American odds. <Term k="unit">Stake</Term> is in units, and 1 unit is 1% of a bankroll. <Term k="closing">CLV</Term> is how far the closing line moved after the pick was posted.
      </p>
      <div className="tablewrap picks-wrap">
        <table className="picks">
          <thead>
            <tr><th>Date</th><th>Pick</th><th className="r">Price</th><th>Book</th><th className="r">Stake</th><th className="r">CLV</th><th className="r">Result</th><th className="r">Units</th></tr>
          </thead>
          <tbody>
            {shown.length === 0 && <tr><td colSpan={8} className="muted pick-main">Nothing matches this filter.</td></tr>}
            {shown.map((r) => {
              const href = matchupPath(r.league, r.date, r.game);
              return (
              <tr key={r.id}>
                <td className="num" data-label="Date"><span className="cell">{dayShort(r.date)}</span></td>
                <td className="pick-main" data-label="Pick"><span className="cell"><span className={"tag " + r.league.toLowerCase()}>{r.league}</span>{r.pick}<span className="sub">{href ? <a href={href}>{r.game}</a> : r.game}{r.actual != null ? `, finished ${r.actual}` : ""}</span></span></td>
                <td className="r num" data-label="Price"><span className="cell">{odds(r.price)}{shopSub(r)}</span></td>
                <td className="muted" data-label="Book"><span className="cell">{r.book}</span></td>
                <td className="r num" data-label="Stake"><span className="cell">{r.stake}u</span></td>
                <td className={"r num " + (r.clv > 0 ? "pos" : r.clv < 0 ? "neg" : "muted")} data-label="CLV"><span className="cell">{r.clv == null ? "–" : `${signed(r.clv, 1)}`}</span></td>
                <td className={"r " + resultTone(r.result)} data-label="Result"><span className="cell">{resultLabel(r.result)}</span></td>
                <td className={"r num " + resultTone(r.result)} data-label="Units"><span className="cell">{r.units == null ? "–" : units(r.units)}</span></td>
              </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}
