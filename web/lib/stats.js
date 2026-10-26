// Aggregates for /stats. Unit totals go through summary.js so they match the rest of the site.
// Tier is read here, and only tier, because data.js does not put it on a pick row.
// Calibration reads nba_calibration and nothing else in research.json. It never
// derives a probability from the price or from any other field.
import fs from "node:fs";
import path from "node:path";
import { finite } from "./clv.js";
import { unitsFromMilli } from "./format.js";
import { byTime, fromMilli, isGraded, summarize, toMilli } from "./summary.js";

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

export function buildStats(rows) {
  const summary = summarize(rows);
  const otherMap = new Map();
  for (const r of rows) {
    if (!r.result || isGraded(r.result) || r.result === "Pending") continue;
    otherMap.set(r.result, (otherMap.get(r.result) || 0) + 1);
  }
  return {
    summary,
    series: unitsRoiSeries(rows),
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
  };
}
