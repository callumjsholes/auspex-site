import { getData } from "@/lib/data";
import { SITE } from "@/lib/site";
import { pct, record, signed, units, stamp } from "@/lib/format";
import { summaryCopy } from "@/lib/clv";
import RecordCharts from "@/components/RecordCharts";
import RecordTable from "@/components/RecordTable";
import BankrollCalc from "@/components/BankrollCalc";

export const metadata = { title: "Record", description: "Every Auspex Sports pick since launch, graded at the posted price, with closing-line value." };

function ClvSummary({ clv }) {
  const copy = summaryCopy(clv.all, clv.leagues);
  return (
    <section className="clvsum" aria-labelledby="clv-h">
      <h2 id="clv-h">Closing-line value</h2>
      <p className="lede">{copy.sentence}</p>
      <div className="kpis three">
        <div><b className={"num " + copy.avgTone}>{copy.avg}</b><span>Average CLV, cents</span></div>
        <div><b className={"num " + copy.beatTone}>{copy.beat}</b><span>Beat the close</span></div>
        <div><b className={"num " + copy.nTone}>{copy.n}</b><span>{copy.sample}</span></div>
      </div>
    </section>
  );
}

function Kpis({ s }) {
  return (
    <div className="kpis">
      <div><b className="num">{record(s)}</b><span>Won–lost{s.pending ? `, ${s.pending} open` : ""}</span></div>
      <div><b className={"num " + (s.units > 0 ? "pos" : s.units < 0 ? "neg" : "")}>{s.bets ? units(s.units) : "–"}</b><span>Units</span></div>
      <div><b className="num">{s.roi != null ? `${signed(s.roi, 1)}%` : "–"}</b><span>ROI at the posted price</span></div>
      <div><b className="num">{s.clvN ? pct(s.beatClose) : "–"}</b><span>Beat the close, in points{s.clvN ? `, ${s.clvN} picks` : ""}</span></div>
    </div>
  );
}

export default function RecordPage() {
  const D = getData();
  return (
    <div className="page wrap">
      <div className="intro">
        <h1>The record</h1>
        <p className="lede">Every pick since {SITE.launch}, graded at the price and book it was posted at. {D.generatedAt ? `Updated ${stamp(D.generatedAt)}.` : ""}</p>
      </div>
      <Kpis s={D.sum.all} />
      <ClvSummary clv={D.clv} />
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
