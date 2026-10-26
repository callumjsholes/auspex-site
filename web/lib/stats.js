// Aggregates for /stats. Unit totals go through summary.js so they match the rest of the site.
// Tier, team, and opponent are read here, because data.js does not put them on a pick row.
// Model-derived numbers on this page are buckets, counts, and averages. No per-pick
// probability or edge is attached to a row, and nothing here is a weight or a formula.
import fs from "node:fs";
import path from "node:path";
import { finite } from "./clv.js";
import { implied, unitsFromMilli } from "./format.js";
import { byTime, fromMilli, isGraded, summarize, toMilli } from "./summary.js";
import { team } from "./teams.js";

export const SHORT_SAMPLE = 30;

const DIRS = [path.join(process.cwd(), "..", "data"), path.join(process.cwd(), "data")];

function dataDir() {
  return DIRS.find((d) => fs.existsSync(d)) || null;
}

function readJson(name) {
  const dir = dataDir();
  if (!dir) return null;
  const file = path.join(dir, name);
  if (!fs.existsSync(file)) return null;
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

export function englishList(parts) {
  const items = parts.filter(Boolean);
  if (items.length <= 1) return items[0] || "";
  if (items.length === 2) return `${items[0]} and ${items[1]}`;
  return `${items.slice(0, -1).join(", ")}, and ${items[items.length - 1]}`;
}

export function totalsMatch(a, b) {
  if (!a || !b) return false;
  return a.unitMilli === b.unitMilli
    && a.bets === b.bets
    && a.wins === b.wins
    && a.losses === b.losses
    && a.pushes === b.pushes
    && a.pending === b.pending
    && a.clvN === b.clvN
    && toMilli(a.staked) === toMilli(b.staked);
}

export function withTiers(rows, tierById) {
  const map = tierById || new Map();
  return rows.map((r) => {
    if (r.tier) return r;
    const tier = map.get(r.id);
    if (!tier) return r;
    return { ...r, tier: String(tier) };
  });
}

export function readContextIndex() {
  const map = new Map();
  const nba = readJson("nba_live.json");
  for (const p of nba?.picks || []) {
    if (!p || p.id == null) continue;
    const club = p.team ? String(p.team) : "";
    const opp = p.opp ? String(p.opp) : "";
    if (!club && !opp) continue;
    map.set("nba-" + p.id, { team: club, opp });
  }
  return map;
}

export function withContext(rows, index) {
  const map = index || new Map();
  return rows.map((r) => {
    const extra = map.get(r.id);
    if (!extra) return r;
    return { ...r, team: r.team || extra.team || "", opp: r.opp || extra.opp || "" };
  });
}

export function readTierIndex() {
  const map = new Map();
  const nba = readJson("nba_live.json");
  const picks = readJson("picks.json");
  for (const p of nba?.picks || []) {
    if (p && p.id != null && p.tier) map.set("nba-" + p.id, String(p.tier));
  }
  const list = Array.isArray(picks) ? picks : [];
  for (const p of list) {
    if (!p || p.source !== "live" || p.game_id == null || !p.tier) continue;
    map.set("nhl-" + p.game_id, String(p.tier));
  }
  return map;
}

export function marketFamily(row) {
  if (row.stat === "ml") return "Moneyline";
  if (row.stat === "pts" || row.stat === "reb" || row.stat === "ast") return "Player prop";
  return "Other";
}

export function marketLabel(row) {
  const names = { pts: "Points", reb: "Rebounds", ast: "Assists", ml: "Moneyline" };
  if (names[row.stat]) return names[row.stat];
  if (row.stat) return String(row.stat);
  return "Other";
}

export function oddsBand(price) {
  const p = Number(price);
  if (price == null || price === "" || Number.isNaN(p)) return "No price";
  if (p <= -150) return "−150 or shorter";
  if (p <= -110) return "−149 to −110";
  if (p <= 110) return "−109 to +110";
  if (p <= 150) return "+111 to +150";
  return "+151 or longer";
}

export const ODDS_ORDER = [
  "−150 or shorter",
  "−149 to −110",
  "−109 to +110",
  "+111 to +150",
  "+151 or longer",
  "No price",
];

export function orderedGroups(rows, keyFn, order = []) {
  const map = new Map();
  for (const r of rows) {
    const key = keyFn(r);
    if (!map.has(key)) map.set(key, []);
    map.get(key).push(r);
  }
  const keys = order.filter((k) => map.has(k));
  const rest = [...map.keys()].filter((k) => !keys.includes(k)).sort((a, b) => String(a).localeCompare(String(b)));
  return [...keys, ...rest].map((key) => {
    const summary = summarize(map.get(key));
    return { key, summary, few: summary.bets > 0 && summary.bets < SHORT_SAMPLE };
  }).filter((g) => g.summary.bets > 0 || g.summary.pending > 0);
}

function samePartition(rows) {
  const a = new Map();
  const b = new Map();
  for (const r of rows) {
    if (!isGraded(r.result)) continue;
    const ka = r.league || "Other";
    const kb = marketFamily(r);
    if (!a.has(ka)) a.set(ka, []);
    if (!b.has(kb)) b.set(kb, []);
    a.get(ka).push(r.id);
    b.get(kb).push(r.id);
  }
  const sig = (m) => [...m.values()].map((ids) => ids.slice().sort().join(",")).sort().join("|");
  return a.size > 0 && sig(a) === sig(b);
}

export function sportMarketFacts(rows) {
  const graded = rows.filter((r) => isGraded(r.result));
  const leagues = [...new Set(graded.map((r) => r.league))];
  const nba = graded.filter((r) => r.league === "NBA");
  const nhl = graded.filter((r) => r.league === "NHL");
  const known = new Set(["pts", "reb", "ast", "ml"]);
  return {
    duplicate: samePartition(rows)
      && leagues.every((l) => l === "NBA" || l === "NHL")
      && nba.every((r) => marketFamily(r) === "Player prop")
      && nhl.every((r) => marketFamily(r) === "Moneyline"),
    onlyKnown: graded.every((r) => known.has(r.stat)),
    hasNba: nba.length > 0,
    hasNhl: nhl.length > 0,
  };
}

const TIER_ORDER = ["Pick", "Bet", "Best bet", "Not labeled"];

function stakeLabel(milli) {
  if (milli % 1000 === 0) return String(milli / 1000);
  return unitsFromMilli(milli).replace(/^[+−]/, "").replace(/u$/, "");
}

export function stakeSentence(rows) {
  const graded = rows.filter((r) => isGraded(r.result));
  if (!graded.length) return null;
  const byTier = new Map();
  for (const r of graded) {
    const tier = r.tier || "Not labeled";
    if (!byTier.has(tier)) byTier.set(tier, new Set());
    byTier.get(tier).add(toMilli(r.stake));
  }
  for (const set of byTier.values()) if (set.size !== 1) return null;
  const ranked = [...byTier.keys()].sort((a, b) => {
    const ia = TIER_ORDER.indexOf(a);
    const ib = TIER_ORDER.indexOf(b);
    return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib) || String(a).localeCompare(String(b));
  });
  const byStake = new Map();
  for (const tier of ranked) {
    const milli = [...byTier.get(tier)][0];
    if (!byStake.has(milli)) byStake.set(milli, []);
    byStake.get(milli).push(tier);
  }
  const chunks = [];
  for (const [milli, tiers] of byStake) {
    const unit = stakeLabel(milli);
    const noun = unit === "1" ? "unit" : "units";
    const verb = tiers.length > 1 ? "are" : "is";
    const each = tiers.length > 1 ? " each" : "";
    chunks.push(`${englishList(tiers)} ${verb} ${unit} ${noun}${each}`);
  }
  return `On graded picks, ${chunks.join(". ")}.`;
}

