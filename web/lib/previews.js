// Build-time write-ups for a game page. Facts come from the game object games.js
// already built out of getData(). A missing field is left out. Nothing here is a
// chance, an edge, a projection, or minutes, and the wording does not describe
// the model. Phrase choice is a stable hash of the game path, so a rebuild of
// the same game reads the same way. No network calls.
import { team } from "./teams.js";
import { previewState, resultPhrase, finalText } from "./games.js";
import { odds, units, centsBetter, signed, dayLongYear, dayTitle, timeEastern } from "./format.js";
import { formatCents, formatLine } from "./clv.js";

const STAT = { pts: "points", reb: "rebounds", ast: "assists" };
const GRADED = new Set(["Won", "Lost", "Push", "Void"]);

function choose(seed, salt, options) {
  let h = 2166136261;
  const s = `${seed}\u0000${salt}`;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return options[(h >>> 0) % options.length];
}

function sentence(...parts) {
  return parts.filter(Boolean).join(" ").replace(/[ \t]+/g, " ").replace(/ +([.,;])/g, "$1").trim();
}

function numText(v) {
  if (v == null || !Number.isFinite(Number(v))) return null;
  return String(Number(v));
}

function statWord(stat, n) {
  const base = STAT[stat] || (typeof stat === "string" && stat ? stat : "");
  if (!base) return "";
  if (Number(n) === 1 && base.endsWith("s")) return base.slice(0, -1);
  return base;
}

function cent(n) {
  return `${n} cent${n === 1 ? "" : "s"}`;
}

function stakeText(n) {
  if (n == null || !Number.isFinite(Number(n))) return null;
  const v = Number(n);
  const shown = Number.isInteger(v) ? String(v) : String(v);
  return `${shown} unit${v === 1 ? "" : "s"}`;
}

function seedOf(game) {
  return game.path || `${game.league}|${game.date}|${game.slug || ""}`;
}

function picksOf(game) {
  return Array.isArray(game.picks) ? game.picks : [];
}

function stakesVary(picks) {
  const vals = picks.map((p) => (p.stake == null || !Number.isFinite(Number(p.stake)) ? null : Number(p.stake)));
  return new Set(vals.filter((v) => v != null)).size > 1;
}

function nhlSide(game, abbr) {
  if (abbr && abbr === game.away) return { nick: game.awayNick, full: game.awayFull };
  if (abbr && abbr === game.home) return { nick: game.homeNick, full: game.homeFull };
  const known = team(game.league || "NHL", abbr);
  return { nick: known.nick, full: known.full };
}

function priceLabel(p) {
  if (p.price == null) return "";
  return p.book ? `${odds(p.price)} (${p.book})` : odds(p.price);
}

function pickTitle(p) {
  if (p.pick) return p.pick;
  return [p.player, p.side, numText(p.line), statWord(p.stat, p.line)].filter(Boolean).join(" ");
}

function matchupParagraph(game, seed) {
  const date = dayLongYear(game.date);
  const clock = game.start ? timeEastern(game.start) : "";
  const placeWord = game.league === "NHL" ? "Puck drop" : "Tip-off";
  const where = game.homePlace ? ` in ${game.homePlace}` : "";
  const line = choose(seed, "match", [
    `${game.awayFull} at ${game.homeFull} on ${date}.`,
    `On ${date}: ${game.awayFull} at ${game.homeFull}${where}.`,
    `The matchup is ${game.awayFull} at ${game.homeFull}, ${date}.`,
  ]);
  const time = clock
    ? choose(seed, "time", [
        `${placeWord} at ${clock}.`,
        `${placeWord} is ${clock}.`,
        `On the schedule, ${placeWord.toLowerCase()} is ${clock}.`,
      ])
    : "";
  return sentence(line, time);
}

function noPickParagraph(game, seed) {
  if (previewState(game) === "pass") {
    return choose(seed, "pass", [
      "No pick on this game. Passing is part of the plan.",
      "I passed on this game. Nothing was posted.",
      "This one is a pass. There is no pick to grade.",
    ]);
  }
  if (game.league === "NHL") {
    return choose(seed, "wait-nhl", [
      "No pick yet. I post the moneyline before the first puck drop of the day, with the price, or I pass. Most games are a pass.",
      "Nothing is posted for this game yet. The moneyline, if there is one, goes up before the first puck drop, with the price. A pass is the usual outcome.",
      "This game is still on the slate. I'll post a moneyline before the first puck drop, with the price, or I'll pass. Most games get a pass.",
    ]);
  }
  return choose(seed, "wait-nba", [
    "No pick yet. I post the prop before tip, with the price and the book, or I pass. Most games are a pass.",
    "Nothing is posted for this game yet. The prop, if there is one, goes up before tip with the price and the book. A pass is the usual outcome.",
    "This game is still on the slate. I'll post a prop before tip, price and book included, or I'll pass. Most games get a pass.",
  ]);
}

