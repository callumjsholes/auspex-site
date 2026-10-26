// One total for every page. Published units are exact thousandths of a unit, so the
// sum is an integer count of those thousandths. Addition order cannot change it,
// and the last point on a units chart is the same number as the headline.

export const isGraded = (result) => result === "Won" || result === "Lost" || result === "Push";

const SCALE = 1000;

export function toMilli(v) {
  if (v == null || Number.isNaN(Number(v))) return 0;
  return Math.round(Number(v) * SCALE);
}

export function fromMilli(m) {
  return m / SCALE;
}

export function summarize(rows) {
  const done = rows.filter((r) => isGraded(r.result));
  let unitMilli = 0;
  let stakeMilli = 0;
  for (const r of done) {
    unitMilli += toMilli(r.units);
    stakeMilli += toMilli(r.stake);
  }
  const clvRows = rows.filter((r) => r.clv != null && !Number.isNaN(Number(r.clv)));
  let clvMilli = 0;
  for (const r of clvRows) clvMilli += toMilli(r.clv);
  return {
    bets: done.length,
    wins: done.filter((r) => r.result === "Won").length,
    losses: done.filter((r) => r.result === "Lost").length,
    pushes: done.filter((r) => r.result === "Push").length,
    staked: fromMilli(stakeMilli),
    units: fromMilli(unitMilli),
    unitMilli,
    roi: stakeMilli ? (100 * unitMilli) / stakeMilli : null,
    pending: rows.filter((r) => r.result === "Pending").length,
    clvN: clvRows.length,
    beatClose: clvRows.length ? (100 * clvRows.filter((r) => r.clv > 0).length) / clvRows.length : null,
    avgClv: clvRows.length ? fromMilli(clvMilli) / clvRows.length : null,
  };
}

function timeKey(r) {
  return `${r.date || ""}|${r.locked || ""}|${r.id || ""}`;
}

export function byTime(a, b) {
  const ka = timeKey(a);
  const kb = timeKey(b);
  return ka < kb ? -1 : ka > kb ? 1 : 0;
}

// Chronological running total. `units` draws the line. `unitMilli` is the exact total.
export function runningTotals(rows) {
  const done = rows.filter((r) => isGraded(r.result)).sort(byTime);
  let unitMilli = 0;
  return done.map((r, i) => {
    unitMilli += toMilli(r.units);
    return { i: i + 1, date: r.date, units: fromMilli(unitMilli), unitMilli, r };
  });
}

export function series(rows) {
  return runningTotals(rows).map(({ i, date, units, unitMilli }) => ({ i, date, units, unitMilli }));
}
