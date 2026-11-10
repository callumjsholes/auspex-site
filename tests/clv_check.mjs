// Fixture checks for closing-line value. Run from the repo root:
//   node --experimental-detect-module tests/clv_check.mjs
import fs from "node:fs";
import assert from "node:assert/strict";
import { odds } from "../web/lib/format.js";
import { nbaRow, nhlRow, getData } from "../web/lib/data.js";
import {
  assembleClv, clvFromRows, combineClv, describeClose, formatCents, formatPct,
  medianClvCents, readClvBlock, readPickClv, readTierMap, summaryCopy, CLV_SENTENCE, headlineCents,
} from "../web/lib/clv.js";

const withFields = JSON.parse(fs.readFileSync(new URL("./fixtures/clv/with.json", import.meta.url), "utf8"));
const without = JSON.parse(fs.readFileSync(new URL("./fixtures/clv/without.json", import.meta.url), "utf8"));
const texts = (p) => describeClose(p, odds).map((it) => it.text);
// Pick rows still must not carry a probability. The /stats calibration chart reads
// research.json nba_calibration on its own and does not add these keys here.
const BANNED = ["chance", "projection", "proj", "edge", "minutes", "probability", "tier", "units_typical", "close_ev", "close_ev_units", "close_price", "close_line"];

const nba = nbaRow(withFields.nba);
assert.equal(nba.clvCents, 2.4);
assert.equal(nba.medianCents, medianClvCents(-115, -125));
assert.notEqual(nba.medianCents, nba.clvCents);
assert.ok(nba.medianCents > 0);
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
assert.equal(same.medianCents, null);
assert.deepEqual(texts(same), ["Locked +105", "Close +100", "0.0¢"]);
assert.equal(texts(same).some((t) => t.includes("nearest")), false);
assert.equal(texts(same).some((t) => t.includes("Beat")), false);
assert.equal(texts(same).some((t) => t.startsWith("Best close")), false);

const centsOnly = nbaRow(withFields.nbaCentsOnly);
assert.equal(centsOnly.medianCents, null);
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
assert.equal(bad.medianCents, null);
assert.equal(describeClose(bad, odds), null);

const nhl = nhlRow(withFields.nhl);
assert.equal(nhl.closeBestBook, "caesars");
assert.equal(nhl.clvCents, -1.1);
assert.equal(nhl.medianCents, medianClvCents(-150, -140));
assert.notEqual(nhl.medianCents, medianClvCents(withFields.nhl.best_price, -140));
assert.equal(texts(nhl).includes("✓ Beat the close"), false);
assert.ok(texts(nhl).includes("−1.1¢"));
assert.ok(texts(nhl).includes("Best close -135 at caesars"));

const old = nbaRow(without.nba);
assert.equal(old.clv, 0.1);
assert.equal(old.clvCents, null);
assert.equal(old.medianCents, null);
assert.equal(old.closeMedian, null);
assert.equal(describeClose(old, odds), null);
for (const key of BANNED) assert.equal(key in old, false, key);
assert.equal(describeClose(nhlRow(without.nhl), odds), null);

const medianOnly = nbaRow(without.nbaMedianOnly);
assert.equal(medianOnly.closeMedian, -118);
assert.equal(medianOnly.clvCents, null);
assert.equal(medianOnly.medianCents, null);
assert.deepEqual(texts(medianOnly), ["Locked -111", "Close -118", "CLV n/a"]);

assert.equal(readClvBlock(without.summary), null);
assert.equal(readClvBlock(without.nbaSummary), null);
assert.equal(readClvBlock(withFields.nullBlock), null);
assert.deepEqual(readClvBlock(withFields.zeroBlock), { n: 0, avg: null, beat: null, na: 3 });
assert.equal(readTierMap(withFields.pointsOnlyTier), null);
assert.deepEqual(readTierMap(withFields.tiers), { n: 20, avg: 2, beat: 65, na: 1 });

const ignored = assembleClv({
  nbaSummary: withFields.nbaSummary,
  nbaRows: [{ clvCents: 9 }, { clvCents: 9 }],
  nhlSummary: withFields.nhlLive,
  nhlRows: [{ clvCents: -9 }],
});
assert.equal(ignored.all, null);
assert.equal(ignored.leagues, null);

const fromMedian = assembleClv({
  nbaSummary: withFields.nbaSummary,
  nbaRows: [{ medianCents: 1 }, { medianCents: 0 }, { clvCents: 9 }],
  nhlSummary: withFields.nhlLive,
  nhlRows: [{ medianCents: -1 }, { medianCents: 3 }],
});
assert.equal(fromMedian.leagues, "both");
assert.equal(fromMedian.all.n, 4);
assert.equal(fromMedian.nba.na, 1);
assert.equal(fromMedian.all.na, 1);
assert.ok(Math.abs(fromMedian.all.avg - (1 + 0 + -1 + 3) / 4) < 1e-9);
assert.equal(fromMedian.all.beat, 50);
assert.notEqual(fromMedian.all.avg, withFields.nbaSummary.avg_clv_cents);