export function unitsRoiSeries(rows) {
  const done = rows.filter((r) => isGraded(r.result)).sort(byTime);
  let unitMilli = 0;
  let stakeMilli = 0;
  return done.map((r, idx) => {
    unitMilli += toMilli(r.units);
    stakeMilli += toMilli(r.stake);
    return {
      i: idx + 1,
      date: r.date || "",
      units: fromMilli(unitMilli),
      unitMilli,
      pickMilli: toMilli(r.units),
      roi: stakeMilli ? (100 * unitMilli) / stakeMilli : null,
      label: r.short || r.pick || r.id || "Pick",
      result: r.result,
    };
  });
}

export function dailyRollup(rows) {
  const done = rows.filter((r) => isGraded(r.result)).sort(byTime);
  const order = [];
  const groups = new Map();
  for (const r of done) {
    const date = r.date || "";
    if (!groups.has(date)) {
      groups.set(date, []);
      order.push(date);
    }
    groups.get(date).push(r);
  }
  let unitMilli = 0;
  let stakeMilli = 0;
  return order.map((date) => {
    const list = groups.get(date);
    for (const r of list) {
      unitMilli += toMilli(r.units);
      stakeMilli += toMilli(r.stake);
    }
    return {
      date,
      day: summarize(list),
      totalMilli: unitMilli,
      roi: stakeMilli ? (100 * unitMilli) / stakeMilli : null,
    };
  });
}

