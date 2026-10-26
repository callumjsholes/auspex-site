import CalChart from "@/components/CalChart";
import LineChart from "@/components/LineChart";
import RigorSection from "@/components/RigorSection";
import { BookSection, Breakeven, ClvBands, RollingSection, ShapeSection, ShoppingSection, SideSection, SplitTable, TeamSection, TestsSection, WhenSection } from "@/components/StatsMore";
import { formatCents } from "@/lib/clv";
import { dayShort, dayTitle, pct, record, resultLabel, signed, unitsFromMilli } from "@/lib/format";
import { recordSentence } from "@/lib/recordText";
import { RESPONSIBLE } from "@/lib/site";
import { englishList } from "@/lib/stats";
import { toMilli as milli } from "@/lib/summary";

function roiText(roi) {
  return roi == null ? "–" : `${signed(roi, 1)}%`;
}

function unitText(value) {
  if (value == null) return "–";
  return unitsFromMilli(value);
}

function stakeText(summary) {
  if (!summary.bets) return "–";
  return unitsFromMilli(milli(summary.staked)).replace(/^\+/, "").replace(/\.00u$/, "u");
}

function toneOf(milliValue) {
  if (milliValue > 0) return "pos";
  if (milliValue < 0) return "neg";
  return "";
}

function unitsPoint(p) {
  return {
    i: p.i,
    date: p.date,
    y: p.units,
    text: `Pick ${p.i}, ${dayShort(p.date)}: ${p.label}. ${resultLabel(p.result)} ${unitText(p.pickMilli)}. Total ${unitText(p.unitMilli)}. ROI ${roiText(p.roi)}.`,
  };
}

function roiPoint(p) {
  return {
    i: p.i,
    date: p.date,
    y: p.roi,
    text: `Pick ${p.i}, ${dayShort(p.date)}: ${p.label}. ROI ${roiText(p.roi)} after ${p.i} graded picks. Total ${unitText(p.unitMilli)}.`,
  };
}

function centsPoint(p) {
  return {
    i: p.i,
    date: p.date,
    y: p.avg,
    text: `Pick ${p.i}, ${dayShort(p.date)}: ${p.label}. ${resultLabel(p.result)}. This pick ${formatCents(p.cents)}. Average ${formatCents(p.avg)}.`,
  };
}

function scopeNote(model) {
  const parts = [];
  const n = model.summary.pending;
  if (n) {
    const days = model.pendingDates.map(dayShort);
    const when = days.length ? ` (${englishList(days)})` : "";
    parts.push(`${n} ${n === 1 ? "pick is" : "picks are"} still open${when}. Open picks are not in the units or the ROI.`);
  }
  if (model.centsOpen > 0) {
    parts.push(model.centsOpen === 1
      ? "Closing-line value still counts an open pick that already has a cents figure."
      : `Closing-line value still counts ${model.centsOpen} open picks that already have a cents figure.`);
  }
  if (model.otherResults.length) {
    const bits = model.otherResults.map((o) => `${o.n} marked ${o.result}`);
    const total = model.otherResults.reduce((a, o) => a + o.n, 0);
    parts.push(`${englishList(bits)} ${total === 1 ? "is" : "are"} not in the graded totals.`);
  }
  return parts.join(" ");
}

function marketIntro(facts) {
  const bits = [];
  if (facts.duplicate && facts.hasNba && facts.hasNhl) {
    bits.push("Every NBA pick in this record is a player prop, and every NHL pick is a moneyline. That split matches the sport table, so it is not repeated.");
  } else if (facts.duplicate && facts.hasNba) {
    bits.push("Every NBA pick in this record is a player prop.");
  } else if (facts.duplicate && facts.hasNhl) {
    bits.push("Every NHL pick in this record is a moneyline.");
  }
  if (facts.onlyKnown) bits.push("There are no game totals and no point spreads in the live record.");
  return bits.join(" ");
}

