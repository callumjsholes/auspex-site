import { BetaChart, FanChart, FunnelChart } from "@/components/RigorDraw";
import { formatCents } from "@/lib/clv";
import { signed, units } from "@/lib/format";
import { ODDS_ORDER } from "@/lib/stats";

const Z_LINE = 1.96;
const INTERVAL_FAMILIES = ["Sport", "Market", "Tier", "Price", "Side", "Venue"];
const FAMILY_ORDER = ["Sport", "Market", "Tier", "Price", "Side", "Venue", "Book", "Day", "Start", "Team", "Opponent"];

function hitPct(v) {
  if (v == null || Number.isNaN(v)) return "–";
  return `${(v * 100).toFixed(1)}%`;
}

function roiPct(v) {
  if (v == null || Number.isNaN(v)) return "–";
  return `${signed(v, 1)}%`;
}

function unitLabel(v) {
  if (v == null || Number.isNaN(v)) return "–";
  return units(v);
}

function pLabel(p) {
  if (p == null || Number.isNaN(p)) return "–";
  if (p < 0.001) return "< 0.001";
  if (p < 0.01) return p.toFixed(3);
  return p.toFixed(2);
}

function count(n) {
  return Number(n).toLocaleString("en-US");
}

function share(p) {
  if (p == null || Number.isNaN(p)) return "–";
  const pct = p * 100;
  if (pct === 0) return "0%";
  if (pct < 0.1) return `${pct.toFixed(2)}%`;
  if (pct < 10) return `${pct.toFixed(1)}%`;
  return `${Math.round(pct)}%`;
}

function domain(values) {
  const nums = values.filter((v) => Number.isFinite(v));
  if (!nums.length) return [0, 1];
  let lo = Math.min(...nums);
  let hi = Math.max(...nums);
  if (!(hi > lo)) {
    lo -= 1;
    hi += 1;
  }
  const pad = (hi - lo) * 0.06;
  return [lo - pad, hi + pad];
}

function place(v, lo, hi) {
  return ((v - lo) / (hi - lo)) * 100;
}

function byFamily(a, b) {
  const fa = FAMILY_ORDER.indexOf(a.family) - FAMILY_ORDER.indexOf(b.family);
  if (fa) return fa;
  if (a.family === "Price") return ODDS_ORDER.indexOf(a.name) - ODDS_ORDER.indexOf(b.name);
  return String(a.name).localeCompare(String(b.name));
}

function intervalSlices(slices) {
  return slices.filter((s) => INTERVAL_FAMILIES.includes(s.family) && s.n > 0).slice().sort(byFamily);
}

function wilsonReading(w, price) {
  if (!w) return "There are no decided picks in this publish, so there is no hit-rate interval.";
  const interval = `${hitPct(w.lo)} to ${hitPct(w.hi)}`;
  if (price == null) {
    return `The hit rate is ${hitPct(w.p)}. A 95% Wilson interval runs from ${interval}. This publish has no usable posted price to set next to that interval.`;
  }
  const line = hitPct(price);
  if (w.lo > price) {
    return `The hit rate is ${hitPct(w.p)}. A 95% Wilson interval runs from ${interval}, and the whole interval sits above the ${line} average break-even of the posted prices. That is the 95% comparison on this sample.`;
  }
  if (w.hi < price) {
    return `The hit rate is ${hitPct(w.p)}. A 95% Wilson interval runs from ${interval}, and the whole interval sits below the ${line} average break-even of the posted prices.`;
  }
  return `The hit rate is ${hitPct(w.p)}. A 95% Wilson interval runs from ${interval}. That interval still covers the ${line} average break-even of the posted prices. A 95% interval that covers the price is not evidence the hit rate beats the price.`;
}