export function centsSeries(rows) {
  const done = rows.filter((r) => finite(r?.clvCents) != null).sort(byTime);
  let sum = 0;
  return done.map((r, idx) => {
    const cents = finite(r.clvCents);
    sum += cents;
    const n = idx + 1;
    return {
      i: n,
      date: r.date || "",
      cents,
      avg: sum / n,
      label: r.short || r.pick || r.id || "Pick",
      result: r.result,
    };
  });
}

function bookSide(row) {
  const pred = finite(row.book_pred);
  const obs = finite(row.book_obs);
  const n = finite(row.book_n);
  if (pred == null || obs == null || n == null || n <= 0) return null;
  return { pred, obs, n, few: n < SHORT_SAMPLE };
}

// Only rows that already carry a model probability, a hit rate, and a count.
export function readCalibrationBuckets(list) {
  if (!Array.isArray(list)) return [];
  const out = [];
  for (const row of list) {
    if (!row || typeof row !== "object") continue;
    const pred = finite(row.model_pred);
    const obs = finite(row.model_obs);
    const n = finite(row.model_n);
    if (pred == null || obs == null || n == null || n <= 0) continue;
    const bin = typeof row.bin === "string" && row.bin.trim() ? row.bin.trim() : "Unlabeled";
    out.push({
      bin,
      pred,
      obs,
      n,
      few: n < SHORT_SAMPLE,
      book: bookSide(row),
    });
  }
  out.sort((a, b) => a.pred - b.pred || a.bin.localeCompare(b.bin));
  return out;
}

export function readCalibration() {
  const research = readJson("research.json");
  const list = research && Array.isArray(research.nba_calibration) ? research.nba_calibration : null;
  return { present: list != null, buckets: readCalibrationBuckets(list || []) };
}

export function oppOf(row) {
  if (row.opp) return String(row.opp);
  if (row.team && row.home && row.away) {
    if (row.team === row.home) return String(row.away);
    if (row.team === row.away) return String(row.home);
  }
  return "";
}

export function venueOf(row) {
  if (!row.team) return "";
  if (row.home && row.team === row.home) return "Home";
  if (row.away && row.team === row.away) return "Away";
  const parts = String(row.game || "").split(" at ");
  if (parts.length === 2 && parts[1] === row.team) return "Home";
  if (parts.length === 2 && parts[0] === row.team) return "Away";
  return "";
}

