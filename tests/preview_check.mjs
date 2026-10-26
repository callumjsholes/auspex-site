// Game-page write-ups. Run from the repo root:
//   node --experimental-detect-module tests/preview_check.mjs
import assert from "node:assert/strict";
import { odds, units } from "../web/lib/format.js";
import { formatCents } from "../web/lib/clv.js";
import { getCatalog, previewState, sportsEvent } from "../web/lib/games.js";
import { eventBlurb, gamePreview, previewDescription } from "../web/lib/previews.js";

const BANNED = [
  /\bedges?\b/i,
  /\bchances?\b/i,
  /\bprojections?\b/i,
  /\bprojected\b/i,
  /\bminutes\b/i,
  /\bprobability\b/i,
  /\bprobabilities\b/i,
  /\bmodel\b/i,
  /\binjur/i,
  /\bguarantee/i,
  /\btier\b/i,
  /\bweight\b/i,
  /\bcoefficient\b/i,
  /\bformula\b/i,
];
const RAW_BOOKS = ["draftkings", "fanduel", "betmgm", "williamhill_us", "betrivers", "betonlineag", "williamhill"];

function textOf(preview) {
  return [...preview.paragraphs, preview.note].join("\n");
}

function hasOdds(text) {
  const stripped = String(text).replace(/1-800-GAMBLER/g, "").replace(/\b(?:18|19|21)\+/g, "");
  return /[+\u2212-]\d{2,}/.test(stripped);
}

function assertClean(text, label) {
  for (const re of BANNED) assert.equal(re.test(text), false, `${label} matched ${re}`);
  assert.equal(text.includes("undefined"), false, label);
  assert.equal(text.includes("NaN"), false, label);
  assert.equal(text.includes("null"), false, label);
  for (const key of RAW_BOOKS) assert.equal(text.includes(key), false, `${label} raw book ${key}`);
}

function baseGame(over = {}) {
  return {
    league: "NBA",
    date: "2026-10-21",
    away: "ATL",
    home: "WAS",
    awayNick: "Hawks",
    homeNick: "Wizards",
    awayFull: "Atlanta Hawks",
    homeFull: "Washington Wizards",
    awayPlace: "Atlanta",
    homePlace: "Washington",
    start: "2026-10-21T23:00:00Z",
    score: null,
    completed: false,
    locked: true,
    picks: [],
    slug: "atl-at-was",
    path: "/nba/2026-10-21/atl-at-was",
    ...over,
  };
}

const prop = {
  id: "nba-1",
  player: "Trae Young",
  stat: "ast",
  side: "Under",
  line: 10.5,
  pick: "Trae Young under 10.5 assists",
  price: -122,
  book: "Caesars",
  stake: 1,
  result: "Lost",
  units: -1,
  actual: 13,
  typical: -130,
  typicalN: 4,
  clvCents: 1.57,
  closeMedian: -115,
  closeBest: -110,
  closeBestBook: "FanDuel",
  closeLineExact: true,
};