function bandReading(kind, lo, hi, est) {
  const fmt = kind === "units" ? unitLabel : roiPct;
  const span = `${fmt(lo)} to ${fmt(hi)}`;
  const thin = kind === "units" ? lo > 0 && lo < 5 : lo > 0 && lo < 2;
  if (lo > 0) {
    return `A 95% bootstrap interval runs from ${span}, around ${fmt(est)}.${thin ? " The bottom of that interval is close to zero, so another shuffle of these same picks can land near even." : ""} The interval describes this record. It is not a forecast.`;
  }
  if (hi < 0) {
    return `A 95% bootstrap interval runs from ${span}, around ${fmt(est)}. The whole interval sits below zero. It describes this record, not the picks ahead.`;
  }
  return `A 95% bootstrap interval runs from ${span}, around ${fmt(est)}. The interval still covers zero. It describes this record, not the picks ahead.`;
}

function testReading(t) {
  if (!t?.n || t.z == null) return "No decided picks with a posted price, so there is no test against break-even.";
  const more = t.wins >= t.expected;
  const dir = more ? "more wins than those prices implied" : "fewer wins than those prices implied";
  const head = `${t.wins} wins against ${t.expected.toFixed(1)} expected from the posted prices. The z-score is ${signed(t.z, 2)}.`;
  if (t.p < 0.001) {
    return `${head} A two-sided p-value under 0.001 would be rare if each posted price were the true win rate. This sample has ${dir}. One sample can still land here.`;
  }
  if (t.p < 0.01) {
    return `${head} A two-sided p-value under 0.01 is uncommon if the prices were the true win rates. This sample has ${dir}. That is still one run.`;
  }
  if (t.p < 0.05) {
    return `${head} A two-sided p-value of ${pLabel(t.p)} is uncommon if the prices were the true win rates, and one run can produce it. This sample has ${dir}.`;
  }
  return `${head} A two-sided p-value of ${pLabel(t.p)} is ordinary if each posted price were the true win rate. The record has ${dir}, and that gap is not distinguishable from chance at 95%.`;
}

function luckReading(t) {
  if (!t?.n || !(t.sd > 0)) return "There is no posted-price band for the win total yet.";
  const z = (t.wins - t.expected) / t.sd;
  const abs = Math.abs(z);
  let where = "Actual wins sit outside two standard deviations of that expectation. One sample can land there.";
  if (abs <= 1) where = "Actual wins sit inside one standard deviation of that expectation.";
  else if (abs <= 2) where = "Actual wins sit outside one standard deviation and inside two.";
  const side = t.wins >= t.expected ? "more wins than the prices implied" : "fewer wins than the prices implied";
  return `${t.wins} wins, against ${t.expected.toFixed(1)} expected if every posted price were the true win rate. That is ${side}. ${where} The band is the variation in the win total when the prices are the true rates. Sitting inside it does not separate luck from a small edge.`;
}

function bayesReading(b, w) {
  if (!b) return "There are no decided picks, so there is no posterior for the hit rate.";
  const above = b.pAbovePrice == null
    ? "This posterior has no posted price to compare with."
    : `The chance this posterior puts on a hit rate above the average posted price is ${share(b.pAbovePrice)}.`;
  const roi = `A Bayesian bootstrap puts ${share(b.pRoiPositive)} of its weight on a positive ROI. Its 95% interval for ROI runs from ${roiPct(b.roiLo)} to ${roiPct(b.roiHi)}.`;
  const covers = w && b.price != null && w.lo <= b.price && w.hi >= b.price;
  const relation = covers
    ? "The Wilson interval still covers that price. This posterior probability is a softer question, and it is not a 95% test."
    : "That probability answers a softer question than whether a 95% interval clears the price or zero.";
  return `${above} ${roi} ${relation}`;
}

