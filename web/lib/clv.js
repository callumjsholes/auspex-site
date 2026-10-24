// Closing-line value in cents. One cent is one percentage point of implied probability.
// Positive means the locked price was longer than the closing median.
// Missing or non-numeric fields stay null. This file never derives a cents figure
// from the American price or from clv_pts.

export function finite(v) {
  return typeof v === "number" && Number.isFinite(v) ? v : null;
}

function text(v) {
  return typeof v === "string" && v.trim() ? v.trim() : null;
}

export function formatLine(v) {
  const n = finite(v);
  if (n == null) return null;
  return n.toFixed(3).replace(/0+$/, "").replace(/\.$/, "");
}

// At least one decimal. Extra places only when two decimals would show a non-zero gap as 0.00.
export function formatCents(v) {
  const n = finite(v);
  if (n == null) return null;
  const abs = Math.abs(n);
  const places = abs !== 0 && Number(abs.toFixed(2)) === 0 ? 4 : 2;
  let s = abs.toFixed(places).replace(/(\.\d*?)0+$/, "$1").replace(/\.$/, "");
  if (!s.includes(".")) s += ".0";
  const sign = n < 0 ? "−" : n > 0 ? "+" : "";
  return `${sign}${s}¢`;
}

export function formatPct(v) {
  const n = finite(v);
  if (n == null) return null;
  const s = n.toFixed(1);
  return `${s.endsWith(".0") ? n.toFixed(0) : s}%`;
}

export function readPickClv(p) {
  const raw = p && typeof p === "object" ? p : {};
  return {
    closeMedian: finite(raw.close_median),
    closeBest: finite(raw.close_best),
    closeBestBook: text(raw.close_best_book),
    clvCents: finite(raw.clv_cents),
    closeQuoteLine: finite(raw.close_quote_line),
    closeLineExact: raw.close_line_exact === true || raw.close_line_exact === false ? raw.close_line_exact : null,
  };
}

export function readClvBlock(block) {
  if (!block || typeof block !== "object" || Array.isArray(block)) return null;
  const out = {
    n: finite(block.clv_cents_n),
    avg: finite(block.avg_clv_cents),
    beat: finite(block.beat_close_cents_pct),
    na: finite(block.clv_na),
  };
  if (out.n == null && out.avg == null && out.beat == null && out.na == null) return null;
  return out;
}

export function readTierMap(map) {
  if (!map || typeof map !== "object" || Array.isArray(map)) return null;
  const parts = Object.values(map).map(readClvBlock).filter(Boolean);
  if (!parts.length) return null;
  return combineClv(parts);
}

// Weight by sample size. A block with n of 0 does not pull the average toward empty.
// Returns null when any block is missing its sample size, so two leagues are not mashed together.
export function combineClv(parts) {
  if (!parts || !parts.length || parts.some((p) => !p || typeof p.n !== "number")) return null;
  const n = parts.reduce((a, p) => a + p.n, 0);
  const weigh = (key) => {
    const used = parts.filter((p) => p.n > 0);
    if (!used.length || used.some((p) => typeof p[key] !== "number")) return null;
    return used.reduce((a, p) => a + p[key] * p.n, 0) / used.reduce((a, p) => a + p.n, 0);
  };
  const na = parts.every((p) => typeof p.na === "number") ? parts.reduce((a, p) => a + p.na, 0) : null;
  return { n, avg: weigh("avg"), beat: weigh("beat"), na };
}

export function clvFromRows(rows) {
  const known = [];
  for (const r of rows || []) {
    const v = r && finite(r.clvCents);
    if (v != null) known.push(v);
  }
  if (!known.length) return null;
  return {
    n: known.length,
    avg: known.reduce((a, v) => a + v, 0) / known.length,
    beat: (100 * known.filter((v) => v > 0).length) / known.length,
    na: null,
  };
}

// Published totals win. Pick rows fill in only when that league's totals are absent.
export function assembleClv({ nbaSummary, nbaTiers, nbaRows, nhlSummary, nhlTiers, nhlRows }) {
  const nba = readClvBlock(nbaSummary) || readTierMap(nbaTiers) || clvFromRows(nbaRows);
  const nhl = readClvBlock(nhlSummary) || readTierMap(nhlTiers) || clvFromRows(nhlRows);
  if (nba && nhl) {
    const all = combineClv([nba, nhl]);
    return { all, nba, nhl, leagues: all ? "both" : null };
  }
  if (nba) return { all: nba, nba, nhl: null, leagues: "NBA" };
  if (nhl) return { all: nhl, nba: null, nhl, leagues: "NHL" };
  return { all: null, nba: null, nhl: null, leagues: null };
}

