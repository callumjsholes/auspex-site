import LineChart from "@/components/LineChart";
import { formatCents } from "@/lib/clv";
import { dayShort, record, resultLabel, signed, unitsFromMilli } from "@/lib/format";
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

function hitText(rate) {
  return rate == null ? "–" : `${rate.toFixed(1)}%`;
}

function gapText(gap) {
  return gap == null ? "–" : `${signed(gap, 1)} pp`;
}

function monthLabel(ym) {
  const [y, m] = String(ym).split("-");
  if (!y || !m) return ym;
  return new Date(Date.UTC(Number(y), Number(m) - 1, 1)).toLocaleDateString("en-US", { timeZone: "UTC", month: "short", year: "numeric" });
}

export function SplitTable({ caption, groups, name, showOpen }) {
  if (!groups.length) return <div className="empty">Nothing graded in this split yet.</div>;
  const max = Math.max(...groups.map((g) => Math.abs(g.summary.units || 0)), 0);
  return (
    <div className="tablewrap">
      <table className="stack">
        <caption>{caption}</caption>
        <thead>
          <tr>
            <th scope="col">{name}</th>
            <th scope="col" className="r">Graded</th>
            <th scope="col" className="r">Record</th>
            {showOpen && <th scope="col" className="r">Open</th>}
            <th scope="col" className="r">Staked</th>
            <th scope="col" className="r">Units</th>
            <th scope="col" className="r">ROI</th>
          </tr>
        </thead>
        <tbody>
          {groups.map((g) => {
            const width = g.summary.bets && max ? Math.max(2, (Math.abs(g.summary.units) / max) * 100) : 0;
            const tone = toneOf(g.summary.unitMilli);
            return (
              <tr key={g.key}>
                <th scope="row" data-label={name}>
                  <span className="split-name">{g.key}</span>
                  {g.few && <span className="flag">Short sample</span>}
                </th>
                <td className="r num" data-label="Graded">{g.summary.bets}</td>
                <td className="r num" data-label="Record">{record(g.summary)}</td>
                {showOpen && <td className="r num" data-label="Open">{g.summary.pending}</td>}
                <td className="r num" data-label="Staked">{stakeText(g.summary)}</td>
                <td className={"r num " + tone} data-label="Units">
                  <span className="unitcell">
                    {g.summary.bets > 0 && (
                      <span className="track" aria-hidden="true"><i className={tone || "flat"} style={{ width: `${width}%` }} /></span>
                    )}
                    <span>{g.summary.bets ? unitText(g.summary.unitMilli) : "–"}</span>
                  </span>
                </td>
                <td className={"r num " + (g.summary.roi > 0 ? "pos" : g.summary.roi < 0 ? "neg" : "")} data-label="ROI">{g.summary.bets ? roiText(g.summary.roi) : "–"}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function HBars({ rows, scale }) {
  const max = scale || Math.max(...rows.map((r) => Math.abs(r.value)), 0);
  if (!rows.length || !max) return null;
  return (
    <div className="hbars" aria-hidden="true">
      {rows.map((r) => (
        <div className="bar-row" key={r.key}>
          <span className="bar-key">{r.key}</span>
          <span className="bar-track"><i className={r.tone || "ink"} style={{ width: `${Math.max(2, (Math.abs(r.value) / max) * 100)}%` }} /></span>
          <span className={"bar-val num " + (r.tone === "pos" || r.tone === "neg" ? r.tone : "")}>{r.display}</span>
        </div>
      ))}
    </div>
  );
}

function rollPoint(p, kind) {
  const base = `Pick ${p.i}, ${dayShort(p.date)}, last ${p.window}: ${p.wins}–${p.losses}. Hit rate ${hitText(p.winRate)}. ROI ${roiText(p.roi)}. Units in the window ${unitText(p.unitMilli)}.`;
  return {
    i: p.i,
    date: p.date,
    y: kind === "roi" ? p.roi : p.winRate,
    text: base,
  };
}

export function RollingSection({ model }) {
  const n = model.summary.bets;
  const last25 = model.rolling25[model.rolling25.length - 1];
  const last50 = model.rolling50[model.rolling50.length - 1];
  return (
    <section className="block" id="rolling" aria-labelledby="rolling-h">
      <div className="head">
        <div>
          <h2 id="rolling-h">Rolling win rate and ROI</h2>
          <p className="lede">Each point is a window of graded picks ending on that pick, oldest first. The first picks in a window are only the warm-up, so the line starts once the window is full. A window of 25 still moves on one or two results. Winning half of them is not the break-even: the price does that job, in the chart further down. {n ? `${n} graded picks in this record.` : ""}</p>
        </div>
      </div>
      <div className="chart-stack">
        <div className="panel">
          <h3 className="side-h">Hit rate, last 25</h3>
          <LineChart
            points={model.rolling25.map((p) => rollPoint(p, "rate"))}
            yLabel="Hit rate"
            xLabel="Window ending on this pick"
            kind="pct"
            tone="ink"
            includeZero={false}
            aria={last25 ? `Hit rate over the last 25 graded picks. Ends at ${hitText(last25.winRate)}, ${last25.wins}–${last25.losses}.` : "No 25-pick window yet."}
            summary={last25 ? `Last 25: ${last25.wins}–${last25.losses}, hit rate ${hitText(last25.winRate)}.` : "The 25-pick line draws once 25 picks are graded."}
            empty="The 25-pick line draws once 25 picks are graded."
          />
        </div>
        <div className="panel">
          <h3 className="side-h">ROI, last 25</h3>
          <LineChart
            points={model.rolling25.filter((p) => p.roi != null).map((p) => rollPoint(p, "roi"))}
            yLabel="ROI"
            xLabel="Window ending on this pick"
            kind="roi"
            tone="bronze"
            aria={last25 ? `ROI over the last 25 graded picks. Ends at ${roiText(last25.roi)}.` : "No 25-pick window yet."}
            summary={last25 ? `Last 25: ROI ${roiText(last25.roi)}, ${unitText(last25.unitMilli)}.` : "The 25-pick line draws once 25 picks are graded."}
            empty="The 25-pick line draws once 25 picks are graded."
          />
        </div>
        <div className="panel">
          <h3 className="side-h">ROI, last 50</h3>
          <LineChart
            points={model.rolling50.filter((p) => p.roi != null).map((p) => rollPoint(p, "roi"))}
            yLabel="ROI"
            xLabel="Window ending on this pick"
            kind="roi"
            tone="ink"
            aria={last50 ? `ROI over the last 50 graded picks. Ends at ${roiText(last50.roi)}.` : "No 50-pick window yet."}
            summary={last50 ? `Last 50: ROI ${roiText(last50.roi)}, ${unitText(last50.unitMilli)}.` : "The 50-pick line draws once 50 picks are graded."}
            empty="The 50-pick line draws once 50 picks are graded."
          />
        </div>
      </div>
    </section>
  );
}

export function ShapeSection({ model }) {
  const dd = model.drawdown;
  const last = dd.points[dd.points.length - 1];
  const worst = dd.points.find((p) => p.i === dd.worstAt);
  const bins = model.bins;
  const streak = model.streaks;
  const run = streak.current;
  const runText = !run
    ? "The last graded result was a push, so there is no open run."
    : run > 0
      ? `Current run: ${run} win${run === 1 ? "" : "s"}.`
      : `Current run: ${Math.abs(run)} loss${Math.abs(run) === 1 ? "" : "es"}.`;
  return (
    <section className="block" id="shape" aria-labelledby="shape-h">
      <div className="head">
        <div>
          <h2 id="shape-h">Drawdown, distribution, streaks</h2>
          <p className="lede">Drawdown is how far the running total sat under its own high. The deepest drop in this record is {unitText(dd.worstMilli)}{worst ? `, at pick ${worst.i} on ${dayShort(worst.date)}` : ""}. {dd.currentMilli === 0 ? "The total is back at its peak." : `It sits ${unitText(dd.currentMilli)} under that peak now.`} A push ends a streak. Open picks are not in it.</p>
        </div>
      </div>
      <div className="kpis three">
        <div><b className={"num " + toneOf(dd.worstMilli)}>{unitText(dd.worstMilli)}</b><span>Deepest drop from a peak</span></div>
        <div><b className="num">{streak.bestW}</b><span>Longest win streak</span></div>
        <div><b className="num">{streak.bestL}</b><span>Longest loss streak</span></div>
      </div>
      <div className="panel clv-panel">
        <h3 className="side-h">Under the peak</h3>
        <LineChart
          points={dd.points.map((p) => ({
            i: p.i,
            date: p.date,
            y: p.y,
            text: `Pick ${p.i}, ${dayShort(p.date)}: ${p.label}. ${resultLabel(p.result)}. ${unitText(p.underMilli)} under a peak of ${unitText(p.peakMilli)}. Running total ${unitText(p.unitMilli)}.`,
          }))}
          yLabel="Units under peak"
          xLabel="Graded picks, oldest to newest"
          kind="units"
          tone="result"
          aria={last ? `Units under the running peak. Deepest drop ${unitText(dd.worstMilli)}. Now ${unitText(dd.currentMilli)} under a peak of ${unitText(dd.peakMilli)}.` : "No graded picks yet."}
          summary={last ? `Now ${unitText(dd.currentMilli)} under the peak of ${unitText(dd.peakMilli)}.` : "No graded picks yet."}
          empty="The drawdown line draws once two picks are graded."
        />
      </div>
      {bins.length > 0 && (
        <div className="spaced">
          <h3 className="side-h">Where each pick landed</h3>
          <p className="lede">Count of graded picks in each unit bin. A 1 unit loss sits in the minus bin. A win at a short price is usually under 1 unit.</p>
          <HBars rows={bins.map((b) => ({ key: b.key, value: b.n, display: String(b.n), tone: b.summary.unitMilli > 0 ? "pos" : b.summary.unitMilli < 0 ? "neg" : "ink" }))} />
          <div className="tablewrap spaced">
            <table className="stack">
              <caption>Graded picks by the units on that pick.</caption>
              <thead>
                <tr>
                  <th scope="col">Bin</th>
                  <th scope="col" className="r">Picks</th>
                  <th scope="col" className="r">Units</th>
                </tr>
              </thead>
              <tbody>
                {bins.map((b) => (
                  <tr key={b.key}>
                    <th scope="row" data-label="Bin">{b.key}</th>
                    <td className="r num" data-label="Picks">{b.n}</td>
                    <td className={"r num " + toneOf(b.summary.unitMilli)} data-label="Units">{unitText(b.summary.unitMilli)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      {streak.recent.length > 0 && (
        <div className="spaced">
          <h3 className="side-h">Recent results</h3>
          <p className="lede">{runText} Longest win streak {streak.bestW}. Longest loss streak {streak.bestL}. The strip is the last {streak.recent.length} graded results, oldest on the left.</p>
          <ol className="streak">
            {streak.recent.map((r, i) => (
              <li key={`${r.date}-${i}`} className={r.result === "Won" ? "won" : r.result === "Lost" ? "lost" : "push"} aria-label={`${resultLabel(r.result)}, ${r.label}, ${dayShort(r.date)}`}>
                {r.result === "Won" ? "W" : r.result === "Lost" ? "L" : "P"}
              </li>
            ))}
          </ol>
        </div>
      )}
    </section>
  );
}

export function WhenSection({ model, showOpen }) {
  return (
    <section className="block" id="when" aria-labelledby="when-h">
      <div className="head">
        <div>
          <h2 id="when-h">Day and start time</h2>
          <p className="lede">Day is the slate date on the pick. Start time is tip-off in Eastern Time, and only when the pick carries one. {model.startMissing ? `${model.startMissing} graded ${model.startMissing === 1 ? "pick has" : "picks have"} no start time, so ${model.startMissing === 1 ? "it is" : "they are"} left out of the time table. ` : ""}The live record is still one short run of days, so a weekday with a handful of games is a short sample. There is no monthly heatmap in a record this young.</p>
        </div>
      </div>
      <h3 className="side-h">By day of the week</h3>
      <SplitTable caption="Graded picks by the slate date's weekday." groups={model.dow} name="Day" showOpen={showOpen} />
      <h3 className="side-h spaced-h">By start time</h3>
      <SplitTable caption="Graded picks by tip-off, Eastern Time." groups={model.start} name="Start" showOpen={showOpen} />
    </section>
  );
}

export function SideSection({ model, showOpen }) {
  return (
    <section className="block" id="side" aria-labelledby="side-h">
      <div className="head">
        <div>
          <h2 id="side-h">Side and home or away</h2>
          <p className="lede">Over and under are the side on a player prop. Home or away is the team on the pick: the player's team, or the NHL team on the moneyline.</p>
        </div>
      </div>
      <h3 className="side-h">Over and under</h3>
      <SplitTable caption="Graded player props by over or under." groups={model.side} name="Side" showOpen={showOpen} />
      <h3 className="side-h spaced-h">Home and away</h3>
      <SplitTable caption="Graded picks by whether the picked team was at home." groups={model.venue} name="Venue" showOpen={showOpen} />
    </section>
  );
}

export function TeamSection({ model, showOpen }) {
  return (
    <section className="block" id="teams" aria-labelledby="teams-h">
      <div className="head">
        <div>
          <h2 id="teams-h">Team and opponent</h2>
          <p className="lede">The picked team, then the other team in that game. One week of games leaves almost every row under {model.shortSample} picks. Read the flag before the units.</p>
        </div>
      </div>
      <h3 className="side-h">By team</h3>
      <SplitTable caption="Graded picks by the team on the pick, sorted by units." groups={model.team} name="Team" showOpen={showOpen} />
      <h3 className="side-h spaced-h">By opponent</h3>
      <SplitTable caption="Graded picks by the other team in the game, sorted by units." groups={model.opp} name="Opponent" showOpen={showOpen} />
    </section>
  );
}

export function BookSection({ model, showOpen }) {
  return (
    <section className="block" id="book" aria-labelledby="book-h">
      <div className="head">
        <div>
          <h2 id="book-h">By book</h2>
          <p className="lede">The book on the card. NHL moneylines in this record are graded at the median price, so they sit on their own row.</p>
        </div>
      </div>
      <SplitTable caption="Graded picks by the posted book." groups={model.book} name="Book" showOpen={showOpen} />
    </section>
  );
}

export function Breakeven({ prices }) {
  if (!prices.length) return null;
  const max = 100;
  return (
    <div className="spaced">
      <h3 className="side-h">Hit rate against the price</h3>
      <p className="lede">Hit rate is wins divided by wins and losses. Pushes are left out of the rate. Break-even is the average of the posted prices in that band, as the win rate that would have won the stake back. It is the price on the card. It is not a model probability. The gap is hit rate minus that break-even, in percentage points. A band under 30 decided picks is a short sample.</p>
      <div className="hbars" aria-hidden="true">
        {prices.filter((g) => g.hit != null).map((g) => (
          <div className="twin-row" key={g.key}>
            <span className="bar-key">{g.key}{g.few ? " · short" : ""}</span>
            <span className="twin-plot">
              <i className="hit" style={{ width: `${Math.max(0, Math.min(max, g.hit))}%` }} />
              <i className="be" style={{ width: `${Math.max(0, Math.min(max, g.breakeven || 0))}%` }} />
            </span>
          </div>
        ))}
      </div>
      <ul className="cal-legend">
        <li><i className="swatch model" aria-hidden="true" /> Hit rate</li>
        <li><i className="swatch line" aria-hidden="true" /> Break-even at the posted price</li>
      </ul>
      <div className="tablewrap">
        <table className="stack">
          <caption>Hit rate by posted price, next to the break-even rate implied by those prices.</caption>
          <thead>
            <tr>
              <th scope="col">Price</th>
              <th scope="col" className="r">Decided</th>
              <th scope="col" className="r">Hit rate</th>
              <th scope="col" className="r">Break-even</th>
              <th scope="col" className="r">Gap</th>
              <th scope="col" className="r">Units</th>
            </tr>
          </thead>
          <tbody>
            {prices.map((g) => (
              <tr key={g.key}>
                <th scope="row" data-label="Price">
                  <span className="split-name">{g.key}</span>
                  {g.few && <span className="flag">Short sample</span>}
                </th>
                <td className="r num" data-label="Decided">{g.decided}</td>
                <td className="r num" data-label="Hit rate">{hitText(g.hit)}</td>
                <td className="r num" data-label="Break-even">{hitText(g.breakeven)}</td>
                <td className={"r num " + (g.gap > 0 ? "pos" : g.gap < 0 ? "neg" : "")} data-label="Gap">{gapText(g.gap)}</td>
                <td className={"r num " + toneOf(g.summary.unitMilli)} data-label="Units">{g.summary.bets ? unitText(g.summary.unitMilli) : "–"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function ClvBands({ block }) {
  if (!block || !block.n) return null;
  return (
    <div className="spaced">
      <h3 className="side-h">Cents against the result</h3>
      <p className="lede">Graded picks that have a cents figure, grouped. The hit rate is how often that group won. The average cents on wins and on losses are the two figures under the heading. A group under 30 picks is a short sample. These are not per-pick probabilities.</p>
      <div className="kpis">
        <div><b className="num">{formatCents(block.winCents)}</b><span>Average cents on wins</span></div>
        <div><b className="num">{formatCents(block.lossCents)}</b><span>Average cents on losses</span></div>
        <div><b className="num">{block.n}</b><span>Graded picks with cents</span></div>
      </div>
      <HBars scale={100} rows={block.bands.map((b) => ({ key: b.key, value: b.hit || 0, display: hitText(b.hit), tone: "ink" }))} />
      <div className="tablewrap spaced">
        <table className="stack">
          <caption>Hit rate by closing-line value in cents. The count is graded picks in the band.</caption>
          <thead>
            <tr>
              <th scope="col">Cents</th>
              <th scope="col" className="r">Picks</th>
              <th scope="col" className="r">Hit rate</th>
              <th scope="col" className="r">Units</th>
            </tr>
          </thead>
          <tbody>
            {block.bands.map((b) => (
              <tr key={b.key}>
                <th scope="row" data-label="Cents">
                  <span className="split-name">{b.key}</span>
                  {b.few && <span className="flag">Short sample</span>}
                </th>
                <td className="r num" data-label="Picks">{b.n}</td>
                <td className="r num" data-label="Hit rate">{hitText(b.hit)}</td>
                <td className={"r num " + toneOf(b.summary.unitMilli)} data-label="Units">{unitText(b.summary.unitMilli)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function ShoppingSection({ shopping }) {
  if (!shopping || !shopping.n) return null;
  const rows = [
    { key: "Posted price", value: shopping.postedMilli, display: unitText(shopping.postedMilli), tone: toneOf(shopping.postedMilli) || "ink" },
    { key: "Typical price", value: shopping.typicalMilli, display: unitText(shopping.typicalMilli), tone: toneOf(shopping.typicalMilli) || "ink" },
  ];
  return (
    <section className="block" id="shopping" aria-labelledby="shop-h">
      <div className="head">
        <div>
          <h2 id="shop-h">Posted price and typical price</h2>
          <p className="lede">NBA picks that have both a result at the posted price and a result at the typical price. The typical price is the median across the tracked books at the same line. The two bars are those sums. {shopping.missing ? `${shopping.missing} graded NBA ${shopping.missing === 1 ? "pick is" : "picks are"} missing a typical price and ${shopping.missing === 1 ? "is" : "are"} left out. ` : ""}This is not a second record, and it is not the headline total above.</p>
        </div>
      </div>
      <HBars rows={rows} />
      <div className="tablewrap spaced">
        <table className="stack">
          <caption>Sum of units on {shopping.n} NBA picks, at the posted price and at the typical price.</caption>
          <thead>
            <tr>
              <th scope="col">Price</th>
              <th scope="col" className="r">Picks</th>
              <th scope="col" className="r">Units</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <th scope="row" data-label="Price">Posted price</th>
              <td className="r num" data-label="Picks">{shopping.n}</td>
              <td className={"r num " + toneOf(shopping.postedMilli)} data-label="Units">{unitText(shopping.postedMilli)}</td>
            </tr>
            <tr>
              <th scope="row" data-label="Price">Typical price</th>
              <td className="r num" data-label="Picks">{shopping.n}</td>
              <td className={"r num " + toneOf(shopping.typicalMilli)} data-label="Units">{unitText(shopping.typicalMilli)}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  );
}

export function TestsSection({ tests, nhl }) {
  const equity = tests?.equity || [];
  const last = equity[equity.length - 1];
  const first = equity[0];
  const seasons = nhl?.rows || [];
  if (!equity.length && !seasons.length && !(tests?.monthly || []).length) return null;
  return (
    <section className="block" id="tests" aria-labelledby="tests-h">
      <div className="head">
        <div>
          <h2 id="tests-h">Older tests</h2>
          <p className="lede">These charts are the tests from before the live record. They are not added to the units at the top of this page. The <a href="/method">method page</a> has the same tests as tables, including the book split and the range on the NHL total.</p>
        </div>
      </div>
      {equity.length > 0 && (
        <div className="panel">
          <h3 className="side-h">NBA unseen test</h3>
          <p className="lede">{tests.label || "Unseen games."} Cumulative units in that test, by day.</p>
          <LineChart
            points={equity.map((p, i) => ({
              i: i + 1,
              date: p.date,
              y: p.units,
              text: `${dayShort(p.date)}: ${signed(p.units, 2)} units in the unseen test. Not the live record.`,
            }))}
            yLabel="Test units"
            xLabel="Days in the unseen test"
            kind="units"
            tone="bronze"
            aria={last ? `Unseen NBA test, cumulative units, from ${dayShort(first.date)} to ${dayShort(last.date)}. Ends at ${signed(last.units, 2)} units. Not the live record.` : "No unseen test series in this publish."}
            summary={last ? `The unseen test ends at ${signed(last.units, 2)} units. Not the live record.` : "No unseen test series in this publish."}
            empty="The unseen test has no daily series in this publish."
          />
        </div>
      )}
      {tests?.resample && (
        <p className="note">A reshuffle of those same unseen bets. Not the path that happened, and not the live record. {tests.resample.up}% of the paths finished up. The middle path ended at {signed(tests.resample.medianEnd, 1)} units. The low end was {signed(tests.resample.lowEnd, 1)} units. The middle drawdown was {signed(tests.resample.medianDrawdown, 1)} units.</p>
      )}
      {(tests?.monthly || []).length > 0 && (
        <div className="spaced">
          <h3 className="side-h">That test, by month</h3>
          <HBars rows={tests.monthly.map((m) => ({ key: monthLabel(m.month), value: m.units || 0, display: `${signed(m.units, 1)}u`, tone: m.units > 0 ? "pos" : m.units < 0 ? "neg" : "ink" }))} />
          <div className="tablewrap spaced">
            <table className="stack">
              <caption>Unseen NBA test by month. Not the live record.</caption>
              <thead>
                <tr>
                  <th scope="col">Month</th>
                  <th scope="col" className="r">Bets</th>
                  <th scope="col" className="r">Units</th>
                  <th scope="col" className="r">ROI</th>
                </tr>
              </thead>
              <tbody>
                {tests.monthly.map((m) => (
                  <tr key={m.month}>
                    <th scope="row" data-label="Month">{monthLabel(m.month)}</th>
                    <td className="r num" data-label="Bets">{m.bets}</td>
                    <td className={"r num " + (m.units > 0 ? "pos" : m.units < 0 ? "neg" : "")} data-label="Units">{signed(m.units, 1)}u</td>
                    <td className="r num" data-label="ROI">{roiText(m.roi)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      {(tests?.byStat || []).length > 0 && (
        <div className="spaced">
          <h3 className="side-h">That test, by stat</h3>
          <HBars rows={tests.byStat.map((m) => ({ key: m.stat, value: m.units || 0, display: `${signed(m.units, 1)}u`, tone: m.units > 0 ? "pos" : m.units < 0 ? "neg" : "ink" }))} />
          <div className="tablewrap spaced">
            <table className="stack">
              <caption>Unseen NBA test by stat. Not the live record.</caption>
              <thead>
                <tr>
                  <th scope="col">Stat</th>
                  <th scope="col" className="r">Bets</th>
                  <th scope="col" className="r">Units</th>
                  <th scope="col" className="r">ROI</th>
                </tr>
              </thead>
              <tbody>
                {tests.byStat.map((m) => (
                  <tr key={m.stat}>
                    <th scope="row" data-label="Stat">{m.stat}</th>
                    <td className="r num" data-label="Bets">{m.bets}</td>
                    <td className={"r num " + (m.units > 0 ? "pos" : m.units < 0 ? "neg" : "")} data-label="Units">{signed(m.units, 1)}u</td>
                    <td className="r num" data-label="ROI">{roiText(m.roi)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      {seasons.length > 0 && (
        <div className="spaced">
          <h3 className="side-h">NHL test, by season</h3>
          <p className="lede">Units in the older NHL test. {nhl.total?.max_drawdown != null ? `The published deepest drop in that test is ${nhl.total.max_drawdown} units.` : ""} Not the live record.</p>
          <HBars rows={seasons.map((r) => ({ key: r.season, value: r.units, display: `${signed(r.units, 1)}u`, tone: r.units > 0 ? "pos" : r.units < 0 ? "neg" : "ink" }))} />
          <div className="tablewrap spaced">
            <table className="stack">
              <caption>Older NHL test by season. Not the live record.</caption>
              <thead>
                <tr>
                  <th scope="col">Season</th>
                  <th scope="col" className="r">Units</th>
                  <th scope="col" className="r">ROI</th>
                </tr>
              </thead>
              <tbody>
                {seasons.map((r) => (
                  <tr key={r.season}>
                    <th scope="row" data-label="Season">{r.season}</th>
                    <td className={"r num " + (r.units > 0 ? "pos" : r.units < 0 ? "neg" : "")} data-label="Units">{signed(r.units, 1)}u</td>
                    <td className="r num" data-label="ROI">{roiText(r.roi)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </section>
  );
}