function fanReading(fan) {
  if (!fan) return "The fan draws once two picks are graded.";
  const paths = count(fan.paths);
  const horizon = count(fan.horizon);
  const down20 = fan.pDown20 === 0
    ? `None of the ${paths} paths fell 20 units under the start.`
    : `About ${share(fan.pDown20)} of the ${paths} paths fell 20 units under the start.`;
  const down100 = fan.pDown100 === 0
    ? "None of them lost 100 units. That would be the whole bankroll if 1 unit is 1% of it."
    : `About ${share(fan.pDown100)} of them lost 100 units. That is the whole bankroll if 1 unit is 1% of it.`;
  const end = fan.pEndDown === 0 ? "None of them finished down." : `About ${share(fan.pEndDown)} finished down.`;
  return `Each path plays ${horizon} results drawn from this graded record, in a new mix. It repeats prices and results already on the book. It is not the schedule ahead. ${down20} ${down100} ${end} A reshuffle of a record that is already ahead will usually stay ahead.`;
}

function clvReading(c) {
  if (!c || c.mean == null) return "Fewer than two graded picks have a cents figure, so there is no interval for the mean.";
  const pBit = c.p < 0.001 ? "under 0.001" : `of ${pLabel(c.p)}`;
  const where = c.lo > 0
    ? "The interval sits above zero, so the average in this sample is not one lucky pick."
    : c.hi < 0
      ? "The interval sits below zero."
      : "The interval still covers zero.";
  let corr = "There are not enough decided picks to compare cents with winning.";
  if (c.rWin != null && c.rWinP != null) {
    const r = signed(c.rWin, 2);
    if (c.rWinP >= 0.05) {
      corr = `The correlation between cents and winning is ${r}, with a p-value of ${pLabel(c.rWinP)}. Beating the close in this sample does not line up with which picks won.`;
    } else if (c.rWin > 0) {
      corr = `The correlation between cents and winning is ${r}, with a p-value ${c.rWinP < 0.001 ? "under 0.001" : `of ${pLabel(c.rWinP)}`}. Higher cents line up with more wins here. That is still one record.`;
    } else {
      corr = `The correlation between cents and winning is ${r}, with a p-value ${c.rWinP < 0.001 ? "under 0.001" : `of ${pLabel(c.rWinP)}`}. Higher cents line up with fewer wins here. That is still one record.`;
    }
  }
  return `The mean closing-line value is ${formatCents(c.mean)} across ${count(c.n)} graded picks with a cents figure. A 95% t interval runs from ${formatCents(c.lo)} to ${formatCents(c.hi)}. A two-sided test of a zero mean has a p-value ${pBit}. ${where} ${corr} A positive close is not, by itself, a prediction of which pick won.`;
}

function powerReading(power) {
  if (!power || power.hit == null || power.breakeven == null) return "There is no hit rate and posted price to size a sample from.";
  const hit = hitPct(power.hit);
  const be = hitPct(power.breakeven);
  if (power.unreachable) {
    return `The decided hit rate is ${hit} and the average posted price implies ${be}. At this hit rate, a larger sample will not push the 95% Wilson lower bound above that price. The rate would have to stay above the price.`;
  }
  if (power.already) {
    return `The 95% Wilson lower bound is already above the ${be} average posted price, at a ${hit} hit rate on ${count(power.decided)} decided picks. The rate can still move.`;
  }
  return `The decided hit rate is ${hit} on ${count(power.decided)} picks, against a ${be} average break-even. If that hit rate and those prices stayed exactly like this, the 95% Wilson lower bound would clear the price after ${count(power.more)} more decided picks, ${count(power.needed)} in all. The rate will not stay still. This is a sketch of the current numbers, not a promise about the picks ahead.`;
}

