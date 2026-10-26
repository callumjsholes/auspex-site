// Rigorous-stats helpers. Run from the repo root:
//   node --experimental-detect-module tests/rigor_check.mjs
import assert from "node:assert/strict";
import { getData } from "../web/lib/data.js";
import { toMilli } from "../web/lib/summary.js";
import { buildStats, readContextIndex, readTierIndex, withContext, withTiers } from "../web/lib/stats.js";
import {
  betaHit, betaQuantile, breakEven, buildRigor, logGamma, mulberry32, normalCdf,
  pearson, priceTest, regularizedIncompleteBeta, runsTest, sampleSize, studentCdf,
  studentQuantile, wilson,
} from "../web/lib/rigor.js";

assert.ok(Math.abs(normalCdf(0) - 0.5) < 1e-4);
assert.ok(Math.abs(normalCdf(1.959963984540054) - 0.975) < 2e-4);
assert.ok(Math.abs(logGamma(1)) < 1e-9);
assert.ok(Math.abs(logGamma(6) - Math.log(120)) < 1e-9);
assert.ok(Math.abs(regularizedIncompleteBeta(0.5, 1, 1) - 0.5) < 1e-9);
assert.ok(Math.abs(regularizedIncompleteBeta(0.5, 2, 2) - 0.5) < 1e-6);
assert.ok(Math.abs(betaQuantile(0.5, 2, 2) - 0.5) < 1e-6);
assert.ok(Math.abs(studentCdf(0, 10) - 0.5) < 1e-6);
assert.ok(Math.abs(studentCdf(1, 1) - 0.75) < 1e-4);
assert.ok(Math.abs(studentQuantile(0.975, 10) - 2.228138851986274) < 2e-3);
assert.ok(Math.abs(studentQuantile(0.975, 1e6) - 1.959963984540054) < 2e-3);

const even = wilson(50, 50);
assert.ok(even.lo < 0.5 && even.hi > 0.5);
assert.ok(even.hi - even.lo < 0.25);
const none = wilson(0, 10);
assert.equal(none.lo, 0);
assert.ok(none.hi < 0.3);
const all = wilson(10, 0);
assert.equal(all.hi, 1);
assert.equal(wilson(0, 0), null);
const mirror = wilson(3, 7);
const flip = wilson(7, 3);
assert.ok(Math.abs(mirror.lo - (1 - flip.hi)) < 1e-12);
assert.ok(Math.abs(mirror.hi - (1 - flip.lo)) < 1e-12);

const rngA = mulberry32(20261025);
const rngB = mulberry32(20261025);
assert.equal(rngA(), rngB());
assert.equal(rngA(), rngB());
assert.notEqual(mulberry32(1)(), mulberry32(2)());

const flat = [
  { result: "Won", units: 1, stake: 1, price: 100, date: "2026-10-20", locked: "a", id: "1" },
  { result: "Lost", units: -1, stake: 1, price: 100, date: "2026-10-20", locked: "b", id: "2" },
  { result: "Won", units: 1, stake: 1, price: 100, date: "2026-10-21", locked: "c", id: "3" },
  { result: "Lost", units: -1, stake: 1, price: 100, date: "2026-10-21", locked: "d", id: "4" },
];
const small = buildRigor(flat, { boots: 200, paths: 50, seed: 7 });
const again = buildRigor(flat, { boots: 200, paths: 50, seed: 7 });
assert.deepEqual(small.units, again.units);
assert.deepEqual(small.fan.p50, again.fan.p50);
assert.equal(small.units.est, 0);
assert.ok(small.units.lo <= small.units.est && small.units.est <= small.units.hi);
assert.ok(small.roi.lo <= 0 && small.roi.hi >= 0);
assert.equal(breakEven(100), 0.5);
assert.equal(breakEven(-110), 110 / 210);
assert.equal(breakEven(50), null);
const fair = priceTest(flat);
assert.equal(fair.wins, 2);
assert.equal(fair.expected, 2);
assert.ok(Math.abs(fair.z) < 1e-9);

const hot = [];
for (let i = 0; i < 80; i++) hot.push({ result: "Won", units: 1, stake: 1, price: 100, date: "2026-10-20", locked: String(i), id: "w" + i });
for (let i = 0; i < 20; i++) hot.push({ result: "Lost", units: -1, stake: 1, price: 100, date: "2026-10-21", locked: String(i), id: "l" + i });
const hotTest = priceTest(hot);
assert.ok(hotTest.z > 5);
assert.ok(hotTest.p < 1e-6);
const post = betaHit(80, 20);
assert.ok(Math.abs(post.mean - (80.5 / 101)) < 1e-12);
assert.ok(post.lo < post.mean && post.mean < post.hi);
const balanced = betaHit(40, 40);
const pAboveHalf = 1 - regularizedIncompleteBeta(0.5, balanced.a, balanced.b);
assert.ok(Math.abs(pAboveHalf - 0.5) < 1e-3);

