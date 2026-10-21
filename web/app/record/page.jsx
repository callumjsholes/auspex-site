import { getData } from "@/lib/data";
import { SITE } from "@/lib/site";
import { pct, record, signed, units, stamp } from "@/lib/format";
import RecordCharts from "@/components/RecordCharts";
import RecordTable from "@/components/RecordTable";
import BankrollCalc from "@/components/BankrollCalc";

export const metadata = { title: "Record", description: "Every Auspex Sports pick since launch, graded at the posted price, with closing-line value." };

function Kpis({ s }) {
  return (
    <div className="kpis">
      <div><b className="num">{record(s)}</b><span>Won–lost{s.pending ? `, ${s.pending} open` : ""}</span></div>
      <div><b className={"num " + (s.units > 0 ? "pos" : s.units < 0 ? "neg" : "")}>{s.bets ? units(s.units) : "–"}</b><span>Units</span></div>
      <div><b className="num">{s.roi != null ? `${signed(s.roi, 1)}%` : "–"}</b><span>ROI at the posted price</span></div>
      <div><b className="num">{s.clvN ? pct(s.beatClose) : "–"}</b><span>Beat the closing line{s.clvN ? `, ${s.clvN} picks` : ""}</span></div>
    </div>
  );
}

export default function RecordPage() {
  const D = getData();
  return (
    <div className="page wrap">
      <div className="intro">
        <h1>The record</h1>
        <p className="lede">Every pick since {SITE.launch}, graded at the price and book it was posted at. Closing-line value (CLV) is how many percentage points the market moved toward the pick after it posted. {D.generatedAt ? `Updated ${stamp(D.generatedAt)}.` : ""}</p>
      </div>
      <Kpis s={D.sum.all} />
      <RecordCharts rows={D.all} />
      <BankrollCalc rows={D.all} />
      <section className="block" aria-labelledby="all-h" style={{ paddingTop: 48 }}>
        <div className="head"><h2 id="all-h">Every pick</h2></div>
        <RecordTable rows={D.all} />
        <p className="note">Every pick keeps its lock time, price and closing price. A prop is void, not a win or loss, if the player doesn't play.</p>
      </section>
    </div>
  );
}