function runsReading(runs) {
  if (!runs || runs.z == null) return "There are not enough wins and losses, in order, to test streaks.";
  const acf = signed(runs.acf, 3);
  let streak = "The lag-1 autocorrelation sits inside the usual random band, so the streaks look like a shuffle.";
  if (runs.acf != null && runs.band != null && Math.abs(runs.acf) > runs.band) {
    streak = runs.acf > 0
      ? "The lag-1 autocorrelation sits outside the usual random band, on the side of wins following wins. One sample can do that."
      : "The lag-1 autocorrelation sits outside the usual random band, on the side of wins following losses. One sample can do that.";
  }
  return `Wins and losses in time order, with pushes left out. There were ${count(runs.runs)} runs against ${runs.expected.toFixed(1)} expected from a shuffle. The runs z-score is ${signed(runs.z, 2)} and the two-sided p-value is ${pLabel(runs.p)}. ${streak}`;
}

function funnelReading(funnel) {
  const points = funnel?.points || [];
  if (points.length < 2) return "The funnel needs at least two splits.";
  const out = points.filter((p) => p.outside).length;
  const countLine = out
    ? `${count(out)} of ${count(points.length)} splits sit outside the limit nearest their sample size.`
    : `None of the ${count(points.length)} splits sit outside the limit nearest their sample size.`;
  return `Each dot is one split's ROI against how many graded picks it has. The dashed curves are 95% control limits from the spread of returns in the whole record. A small split gets a wide limit, so a loud ROI there is usually noise. ${countLine} A hollow dot is outside that limit. That is a loud sample, not a separate result. The limits assume every split is a random draw from the same return distribution.`;
}

function IntervalChart({ rows, refValue, format, caption }) {
  const nums = rows.flatMap((r) => [r.lo, r.hi, r.est]);
  if (Number.isFinite(refValue)) nums.push(refValue);
  const [lo, hi] = domain(nums);
  const refAt = Number.isFinite(refValue) ? place(refValue, lo, hi) : null;
  return (
    <div className="intervals" aria-hidden="true">
      <p className="interval-caption">{caption}</p>
      {rows.map((r) => (
        <div className="interval-row" key={r.key}>
          <span className="bar-key">{r.label}{r.few ? " · short" : ""}</span>
          <span className="interval-plot">
            {refAt != null && <i className="interval-ref" style={{ left: `${refAt}%` }} />}
            <i className="interval-bar" style={{ left: `${place(r.lo, lo, hi)}%`, width: `${Math.max(place(r.hi, lo, hi) - place(r.lo, lo, hi), 0.4)}%` }} />
            <i className="interval-dot" style={{ left: `${place(r.est, lo, hi)}%` }} />
          </span>
          <span className="interval-val">{format(r.est)}</span>
        </div>
      ))}
    </div>
  );
}

function MarkerChart({ rows, lines, format }) {
  const [lo, hi] = domain([...rows.map((r) => r.value), ...lines]);
  return (
    <div className="intervals" aria-hidden="true">
      {rows.map((r) => (
        <div className="interval-row" key={r.key}>
          <span className="bar-key">{r.label}{r.few ? " · short" : ""}</span>
          <span className="interval-plot">
            {lines.map((line) => (
              <i key={line} className={line === 0 ? "interval-zero" : "interval-ref"} style={{ left: `${place(line, lo, hi)}%` }} />
            ))}
            <i className="interval-dot" style={{ left: `${place(r.value, lo, hi)}%` }} />
          </span>
          <span className="interval-val">{format(r.value)}</span>
        </div>
      ))}
    </div>
  );
}

function LuckLine({ test }) {
  const lo = Math.min(test.expected - 2.4 * test.sd, test.wins);
  const hi = Math.max(test.expected + 2.4 * test.sd, test.wins);
  const [a, b] = domain([lo, hi]);
  const band = (k) => {
    const left = place(test.expected - k * test.sd, a, b);
    const right = place(test.expected + k * test.sd, a, b);
    return { left: `${left}%`, width: `${right - left}%` };
  };
  return (
    <div className="luck" aria-hidden="true">
      <div className="luck-plot">
        <i className="luck-band outer" style={band(2)} />
        <i className="luck-band inner" style={band(1)} />
        <i className="luck-expected" style={{ left: `${place(test.expected, a, b)}%` }} />
        <i className="luck-actual" style={{ left: `${place(test.wins, a, b)}%` }} />
      </div>
      <p className="interval-caption">Inner band, one standard deviation. Outer band, two. Dashed line, wins expected from the posted prices. Dot, actual wins.</p>
    </div>
  );
}