function stakeSentence(picks, seed) {
  if (stakesVary(picks)) return "";
  const known = picks.filter((p) => p.stake != null && Number.isFinite(Number(p.stake)));
  if (known.length !== picks.length) return "";
  const text = stakeText(known[0].stake);
  if (!text) return "";
  if (picks.length === 1) {
    return choose(seed, "stake", [
      `Posted at ${text}.`,
      `The stake is ${text}.`,
      `It's on the card at ${text}.`,
    ]);
  }
  return choose(seed, "stake-many", [
    `Each one is ${text}.`,
    `The stake on each is ${text}.`,
    `They're posted at ${text} each.`,
  ]);
}

function plainProp(p, seed) {
  const line = numText(p.line);
  const stat = statWord(p.stat, p.line);
  if (!p.player || !line || !stat) return "";
  if (p.side !== "Over" && p.side !== "Under") return "";
  const dir = p.side === "Over" ? "more than" : "less than";
  const push = Number.isInteger(Number(p.line))
    ? ` If ${p.player} lands on ${line}, the pick is a push.`
    : "";
  const core = choose(seed, "nba-plain", [
    `In plain terms, ${p.player} has to finish with ${dir} ${line} ${stat}.`,
    `What has to happen: ${p.player} finishes with ${dir} ${line} ${stat}.`,
    `It wins if ${p.player} finishes with ${dir} ${line} ${stat}.`,
  ]);
  return core + push;
}

function oneNba(p, seed) {
  const name = pickTitle(p);
  const price = priceLabel(p);
  const lead = price
    ? choose(seed, "nba-lead", [
        `The pick is ${name} at ${price}.`,
        `I posted ${name} at ${price}.`,
        `On the card: ${name} at ${price}.`,
      ])
    : choose(seed, "nba-lead-open", [
        `The pick is ${name}.`,
        `I posted ${name}.`,
        `On the card: ${name}.`,
      ]);
  return sentence(lead, stakeSentence([p], seed), plainProp(p, seed));
}

function oneNhl(game, p, seed) {
  const side = nhlSide(game, p.team);
  const lead = choose(seed, "nhl-lead", [
    `The pick is the ${side.nick} to win.`,
    `I posted the ${side.nick} to win.`,
    `This game's pick is the ${side.nick} moneyline.`,
  ]);
  const price = p.price == null
    ? ""
    : `The price on the card is ${odds(p.price)}, the median across the books I track.`;
  const meaning = side.full ? `The bet is on the ${side.full} to win the game, with no point spread.` : "";
  return sentence(lead, price, meaning, stakeSentence([p], seed));
}

function pickClause(game, p) {
  const vary = stakesVary(picksOf(game));
  const stake = vary && stakeText(p.stake) ? `, ${stakeText(p.stake)}` : "";
  if (game.league === "NHL") {
    const side = nhlSide(game, p.team);
    const price = p.price == null ? "" : ` at the median price of ${odds(p.price)}`;
    return `${side.nick} to win${price}${stake}`;
  }
  const name = pickTitle(p) || "Pick";
  const price = priceLabel(p);
  return price ? `${name} at ${price}${stake}` : `${name}${stake}`;
}

function manyPicks(game, seed) {
  const picks = picksOf(game);
  const intro = choose(seed, "many", [
    `I posted ${picks.length} picks.`,
    `${picks.length} picks on this game.`,
    `The card has ${picks.length} picks.`,
  ]);
  const meaning = game.league === "NHL"
    ? "A moneyline wins if that team wins the game. There is no point spread."
    : "Over means the player finishes above the line. Under means below it.";
  const whole = game.league !== "NHL" && picks.some((p) => p.line != null && Number.isInteger(Number(p.line)));
  const push = whole ? "A whole-number line that lands on the number is a push." : "";
  return sentence(intro, stakeSentence(picks, seed), `${picks.map((p) => pickClause(game, p)).join("; ")}.`, meaning, push);
}

function booksPhrase(n) {
  if (n == null || !Number.isFinite(Number(n))) return "";
  const v = Number(n);
  return `, the median across ${v} book${v === 1 ? "" : "s"}`;
}