const clump = [
  { result: "Won", date: "2026-10-20", locked: "a" },
  { result: "Won", date: "2026-10-20", locked: "b" },
  { result: "Won", date: "2026-10-20", locked: "c" },
  { result: "Lost", date: "2026-10-21", locked: "d" },
  { result: "Lost", date: "2026-10-21", locked: "e" },
  { result: "Lost", date: "2026-10-21", locked: "f" },
];
const clumped = runsTest(clump);
assert.equal(clumped.runs, 2);
assert.equal(clumped.expected, 4);
assert.ok(clumped.z < 0);
const alt = [
  { result: "Won", date: "2026-10-20", locked: "a" },
  { result: "Lost", date: "2026-10-20", locked: "b" },
  { result: "Won", date: "2026-10-20", locked: "c" },
  { result: "Lost", date: "2026-10-21", locked: "d" },
  { result: "Won", date: "2026-10-21", locked: "e" },
  { result: "Lost", date: "2026-10-21", locked: "f" },
];
const alternating = runsTest(alt);
assert.equal(alternating.runs, 6);
assert.ok(alternating.acf < 0);
assert.ok(clumped.acf > 0);

const corr = pearson([1, 2, 3, 4], [1, 2, 3, 4]);
assert.ok(Math.abs(corr.r - 1) < 1e-12);
assert.ok(pearson([1, 2, 3, 4], [4, 3, 2, 1]).r < 0);

const reach = sampleSize(0.7, 0.5, 20);
assert.equal(reach.unreachable, false);
assert.ok(reach.needed > 20);
assert.equal(reach.more, reach.needed - 20);
const stuck = sampleSize(0.45, 0.52, 100);
assert.equal(stuck.unreachable, true);
const done = sampleSize(0.9, 0.5, 200);
assert.equal(done.already, true);
assert.equal(done.more, 0);

for (let t = 1; t < small.fan.horizon; t++) {
  assert.ok(small.fan.p5[t - 1] !== undefined);
  assert.ok(small.fan.p5[0] <= small.fan.p25[0] + 1e-9);
  assert.ok(small.fan.p25[0] <= small.fan.p50[0] + 1e-9);
  assert.ok(small.fan.p50[0] <= small.fan.p75[0] + 1e-9);
  assert.ok(small.fan.p75[0] <= small.fan.p95[0] + 1e-9);
}
assert.equal(small.fan.p5.length, 4);

const data = getData();
const rows = withContext(withTiers(data.all, readTierIndex()), readContextIndex());
const live = buildRigor(rows);
const live2 = buildRigor(rows);
assert.equal(live.seed, 20261025);
assert.deepEqual(live.units, live2.units);
assert.deepEqual(live.fan.p50, live2.fan.p50);
const stats = buildStats(rows);
assert.ok(Math.abs(toMilli(live.units.est) - stats.summary.unitMilli) < 1);
assert.ok(live.wilson.lo <= live.wilson.p && live.wilson.p <= live.wilson.hi);
assert.ok(live.units.lo <= live.units.est && live.units.est <= live.units.hi);
assert.ok(live.roi.lo <= live.roi.est && live.roi.est <= live.roi.hi);
assert.equal(live.fan.horizon, stats.summary.bets);
assert.ok(live.fan.p5.length === live.fan.horizon);
assert.ok(live.test.n > 0 && live.test.sd > 0);
assert.ok(live.bayes.lo < live.bayes.hi);
assert.ok(live.clv.n > 2 && live.clv.lo < live.clv.hi);
assert.equal(JSON.stringify(live).includes("units_typical"), false);
assert.equal(JSON.stringify(live.slices[0]).includes("player"), false);
for (const point of live.funnel.points) {
  const half = live.funnel.limits;
  assert.ok(point.n >= 1);
  assert.equal("edge" in point, false);
}
assert.ok(halfWidth(live, 10) > halfWidth(live, 100));
assert.ok(Math.abs(live.power.hit - live.test.wins / live.test.n) < 1e-12);
assert.ok(live.funnel.points.length > 2);
assert.ok(live.funnel.points.every((p) => typeof p.outside === "boolean"));

const dumped = JSON.stringify(live);
for (const word of ["nba_ev_buckets", "nhl_buckets", "ll_model", "changelog", "close_ev"]) {
  assert.equal(dumped.includes(word), false, word);
}

console.log(JSON.stringify({
  hit: round(live.wilson.p), hitLo: round(live.wilson.lo), hitHi: round(live.wilson.hi),
  units: round(live.units.est), unitsLo: round(live.units.lo), unitsHi: round(live.units.hi),
  roi: round(live.roi.est), roiLo: round(live.roi.lo), roiHi: round(live.roi.hi),
  z: round(live.test.z), p: live.test.p, wins: live.test.wins, expected: round(live.test.expected),
  pAbove: round(live.bayes.pAbovePrice), pRoi: round(live.bayes.pRoiPositive),
  clv: round(live.clv.mean), clvLo: round(live.clv.lo), clvHi: round(live.clv.hi), clvP: live.clv.p,
  rWin: round(live.clv.rWin), rWinP: live.clv.rWinP,
  runsZ: round(live.runs.z), runsP: live.runs.p, acf: round(live.runs.acf),
  power: live.power,
  down20: round(live.fan.pDown20), down100: round(live.fan.pDown100), endDown: round(live.fan.pEndDown),
}, null, 2));
console.log("rigor checks ok");

function round(v) { return v == null ? null : Math.round(v * 1000) / 1000; }
function halfWidth(model, n) {
  const lim = model.funnel.limits;
  const near = lim.reduce((best, row) => Math.abs(row.n - n) < Math.abs(best.n - n) ? row : best, lim[0]);
  return near.hi - near.lo;
}