export default function StatsPage({ model, launch, updated, clvCopy, calibration, shopping, tests, nhlTest, rigor }) {
  const s = model.summary;
  const series = model.series;
  const last = series[series.length - 1];
  const first = series[0];
  const showOpen = s.pending > 0;
  const unitsSummary = last
    ? `After ${series.length} graded picks, ${unitText(last.unitMilli)}. ROI ${roiText(last.roi)}.`
    : "No graded picks yet.";
  const unitsAria = last
    ? `Cumulative units after each graded pick. ${unitsSummary} From ${dayTitle(first.date)} to ${dayTitle(last.date)}.`
    : "No graded picks yet.";
  const roiAria = last
    ? `Cumulative ROI after each graded pick. Ends at ${roiText(last.roi)} after ${series.length} picks.`
    : "No graded picks yet.";
  const cents = model.cents;
  const centsLast = cents[cents.length - 1];
  const centsFirst = cents[0];
  const centsSummary = centsLast
    ? `Average ${formatCents(centsLast.avg)} after ${cents.length} picks with a cents figure.`
    : "No cents figures in this publish.";
  const centsAria = centsLast
    ? `Running average closing-line value in cents. ${centsSummary} From ${dayTitle(centsFirst.date)} to ${dayTitle(centsLast.date)}.`
    : "No cents closing-line values in this publish.";
  const span = last ? `${dayTitle(first.date)} to ${dayTitle(last.date)}` : launch;
  const introFacts = marketIntro(model.facts);
  const note = scopeNote(model);
  const missing = model.centsGradedMissing;

  return (
    <div className="page wrap stats-page">
      <div className="intro">
        <h1>Stats</h1>
        <p className="lede">
          Charts and splits of the live record. Same picks and the same unit total as the <a href="/record">record page</a>, graded at the posted price.
          {updated ? ` Updated ${updated}.` : ""}
        </p>
        <p className="takeaway">{recordSentence(s, { launch })}</p>
        <p className="note">These numbers are the live record only. Older tests stay on the <a href="/method">method page</a> and are not added in here.</p>
        <p className="note">The live record starts {launch}, so this is a short run. A row marked short sample has fewer than {model.shortSample} graded picks. One or two results can flip a row that size.</p>
        {note && <p className="note">{note}</p>}
      </div>

      <div className="kpis">
        <div><b className="num">{record(s)}</b><span>Won–lost{s.pending ? `, ${s.pending} open` : ""}</span></div>
        <div><b className={"num " + toneOf(s.unitMilli)}>{s.bets ? unitText(s.unitMilli) : "–"}</b><span>Units, 1% of a bankroll</span></div>
        <div><b className={"num " + (s.roi > 0 ? "pos" : s.roi < 0 ? "neg" : "")}>{s.roi != null ? `${signed(s.roi, 1)}%` : "–"}</b><span>ROI at the posted price</span></div>
        <div><b className="num">{s.clvN ? pct(s.beatClose) : "–"}</b><span>Beat the close, in points{s.clvN ? `, ${s.clvN} picks` : ""}</span></div>
      </div>

      <nav className="jumps" aria-label="On this page">
        <a href="#units">Units and ROI</a>
        <a href="#rolling">Rolling</a>
        <a href="#shape">Drawdown</a>
        <a href="#sport">Sport</a>
        <a href="#market">Market</a>
        {!model.facts.duplicate && <a href="#bet-type">Bet type</a>}
        <a href="#tier">Tier</a>
        <a href="#side">Side</a>
        <a href="#teams">Teams</a>
        <a href="#when">When</a>
        <a href="#price">Price</a>
        <a href="#book">Book</a>
        <a href="#clv">Closing line</a>
        <a href="#tests">Older tests</a>
        <a href="#calibration">Calibration</a>
        <a href="#nerds">For the stats nerds</a>
      </nav>

      <section className="block" id="units" aria-labelledby="units-h">
        <div className="head">
          <div>
            <h2 id="units-h">Units and ROI over time</h2>
            <p className="lede">Units won or lost after each graded pick, oldest first. ROI is units won divided by units staked, after the same picks. Both end on the totals above. The ROI line swings on the first picks, when a few bets are the whole sample. Read the right edge for the total. {s.bets ? `${s.bets} graded picks, ${stakeText(s)} staked, ${span}.` : ""}</p>
          </div>
        </div>
        <div className="chart-stack">
          <div className="panel">
            <h3 className="side-h">Cumulative units</h3>
            <LineChart
              points={series.map(unitsPoint)}
              yLabel="Units won"
              xLabel="Graded picks, oldest to newest"
              kind="units"
              tone="result"
              aria={unitsAria}
              summary={unitsSummary}
              empty="The units line draws once two picks are graded."
            />
          </div>
          <div className="panel">
            <h3 className="side-h">Cumulative ROI</h3>
            <LineChart
              points={series.filter((p) => p.roi != null).map(roiPoint)}
              yLabel="ROI"
              xLabel="Graded picks, oldest to newest"
              kind="roi"
              tone="ink"
              aria={roiAria}
              summary={last ? `ROI ends at ${roiText(last.roi)}.` : "No graded picks yet."}
              empty="The ROI line draws once two picks are graded."
            />
          </div>
        </div>
        {model.daily.length > 0 && (
          <div className="tablewrap spaced">
            <table className="stack">
              <caption>The same totals at the end of each day.</caption>
              <thead>
                <tr>
                  <th scope="col">Date</th>
                  <th scope="col" className="r">Graded</th>
                  <th scope="col" className="r">Record</th>
                  <th scope="col" className="r">That day</th>
                  <th scope="col" className="r">Total</th>
                  <th scope="col" className="r">ROI</th>
                </tr>
              </thead>
              <tbody>
                {model.daily.map((d) => (
                  <tr key={d.date}>
                    <th scope="row" data-label="Date">{dayTitle(d.date)}</th>
                    <td className="r num" data-label="Graded">{d.day.bets}</td>
                    <td className="r num" data-label="Record">{record(d.day)}</td>
                    <td className={"r num " + toneOf(d.day.unitMilli)} data-label="That day">{unitText(d.day.unitMilli)}</td>
                    <td className={"r num " + toneOf(d.totalMilli)} data-label="Total">{unitText(d.totalMilli)}</td>
                    <td className="r num" data-label="ROI">{roiText(d.roi)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {series.length > 0 && (
          <details className="series">
            <summary>Every graded pick in this line ({series.length})</summary>
            <div className="tablewrap">
              <table className="stack">
                <caption>Running total after each graded pick.</caption>
                <thead>
                  <tr>
                    <th scope="col">Pick</th>
                    <th scope="col">Date</th>
                    <th scope="col">Result</th>
                    <th scope="col" className="r">Units</th>
                    <th scope="col" className="r">Total</th>
                    <th scope="col" className="r">ROI</th>
                  </tr>
                </thead>
                <tbody>
                  {series.map((p) => (
                    <tr key={p.i}>
                      <th scope="row" data-label="Pick">{p.label}</th>
                      <td data-label="Date">{dayShort(p.date)}</td>
                      <td data-label="Result" className={p.result === "Won" ? "pos" : p.result === "Lost" ? "neg" : ""}>{resultLabel(p.result)}</td>
                      <td className={"r num " + toneOf(p.pickMilli)} data-label="Units">{unitText(p.pickMilli)}</td>
                      <td className={"r num " + toneOf(p.unitMilli)} data-label="Total">{unitText(p.unitMilli)}</td>
                      <td className="r num" data-label="ROI">{roiText(p.roi)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </details>
        )}
      </section>

      <RollingSection model={model} />
      <ShapeSection model={model} />

      <section className="block" id="sport" aria-labelledby="sport-h">
        <div className="head"><div><h2 id="sport-h">By sport</h2><p className="lede">NBA and NHL, graded at the posted price. The bar length compares the size of the unit total inside this table.</p></div></div>
        <SplitTable caption="Graded picks by sport." groups={model.splits.sport} name="Sport" showOpen={showOpen} />
      </section>

      <section className="block" id="market" aria-labelledby="market-h">
        <div className="head"><div><h2 id="market-h">By market</h2>{introFacts && <p className="lede">{introFacts}</p>}</div></div>
        <SplitTable caption="Graded picks by the stat on the card." groups={model.splits.market} name="Market" showOpen={showOpen} />
      </section>

      {!model.facts.duplicate && (
        <section className="block" id="bet-type" aria-labelledby="type-h">
          <div className="head"><div><h2 id="type-h">By bet type</h2><p className="lede">Player props and moneylines, from the stat on the card.</p></div></div>
          <SplitTable caption="Graded picks by bet type." groups={model.splits.family} name="Bet type" showOpen={showOpen} />
        </section>
      )}

      <section className="block" id="tier" aria-labelledby="tier-h">
        <div className="head">
          <div>
            <h2 id="tier-h">By tier</h2>
            <p className="lede">Tier is the label published with the pick. {model.stakeSentence || "The Staked column is the total risked in that tier."}</p>
          </div>
        </div>
        <SplitTable caption="Graded picks by the published tier." groups={model.splits.tier} name="Tier" showOpen={showOpen} />
      </section>

      <SideSection model={model} showOpen={showOpen} />
      <TeamSection model={model} showOpen={showOpen} />
      <WhenSection model={model} showOpen={showOpen} />

      <section className="block" id="price" aria-labelledby="price-h">
        <div className="head">
          <div>
            <h2 id="price-h">By price</h2>
            <p className="lede">The posted price, in American odds. A minus price is a favorite. A plus price is an underdog. These bands use the price on the card, not the closing price. <a href="/faq">What −110 means</a>.</p>
          </div>
        </div>
        <SplitTable caption="Graded picks by the posted American price." groups={model.splits.odds} name="Price" showOpen={showOpen} />
        <Breakeven prices={model.prices} />
      </section>

      <BookSection model={model} showOpen={showOpen} />
      <ShoppingSection shopping={shopping} />

      <section className="block" id="clv" aria-labelledby="clv-h">
        <div className="head">
          <div>
            <h2 id="clv-h">Closing line over time</h2>
            <p className="lede">{clvCopy.sentence} One cent is one percentage point of implied probability. Positive means the locked price was longer than the closing median. The three figures are the published totals. The line is the average of the cents on each pick that has one, oldest first.</p>
          </div>
        </div>
        <div className="kpis three">
          <div><b className={"num " + clvCopy.avgTone}>{clvCopy.avg}</b><span>Average CLV, cents</span></div>
          <div><b className={"num " + clvCopy.beatTone}>{clvCopy.beat}</b><span>Beat the close</span></div>
          <div><b className={"num " + clvCopy.nTone}>{clvCopy.n}</b><span>{clvCopy.sample}</span></div>
        </div>
        {missing > 0 && (
          <p className="note">{missing === 1 ? "1 graded pick has" : `${missing} graded picks have`} no cents figure, so {missing === 1 ? "it is" : "they are"} left off the line. The line does not fill a cents figure in from the points value or from the price.</p>
        )}
        <div className="panel clv-panel">
          <h3 className="side-h">Average cents</h3>
          <LineChart
            points={cents.map(centsPoint)}
            yLabel="Average CLV"
            xLabel="Picks with a cents figure, oldest to newest"
            kind="cents"
            tone="bronze"
            aria={centsAria}
            summary={centsSummary}
            empty="The cents line draws once two picks have a closing-line value in cents."
          />
        </div>
        <ClvBands block={model.clvBands} />
        {cents.length > 0 && (
          <details className="series">
            <summary>Every pick on the cents line ({cents.length})</summary>
            <div className="tablewrap">
              <table className="stack">
                <caption>Closing-line value in cents, and the average through that pick.</caption>
                <thead>
                  <tr>
                    <th scope="col">Pick</th>
                    <th scope="col">Date</th>
                    <th scope="col">Result</th>
                    <th scope="col" className="r">This pick</th>
                    <th scope="col" className="r">Average</th>
                  </tr>
                </thead>
                <tbody>
                  {cents.map((p) => (
                    <tr key={p.i}>
                      <th scope="row" data-label="Pick">{p.label}</th>
                      <td data-label="Date">{dayShort(p.date)}</td>
                      <td data-label="Result">{resultLabel(p.result)}</td>
                      <td className="r num" data-label="This pick">{formatCents(p.cents)}</td>
                      <td className="r num" data-label="Average">{formatCents(p.avg)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </details>
        )}
      </section>

      <TestsSection tests={tests} nhl={nhlTest} />

      <section className="block" id="calibration" aria-labelledby="cal-h">
        <div className="head">
          <div>
            <h2 id="cal-h">Calibration</h2>
            <p className="lede">Model probability buckets against how often those picks won. Each dot is a bucket, not one pick. I plot a bucket only when it has at least {model.shortSample} picks, and the number on the dot is that count. A smaller bucket is left off, because one or two results move it. The pale dot is where the market priced these same picks, against the same hit rate. This chart is separate from the live record above.</p>
          </div>
        </div>
        {calibration.sports.some((s) => s.buckets.length > 0)
          ? calibration.sports.filter((s) => s.buckets.length > 0).map((s) => (
            <CalChart key={s.league} league={s.league} buckets={s.buckets} shortSample={model.shortSample} />
          ))
          : (
            <p className="note">{calibration.sports.some((s) => s.present)
              ? `No calibration bucket in this publish has ${model.shortSample} picks, so nothing is plotted. I don't estimate the buckets from the posted prices.`
              : "This publish has no calibration buckets, so nothing is plotted. I don't estimate them from the posted prices."}</p>
          )}
        {calibration.sports.some((s) => s.buckets.length > 0) && calibration.sports.filter((s) => s.present && s.buckets.length === 0).map((s) => (
          <p className="note" key={s.league}>{s.league} is not plotted. No bucket there has {model.shortSample} picks.</p>
        ))}
      </section>

      <RigorSection rigor={rigor} />

      <section className="block" id="care" aria-labelledby="care-h">
        <h2 id="care-h">Play responsibly</h2>
        {RESPONSIBLE.map((text) => <p className="lede" key={text}>{text}</p>)}
      </section>
    </div>
  );
}