function gapPhrase(c) {
  if (c == null) return "";
  if (c > 0) return ` The posted price is ${cent(c)} better than that.`;
  if (c === 0) return " The posted price matches it.";
  return ` That price is ${cent(Math.abs(c))} better than the posted price.`;
}

function nbaMarketFact(p, named) {
  if (p.typical == null) return "";
  const books = booksPhrase(p.typicalN);
  const c = p.price == null ? null : centsBetter(p.price, p.typical);
  if (!named) return `The typical book on that line was ${odds(p.typical)}${books}.${gapPhrase(c)}`;
  let gap = "";
  if (c > 0) gap = `, posted price ${cent(c)} better`;
  else if (c === 0) gap = ", posted price matches it";
  else if (c < 0) gap = `, that median is ${cent(Math.abs(c))} better than the posted price`;
  const who = pickTitle(p) || p.player || "Pick";
  return `${who}: ${odds(p.typical)}${books}${gap}.`;
}

function bestClause(game, p, seed) {
  if (p.best == null || p.price == null || p.best === p.price) return "";
  const c = centsBetter(p.best, p.price);
  const where = p.bestBook ? `${odds(p.best)} at ${p.bestBook}` : odds(p.best);
  const who = picksOf(game).length > 1 ? `${nhlSide(game, p.team).nick}: ` : "";
  let line;
  if (c > 0) {
    line = choose(seed, "best", [
      `Best price at lock was ${where}, ${cent(c)} better than the median we grade at.`,
      `The best book at lock was ${where}. That price is ${cent(c)} better than the median.`,
      `${p.bestBook || "The best book"} was ${odds(p.best)} at lock, ${cent(c)} better than the median on the card.`,
    ]);
  } else if (c < 0) {
    line = `Best price at lock was ${where}, ${cent(Math.abs(c))} shorter than the median we grade at.`;
  } else {
    line = `Best price at lock was ${where}, the same length as the median.`;
  }
  return who ? `${who}${line.charAt(0).toLowerCase()}${line.slice(1)}` : line;
}

function joinAnd(parts) {
  if (parts.length <= 1) return parts[0] || "";
  if (parts.length === 2) return `${parts[0]} and ${parts[1]}`;
  return `${parts.slice(0, -1).join(", ")}, and ${parts[parts.length - 1]}`;
}

function centSpan(min, max) {
  if (min === max) return cent(min);
  return `${min} to ${max} cents`;
}

// A long slate stays one paragraph. Four or fewer still name each median.
function nbaMarketSummary(picks) {
  const rows = [];
  let missing = 0;
  for (const p of picks) {
    if (p.typical == null || p.price == null) {
      missing += 1;
      continue;
    }
    const c = centsBetter(p.price, p.typical);
    if (c == null) missing += 1;
    else rows.push(c);
  }
  if (!rows.length) return "";
  const better = rows.filter((c) => c > 0).length;
  const same = rows.filter((c) => c === 0).length;
  const worse = rows.filter((c) => c < 0).length;
  const min = Math.min(...rows);
  const max = Math.max(...rows);
  const covered = missing
    ? `${rows.length} of ${picks.length} ${rows.length === 1 ? "line has" : "lines have"} a median in the feed.`
    : `All ${rows.length} lines have a median in the feed.`;
  let cmp;
  if (better === rows.length) cmp = `The posted price is better than that median on each, by ${centSpan(min, max)}.`;
  else if (same === rows.length) cmp = "The posted price matches that median on each.";
  else if (worse === rows.length) cmp = `That median is better than the posted price on each, by ${centSpan(Math.abs(max), Math.abs(min))}.`;
  else {
    const bits = [];
    if (better) bits.push(`${better} ${better === 1 ? "is" : "are"} better than the median`);
    if (same) bits.push(`${same} ${same === 1 ? "matches" : "match"} it`);
    if (worse) bits.push(`${worse} ${worse === 1 ? "is" : "are"} shorter`);
    cmp = `Of those, ${joinAnd(bits)}.`;
    if (min !== max) cmp += ` The gap runs from ${min} to ${max} cents, and a negative gap means the median was the better price.`;
  }
  return `${covered} ${cmp}`;
}