function RunsLine({ runs }) {
  const band = runs.band;
  const [lo, hi] = domain([-band, band, runs.acf, 0]);
  return (
    <div className="luck" aria-hidden="true">
      <div className="luck-plot">
        <i className="luck-band outer" style={{ left: `${place(-band, lo, hi)}%`, width: `${place(band, lo, hi) - place(-band, lo, hi)}%` }} />
        <i className="luck-expected" style={{ left: `${place(0, lo, hi)}%` }} />
        <i className="luck-actual" style={{ left: `${place(runs.acf, lo, hi)}%` }} />
      </div>
      <p className="interval-caption">The band is ±1.96 divided by the square root of the sample. The dot is the lag-1 autocorrelation. The dashed line is zero.</p>
    </div>
  );
}

function PowerBar({ power }) {
  if (!(power.needed > 0)) return null;
  const pct = Math.max(0, Math.min(100, (100 * power.decided) / power.needed));
  return (
    <div className="power" aria-hidden="true">
      <div className="power-track"><i style={{ width: `${pct}%` }} /></div>
      <p className="interval-caption">{count(power.decided)} decided picks so far. The sketch reaches the comparison at {count(power.needed)}.</p>
    </div>
  );
}

function RowLabel({ row }) {
  return <>{row.label}{row.few ? <span className="flag">Short sample</span> : null}</>;
}

