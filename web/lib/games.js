// Game pages from the public site data only. getData() has already dropped chances,
// projections, edges, and minutes. A pick is added here only if that feed includes it.
// The long write-up and the meta description are built in previews.js.
import { getData } from "./data.js";
import { team, gameSlug } from "./teams.js";
import { SITE } from "./site.js";
import { units, dayTitle, dayLongYear, timeEastern } from "./format.js";

const GRADED = new Set(["Won", "Lost", "Push", "Void"]);

function splitAt(game) {
  const parts = String(game || "").split(" at ");
  if (parts.length !== 2) return null;
  return { away: parts[0].trim(), home: parts[1].trim() };
}

function blank(league, date, away, home) {
  const a = team(league, away);
  const h = team(league, home);
  return {
    league, date, away, home,
    awayNick: a.nick, homeNick: h.nick, awayFull: a.full, homeFull: h.full,
    awayPlace: a.place, homePlace: h.place,
    start: null, score: null, completed: false, locked: false,
    espnGame: null, nhlGame: null, picks: [],
    slug: gameSlug(away, home), path: "",
  };
}

function merge(into, partial) {
  if (partial.start && !into.start) into.start = partial.start;
  if (partial.score && !into.score) into.score = partial.score;
  if (partial.completed) into.completed = true;
  if (partial.locked) into.locked = true;
  if (partial.espnGame && !into.espnGame) into.espnGame = partial.espnGame;
  if (partial.nhlGame && !into.nhlGame) into.nhlGame = partial.nhlGame;
  for (const p of partial.picks || []) {
    if (!into.picks.some((x) => x.id === p.id)) into.picks.push(p);
  }
}

function build() {
  const D = getData();
  const byKey = new Map();
  const add = (partial) => {
    if (!partial.away || !partial.home || !partial.date) return;
    const key = `${partial.league}|${partial.date}|${partial.away}|${partial.home}`;
    let g = byKey.get(key);
    if (!g) {
      g = blank(partial.league, partial.date, partial.away, partial.home);
      byKey.set(key, g);
    }
    merge(g, partial);
  };

  for (const g of D.nbaGames) {
    add({
      league: "NBA", date: D.nbaDate, away: g.away, home: g.home, start: g.start,
      completed: !!g.completed, locked: !!g.locked, espnGame: g.id, score: g.score || null, picks: [],
    });
  }

  const nbaGroups = new Map();
  for (const p of D.nba) {
    const teams = splitAt(p.game);
    if (!teams) continue;
    const key = `${p.date}|${teams.away}|${teams.home}`;
    if (!nbaGroups.has(key)) nbaGroups.set(key, { ...teams, date: p.date, start: p.start, espnGame: p.espnGame, picks: [] });
    const bucket = nbaGroups.get(key);
    if (p.start && !bucket.start) bucket.start = p.start;
    if (p.espnGame && !bucket.espnGame) bucket.espnGame = p.espnGame;
    bucket.picks.push(p);
  }
  for (const bucket of nbaGroups.values()) {
    const done = bucket.picks.length > 0 && bucket.picks.every((p) => GRADED.has(p.result));
    add({
      league: "NBA", date: bucket.date, away: bucket.away, home: bucket.home, start: bucket.start,
      espnGame: bucket.espnGame, locked: true, completed: done, picks: bucket.picks,
    });
  }

  for (const g of D.nhlToday) {
    add({
      league: "NHL", date: D.nhlDate, away: g.away, home: g.home, start: g.start, score: g.score,
      completed: !!g.score, locked: !!g.locked, nhlGame: g.id,
      picks: g.pick ? [g.pick] : [],
    });
  }
  for (const p of D.nhl) {
    const done = GRADED.has(p.result);
    add({
      league: "NHL", date: p.date, away: p.away, home: p.home, start: p.start,
      score: p.actual || null, completed: done && p.actual != null, locked: true, nhlGame: p.nhlGame,
      picks: [p],
    });
  }

  const games = [...byKey.values()];
  const seen = new Set();
  for (const g of games) {
    const key = `${g.league}|${g.date}|${g.slug}`;
    if (seen.has(key)) {
      const id = String(g.nhlGame || g.espnGame || "2").toLowerCase();
      g.slug = `${g.slug}-${id}`;
    }
    seen.add(`${g.league}|${g.date}|${g.slug}`);
    g.path = `/${g.league.toLowerCase()}/${g.date}/${g.slug}`;
    if (g.start) g.picks = g.picks.map((p) => (p.start ? p : { ...p, start: g.start }));
  }
  games.sort((a, b) => b.date.localeCompare(a.date) || (a.start || "9999").localeCompare(b.start || "9999") || a.slug.localeCompare(b.slug));

  return {
    games,
    lockMinutes: D.lockMinutes,
    generatedAt: D.generatedAt,
    nbaDate: D.nbaDate || null,
    nhlDate: D.nhlDate || null,
    nbaNext: D.nbaNext || null,
  };
}

let catalog;
export function getCatalog() {
  if (!catalog) catalog = build();
  return catalog;
}

export function findGame(league, date, slug) {
  return getCatalog().games.find((g) => g.league === league && g.date === date && g.slug === slug) || null;
}

export function datesFor(league) {
  const out = [];
  const idx = new Map();
  for (const g of getCatalog().games) {
    if (g.league !== league) continue;
    if (!idx.has(g.date)) {
      idx.set(g.date, out.length);
      out.push({ date: g.date, games: [] });
    }
    out[idx.get(g.date)].games.push(g);
  }
  return out;
}

