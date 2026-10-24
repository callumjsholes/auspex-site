import { getData } from "@/lib/data";
import { SITE } from "@/lib/site";
import { pct, record, signed, unitsFromMilli, unitsWords, stamp } from "@/lib/format";
import RecordCharts from "@/components/RecordCharts";
import RecordTable from "@/components/RecordTable";
import BankrollCalc from "@/components/BankrollCalc";

export const metadata = { title: "Record", description: "Every Auspex Sports pick since launch, graded at the posted price, with closing-line value." };

function Kpis({ s }) {
  return (
    <div className="kpis">
      <div><b className="num">{record(s)}</b><span>Won–lost{s.pending ? `, ${s.pending} open` : ""}</span></div>
      <div><b className={"num " + (s.units > 0 ? "pos" : s.units < 0 ? "neg" : "")}>{s.bets ? unitsFromMilli(s.unitMilli) : "–"}</b><span>Units, 1% of a bankroll</span></div>
      <div><b className="num">{s.roi != null ? `${signed(s.roi, 1)}%` : "–"}</b><span>ROI at the posted price</span></div>
      <div><b className="num">{s.clvN ? pct(s.beatClose) : "–"}</b><span>Beat the closing line{s.clvN ? `, ${s.clvN} picks` : ""}</span></div>
    </div>
  );
}

function list(parts) {
  if (parts.length <= 1) return parts[0] || "";
  if (parts.length === 2) return `${parts[0]} and ${parts[1]}`;
  return `${parts.slice(0, -1).join(", ")}, and ${parts[parts.length - 1]}`;
}

function takeaway(s) {
  if (!s.bets) return "No graded picks yet. The record starts once the first slate settles.";
  const bits = [`${s.wins} win${s.wins === 1 ? "" : "s"}`, `${s.losses} loss${s.losses === 1 ? "" : "es"}`];
  if (s.pushes) bits.push(`${s.pushes} push${s.pushes === 1 ? "" : "es"}`);
  return `Since ${SITE.launch} I have ${list(bits)}, ${unitsWords(s.unitMilli)}, at the posted prices.`;
}

export default function RecordPage() {
  const D = getData();
  const s = D.sum.all;
  return (
    <div className="page wrap">
      <div className="intro">
        <h1>The record</h1>
        <p className="takeaway">{takeaway(s)}</p>
        <p className="lede">Every pick stays up, graded at the price and book I posted. Closing-line value (CLV) is how many percentage points the market moved toward the pick after I posted it. {D.generatedAt ? `Updated ${stamp(D.generatedAt)}.` : ""}</p>
        <nav className="jumps" aria-label="On this page">
          <a href="#charts">Charts</a>
          <a href="#calculator">Calculator</a>
          <a href="#every-pick">Every pick</a>
        </nav>
      </div>
      <Kpis s={s} />
      <RecordCharts rows={D.all} />
      <BankrollCalc rows={D.all} />
      <section className="block" id="every-pick" aria-labelledby="all-h" style={{ paddingTop: 48 }}>
        <div className="head"><h2 id="all-h">Every pick</h2></div>
        <RecordTable rows={D.all} />
        <p className="note">Every pick keeps its lock time, price and closing price. A prop is void, not a win or loss, if the player doesn't play.</p>
      </section>
    </div>
  );
}