export default function RigorSection({ rigor }) {
  if (!rigor?.units?.n) {
    return (
      <section className="block" id="nerds" aria-labelledby="nerds-h">
        <h2 id="nerds-h">For the stats nerds</h2>
        <p className="lede">These intervals draw once a pick is graded.</p>
      </section>
    );
  }

  const slices = intervalSlices(rigor.slices || []);
  const hitRows = [
    { key: "Overall", label: "Overall", few: false, est: rigor.wilson.p, lo: rigor.wilson.lo, hi: rigor.wilson.hi, n: rigor.wilson.n },
    ...slices.filter((s) => s.hit != null).map((s) => ({
      key: s.key, label: s.key, few: s.few, est: s.hit, lo: s.hitLo, hi: s.hitHi, n: s.wins + s.losses,
    })),
  ];
  const unitRows = [
    { key: "Overall", label: "Overall", few: false, est: rigor.units.est, lo: rigor.units.lo, hi: rigor.units.hi, n: rigor.units.n },
    ...slices.filter((s) => s.units != null).map((s) => ({
      key: s.key, label: s.key, few: s.few, est: s.units, lo: s.unitsLo, hi: s.unitsHi, n: s.n,
    })),
  ];
  const roiRows = [
    { key: "Overall", label: "Overall", few: false, est: rigor.roi.est, lo: rigor.roi.lo, hi: rigor.roi.hi, n: rigor.roi.n },
    ...slices.filter((s) => s.roi != null).map((s) => ({
      key: s.key, label: s.key, few: s.few, est: s.roi, lo: s.roiLo, hi: s.roiHi, n: s.n,
    })),
  ];
  const zRows = [
    { key: "Overall", label: "Overall", few: false, value: rigor.test.z, decided: rigor.test.n, wins: rigor.test.wins, expected: rigor.test.expected, p: rigor.test.p },
    ...(rigor.slices || []).filter((s) => s.decided >= 30 && s.z != null).slice().sort(byFamily).map((s) => ({
      key: s.key, label: s.key, few: s.few, value: s.z, decided: s.decided, wins: s.wins, expected: s.expected, p: s.p,
    })),
  ];
  const outsiders = (rigor.funnel?.points || []).filter((p) => p.outside);
  const priceGap = rigor.wilson && rigor.test?.n && rigor.test.n !== rigor.wilson.n;
  const betaAria = rigor.bayes
    ? `Beta posterior for the hit rate. Posterior mean ${hitPct(rigor.bayes.mean)}. Average posted price ${hitPct(rigor.bayes.price)}.`
    : "No hit-rate posterior.";
  const fanAria = rigor.fan
    ? `Reshuffled unit paths over ${count(rigor.fan.horizon)} picks. Median path and percentile bands.`
    : "No fan chart.";
  const funnelAria = funnelReading(rigor.funnel);

  return (
    <section className="block" id="nerds" aria-labelledby="nerds-h">
      <div className="head">
        <div>
          <h2 id="nerds-h">For the stats nerds</h2>
          <p className="lede">Same graded picks as the charts above. Wilson intervals, bootstrap intervals, a beta posterior, and a runs test. Resamples use a fixed seed and {count(rigor.boots)} draws, so the same record draws the same picture. This is not a larger sample.</p>
          <p className="note">p-values on a split are not adjusted for how many splits are on this page. A split that looks sharp can be one of many. The break-even in every test is the posted American price, not a model probability.</p>
        </div>
      </div>

      <div className="nerd" id="nerd-wilson">
        <h3>Hit rate, with a Wilson interval</h3>
        <p className="lede">{wilsonReading(rigor.wilson, rigor.test?.meanPrice)}</p>
        <p className="note">The bar is the 95% Wilson interval. The dot is the hit rate. The dashed line is the average break-even of the posted prices. A wide bar is a small sample. Sport, market, tier, price, side, and venue are the splits here. Smaller cuts are on the funnel below.{priceGap ? " The dashed line uses only decided picks that have a usable posted price." : ""}</p>
        <IntervalChart rows={hitRows} refValue={rigor.test?.meanPrice} format={hitPct} caption="Dashed line: average break-even of the posted prices." />
        <div className="tablewrap">
          <table className="stack">
            <caption>Hit rate and 95% Wilson interval. Overall, then sport, market, tier, price, side, and venue.</caption>
            <thead>
              <tr>
                <th scope="col">Split</th>
                <th scope="col" className="r">Decided</th>
                <th scope="col" className="r">Hit rate</th>
                <th scope="col" className="r">95% interval</th>
              </tr>
            </thead>
            <tbody>
              {hitRows.map((r) => (
                <tr key={r.key}>
                  <th scope="row" data-label="Split"><RowLabel row={r} /></th>
                  <td className="r num" data-label="Decided">{count(r.n)}</td>
                  <td className="r num" data-label="Hit rate">{hitPct(r.est)}</td>
                  <td className="r num" data-label="95% interval">{hitPct(r.lo)} to {hitPct(r.hi)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="nerd" id="nerd-units">
        <h3>Units, with a bootstrap interval</h3>
        <p className="lede">{bandReading("units", rigor.units.lo, rigor.units.hi, rigor.units.est)}</p>
        <p className="note">Each draw resamples the graded picks with replacement, {count(rigor.boots)} times, and keeps the middle 95 percent of those draws. The dot is the units on the book, not the center of the draws. The dashed line is zero.</p>
        <IntervalChart rows={unitRows} refValue={0} format={unitLabel} caption="Dashed line: zero units." />
        <div className="tablewrap">
          <table className="stack">
            <caption>Units and 95% bootstrap interval.</caption>
            <thead>
              <tr>
                <th scope="col">Split</th>
                <th scope="col" className="r">Graded</th>
                <th scope="col" className="r">Units</th>
                <th scope="col" className="r">95% interval</th>
              </tr>
            </thead>
            <tbody>
              {unitRows.map((r) => (
                <tr key={r.key}>
                  <th scope="row" data-label="Split"><RowLabel row={r} /></th>
                  <td className="r num" data-label="Graded">{count(r.n)}</td>
                  <td className="r num" data-label="Units">{unitLabel(r.est)}</td>
                  <td className="r num" data-label="95% interval">{unitLabel(r.lo)} to {unitLabel(r.hi)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="nerd" id="nerd-roi">
        <h3>ROI, with a bootstrap interval</h3>
        <p className="lede">{bandReading("roi", rigor.roi.lo, rigor.roi.hi, rigor.roi.est)}</p>
        <p className="note">Same draws as the units interval. ROI is units won divided by units staked inside each draw. A split with a few picks has a wide interval, which is the point of drawing it.</p>
        <IntervalChart rows={roiRows} refValue={0} format={roiPct} caption="Dashed line: zero ROI." />
        <div className="tablewrap">
          <table className="stack">
            <caption>ROI and 95% bootstrap interval.</caption>
            <thead>
              <tr>
                <th scope="col">Split</th>
                <th scope="col" className="r">Graded</th>
                <th scope="col" className="r">ROI</th>
                <th scope="col" className="r">95% interval</th>
              </tr>
            </thead>
            <tbody>
              {roiRows.map((r) => (
                <tr key={r.key}>
                  <th scope="row" data-label="Split"><RowLabel row={r} /></th>
                  <td className="r num" data-label="Graded">{count(r.n)}</td>
                  <td className="r num" data-label="ROI">{roiPct(r.est)}</td>
                  <td className="r num" data-label="95% interval">{roiPct(r.lo)} to {roiPct(r.hi)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="nerd" id="nerd-test">
        <h3>Test against the posted price</h3>
        <p className="lede">{testReading(rigor.test)}</p>
        <p className="note">The score treats each posted price as the win rate for that pick and adds the variances. Pushes are left out. The dashed lines are plus and minus 1.96, the usual 95% marks. Splits under 30 decided picks are left off this plot and stay on the funnel. These p-values are not adjusted for the number of splits.</p>
        <MarkerChart rows={zRows} lines={[-Z_LINE, 0, Z_LINE]} format={(v) => signed(v, 2)} />
        <div className="tablewrap">
          <table className="stack">
            <caption>Wins against the total implied by the posted prices. Overall, and splits with at least 30 decided picks.</caption>
            <thead>
              <tr>
                <th scope="col">Split</th>
                <th scope="col" className="r">Decided</th>
                <th scope="col" className="r">Wins</th>
                <th scope="col" className="r">Expected</th>
                <th scope="col" className="r">z</th>
                <th scope="col" className="r">p</th>
              </tr>
            </thead>
            <tbody>
              {zRows.map((r) => (
                <tr key={r.key}>
                  <th scope="row" data-label="Split">{r.label}</th>
                  <td className="r num" data-label="Decided">{count(r.decided)}</td>
                  <td className="r num" data-label="Wins">{count(r.wins)}</td>
                  <td className="r num" data-label="Expected">{r.expected == null ? "–" : r.expected.toFixed(1)}</td>
                  <td className="r num" data-label="z">{signed(r.value, 2)}</td>
                  <td className="r num" data-label="p">{pLabel(r.p)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="nerd" id="nerd-luck">
        <h3>Wins against the price band</h3>
        <p className="lede">{luckReading(rigor.test)}</p>
        <p className="note">Expected wins are the posted prices added up. The bands are one and two standard deviations of that sum. This is the same comparison as the test above, drawn as a count of wins rather than a z-score.</p>
        {rigor.test?.sd > 0 && <LuckLine test={rigor.test} />}
      </div>

      <div className="nerd" id="nerd-bayes">
        <h3>A beta posterior for the hit rate</h3>
        <p className="lede">{bayesReading(rigor.bayes, rigor.wilson)}</p>
        <p className="note">The curve starts from a nearly flat prior and updates it with the wins and losses. The dashed line is the average posted price. The faint line is the posterior mean. The ROI figure is a separate Bayesian bootstrap of the graded units, not a read of that curve. Neither one is a model probability.</p>
        <BetaChart density={rigor.bayes?.density} price={rigor.bayes?.price} mean={rigor.bayes?.mean} aria={betaAria} />
      </div>

      <div className="nerd" id="nerd-fan">
        <h3>Plausible unit paths, reshuffled</h3>
        <p className="lede">{fanReading(rigor.fan)}</p>
        <p className="note">The deeper bronze band is the middle half of {count(rigor.paths)} paths. The lighter band runs from the 5th to the 95th percentile. Paths are drawn from the graded results only. Open picks are not in the mix. None of this uses a model probability.</p>
        <FanChart fan={rigor.fan} aria={fanAria} />
      </div>

      <div className="nerd" id="nerd-clv">
        <h3>Closing line, mean and correlation</h3>
        <p className="lede">{clvReading(rigor.clv)}</p>
        <p className="note">The interval is a t interval for the mean of the cents figures on graded picks. It does not fill a missing cents figure from the points value or from the price. Correlation is Pearson, on decided picks for the win comparison.</p>
        {rigor.clv?.mean != null && (
          <IntervalChart
            rows={[{ key: "Mean", label: "Mean cents", few: false, est: rigor.clv.mean, lo: rigor.clv.lo, hi: rigor.clv.hi }]}
            refValue={0}
            format={formatCents}
            caption="Dashed line: zero cents."
          />
        )}
      </div>

      <div className="nerd" id="nerd-power">
        <h3>How many more picks the comparison needs</h3>
        <p className="lede">{powerReading(rigor.power)}</p>
        <p className="note">The sketch holds the current hit rate and the current average price still, and asks when the 95% Wilson lower bound would clear that price. It is not a sequential test, and it is not a sample size for a future slate.</p>
        <PowerBar power={rigor.power} />
      </div>

      <div className="nerd" id="nerd-runs">
        <h3>Streaks against a shuffle</h3>
        <p className="lede">{runsReading(rigor.runs)}</p>
        <p className="note">A run is a streak of the same result. Pushes are left out, because a push is not a win or a loss. The band is the usual 95% range for a lag-1 autocorrelation when the order is random.</p>
        {rigor.runs?.acf != null && rigor.runs.band != null && <RunsLine runs={rigor.runs} />}
      </div>

      <div className="nerd" id="nerd-funnel">
        <h3>Split ROI against sample size</h3>
        <p className="lede">{funnelReading(rigor.funnel)}</p>
        <p className="note">Day, start time, book, team, and opponent sit on this plot with the larger splits. A team with a handful of picks can print a wild ROI. The limits get wider as the sample gets smaller so that print does not read as a finding. Hollow dots are outside the limit nearest their count.</p>
        <FunnelChart funnel={rigor.funnel} aria={funnelAria} />
        {outsiders.length > 0 && (
          <details className="series">
            <summary>{count(outsiders.length)} {outsiders.length === 1 ? "split sits" : "splits sit"} outside the limits</summary>
            <div className="tablewrap">
              <table className="stack">
                <caption>Splits whose ROI is outside the control limit nearest their sample size.</caption>
                <thead>
                  <tr>
                    <th scope="col">Split</th>
                    <th scope="col" className="r">Graded</th>
                    <th scope="col" className="r">ROI</th>
                  </tr>
                </thead>
                <tbody>
                  {outsiders.map((p) => (
                    <tr key={p.key}>
                      <th scope="row" data-label="Split">{p.key}{p.few ? <span className="flag">Short sample</span> : null}</th>
                      <td className="r num" data-label="Graded">{count(p.n)}</td>
                      <td className="r num" data-label="ROI">{roiPct(p.roi)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </details>
        )}
      </div>
    </section>
  );
}