// wait: the slate is up and this game has no published pick yet.
// pass: the game locked (or is final) with no pick.
// open: a pick is published and not graded.
// graded: every published pick on the game is graded.
export function previewState(game) {
  if (game.picks.length) return game.picks.some((p) => p.result === "Pending") ? "open" : "graded";
  if (game.locked || game.completed) return "pass";
  return "wait";
}

export function resultPhrase(picks) {
  const done = picks.filter((p) => GRADED.has(p.result));
  const wins = done.filter((p) => p.result === "Won").length;
  const losses = done.filter((p) => p.result === "Lost").length;
  const pushes = done.filter((p) => p.result === "Push").length;
  const voids = done.filter((p) => p.result === "Void").length;
  const parts = [];
  if (wins) parts.push(`${wins} win${wins === 1 ? "" : "s"}`);
  if (losses) parts.push(`${losses} loss${losses === 1 ? "" : "es"}`);
  if (pushes) parts.push(`${pushes} push${pushes === 1 ? "" : "es"}`);
  if (voids) parts.push(`${voids} void${voids === 1 ? "" : "s"}`);
  const unitsTotal = done.reduce((a, p) => a + (p.units || 0), 0);
  return { done, wins, losses, pushes, voids, parts, units: done.length ? unitsTotal : null };
}

export function gameStatus(game) {
  const state = previewState(game);
  if (state === "wait") return { text: "Pick not posted yet", tone: "" };
  if (state === "pass") return { text: "No pick", tone: "" };
  if (state === "open") return { text: game.picks.length > 1 ? `${game.picks.length} picks posted` : "Pick posted", tone: "" };
  const s = resultPhrase(game.picks);
  if (game.picks.length === 1 && s.wins) return { text: "Won", tone: "pos" };
  if (game.picks.length === 1 && s.losses) return { text: "Lost", tone: "neg" };
  if (game.picks.length === 1 && s.pushes) return { text: "Push", tone: "" };
  return { text: s.parts.join(", ") || "Graded", tone: "" };
}

export function finalText(game) {
  if (!game.score) return null;
  const [a, h] = String(game.score).split("–");
  if (h == null) return `Final ${game.score}`;
  return `Final: ${game.awayNick} ${a}, ${game.homeNick} ${h}`;
}

export function gameTitle(game) {
  const when = dayTitle(game.date);
  const match = `${game.awayNick} vs ${game.homeNick}`;
  const state = previewState(game);
  if (state === "open" || state === "graded") return `${match} pick and odds - ${when}`;
  return `${match} - ${when}`;
}

export function gameIntro(game, lockMinutes) {
  const date = dayLongYear(game.date);
  const clock = game.start ? timeEastern(game.start) : null;
  const place = game.league === "NHL" ? "Puck drop" : "Tip-off";
  const when = clock ? `${date}. ${place} at ${clock}.` : `${date}. The start time isn't in the public data for this game.`;
  const state = previewState(game);
  let status;
  if (state === "wait") {
    status = game.league === "NBA"
      ? `No pick yet. I post the prop about ${lockMinutes} minutes before tip, after the injury report, with the price and the book. Most games are a pass.`
      : "No pick yet. I post the moneyline before the first puck drop of the day, with the price. Most games are a pass.";
  } else if (state === "pass") {
    status = "No pick on this game. Passing is part of the plan.";
  } else if (state === "open") {
    status = game.picks.length === 1
      ? "One pick is posted. I'll grade it at this price after the game."
      : `${game.picks.length} picks are posted. I'll grade them at these prices after the game.`;
  } else {
    const s = resultPhrase(game.picks);
    status = `Graded at the posted price: ${s.parts.join(", ")}${s.units != null ? `, ${units(s.units)}` : ""}.`;
  }
  return `${game.awayFull} at ${game.homeFull}. ${when} ${status}`;
}

// description should name the matchup only. Prices and picks stay out of the JSON-LD.
export function sportsEvent(game, description) {
  const sport = game.league === "NHL" ? "Ice Hockey" : "Basketball";
  const done = game.completed || previewState(game) === "graded";
  const data = {
    "@context": "https://schema.org",
    "@type": "SportsEvent",
    name: `${game.awayFull} vs ${game.homeFull}`,
    sport,
    eventStatus: done ? "https://schema.org/EventCompleted" : "https://schema.org/EventScheduled",
    eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
    url: `${SITE.url}${game.path}`,
    description,
    homeTeam: { "@type": "SportsTeam", name: game.homeFull, sport },
    awayTeam: { "@type": "SportsTeam", name: game.awayFull, sport },
    location: {
      "@type": "Place",
      name: game.homePlace,
      address: { "@type": "PostalAddress", addressLocality: game.homePlace },
    },
  };
  if (game.start) data.startDate = game.start;
  return data;
}

export function dateBlurb(league, date, games, lockMinutes) {
  const names = games.slice(0, 3).map((g) => `${g.awayNick} at ${g.homeNick}`);
  const extra = games.length - names.length;
  const list = names.join(", ") + (extra > 0 ? `, and ${extra} more` : "");
  const when = dayTitle(date);
  if (league === "NBA") return `NBA games on ${when}: ${list}. Props post about ${lockMinutes} minutes before tip, or I pass.`;
  return `NHL games on ${when}: ${list}. Moneylines post before the first puck drop, or I pass.`;
}