export function closeView(p) {
  if (!p || typeof p !== "object") return null;
  const median = finite(p.closeMedian);
  const cents = finite(p.clvCents);
  const exact = p.closeLineExact === true || p.closeLineExact === false ? p.closeLineExact : null;
  const quote = finite(p.closeQuoteLine);
  const best = finite(p.closeBest);
  const bestBook = text(p.closeBestBook);
  const showBest = best != null && best !== median;
  if (median == null && cents == null && !showBest) return null;
  return {
    median,
    cents,
    beat: cents == null ? null : cents > 0,
    nearest: exact === false,
    quote: exact === false ? quote : null,
    best: showBest ? best : null,
    bestBook: showBest ? bestBook : null,
  };
}

export function describeClose(p, oddsText) {
  const c = closeView(p);
  if (!c) return null;
  const odds = typeof oddsText === "function" ? oddsText : (v) => String(v);
  const items = [{ k: "locked", text: `Locked ${odds(p.price)}` }];
  if (c.median != null) {
    const note = c.nearest ? (c.quote != null ? `, nearest line ${formatLine(c.quote)}` : ", nearest line") : "";
    items.push({ k: "close", text: `Close ${odds(c.median)}${note}` });
  } else if (c.nearest && c.quote != null) {
    items.push({ k: "close", text: `Nearest line ${formatLine(c.quote)}` });
  }
  items.push({
    k: "cents",
    text: c.cents == null ? "CLV n/a" : formatCents(c.cents),
    tone: c.cents == null ? "" : c.cents > 0 ? "pos" : c.cents < 0 ? "neg" : "",
  });
  if (c.beat) items.push({ k: "beat", text: "✓ Beat the close" });
  if (c.best != null) items.push({ k: "best", text: `Best close ${odds(c.best)}${c.bestBook ? ` at ${c.bestBook}` : ""}` });
  return items;
}

export const CLV_SENTENCE = "Beating the closing line is the best sign I have of a real edge, even on losing nights.";

export function summaryCopy(block, leagues) {
  const has = block && typeof block === "object";
  const avgN = has ? finite(block.avg) : null;
  const beatN = has ? finite(block.beat) : null;
  const nN = has ? finite(block.n) : null;
  const naN = has ? finite(block.na) : null;
  const who = leagues === "NBA" || leagues === "NHL" ? `${leagues} picks` : "Picks";
  const na = naN != null && naN > 0 ? naN : null;
  const sample = nN == null ? "Sample size" : na == null ? `${who} with a closing price` : `${who} with a closing price, ${na} left out`;
  return {
    avg: avgN == null ? "n/a" : formatCents(avgN),
    beat: beatN == null ? "n/a" : formatPct(beatN),
    n: nN == null ? "n/a" : String(nN),
    na,
    avgTone: avgN == null ? "muted" : avgN > 0 ? "pos" : avgN < 0 ? "neg" : "",
    beatTone: beatN == null ? "muted" : "",
    nTone: nN == null ? "muted" : "",
    sentence: CLV_SENTENCE,
    sample,
  };
}

// Home-page figures switch to cents only when the number covers every league that has picks.
export function headlineCents(clv, counts) {
  if (!clv || !clv.all || (clv.leagues !== "both" && clv.leagues !== "NBA" && clv.leagues !== "NHL")) return null;
  const nbaN = counts && typeof counts.nba === "number" ? counts.nba : 0;
  const nhlN = counts && typeof counts.nhl === "number" ? counts.nhl : 0;
  const covers = clv.leagues === "both" || (clv.leagues === "NBA" && nhlN === 0) || (clv.leagues === "NHL" && nbaN === 0);
  if (!covers || finite(clv.all.n) == null || clv.all.n <= 0) return null;
  if (finite(clv.all.avg) == null && finite(clv.all.beat) == null) return null;
  return clv.all;
}
