// Fixture checks for closing-line value. Run from the repo root:
//   node --experimental-detect-module tests/clv_check.mjs
import fs from "node:fs";
import assert from "node:assert/strict";
import { odds } from "../web/lib/format.js";
import { nbaRow, nhlRow, getData } from "../web/lib/data.js";
import {
  assembleClv, clvFromRows, combineClv, describeClose, formatCents, formatPct,
  readClvBlock, readPickClv, readTierMap, summaryCopy, CLV_SENTENCE, headlineCents,
} from "../web/lib/clv.js";

const withFields = JSON.parse(fs.readFileSync(new URL("./fixtures/clv/with.json", import.meta.url), "utf8"));
const without = JSON.parse(fs.readFileSync(new URL("./fixtures/clv/without.json", import.meta.url), "utf8"));
const texts = (p) => describeClose(p, odds).map((it) => it.text);
const BANNED = ["chance", "projection", "proj", "edge", "minutes", "probability", "tier", "units_typical", "close_ev", "close_ev_units", "close_price", "close_line"];

const nba = nbaRow(withFields.nba);
assert.equal(nba.clvCents, 2.4);
assert.equal(nba.closeMedian, -125);
assert.equal(nba.closeBest, -120);
assert.equal(nba.closeBestBook, "FanDuel");
assert.equal(nba.closeQuoteLine, 21.5);
assert.equal(nba.closeLineExact, false);
assert.equal(nba.clv, 1.2);
assert.deepEqual(texts(nba), [
  "Locked -110",
  "Close -125, nearest line 21.5",
  "+2.4¢",
  "✓ Beat the close",
  "Best close -120 at FanDuel",
]);
for (const key of BANNED) assert.equal(key in nba, false, key);

const same = nbaRow(withFields.nbaSameLine);
assert.equal(same.clvCents, 0);
assert.deepEqual(texts(same), ["Locked +105", "Close +100", "0.0¢"]);
assert.equal(texts(same).some((t) => t.includes("nearest")), false);
assert.equal(texts(same).some((t) => t.includes("Beat")), false);
assert.equal(texts(same).some((t) => t.startsWith("Best close")), false);

const centsOnly = nbaRow(withFields.nbaCentsOnly);
assert.equal(centsOnly.closeMedian, null);
assert.equal(centsOnly.closeQuoteLine, null);
assert.equal(centsOnly.closeBestBook, null);
assert.deepEqual(texts(centsOnly), ["Locked -130", "−0.4¢"]);
assert.equal(texts(centsOnly).some((t) => t.startsWith("Close")), false);

const bad = nbaRow(withFields.nbaBad);
assert.deepEqual(readPickClv(withFields.nbaBad), {
  closeMedian: null, closeBest: null, closeBestBook: null, clvCents: null, closeQuoteLine: null, closeLineExact: null,
});
assert.equal(bad.clv, 3);
assert.equal(bad.clvCents, null);
assert.equal(describeClose(bad, odds), null);

const nhl = nhlRow(withFields.nhl);
assert.equal(nhl.closeBestBook, "caesars");
assert.equal(nhl.clvCents, -1.1);
assert.equal(texts(nhl).includes("✓ Beat the close"), false);
assert.ok(texts(nhl).includes("−1.1¢"));
assert.ok(texts(nhl).includes("Best close -135 at caesars"));

const old = nbaRow(without.nba);
assert.equal(old.clv, 0.1);
assert.equal(old.clvCents, null);
assert.equal(old.closeMedian, null);
assert.equal(describeClose(old, odds), null);
for (const key of BANNED) assert.equal(key in old, false, key);
assert.equal(describeClose(nhlRow(without.nhl), odds), null);

const medianOnly = nbaRow(without.nbaMedianOnly);
assert.equal(medianOnly.closeMedian, -118);
assert.equal(medianOnly.clvCents, null);
assert.deepEqual(texts(medianOnly), ["Locked -111", "Close -118", "CLV n/a"]);

assert.equal(readClvBlock(without.summary), null);
assert.equal(readClvBlock(without.nbaSummary), null);
assert.equal(readClvBlock(withFields.nullBlock), null);
assert.deepEqual(readClvBlock(withFields.zeroBlock), { n: 0, avg: null, beat: null, na: 3 });
assert.equal(readTierMap(withFields.pointsOnlyTier), null);
assert.deepEqual(readTierMap(withFields.tiers), { n: 20, avg: 2, beat: 65, na: 1 });

const published = assembleClv({
  nbaSummary: withFields.nbaSummary,
  nbaRows: [{ clvCents: 9 }, { clvCents: 9 }],
  nhlSummary: withFields.nhlLive,
  nhlRows: [{ clvCents: -9 }],
});
assert.equal(published.leagues, "both");
assert.equal(published.all.n, 150);
assert.ok(Math.abs(published.all.avg - (1.2 * 100 + 0.4 * 50) / 150) < 1e-9);
assert.ok(Math.abs(published.all.beat - (54 * 100 + 40 * 50) / 150) < 1e-9);
assert.equal(published.all.na, 5);
assert.notEqual(published.all.avg, 9);

