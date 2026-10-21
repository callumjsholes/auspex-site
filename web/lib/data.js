// Reads the JSON published to ../data at build time and keeps only what the public site shows:
// the pick, the price, the book, the result and closing-line value. Model outputs (chances,
// projections, minutes, edges) are dropped here so they never reach a page or the browser.
// Every publish commit that changes data/ triggers a Vercel rebuild, so pages stay current.
import fs from "node:fs";
import path from "node:path";

const DIRS = [path.join(process.cwd(), "..", "data"), path.join(process.cwd(), "data")];
const DATA = DIRS.find((d) => fs.existsSync(d)) || DIRS[0];

function read(name, fallback) {
  try {
    return JSON.parse(fs.readFileSync(path.join(DATA, name), "utf8"));
  } catch {
    return fallback;
  }
}

export const BOOK = {
  draftkings: "DraftKings", fanduel: "FanDuel", betmgm: "BetMGM", williamhill_us: "Caesars", betrivers: "BetRivers",
  fanatics: "Fanatics", espnbet: "ESPN BET", betonlineag: "BetOnline", bovada: "Bovada", lowvig: "LowVig", mybookieag: "MyBookie",
  ballybet: "Bally Bet", hardrockbet: "Hard Rock", betparx: "betPARX", fliff: "Fliff",
};
export const STAT = { pts: "points", reb: "rebounds", ast: "assists" };
const graded = (r) => r === "Won" || r === "Lost" || r === "Push";

function summarize(rows) {
  const done = rows.filter((r) => graded(r.result));
  const staked = done.reduce((a, r) => a + r.stake, 0);
  const units = done.reduce((a, r) => a + (r.units || 0), 0);
  const clv = rows.filter((r) => r.clv != null);
  return {
    bets: done.length,
    wins: done.filter((r) => r.result === "Won").length,
    losses: done.filter((r) => r.result === "Lost").length,
    pushes: done.filter((r) => r.result === "Push").length,
    staked, units, roi: staked ? (100 * units) / staked : null,
    pending: rows.filter((r) => r.result === "Pending").length,
    clvN: clv.length,
    beatClose: clv.length ? (100 * clv.filter((r) => r.clv > 0).length) / clv.length : null,
    avgClv: clv.length ? clv.reduce((a, r) => a + r.clv, 0) / clv.length : null,
  };
}

function nbaRow(p) {
  const verb = p.side === "Over" ? "over" : "under";
  const stat = STAT[p.stat] || p.stat;
  return {
    id: "nba-" + p.id, league: "NBA", date: p.date, start: p.start_utc, locked: p.locked_at, game: p.game.replace("@", " at "),
    pick: `${p.player} ${verb} ${p.line} ${stat}`, short: `${p.player} ${verb} ${p.line} ${p.stat}`,
    price: p.price, book: BOOK[p.book] || p.book, stake: p.stake, result: p.result, units: p.units ?? null, clv: p.clv_pts ?? null,
    actual: p.actual ?? null, stat: p.stat,
  };
}
function nhlRow(p) {
  const [away, home] = p.game.split("@");
  return {
    id: "nhl-" + p.game_id, league: "NHL", date: p.date, start: null, locked: p.locked_at, game: `${away} at ${home}`,
    pick: `${p.team} to win`, short: `${p.team} moneyline`, price: p.price, book: "Median price", stake: p.stake,
    result: p.result, units: p.units ?? null, clv: p.clv_pts ?? null, actual: p.home_score != null ? `${p.away_score}–${p.home_score}` : null,
    stat: "ml",
  };
}

function series(rows) {
  const done = rows.filter((r) => graded(r.result)).sort((a, b) => (a.date + (a.locked || "")).localeCompare(b.date + (b.locked || "")));
  let c = 0;
  return done.map((r, i) => ({ i: i + 1, date: r.date, units: (c += r.units || 0) }));
}

export function getData() {
  const nbaLive = read("nba_live.json", { picks: [], games: [] });
  const nhlPicks = read("picks.json", []).filter((p) => p.source === "live");
  const today = read("today.json", { games: [] });
  const nbaTest = read("nba.json", {});
  const nhlTest = read("backtest.json", {});
  const summary = read("summary.json", {});

  const nba = (nbaLive.picks || []).map(nbaRow);
  const nhl = nhlPicks.map(nhlRow);
  const all = [...nba, ...nhl].sort((a, b) => (b.date + (b.locked || "")).localeCompare(a.date + (a.locked || "")));
  const nhlLocked = new Map(nhl.filter((r) => r.date === today.date).map((r) => [r.game, r]));

  // Today's NHL slate: matchups and start times; a pick only once it has locked.
  const nhlToday = (today.games || []).map((g) => {
    const locked = nhlLocked.get(`${g.away} at ${g.home}`);
    return { id: g.game_id, start: g.start_utc, away: g.away, home: g.home,
      score: g.home_score != null ? `${g.away_score}–${g.home_score}` : null, pick: locked || null };
  });

  // Only the headline test numbers, nothing about how the model works.
  const nbaHeadline = (nbaTest.stats || []).filter((s) => /ROI|won|Unseen/i.test(s.k));
  const nbaBooks = nbaTest.books ? { caption: nbaTest.books.caption, rows: nbaTest.books.rows } : null;

  return {
    generatedAt: [nbaLive.generated_at, summary.generated_at].filter(Boolean).sort().pop() || null,
    nbaDate: nbaLive.today, nhlDate: today.date,
    nbaGames: (nbaLive.games || []).map((g) => ({ id: g.game_id, away: g.away, home: g.home, start: g.start_utc, completed: g.completed, locked: g.locked, picks: g.picks })),
    nbaNext: nbaLive.next_date || null, lockMinutes: nbaLive.rules?.lock_minutes || 50,
    nbaToday: nba.filter((r) => r.date === nbaLive.today),
    nhlToday,
    all, nba, nhl,
    sum: { all: summarize(all), nba: summarize(nba), nhl: summarize(nhl) },
    curve: series(all),
    nbaHeadline, nbaBooks,
    nhlTest: nhlTest.total ? { total: nhlTest.total, rows: (nhlTest.rows || []).map((r) => ({ season: r.season, units: r.units, roi: r.roi })) } : null,
  };
}