const graded = baseGame({ picks: [prop], completed: true });
const preview = gamePreview(graded);
assert.ok(preview.paragraphs.length >= 2 && preview.paragraphs.length <= 4, preview.paragraphs.length);
const body = textOf(preview);
assertClean(body, "graded");
assert.match(body, /Trae Young under 10\.5 assists/);
assert.match(body, /-122 \(Caesars\)/);
assert.match(body, /less than 10\.5 assists/);
assert.match(body, /1 unit/);
assert.match(body, /typical book on that line was -130, the median across 4 books/i);
assert.match(body, /8 cents better/);
assert.match(body, /finished with 13 assists/);
assert.match(body, /−1\.00u at the posted price/);
assert.match(body, new RegExp(formatCents(1.57).replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
assert.match(body, /close of -115/);
assert.match(body, /Best close was -110 at FanDuel/);
assert.match(body, /1-800-GAMBLER/);
assert.match(body, /18\+/);
assert.equal(body.includes("nearest"), false);
assert.deepEqual(gamePreview(graded), preview);

const noMarket = baseGame({
  path: "/nba/2026-10-21/atl-at-was-bare",
  picks: [{ ...prop, typical: null, typicalN: null, clvCents: null, closeMedian: null, closeBest: null, clv: null, actual: null }],
});
const bare = textOf(gamePreview(noMarket));
assertClean(bare, "bare");
assert.equal(/typical|median|across \d+ book/i.test(bare), false);
assert.equal(bare.includes("Closing"), false);
assert.equal(bare.includes("¢"), false);
assert.equal(bare.includes("finished with"), false);
assert.match(bare, /Lost:|Result: lost|After the game: lost|How it finished: lost/i);

const shorter = baseGame({
  path: "/nba/2026-10-22/short",
  picks: [{ ...prop, price: -140, typical: -120, typicalN: 3, result: "Won", units: 0.71, actual: 4, clvCents: null, closeMedian: null, closeBest: null }],
});
const shortText = textOf(gamePreview(shorter));
assert.match(shortText, /20 cents better than the posted price/);
assert.equal(shortText.includes("Closing-line"), false);

const whole = baseGame({
  path: "/nba/2026-10-22/whole",
  picks: [{ ...prop, line: 10, pick: "Trae Young under 10 assists", side: "Under", result: "Pending", units: null, actual: null, typical: null, typicalN: null, clvCents: null, closeMedian: null, closeBest: null }],
});
const wholeText = textOf(gamePreview(whole));
assert.match(wholeText, /lands on 10, the pick is a push/);
assert.match(wholeText, /still open|No result yet|Not graded yet/);
assert.equal(wholeText.includes("finished with"), false);

const wait = baseGame({ locked: false, completed: false, picks: [], path: "/nba/2026-10-26/was-at-cha" });
const waitText = textOf(gamePreview(wait));
assert.equal(previewState(wait), "wait");
assert.match(waitText, /No pick yet|Nothing is posted|still on the slate/);
assert.equal(hasOdds(waitText), false);
assert.equal(waitText.includes("Trae"), false);
assert.ok(gamePreview(wait).paragraphs.length <= 4);

const pass = baseGame({ locked: true, completed: true, picks: [], path: "/nba/2026-10-20/pass" });
assert.match(textOf(gamePreview(pass)), /pass/i);
assert.equal(hasOdds(textOf(gamePreview(pass))), false);

const nhl = baseGame({
  league: "NHL",
  away: "NSH",
  home: "PIT",
  awayNick: "Predators",
  homeNick: "Penguins",
  awayFull: "Nashville Predators",
  homeFull: "Pittsburgh Penguins",
  homePlace: "Pittsburgh",
  start: null,
  score: "2–3",
  completed: true,
  path: "/nhl/2026-10-24/nsh-at-pit",
  slug: "nsh-at-pit",
  picks: [{
    id: "nhl-1",
    team: "PIT",
    pick: "PIT to win",
    price: -139,
    book: "Median price",
    stake: 1,
    result: "Won",
    units: 0.719,
    best: -136,
    bestBook: "LowVig",
    clvCents: -2.6,
    closeMedian: -125,
    closeLineExact: null,
  }],
});
const nhlText = textOf(gamePreview(nhl));
assertClean(nhlText, "nhl");
assert.match(nhlText, /Penguins to win/);
assert.match(nhlText, /median across the books I track/);
assert.match(nhlText, /-139/);
assert.match(nhlText, /Pittsburgh Penguins/);
assert.match(nhlText, /no point spread/i);
assert.match(nhlText, /LowVig/);
assert.match(nhlText, /3 cents better than the median/);
assert.match(nhlText, /Final: Predators 2, Penguins 3/);
assert.match(nhlText, /\+0\.72u at the posted price/);
assert.match(nhlText, /−2\.6¢/);
assert.equal(nhlText.includes("Puck drop"), false);
assert.equal(nhlText.includes("PIT to win"), false);

const nearest = baseGame({
  path: "/nba/2026-10-21/nearest",
  picks: [{ ...prop, closeLineExact: false, closeQuoteLine: 21.5, clvCents: 2.4, closeMedian: -125 }],
});
assert.match(textOf(gamePreview(nearest)), /nearest line 21\.5/);

const pointsOnly = baseGame({
  path: "/nba/2026-10-21/points",
  picks: [{ ...prop, clvCents: null, closeMedian: null, closeBest: null, clv: 0.4 }],
});
assert.match(textOf(gamePreview(pointsOnly)), /Closing line in points was \+0\.4/);
assert.equal(textOf(gamePreview(pointsOnly)).includes("¢"), false);

const many = baseGame({
  path: "/nba/2026-10-21/many",
  picks: [1, 2, 3, 4, 5].map((i) => ({
    ...prop,
    id: `nba-${i}`,
    player: `Player ${i}`,
    pick: `Player ${i} over ${i}.5 points`,
    stat: "pts",
    side: "Over",
    line: i + 0.5,
    price: -110,
    typical: -120,
    typicalN: 3,
    result: "Won",
    units: 0.91,
    actual: 20,
    clvCents: i,
    closeMedian: -130,
    closeBest: null,
  })),
});
const manyPreview = gamePreview(many);
assert.equal(manyPreview.paragraphs.length, 4);
assert.match(manyPreview.paragraphs[1], /Player 3 over 3\.5 points/);
assert.match(manyPreview.paragraphs[2], /All 5 lines have a median/);
assert.match(manyPreview.paragraphs[2], /10 cents/);
assert.equal(manyPreview.paragraphs[2].includes("Player 3"), false);
assert.ok(manyPreview.paragraphs[2].length < 320, manyPreview.paragraphs[2]);
assertClean(textOf(manyPreview), "many");

const mixed = baseGame({
  path: "/nba/2026-10-21/mixed",
  picks: [
    { ...prop, player: "A", pick: "A over 1.5 points", price: -110, typical: -120 },
    { ...prop, player: "B", pick: "B over 1.5 points", price: -110, typical: -120 },
    { ...prop, player: "C", pick: "C over 1.5 points", price: -110, typical: -120 },
    { ...prop, player: "D", pick: "D over 1.5 points", price: -110, typical: -110 },
    { ...prop, player: "E", pick: "E over 1.5 points", price: -130, typical: -110 },
  ],
});
const mixedMarket = gamePreview(mixed).paragraphs[2];
assert.match(mixedMarket, /3 are better than the median/);
assert.match(mixedMarket, /1 matches it/);
assert.match(mixedMarket, /1 is shorter/);
assert.match(mixedMarket, /from -20 to 10 cents/);
assert.equal(mixedMarket.includes("Player"), false);

let varied = false;
const opener = gamePreview(graded).paragraphs[0];
for (let i = 0; i < 12; i++) {
  const other = gamePreview(baseGame({ path: `/nba/2026-10-21/atl-at-was-${i}`, picks: graded.picks }));
  assert.deepEqual(gamePreview(baseGame({ path: `/nba/2026-10-21/atl-at-was-${i}`, picks: graded.picks })), other);
  if (other.paragraphs[0] !== opener) varied = true;
}
assert.equal(varied, true);

const blurb = eventBlurb(graded);
assert.match(blurb, /Atlanta Hawks at Washington Wizards/);
assert.match(blurb, /Tip-off/);
assert.equal(/pick|price|odds|bet|unit/i.test(blurb), false);
const ld = sportsEvent(graded, blurb);
assert.equal(ld["@type"], "SportsEvent");
assert.equal(ld.description, blurb);
assert.equal(ld.homeTeam.name, "Washington Wizards");
assert.equal(ld.awayTeam.name, "Atlanta Hawks");
assert.equal(ld.startDate, graded.start);
assert.equal(hasOdds(ld.description), false);
assert.equal(JSON.stringify(ld).includes("Trae"), false);

const desc = previewDescription(graded);
assert.match(desc, /Trae Young under 10\.5 assists/);
assert.match(desc, /-122 \(Caesars\)/);
assert.match(desc, /lost/i);
assert.match(desc, /Typical book -130/);
assertClean(desc, "meta");
const waitDesc = previewDescription(wait);
assert.match(waitDesc, /No prop posted yet/);
assert.equal(/minutes/i.test(waitDesc), false);

const catalog = getCatalog();
const seen = { NBA: {}, NHL: {} };
for (const game of catalog.games) {
  const state = previewState(game);
  seen[game.league][state] = (seen[game.league][state] || 0) + 1;
  const got = gamePreview(game);
  assert.ok(got.paragraphs.length >= 2 && got.paragraphs.length <= 4, `${game.path} ${got.paragraphs.length}`);
  assert.ok(got.note.includes("1-800-GAMBLER"), game.path);
  const all = textOf(got);
  assertClean(all, game.path);
  assert.deepEqual(gamePreview(game), got);
  const meta = previewDescription(game);
  assert.ok(meta.length > 40, game.path);
  assertClean(meta, `${game.path} meta`);
  const event = eventBlurb(game);
  assert.equal(/pick|price|odds|\bunit\b/i.test(event), false, game.path);
  const data = sportsEvent(game, event);
  assert.equal(/[+\u2212-]\d{2,}/.test(data.description), false, game.path);
  if (game.start) assert.equal(data.startDate, game.start);
  for (const p of game.picks) {
    if (p.player) assert.ok(all.includes(p.player), `${game.path} ${p.player}`);
    if (p.price != null && game.picks.length === 1) assert.ok(all.includes(odds(p.price)), `${game.path} ${p.price}`);
    if (game.league !== "NHL" && p.typical != null && game.picks.length === 1) {
      assert.ok(all.includes(odds(p.typical)), `${game.path} typical`);
    }
    if (p.result && p.result !== "Pending" && p.units != null && game.picks.length === 1) {
      assert.ok(all.includes(units(p.units)), `${game.path} units`);
    }
    if (p.clvCents != null && game.picks.length === 1) assert.ok(all.includes(formatCents(p.clvCents)), `${game.path} clv`);
  }
  if (!game.picks.length) assert.equal(hasOdds(all), false, game.path);
}

assert.ok(seen.NBA.graded > 0, "nba graded");
assert.ok(seen.NBA.wait > 0, "nba wait");
assert.ok(seen.NHL.graded > 0, "nhl graded");
assert.ok(seen.NHL.wait > 0, "nhl wait");
assert.equal(seen.NBA.open || 0, 0);
assert.equal(seen.NHL.open || 0, 0);

console.log("preview checks ok");
console.log(JSON.stringify(seen));