export function clubName(league, abbr) {
  if (!abbr) return "";
  const known = team(league || "NBA", abbr);
  return known.nick && known.nick !== abbr ? known.nick : abbr;
}

export function dowName(date) {
  if (!date) return "";
  return new Date(date + "T12:00:00Z").toLocaleDateString("en-US", { timeZone: "UTC", weekday: "long" });
}

const DOW_ORDER = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

export function startBand(iso) {
  if (!iso) return "";
  const hour = Number(new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York", hour: "numeric", hourCycle: "h23",
  }).format(new Date(iso)));
  if (!Number.isFinite(hour)) return "";
  if (hour < 18) return "Before 6 PM ET";
  if (hour < 19) return "6 PM ET";
  if (hour < 20) return "7 PM ET";
  if (hour < 21) return "8 PM ET";
  if (hour < 22) return "9 PM ET";
  return "10 PM ET or later";
}

const START_ORDER = ["Before 6 PM ET", "6 PM ET", "7 PM ET", "8 PM ET", "9 PM ET", "10 PM ET or later"];

function decidedRate(summary) {
  const n = summary.wins + summary.losses;
  return n ? (100 * summary.wins) / n : null;
}

export function rollingSeries(rows, window) {
  const done = rows.filter((r) => isGraded(r.result)).sort(byTime);
  const out = [];
  if (!(window >= 2)) return out;
  for (let i = window - 1; i < done.length; i++) {
    const summary = summarize(done.slice(i - window + 1, i + 1));
    const end = done[i];
    out.push({
      i: i + 1,
      date: end.date || "",
      winRate: decidedRate(summary),
      roi: summary.roi,
      wins: summary.wins,
      losses: summary.losses,
      unitMilli: summary.unitMilli,
      label: end.short || end.pick || "Pick",
      window,
    });
  }
  return out;
}

export function drawdownSeries(series) {
  let peak = 0;
  let worst = 0;
  let worstAt = null;
  const points = (series || []).map((p) => {
    if (p.unitMilli > peak) peak = p.unitMilli;
    const under = p.unitMilli - peak;
    if (under < worst) {
      worst = under;
      worstAt = p.i;
    }
    return {
      i: p.i,
      date: p.date,
      y: fromMilli(under),
      underMilli: under,
      peakMilli: peak,
      unitMilli: p.unitMilli,
      label: p.label,
      result: p.result,
    };
  });
  const last = points[points.length - 1];
  return {
    points,
    worstMilli: worst,
    worstAt,
    currentMilli: last ? last.underMilli : 0,
    peakMilli: last ? last.peakMilli : 0,
  };
}

const UNIT_BINS = [
  { key: "−1.50u or worse", test: (m) => m <= -1500 },
  { key: "−1.49u to −0.01u", test: (m) => m > -1500 && m < 0 },
  { key: "Push", test: (m) => m === 0 },
  { key: "+0.01u to +1.00u", test: (m) => m > 0 && m <= 1000 },
  { key: "+1.01u or more", test: (m) => m > 1000 },
];

export function unitBins(rows) {
  const done = rows.filter((r) => isGraded(r.result));
  return UNIT_BINS.map((bin) => {
    const list = done.filter((r) => bin.test(toMilli(r.units)));
    return { key: bin.key, n: list.length, summary: summarize(list) };
  }).filter((b) => b.n > 0);
}

export function streakFacts(rows) {
  const done = rows.filter((r) => isGraded(r.result)).sort(byTime);
  let run = 0;
  let bestW = 0;
  let bestL = 0;
  for (const r of done) {
    if (r.result === "Push") {
      run = 0;
      continue;
    }
    if (r.result === "Won") run = run > 0 ? run + 1 : 1;
    else run = run < 0 ? run - 1 : -1;
    if (run > bestW) bestW = run;
    if (run < bestL) bestL = run;
  }
  return {
    bestW,
    bestL: Math.abs(bestL),
    current: run,
    recent: done.slice(-36).map((r) => ({ result: r.result, label: r.short || r.pick || "Pick", date: r.date || "" })),
  };
}

