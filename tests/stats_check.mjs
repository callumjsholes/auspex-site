// Stats page checks. Run from the repo root:
//   node --experimental-detect-module tests/stats_check.mjs
import fs from "node:fs";
import assert from "node:assert/strict";
import { finite } from "../web/lib/clv.js";
import { getData } from "../web/lib/data.js";
import { implied } from "../web/lib/format.js";
import {
  ODDS_ORDER, SHORT_SAMPLE, buildStats, centsSeries, clvBands, drawdownSeries, oddsBand,
  priceCompare, readCalibration, readCalibrationBuckets, readContextIndex, readOlderTests,
  readPriceShopping, readTierIndex, rollingSeries, stakeSentence, startBand, totalsMatch,
  unitBins, withContext, withTiers,
} from "../web/lib/stats.js";

const fixture = JSON.parse(fs.readFileSync(new URL("./fixtures/calibration/buckets.json", import.meta.url), "utf8"));
const buckets = readCalibrationBuckets(fixture);
assert.equal(buckets.length, 2);
assert.equal(buckets[0].bin, "10–20%");
assert.equal(buckets[0].n, 1);
assert.equal(buckets[0].few, true);
assert.equal(buckets[0].book, null);
assert.equal(buckets[0].obs, 0);
assert.equal(buckets[1].bin, "50–60%");
assert.equal(buckets[1].few, false);
assert.equal(buckets[1].book.n, 10);
assert.equal(buckets[1].book.few, true);
assert.deepEqual(Object.keys(buckets[1]).sort(), ["bin", "book", "few", "n", "obs", "pred"]);
assert.equal("chance" in buckets[1], false);
assert.equal(readCalibrationBuckets([]).length, 0);
assert.equal(readCalibrationBuckets(null).length, 0);
assert.equal(readCalibrationBuckets([{ model_pred: 0.4, model_obs: 0.4 }]).length, 0);

for (let p = -400; p <= 400; p += 1) {
  if (p > -100 && p < 100 && p !== 0) continue;
  assert.ok(ODDS_ORDER.includes(oddsBand(p)), String(p));
}
assert.equal(oddsBand(-150), "−150 or shorter");
assert.equal(oddsBand(-149), "−149 to −110");
assert.equal(oddsBand(-110), "−149 to −110");
assert.equal(oddsBand(-109), "−109 to +110");
assert.equal(oddsBand(110), "−109 to +110");
assert.equal(oddsBand(111), "+111 to +150");
assert.equal(oddsBand(150), "+111 to +150");
assert.equal(oddsBand(151), "+151 or longer");
assert.equal(oddsBand(null), "No price");

const rows = [
  { id: "1", league: "NBA", stat: "pts", price: -150, tier: "Pick", stake: 1, units: 0.667, result: "Won", date: "2026-10-20", locked: "a", clv: 1, clvCents: 1.5, short: "A" },
  { id: "2", league: "NHL", stat: "ml", price: 175, tier: "Best bet", stake: 2, units: -2, result: "Lost", date: "2026-10-20", locked: "b", clv: -0.5, clvCents: -1.1, short: "B" },
  { id: "3", league: "NBA", stat: "reb", price: -110, tier: "Pick", stake: 1, units: 0, result: "Push", date: "2026-10-21", locked: "c", clv: null, clvCents: null, short: "C" },
  { id: "4", league: "NBA", stat: "ast", price: 120, tier: "Pick", stake: 1, units: null, result: "Pending", date: "2026-10-22", locked: "d", clv: 0.4, clvCents: 0.4, short: "D" },
];
const model = buildStats(rows);
assert.equal(model.summary.bets, 3);
assert.equal(model.summary.pending, 1);
assert.equal(model.series.length, 3);
assert.equal(model.series.at(-1).unitMilli, model.summary.unitMilli);
assert.equal(model.series.at(-1).roi, model.summary.roi);
assert.equal(model.daily.at(-1).totalMilli, model.summary.unitMilli);
assert.equal(model.daily.length, 2);
assert.equal(model.cents.length, 3);
assert.equal(model.centsGradedMissing, 1);
assert.equal(model.centsOpen, 1);
assert.equal(model.facts.duplicate, true);
assert.equal(model.facts.onlyKnown, true);
assert.equal(model.splits.odds.find((g) => g.key === "+111 to +150").summary.bets, 0);
assert.equal(model.splits.odds.find((g) => g.key === "+111 to +150").summary.pending, 1);
assert.equal(stakeSentence(rows), "On graded picks, Pick is 1 unit. Best bet is 2 units.");
const few = buildStats(Array.from({ length: 29 }, (_, i) => ({ id: String(i), league: "NBA", stat: "pts", price: -110, tier: "Pick", stake: 1, units: 0.1, result: "Won", date: "2026-10-20", locked: String(i) })));
assert.equal(few.splits.sport[0].few, true);
const enough = buildStats(Array.from({ length: 30 }, (_, i) => ({ id: String(i), league: "NBA", stat: "pts", price: -110, tier: "Pick", stake: 1, units: 0.1, result: "Won", date: "2026-10-20", locked: String(i).padStart(2, "0") })));
assert.equal(enough.splits.sport[0].few, false);
assert.equal(SHORT_SAMPLE, 30);

const kept = withTiers([{ id: "nba-1", tier: "Keep" }], new Map([["nba-1", "Other"]]));
assert.equal(kept[0].tier, "Keep");
const filled = withTiers([{ id: "nba-1", units: 1 }], new Map([["nba-1", "Pick"]]));
assert.equal(filled[0].tier, "Pick");
assert.equal(filled[0].units, 1);

