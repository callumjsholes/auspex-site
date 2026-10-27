"use client";

import { useMemo, useState } from "react";
import RecordCharts from "@/components/RecordCharts";
import RecordTable from "@/components/RecordTable";
import BankrollCalc from "@/components/BankrollCalc";
import { pct, record, signed, unitsFromMilli } from "@/lib/format";
import { clvFromRows, summaryCopy } from "@/lib/clv";
import { summarize } from "@/lib/summary";
import { recordSentence } from "@/lib/recordText";

const LEAGUES = ["All", "NBA", "NHL"];
const RANGES = [["all", "All time"], ["7", "Last 7 days"], ["30", "Last 30 days"]];

function ymd(date) {
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${m}-${d}`;
}

// Last N calendar days in the visitor's time zone, including today.
function sinceYmd(days) {
  const dt = new Date();
  dt.setHours(12, 0, 0, 0);
  dt.setDate(dt.getDate() - (days - 1));
  return ymd(dt);
}

function Kpis({ s }) {
  return (
    <div className="kpis">
      <div><b className="num">{record(s)}</b><span>Won–lost{s.pending ? `, ${s.pending} open` : ""}</span></div>
      <div><b className={"num " + (s.units > 0 ? "pos" : s.units < 0 ? "neg" : "")}>{s.bets ? unitsFromMilli(s.unitMilli) : "–"}</b><span>Units, 1% of a bankroll</span></div>
      <div><b className="num">{s.roi != null ? `${signed(s.roi, 1)}%` : "–"}</b><span>ROI at the posted price</span></div>
      <div><b className="num">{s.clvN ? pct(s.beatClose) : "–"}</b><span>Beat the close, in points{s.clvN ? `, ${s.clvN} picks` : ""}</span></div>
    </div>
  );
}

// All time uses the published totals for that league. A date window uses the cents on the picks in view.
function viewClv(clv, league, range, shown) {
  const label = league === "NBA" || league === "NHL" ? league : null;
  if (range !== "all" || !clv) return { block: clvFromRows(shown), leagues: label };
  if (league === "NBA") return { block: clv.nba || null, leagues: clv.nba ? "NBA" : null };
  if (league === "NHL") return { block: clv.nhl || null, leagues: clv.nhl ? "NHL" : null };
  return { block: clv.all || null, leagues: clv.leagues || null };
}

export default function RecordBoard({ rows, launch, updated, clv }) {
  const [league, setLeague] = useState("All");
  const [range, setRange] = useState("all");
  const cutoff = range === "all" ? null : sinceYmd(Number(range));
  const leagueRows = useMemo(
    () => rows.filter((r) => league === "All" || r.league === league),
    [rows, league],
  );
  const shown = useMemo(
    () => (cutoff ? leagueRows.filter((r) => r.date >= cutoff) : leagueRows),
    [leagueRows, cutoff],
  );
  const s = summarize(shown);
  const leagueSum = summarize(leagueRows);
  const view = viewClv(clv, league, range, shown);
  const copy = summaryCopy(view.block, view.leagues);
  const coversAll = range !== "all" && s.bets === leagueSum.bets && s.unitMilli === leagueSum.unitMilli && s.bets > 0;
  const coverNote = league === "All"
    ? `The live record only goes back to ${launch}, so this window is the whole set.`
    : `${league} picks only go back to ${launch}, so this window is the whole set.`;
  return (
    <div className="page wrap">
      <div className="intro">
        <h1>The record</h1>
        <p className="takeaway">{recordSentence(s, { launch, league, range })}</p>
        {coversAll && <p className="note filter-note">{coverNote}</p>}
        <p className="lede">Every pick stays up, graded at the price and book I posted. Closing-line value (CLV) is how many cents the locked price beat the closing median by. {updated ? `Updated ${updated}. ` : ""}Games have their own pages: <a href="/nba">NBA</a> and <a href="/nhl">NHL</a>. Charts and splits are on <a href="/stats">stats</a>.</p>
        <nav className="jumps" aria-label="On this page">
          <a href="/stats">Stats page</a>
          <a href="#clv">Closing line</a>
          <a href="#charts">Charts</a>
          <a href="#calculator">Calculator</a>
          <a href="#every-pick">Every pick</a>
        </nav>
      </div>
      <div className="filters record-filters">
        <div className="tabs" role="group" aria-label="League">
          {LEAGUES.map((l) => (
            <button key={l} type="button" aria-pressed={league === l} onClick={() => setLeague(l)}>{l === "All" ? "All" : l}</button>
          ))}
        </div>
        <div className="tabs" role="group" aria-label="Dates">
          {RANGES.map(([k, label]) => (
            <button key={k} type="button" aria-pressed={range === k} onClick={() => setRange(k)}>{label}</button>
          ))}
        </div>
      </div>
      <Kpis s={s} />
      <section className="clvsum" id="clv" aria-labelledby="clv-h">
        <h2 id="clv-h">Closing-line value</h2>
        <p className="lede">{copy.sentence}</p>
        <div className="kpis three">
          <div><b className={"num " + copy.avgTone}>{copy.avg}</b><span>Average CLV, cents</span></div>
          <div><b className={"num " + copy.beatTone}>{copy.beat}</b><span>Beat the close</span></div>
          <div><b className={"num " + copy.nTone}>{copy.n}</b><span>{copy.sample}</span></div>
        </div>
      </section>
      <RecordCharts rows={shown} league={league} />
      <BankrollCalc rows={shown} />
      <section className="block" id="every-pick" aria-labelledby="all-h">
        <div className="head"><h2 id="all-h">Every pick</h2></div>
        <RecordTable rows={shown} />
        <p className="note">Every pick keeps its lock time, price and closing price. A prop is void, not a win or loss, if the player doesn't play.</p>
      </section>
    </div>
  );
}
