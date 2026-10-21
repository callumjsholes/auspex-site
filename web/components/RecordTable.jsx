"use client";
import { useMemo, useState } from "react";
import { odds, dayShort, resultLabel, resultTone, units, signed } from "@/lib/format";

export default function RecordTable({ rows }) {
  const [league, setLeague] = useState("All");
  const [result, setResult] = useState("All");
  const shown = useMemo(() => rows.filter((r) => (league === "All" || r.league === league) && (result === "All" || r.result === result)), [rows, league, result]);
  const csv = () => {
    const head = ["date", "league", "game", "pick", "price", "book", "stake", "result", "units", "clv_pts", "locked_at"];
    const lines = [head.join(",")].concat(shown.map((r) => [r.date, r.league, r.game, r.pick, r.price, r.book, r.stake, r.result, r.units ?? "", r.clv ?? "", r.locked].map((v) => `"${String(v ?? "").replace(/"/g, '""')}"`).join(",")));
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([lines.join("\n")], { type: "text/csv" }));
    a.download = "auspex-record.csv"; a.click();
  };
  return (
    <>
      <div className="filters">
        <label>League <select value={league} onChange={(e) => setLeague(e.target.value)}><option>All</option><option>NBA</option><option>NHL</option></select></label>
        <label>Result <select value={result} onChange={(e) => setResult(e.target.value)}><option>All</option><option>Won</option><option>Lost</option><option>Push</option><option value="Pending">Open</option><option>Void</option></select></label>
        <button className="btn line" style={{ padding: "7px 14px", fontSize: 14 }} onClick={csv}>Download CSV</button>
        <span className="muted" style={{ fontSize: 14 }}>{shown.length} pick{shown.length === 1 ? "" : "s"}</span>
      </div>
      <div className="tablewrap">
        <table>
          <thead>
            <tr><th>Date</th><th>Pick</th><th className="r">Price</th><th>Book</th><th className="r">Stake</th><th className="r">CLV</th><th className="r">Result</th><th className="r">Units</th></tr>
          </thead>
          <tbody>
            {shown.length === 0 && <tr><td colSpan={8} className="muted">Nothing matches this filter.</td></tr>}
            {shown.map((r) => (
              <tr key={r.id}>
                <td className="num">{dayShort(r.date)}</td>
                <td><span className={"tag " + r.league.toLowerCase()}>{r.league}</span>{r.pick}<span className="sub">{r.game}{r.actual != null ? `, finished ${r.actual}` : ""}</span></td>
                <td className="r num">{odds(r.price)}</td>
                <td className="muted">{r.book}</td>
                <td className="r num">{r.stake}u</td>
                <td className={"r num " + (r.clv > 0 ? "pos" : r.clv < 0 ? "neg" : "muted")}>{r.clv == null ? "–" : `${signed(r.clv, 1)}`}</td>
                <td className={"r " + resultTone(r.result)}>{resultLabel(r.result)}</td>
                <td className={"r num " + resultTone(r.result)}>{r.units == null ? "–" : units(r.units)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