const fromRows = assembleClv({
  nbaSummary: without.nbaSummary,
  nbaTiers: withFields.pointsOnlyTier,
  nbaRows: [nba, same, centsOnly, bad, old],
  nhlSummary: without.summary,
  nhlRows: [nhl, nhlRow(without.nhl)],
});
assert.equal(fromRows.leagues, "both");
assert.equal(fromRows.all.n, 4);
assert.equal(fromRows.all.na, null);
assert.ok(Math.abs(fromRows.all.avg - (2.4 + 0 + -0.4 + -1.1) / 4) < 1e-9);
assert.equal(fromRows.all.beat, 25);

assert.equal(clvFromRows([{ clv: 4, clvCents: null }, { clvCents: "1" }]), null);
assert.equal(combineClv([readClvBlock(withFields.nbaSummary), { n: null, avg: 1, beat: 1, na: 0 }]), null);

const emptyCopy = summaryCopy(null, null);
assert.equal(emptyCopy.avg, "n/a");
assert.equal(emptyCopy.beat, "n/a");
assert.equal(emptyCopy.n, "n/a");
assert.equal(emptyCopy.sentence, CLV_SENTENCE);
assert.equal(emptyCopy.sample, "Sample size");
assert.equal(emptyCopy.na, null);

const fullCopy = summaryCopy(published.all, "both");
assert.equal(fullCopy.avg, formatCents(published.all.avg));
assert.equal(fullCopy.beat, formatPct(published.all.beat));
assert.equal(fullCopy.n, "150");
assert.equal(fullCopy.sample, "Picks with a closing price, 5 left out");
assert.equal(summaryCopy(readClvBlock(withFields.zeroBlock), "NBA").sample, "NBA picks with a closing price, 3 left out");
assert.equal(summaryCopy(readClvBlock(withFields.zeroBlock), "NBA").avg, "n/a");
assert.equal(summaryCopy(readClvBlock(withFields.zeroBlock), "NBA").n, "0");

assert.equal(formatCents(2), "+2.0¢");
assert.equal(formatCents(-0.4), "−0.4¢");
assert.equal(formatCents(0.004), "+0.004¢");
assert.equal(formatCents(0), "0.0¢");
assert.equal(formatPct(54), "54%");
assert.equal(formatPct(49.333), "49.3%");
assert.equal(formatCents("2"), null);

assert.equal(headlineCents({ all: null, leagues: null }, { nba: 1, nhl: 1 }), null);
assert.equal(headlineCents({ all: published.nba, leagues: "NBA" }, { nba: 10, nhl: 6 }), null);
assert.equal(headlineCents(published, { nba: 10, nhl: 6 }).n, 150);
assert.equal(headlineCents({ all: published.nba, leagues: "NBA" }, { nba: 10, nhl: 0 }).avg, 1.2);

const recordPage = fs.readFileSync(new URL("../web/app/record/page.jsx", import.meta.url), "utf8");
const board = fs.readFileSync(new URL("../web/components/RecordBoard.jsx", import.meta.url), "utf8");
const today = fs.readFileSync(new URL("../web/components/Today.jsx", import.meta.url), "utf8");
assert.match(recordPage, /clv=\{D\.clv\}/);
assert.match(board, /summaryCopy\(view\.block, view\.leagues\)/);
assert.match(board, /copy\.sentence/);
assert.match(today, /<CloseLine /);
assert.equal(CLV_SENTENCE, "Beating the closing line is the best sign I have of a real edge, even on losing nights.");

const D = getData();
const nbaLive = JSON.parse(fs.readFileSync(new URL("../data/nba_live.json", import.meta.url), "utf8"));
const nhlPicks = JSON.parse(fs.readFileSync(new URL("../data/picks.json", import.meta.url), "utf8")).filter((p) => p.source === "live");
const summary = JSON.parse(fs.readFileSync(new URL("../data/summary.json", import.meta.url), "utf8"));
for (const raw of nbaLive.picks || []) {
  const row = D.nba.find((r) => r.id === "nba-" + raw.id);
  assert.ok(row, raw.id);
  const want = readPickClv(raw);
  assert.equal(row.closeMedian, want.closeMedian);
  assert.equal(row.clvCents, want.clvCents);
  assert.equal(row.closeBest, want.closeBest);
  assert.equal(row.closeQuoteLine, want.closeQuoteLine);
  assert.equal(row.closeLineExact, want.closeLineExact);
  assert.equal(row.clv, raw.clv_pts ?? null);
  for (const key of BANNED) assert.equal(key in row, false, key);
}
for (const raw of nhlPicks) {
  const row = D.nhl.find((r) => r.id === "nhl-" + raw.game_id);
  assert.ok(row, raw.game_id);
  const want = readPickClv(raw);
  assert.equal(row.closeMedian, want.closeMedian);
  assert.equal(row.clvCents, want.clvCents);
  assert.equal(row.clv, raw.clv_pts ?? null);
  for (const key of BANNED) assert.equal(key in row, false, key);
}
assert.deepEqual(D.clv, assembleClv({
  nbaSummary: nbaLive.summary, nbaTiers: nbaLive.by_tier, nbaRows: D.nba,
  nhlSummary: summary.live, nhlTiers: summary.live_by_tier, nhlRows: D.nhl,
}));

console.log("clv checks ok");