function marketParagraph(game, seed) {
  const picks = picksOf(game);
  if (game.league === "NHL") {
    const bits = picks.map((p) => bestClause(game, p, seed)).filter(Boolean);
    if (!bits.length) return "";
    if (bits.length === 1) return bits[0];
    return sentence("Where the best book differed from the median:", bits.join(" "));
  }
  const facts = picks.map((p) => nbaMarketFact(p, picks.length > 1)).filter(Boolean);
  if (!facts.length) return "";
  if (picks.length === 1) {
    const fact = facts[0];
    return choose(seed, "mkt", [
      fact,
      `Price check. ${fact}`,
      `How the posted price sat against the other books: ${fact.charAt(0).toLowerCase()}${fact.slice(1)}`,
    ]);
  }
  if (picks.length > 4) {
    const summary = nbaMarketSummary(picks);
    return choose(seed, "mkt-sum", [
      summary,
      `Price check. ${summary}`,
      `Against the other books, ${summary.charAt(0).toLowerCase()}${summary.slice(1)}`,
    ]);
  }
  const intro = choose(seed, "mkt-many", [
    "Here is the typical book, the median on that line, wherever the feed has one.",
    "Where the feed has a median, this is how the posted price compares.",
    "The market price sits next to the posted number on each line that has one.",
  ]);
  return sentence(intro, facts.join(" "));
}

function gloss(values, seed) {
  if (!values.length) return "";
  if (values.every((v) => v === 0)) return "The locked price matched the close.";
  return choose(seed, "gloss", [
    "Positive means the locked price was longer than the close.",
    "A plus figure means the price I locked was longer than the closing median.",
    "Above zero, the posted price was longer than the close.",
  ]);
}

function singleClv(p, seed) {
  if (p.clvCents != null && Number.isFinite(Number(p.clvCents))) {
    const close = p.closeMedian != null ? ` against a close of ${odds(p.closeMedian)}` : "";
    let nearest = "";
    if (p.closeLineExact === false) {
      nearest = p.closeQuoteLine != null ? `, nearest line ${formatLine(p.closeQuoteLine)}` : ", nearest line";
    }
    const parts = [`Closing-line value was ${formatCents(p.clvCents)}${close}${nearest}.`];
    if (p.closeBest != null && p.closeMedian != null && p.closeBest !== p.closeMedian) {
      parts.push(`Best close was ${odds(p.closeBest)}${p.closeBestBook ? ` at ${p.closeBestBook}` : ""}.`);
    }
    parts.push(gloss([Number(p.clvCents)], seed));
    return sentence(...parts);
  }
  if (p.clv != null && Number.isFinite(Number(p.clv))) return `Closing line in points was ${signed(p.clv, 1)}.`;
  return "";
}

function multiClv(picks, seed) {
  const known = picks.filter((p) => p.clvCents != null && Number.isFinite(Number(p.clvCents)));
  if (!known.length) return "";
  if (known.length === 1) return singleClv(known[0], seed);
  const vals = known.map((p) => Number(p.clvCents));
  const min = Math.min(...vals);
  const max = Math.max(...vals);
  const core = min === max
    ? `Closing-line value was ${formatCents(min)} on each of these.`
    : `Closing-line value ${known.length === picks.length ? "on these picks" : `on ${known.length} of ${picks.length} picks`} runs from ${formatCents(min)} to ${formatCents(max)}.`;
  return sentence(core, gloss(vals, seed));
}

function finalScore(game) {
  const text = finalText(game);
  if (!text) return "";
  return text.endsWith(".") ? text : `${text}.`;
}

function resultParagraph(game, seed) {
  const picks = picksOf(game);
  const graded = picks.filter((p) => GRADED.has(p.result));
  if (!graded.length) return "";
  const pending = picks.filter((p) => p.result === "Pending").length;
  const head = choose(seed, "result-head", ["Result", "After the game", "How it finished"]);
  let body;
  if (picks.length === 1) {
    const p = graded[0];
    const word = { Won: "won", Lost: "lost", Push: "pushed", Void: "voided" }[p.result] || String(p.result).toLowerCase();
    const stat = statWord(p.stat, p.actual);
    const finished = game.league !== "NHL" && p.player && p.actual != null && stat
      ? `${p.player} finished with ${numText(p.actual)} ${stat}.`
      : "";
    const money = p.units != null ? `${units(p.units)} at the posted price.` : "";
    const score = game.league === "NHL" ? finalScore(game) : "";
    body = sentence(`${head}: ${word}.`, finished, money, score, singleClv(p, seed));
  } else {
    const s = resultPhrase(graded);
    const list = s.parts.length ? s.parts.join(", ") : "graded";
    const money = s.units != null ? `${units(s.units)} at the posted price.` : "";
    const score = game.league === "NHL" ? finalScore(game) : "";
    body = sentence(`${head}: ${list}.`, money, score, multiClv(graded, seed));
  }
  if (pending) body = sentence(body, `${pending} still open.`);
  return body;
}

