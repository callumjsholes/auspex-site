// Live box scores for today's open picks. Public data only: ESPN (NBA) and api-web.nhle.com (NHL).
//
//   GET /api/live?nba=<espnGameId>:<espnPlayerId>,...&nhl=<nhlGameId>,...
//
// Ids are digits only and capped in number, the upstream hosts are fixed, and each upstream read is
// cached for 20 seconds, so a busy page costs a few requests a minute. Nothing from the model is
// read or returned; the page already knows the pick and the line.
export const dynamic = "force-dynamic";

const ESPN = "https://site.api.espn.com/apis/site/v2/sports/basketball/nba/summary?event=";
const NHL = "https://api-web.nhle.com/v1/gamecenter/";
const ID = /^\d{1,12}$/;
const MAX_PAIRS = 40;
const MAX_GAMES = 16;

async function getJson(url) {
  try {
    const res = await fetch(url, { next: { revalidate: 20 }, headers: { "User-Agent": "auspexsports.com live tracker" } });
    return res.ok ? await res.json() : null;
  } catch {
    return null;
  }
}

const num = (v) => {
  const n = Number(String(v ?? "").split("-")[0]);
  return Number.isFinite(n) ? n : null;
};

export function parseEspn(js, wanted) {
  if (!js) return null;
  const comp = js.header?.competitions?.[0] || {};
  const type = comp.status?.type || {};
  const out = { state: type.state || "pre", detail: type.shortDetail || type.detail || "", players: {} };
  for (const team of js.boxscore?.players || []) {
    const block = (team.statistics || [])[0];
    if (!block) continue;
    const keys = (block.keys || block.labels || []).map((k) => String(k).toLowerCase());
    const at = (names) => names.map((n) => keys.indexOf(n)).find((i) => i >= 0);
    const idx = { min: at(["minutes", "min"]), pts: at(["points", "pts"]), reb: at(["rebounds", "reb"]), ast: at(["assists", "ast"]) };
    for (const a of block.athletes || []) {
      const id = String(a.athlete?.id ?? "");
      if (!wanted.has(id)) continue;
      const vals = a.stats || [];
      const pick = (i) => (i == null ? null : num(vals[i]));
      out.players[id] = a.didNotPlay || !vals.length
        ? { played: false }
        : { played: true, min: pick(idx.min), pts: pick(idx.pts), reb: pick(idx.reb), ast: pick(idx.ast) };
    }
  }
  return out;
}

export function parseNhl(js) {
  if (!js) return null;
  const gs = js.gameState || "FUT";
  const state = gs === "LIVE" || gs === "CRIT" ? "in" : gs === "FINAL" || gs === "OFF" ? "post" : "pre";
  const p = js.periodDescriptor || {};
  const per = p.periodType === "OT" ? "OT" : p.periodType === "SO" ? "SO" : p.number ? ["1st", "2nd", "3rd"][p.number - 1] || `${p.number}th` : "";
  const clock = js.clock || {};
  const detail = state === "post" ? "Final" : state === "in" ? (clock.inIntermission ? `End of ${per}` : `${per} ${clock.timeRemaining || ""}`.trim()) : "";
  return {
    state, detail,
    home: js.homeTeam?.abbrev || "", away: js.awayTeam?.abbrev || "",
    hs: js.homeTeam?.score ?? null, as: js.awayTeam?.score ?? null,
  };
}

export async function GET(request) {
  const q = new URL(request.url).searchParams;
  const pairs = (q.get("nba") || "").split(",").filter(Boolean).slice(0, MAX_PAIRS).map((s) => s.split(":"))
    .filter(([g, p]) => ID.test(g || "") && ID.test(p || ""));
  const nhlIds = [...new Set((q.get("nhl") || "").split(",").filter((s) => ID.test(s)))].slice(0, MAX_GAMES);

  const byGame = new Map();
  for (const [g, p] of pairs) {
    if (!byGame.has(g)) byGame.set(g, new Set());
    byGame.get(g).add(p);
  }
  const games = [...byGame.entries()].slice(0, MAX_GAMES);

  const [nbaRes, nhlRes] = await Promise.all([
    Promise.all(games.map(async ([g, players]) => [g, parseEspn(await getJson(ESPN + g), players)])),
    Promise.all(nhlIds.map(async (g) => [g, parseNhl(await getJson(`${NHL}${g}/boxscore`))])),
  ]);
  const body = {
    at: new Date().toISOString(),
    nba: Object.fromEntries(nbaRes.filter(([, v]) => v)),
    nhl: Object.fromEntries(nhlRes.filter(([, v]) => v)),
  };
  return Response.json(body, { headers: { "Cache-Control": "public, s-maxage=20, stale-while-revalidate=20" } });
}