const mixed = buildStats([
  { id: "a", league: "NBA", stat: "ml", price: -120, stake: 1, units: 1, result: "Won", date: "2026-10-20", locked: "a" },
  { id: "b", league: "NHL", stat: "ml", price: -120, stake: 1, units: -1, result: "Lost", date: "2026-10-20", locked: "b" },
]);
assert.equal(mixed.facts.duplicate, false);

const data = getData();
const live = buildStats(withTiers(data.all, readTierIndex()));
assert.equal(totalsMatch(live.summary, data.sum.all), true);
assert.equal(live.series.length, live.summary.bets);
assert.equal(live.series.at(-1).unitMilli, live.summary.unitMilli);
assert.equal(live.daily.at(-1).totalMilli, live.summary.unitMilli);
assert.equal(live.cents.length, data.all.filter((r) => finite(r.clvCents) != null).length);
for (const name of ["sport", "market", "tier", "odds"]) {
  const groups = live.splits[name];
  assert.equal(groups.reduce((a, g) => a + g.summary.bets, 0), live.summary.bets, name);
  assert.equal(groups.reduce((a, g) => a + g.summary.unitMilli, 0), live.summary.unitMilli, name);
}
for (const point of live.series) {
  assert.equal("model_pred" in point, false);
  assert.equal("clvCents" in point, false);
}
for (const row of data.all) {
  for (const key of ["chance", "probability", "projection", "edge", "minutes", "model_pred"]) {
    assert.equal(key in row, false, key);
  }
}
const research = JSON.parse(fs.readFileSync(new URL("../data/research.json", import.meta.url), "utf8"));
const cal = readCalibration();
assert.equal(cal.present, Array.isArray(research.nba_calibration));
assert.equal(cal.buckets.length, readCalibrationBuckets(research.nba_calibration).length);
assert.equal(JSON.stringify(cal).includes("nba_ev_buckets"), false);

const liveRows = withContext(withTiers(data.all, readTierIndex()), readContextIndex());
const shaped = buildStats(liveRows);
assert.equal(shaped.rolling25.length, Math.max(0, shaped.summary.bets - 24));
assert.equal(shaped.rolling50.length, Math.max(0, shaped.summary.bets - 49));
if (shaped.rolling25.length) {
  const end = shaped.rolling25.at(-1);
  assert.equal(end.wins + end.losses + 0 <= 25, true);
  assert.equal(end.window, 25);
  assert.equal("clvCents" in end, false);
}
assert.equal(shaped.drawdown.points.length, shaped.series.length);
assert.ok(shaped.drawdown.points.every((p) => p.underMilli <= 0));
assert.equal(shaped.bins.reduce((a, b) => a + b.n, 0), shaped.summary.bets);
assert.equal(shaped.clvBands.n, data.all.filter((r) => finite(r.clvCents) != null && ["Won", "Lost", "Push"].includes(r.result)).length);
assert.equal(shaped.team.reduce((a, g) => a + g.summary.bets, 0), shaped.summary.bets);
assert.equal(shaped.prices.reduce((a, g) => a + g.summary.bets, 0), shaped.summary.bets);
const shop = readPriceShopping();
assert.equal(Array.isArray(shop.picks), false);
assert.equal("units_typical" in shop, false);
assert.ok(shop.n > 0);
const older = readOlderTests();
const charts = JSON.parse(fs.readFileSync(new URL("../data/charts.json", import.meta.url), "utf8"));
assert.equal(older.equity.length, charts.nba_equity.length);
assert.equal(JSON.stringify(older).includes("ll_model"), false);
assert.equal(JSON.stringify(older).includes("nhl_clv_move"), false);
assert.equal(startBand("2026-10-20T23:00:00Z"), "7 PM ET");
const priced = priceCompare([
  { price: -150, result: "Won", stake: 1, units: 0.67, date: "2026-10-20", locked: "a" },
  { price: -150, result: "Lost", stake: 1, units: -1, date: "2026-10-20", locked: "b" },
]);
assert.equal(priced[0].decided, 2);
assert.equal(priced[0].hit, 50);
assert.ok(Math.abs(priced[0].breakeven - implied(-150) * 100) < 1e-9);
const rolled = rollingSeries([
  { result: "Won", stake: 1, units: 1, date: "2026-10-20", locked: "a" },
  { result: "Lost", stake: 1, units: -1, date: "2026-10-21", locked: "b" },
], 2);
assert.equal(rolled.length, 1);
assert.equal(rolled[0].winRate, 50);
assert.equal(unitBins([{ result: "Lost", units: -1, stake: 1 }])[0].key, "−1.49u to −0.01u");
assert.equal(drawdownSeries([{ i: 1, unitMilli: 1000, date: "2026-10-20" }, { i: 2, unitMilli: -500, date: "2026-10-21" }]).worstMilli, -1500);
assert.equal(clvBands([{ result: "Won", clvCents: 2, stake: 1, units: 1 }]).bands[0].key, "1¢ to 3¢");
for (const row of data.nba) {
  assert.equal("team" in row, false);
  assert.equal("units_typical" in row, false);
}

const bannedReads = ["nba_ev_buckets", "nhl_buckets", "ll_model", "changelog"];
const sources = [
  "web/lib/stats.js",
  "web/components/StatsPage.jsx",
  "web/components/StatsMore.jsx",
  "web/components/CalChart.jsx",
  "web/components/LineChart.jsx",
  "web/app/stats/page.jsx",
].map((file) => fs.readFileSync(new URL("../" + file, import.meta.url), "utf8")).join("\n");
for (const word of bannedReads) assert.equal(sources.includes(word), false, word);
assert.equal(centsSeries([{ clv: 1.2, clvCents: null, result: "Won", date: "2026-10-20" }]).length, 0);

console.log("stats checks ok");