export function priceCompare(rows) {
  const map = new Map();
  for (const r of rows) {
    const key = oddsBand(r.price);
    if (!map.has(key)) map.set(key, []);
    map.get(key).push(r);
  }
  return ODDS_ORDER.filter((key) => map.has(key)).map((key) => {
    const list = map.get(key);
    const summary = summarize(list);
    const decided = list.filter((r) => r.result === "Won" || r.result === "Lost");
    const probs = decided.map((r) => implied(Number(r.price))).filter((v) => v != null && !Number.isNaN(v));
    const hit = decided.length ? (100 * decided.filter((r) => r.result === "Won").length) / decided.length : null;
    const breakeven = probs.length ? (100 * probs.reduce((a, b) => a + b, 0)) / probs.length : null;
    return {
      key,
      summary,
      few: decided.length > 0 && decided.length < SHORT_SAMPLE,
      decided: decided.length,
      hit,
      breakeven,
      gap: hit != null && breakeven != null ? hit - breakeven : null,
    };
  }).filter((g) => g.summary.bets > 0 || g.summary.pending > 0);
}

const CLV_BANDS = [
  { key: "Negative", test: (c) => c < 0 },
  { key: "0¢ to 1¢", test: (c) => c >= 0 && c < 1 },
  { key: "1¢ to 3¢", test: (c) => c >= 1 && c < 3 },
  { key: "3¢ or more", test: (c) => c >= 3 },
];

export function clvBands(rows) {
  const graded = rows.filter((r) => isGraded(r.result) && finite(r.clvCents) != null);
  const mean = (result) => {
    const list = graded.filter((r) => r.result === result);
    if (!list.length) return null;
    return list.reduce((sum, r) => sum + finite(r.clvCents), 0) / list.length;
  };
  return {
    n: graded.length,
    winCents: mean("Won"),
    lossCents: mean("Lost"),
    bands: CLV_BANDS.map((band) => {
      const list = graded.filter((r) => band.test(finite(r.clvCents)));
      const decided = list.filter((r) => r.result === "Won" || r.result === "Lost");
      return {
        key: band.key,
        n: list.length,
        decided: decided.length,
        hit: decided.length ? (100 * decided.filter((r) => r.result === "Won").length) / decided.length : null,
        few: list.length > 0 && list.length < SHORT_SAMPLE,
        summary: summarize(list),
      };
    }).filter((b) => b.n > 0),
  };
}

function ranked(rows, keyFn, order = []) {
  const kept = rows.filter((r) => keyFn(r));
  const groups = orderedGroups(kept, keyFn, order);
  if (order.length) return groups;
  return groups.sort((a, b) => b.summary.unitMilli - a.summary.unitMilli || String(a.key).localeCompare(String(b.key)));
}

export function readPriceShopping() {
  const nba = readJson("nba_live.json");
  let n = 0;
  let missing = 0;
  let posted = 0;
  let typical = 0;
  for (const p of nba?.picks || []) {
    if (!isGraded(p?.result)) continue;
    if (finite(p.units) == null || finite(p.units_typical) == null) {
      missing += 1;
      continue;
    }
    n += 1;
    posted += toMilli(p.units);
    typical += toMilli(p.units_typical);
  }
  return { n, missing, postedMilli: posted, typicalMilli: typical };
}

function numOrNull(v) {
  return finite(v);
}