function openParagraph(game, seed) {
  const one = picksOf(game).length === 1;
  return choose(seed, "open", [
    one
      ? "It's still open. I'll grade it at this price after the game."
      : "They're still open. I'll grade them at these prices after the game.",
    "No result yet. The grade uses the posted price.",
    one
      ? "Not graded yet. The price above is the one that will go on the record."
      : "Not graded yet. The prices above are the ones that will go on the record.",
  ]);
}

function rgNote(seed) {
  return choose(seed, "rg", [
    "Picks are information, not betting advice. Bet only what you can afford to lose, and only where it's legal for you: 18+, 19+ in most of Canada, 21+ in most US states. If it stops being fun, call 1-800-GAMBLER.",
    "Nothing on this page is advice to bet. Stake only money you can lose, and only if betting is legal where you are (18+, 19+ in most of Canada, 21+ in most US states). Help is free: 1-800-GAMBLER.",
    "No promise that a pick wins. Bet only what you can afford to lose, and only where it's legal for you: 18+, 19+ in most of Canada, 21+ in most US states. If betting stops being fun, call 1-800-GAMBLER.",
  ]);
}

export function gamePreview(game) {
  const seed = seedOf(game);
  const picks = picksOf(game);
  const paragraphs = [matchupParagraph(game, seed)];
  if (!picks.length) paragraphs.push(noPickParagraph(game, seed));
  else {
    paragraphs.push(picks.length === 1 ? (game.league === "NHL" ? oneNhl(game, picks[0], seed) : oneNba(picks[0], seed)) : manyPicks(game, seed));
    const market = marketParagraph(game, seed);
    if (market) paragraphs.push(market);
    const result = resultParagraph(game, seed);
    paragraphs.push(result || openParagraph(game, seed));
  }
  return { paragraphs, note: rgNote(seed) };
}

export function eventBlurb(game) {
  const date = dayLongYear(game.date);
  const clock = game.start ? timeEastern(game.start) : "";
  const placeWord = game.league === "NHL" ? "Puck drop" : "Tip-off";
  const time = clock ? ` ${placeWord} at ${clock}.` : "";
  return `${game.awayFull} at ${game.homeFull} on ${date}.${time}`;
}

export function previewDescription(game) {
  const when = dayTitle(game.date);
  const state = previewState(game);
  const picks = picksOf(game);
  if (!picks.length || state === "wait" || state === "pass") {
    if (state === "pass") return `${game.awayFull} at ${game.homeFull} on ${when}. No pick on this game.`;
    const clock = game.start ? ` ${game.league === "NHL" ? "Puck drop" : "Tip-off"} at ${timeEastern(game.start)}.` : "";
    const rest = game.league === "NHL"
      ? " No moneyline posted yet. I post it before the first puck drop, with the price, or I pass."
      : " No prop posted yet. I post it before tip, with the price and the book, or I pass.";
    return `${game.awayFull} at ${game.homeFull}, ${when}.${clock}${rest}`;
  }
  if (picks.length === 1) {
    const p = picks[0];
    const label = game.league === "NHL" ? `${nhlSide(game, p.team).nick} to win` : (pickTitle(p) || "The pick");
    const where = game.league === "NHL"
      ? (p.price == null ? "the median price" : `the median price of ${odds(p.price)}`)
      : priceLabel(p);
    let market = "";
    if (game.league !== "NHL" && p.typical != null) market = ` Typical book ${odds(p.typical)}.`;
    if (game.league === "NHL" && p.best != null && p.best !== p.price) {
      market = ` Best book at lock ${odds(p.best)}${p.bestBook ? ` (${p.bestBook})` : ""}.`;
    }
    const at = where ? `at ${where}` : "";
    if (state === "graded") {
      const money = p.units != null ? `${units(p.units)} at the posted price.` : "";
      return sentence(`${label} ${at}, ${String(p.result).toLowerCase()} on ${when}.`, money, market.trim());
    }
    return sentence(`${label} ${at}, posted before the game on ${when}.`, market.trim());
  }
  const who = `${game.awayNick} at ${game.homeNick}`;
  if (state === "graded") {
    const s = resultPhrase(picks);
    const list = s.parts.length ? s.parts.join(", ") : "graded";
    const money = s.units != null ? `, ${units(s.units)}` : "";
    return `${who} on ${when}: ${list}${money}, graded at the posted price.`;
  }
  return `${who} on ${when}. ${picks.length} picks posted before the game. I'll grade them at the posted price.`;
}