const fromRows = assembleClv({
  nbaSummary: without.nbaSummary,
  nbaTiers: withFields.pointsOnlyTier,
  nbaRows: [nba, same, centsOnly, bad, old],
  nhlSummary: without.summary,
  nhlRows: [nhl, nhlRow(without.nhl)],
});
assert.equal(fromRows.leagues, "both");
assert.equal(fromRows.nba.n, 1);
assert.equal(fromRows.nhl.n, 1);
assert.equal(fromRows.all.n, 2);
assert.equal(fromRows.all.na, 5);
assert.ok(Math.abs(fromRows.all.avg - (nba.medianCents + nhl.medianCents) / 2) < 1e-9);
assert.equal(fromRows.all.beat, 50);

assert.equal(medianClvCents(-110, -110), 0);
assert.equal(medianClvCents(null, -110), null);
assert.equal(medianClvCents(-110, null), null);
const ties = clvFromRows([{ medianCents: 0 }, { medianCents: 0 }, { medianCents: 2 }]);
assert.equal(ties.n, 3);
assert.equal(ties.beat, 100 / 3);
assert.equal(ties.na, 0);
assert.equal(clvFromRows([{ medianCents: 0 }]).beat, 0);
assert.equal(clvFromRows([{ clv: 4, clvCents: null }, { clvCents: "1" }]), null);
assert.equal(clvFromRows([{ clvCents: 5 }]), null);
assert.equal(combineClv([readClvBlock(withFields.nbaSummary), { n: null, avg: 1, beat: 1, na: 0 }]), null);

const emptyCopy = summaryCopy(null, null);
assert.equal(emptyCopy.avg, "n/a");
assert.equal(emptyCopy.beat, "n/a");
assert.equal(emptyCopy.n, "n/a");
assert.equal(emptyCopy.sentence, CLV_SENTENCE);
assert.equal(emptyCopy.sample, "Sample size");
assert.equal(emptyCopy.na, null);

const headline = {
  all: { n: 150, avg: 1.2, beat: 54, na: 5 },
  nba: { n: 100, avg: 1.2, beat: 54, na: 4 },
  leagues: "both",
};
const fullCopy = summaryCopy(headline.all, "both");
assert.equal(fullCopy.avg, formatCents(headline.all.avg));
assert.equal(fullCopy.beat, formatPct(headline.all.beat));
assert.equal(fullCopy.n, "150");
assert.equal(fullCopy.sample, "Picks with a median at lock and a closing median, 5 left out");
assert.equal(summaryCopy(readClvBlock(withFields.zeroBlock), "NBA").sample, "NBA picks with a median at lock and a closing median, 3 left out");
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
assert.equal(headlineCents({ all: headline.nba, leagues: "NBA" }, { nba: 10, nhl: 6 }), null);
assert.equal(headlineCents(headline, { nba: 10, nhl: 6 }).n, 150);
assert.equal(headlineCents({ all: headline.nba, leagues: "NBA" }, { nba: 10, nhl: 0 }).avg, 1.2);

const recordPage = fs.readFileSync(new URL("../web/app/record/page.jsx", import.meta.url), "utf8");
const board = fs.readFileSync(new URL("../web/components/RecordBoard.jsx", import.meta.url), "utf8");
const ticket = fs.readFileSync(new URL("../web/components/Ticket.jsx", import.meta.url), "utf8");
assert.match(recordPage, /<RecordBoard /);
assert.equal(recordPage.includes("clv={D.clv}"), false);
assert.match(board, /summaryCopy\(view\.block, view\.leagues\)/);
assert.match(board, /copy\.sentence/);
assert.match(board, /typical market price/);
assert.match(board, /clvFromRows\(shown\)/);
assert.match(ticket, /<CloseLine /);
assert.equal(CLV_SENTENCE, "One cent is one percentage point of implied probability. Positive means the median price at lock was longer than the closing median. An equal price is not a beat. This compares the typical price when I posted with the typical close, which is a stricter check than my best price.");

const D = getData();
const nbaLive = JSON.parse(fs.readFileSync(new URL("../data/nba_live.json", import.meta.url), "utf8"));
const nhlPicks = JSON.parse(fs.readFileSync(new URL("../data/picks.json", import.meta.url), "utf8")).filter((p) => p.source === "live");
for (const raw of nbaLive.picks || []) {
  const row = D.nba.find((r) => r.id === "nba-" + raw.id);
  assert.ok(row, raw.id);
  const want = readPickClv(raw);
  assert.equal(row.closeMedian, want.closeMedian);
  assert.equal(row.clvCents, want.clvCents);
  assert.equal(row.medianCents, medianClvCents(raw.typical_price, raw.close_median));
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
  assert.equal(row.medianCents, medianClvCents(raw.price, raw.close_median));
  if (raw.close_median != null && raw.best_price != null && raw.best_price !== raw.price) {
    assert.notEqual(row.medianCents, medianClvCents(raw.best_price, raw.close_median));
  }
  assert.equal(row.clv, raw.clv_pts ?? null);
  for (const key of BANNED) assert.equal(key in row, false, key);
}
assert.deepEqual(D.clv, assembleClv({ nbaRows: D.nba, nhlRows: D.nhl }));
let centsN = 0;
let centsBeat = 0;
for (const row of D.all) {
  if (row.medianCents == null) continue;
  centsN += 1;
  if (row.medianCents > 0) centsBeat += 1;
}
assert.equal(D.clv.all.n, centsN);
assert.ok(Math.abs(D.clv.all.beat - (100 * centsBeat) / centsN) < 1e-9);
assert.ok(D.clv.all.n > 0);

console.log("clv checks ok");