export function readOlderTests() {
  const charts = readJson("charts.json");
  const empty = { label: "", equity: [], monthly: [], byStat: [], resample: null };
  if (!charts || typeof charts !== "object") return empty;
  const test = charts.nba_test && typeof charts.nba_test === "object" ? charts.nba_test : {};
  const equity = (Array.isArray(charts.nba_equity) ? charts.nba_equity : [])
    .filter((p) => p && p.date && numOrNull(p.units) != null)
    .map((p) => ({ date: String(p.date), units: numOrNull(p.units) }));
  const monthly = (Array.isArray(charts.nba_monthly) ? charts.nba_monthly : [])
    .filter((p) => p && p.month)
    .map((p) => ({ month: String(p.month), bets: p.bets, units: numOrNull(p.units), roi: numOrNull(p.roi) }));
  const byStat = (Array.isArray(charts.nba_by_stat) ? charts.nba_by_stat : [])
    .filter((p) => p && p.stat)
    .map((p) => ({ stat: String(p.stat), bets: p.bets, units: numOrNull(p.units), roi: numOrNull(p.roi) }));
  const rs = charts.nba_resample && typeof charts.nba_resample === "object" ? charts.nba_resample : null;
  const resample = rs && numOrNull(rs.median_end) != null ? {
    paths: rs.paths,
    up: rs.p_profit,
    medianEnd: numOrNull(rs.median_end),
    lowEnd: numOrNull(rs.p5_end),
    medianDrawdown: numOrNull(rs.median_drawdown),
  } : null;
  return {
    label: typeof test.label === "string" ? test.label : "",
    equity,
    monthly,
    byStat,
    resample,
  };
}

export function buildStats(rows) {
  const summary = summarize(rows);
  const otherMap = new Map();
  for (const r of rows) {
    if (!r.result || isGraded(r.result) || r.result === "Pending") continue;
    otherMap.set(r.result, (otherMap.get(r.result) || 0) + 1);
  }
  const series = unitsRoiSeries(rows);
  return {
    summary,
    series,
    daily: dailyRollup(rows),
    cents: centsSeries(rows),
    centsOpen: rows.filter((r) => r.result === "Pending" && finite(r.clvCents) != null).length,
    centsGradedMissing: rows.filter((r) => isGraded(r.result) && finite(r.clvCents) == null).length,
    pendingDates: [...new Set(rows.filter((r) => r.result === "Pending").map((r) => r.date).filter(Boolean))].sort(),
    otherResults: [...otherMap.entries()].map(([result, n]) => ({ result, n })),
    splits: {
      sport: orderedGroups(rows, (r) => r.league || "Other", ["NBA", "NHL"]),
      market: orderedGroups(rows, marketLabel, ["Points", "Rebounds", "Assists", "Moneyline"]),
      family: orderedGroups(rows, marketFamily, ["Player prop", "Moneyline", "Other"]),
      tier: orderedGroups(rows, (r) => r.tier || "Not labeled", ["Pick", "Bet", "Best bet", "Not labeled"]),
      odds: orderedGroups(rows, (r) => oddsBand(r.price), ODDS_ORDER),
    },
    facts: sportMarketFacts(rows),
    stakeSentence: stakeSentence(rows),
    shortSample: SHORT_SAMPLE,
    rolling25: rollingSeries(rows, 25),
    rolling50: rollingSeries(rows, 50),
    drawdown: drawdownSeries(series),
    bins: unitBins(rows),
    streaks: streakFacts(rows),
    dow: ranked(rows, (r) => dowName(r.date), DOW_ORDER),
    start: ranked(rows, (r) => startBand(r.start), START_ORDER),
    startMissing: rows.filter((r) => isGraded(r.result) && !startBand(r.start)).length,
    venue: ranked(rows, venueOf, ["Home", "Away"]),
    side: ranked(rows, (r) => (r.side === "Over" || r.side === "Under" ? r.side : ""), ["Over", "Under"]),
    team: ranked(rows, (r) => clubName(r.league, r.team)),
    opp: ranked(rows, (r) => clubName(r.league, oppOf(r))),
    book: ranked(rows, (r) => r.book || "No book"),
    prices: priceCompare(rows),
    clvBands: clvBands(rows),
  };
}
