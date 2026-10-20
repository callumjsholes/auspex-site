/* Auspex Sports page. Data comes from site/data/*.json. No number on this page is typed in by hand
   except labels. pipeline/build_site.py refreshes the JSON and does not touch this file. */
(function () {
  const $ = (s) => document.querySelector(s);
  const el = (t, c, x) => { const e = document.createElement(t); if (c) e.className = c; if (x != null) e.textContent = x; return e; };
  const NS = "http://www.w3.org/2000/svg";
  const svgEl = (t, a) => { const e = document.createElementNS(NS, t); for (const k in a) e.setAttribute(k, a[k]); return e; };
  const am = (v) => v == null || v === "" ? "–" : (Number(v) > 0 ? "+" + v : String(v));
  const sg = (v, d = 1) => v == null || Number.isNaN(Number(v)) ? "–" : (Number(v) > 0 ? "+" : "") + Number(v).toFixed(d);
  const tone = (v) => v > 0 ? "pos" : v < 0 ? "neg" : "";
  const pct = (v) => v == null ? "–" : (v * 100).toFixed(0) + "%";
  const pct1 = (v) => v == null ? "–" : (v * 100).toFixed(1) + "%";
  const etToday = () => new Intl.DateTimeFormat("en-CA", { timeZone: "America/New_York", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
  const formatSlate = (iso) => {
    if (!iso) return "";
    const [y, m, d] = iso.split("-").map(Number);
    return new Date(Date.UTC(y, m - 1, d, 16)).toLocaleDateString("en-US", { timeZone: "America/New_York", weekday: "long", month: "long", day: "numeric", year: "numeric" });
  };
  const shortDate = (iso) => {
    const [y, m, d] = iso.split("-").map(Number);
    return new Date(Date.UTC(y, m - 1, d, 16)).toLocaleDateString("en-US", { timeZone: "America/New_York", month: "short", day: "numeric" });
  };
  const mt = (iso) => iso ? new Date(iso).toLocaleTimeString("en-US", { timeZone: "America/New_York", hour: "numeric", minute: "2-digit" }) + " ET" : "";
  const when = (iso) => "Updated " + new Date(iso).toLocaleString("en-US", { timeZone: "America/New_York", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }) + " ET";
  const bust = Math.floor(Date.now() / 900000);
  const j = (path) => fetch(path + "?v=" + bust, { cache: "no-cache" }).then((r) => { if (!r.ok) throw new Error(path); return r.json(); });
  const decOdds = (a) => a < 0 ? 1 + 100 / -a : 1 + a / 100;
  const clvPts = (p) => p.close_market_pct != null && p.market_pct != null ? +(p.close_market_pct - p.market_pct).toFixed(1) : null;

  const NHL = { ANA: "Anaheim", BOS: "Boston", BUF: "Buffalo", CAR: "Carolina", CBJ: "Columbus", CGY: "Calgary", CHI: "Chicago", COL: "Colorado", DAL: "Dallas", DET: "Detroit", EDM: "Edmonton", FLA: "Florida", LAK: "Los Angeles", MIN: "Minnesota", MTL: "Montreal", NJD: "New Jersey", NSH: "Nashville", NYI: "NY Islanders", NYR: "NY Rangers", OTT: "Ottawa", PHI: "Philadelphia", PIT: "Pittsburgh", SEA: "Seattle", SJS: "San Jose", STL: "St. Louis", TBL: "Tampa Bay", TOR: "Toronto", UTA: "Utah", VAN: "Vancouver", VGK: "Vegas", WPG: "Winnipeg", WSH: "Washington" };
  const NBA = { ATL: "Atlanta", BOS: "Boston", BKN: "Brooklyn", CHA: "Charlotte", CHI: "Chicago", CLE: "Cleveland", DAL: "Dallas", DEN: "Denver", DET: "Detroit", GSW: "Golden State", HOU: "Houston", IND: "Indiana", LAC: "LA Clippers", LAL: "LA Lakers", MEM: "Memphis", MIA: "Miami", MIL: "Milwaukee", MIN: "Minnesota", NOP: "New Orleans", NYK: "New York", OKC: "Oklahoma City", ORL: "Orlando", PHI: "Philadelphia", PHX: "Phoenix", POR: "Portland", SAC: "Sacramento", SAS: "San Antonio", TOR: "Toronto", UTA: "Utah", WAS: "Washington" };
  const team = (code, sport) => (sport === "nba" ? NBA : NHL)[code] || code;
  const BOOK = { draftkings: "DraftKings", fanduel: "FanDuel", betmgm: "BetMGM", williamhill_us: "Caesars", betrivers: "BetRivers", fanatics: "Fanatics", espnbet: "ESPN BET" };
  const STAT = { pts: "points", reb: "rebounds", ast: "assists" };
  const X = "https://x.com/AuspexSports";

  function publicText(text) {
    return String(text || "").replace(/data\/seed\/strict\.json/g, "the strict test results");
  }
  function copy(path, vars) {
    let v = window.AUSPEX;
    for (const k of path.split(".")) v = v == null ? v : v[k];
    if (typeof v !== "string") return "";
    if (!vars) return v;
    return v.replace(/\{(\w+)\}/g, (_, key) => (vars[key] == null ? "" : String(vars[key])));
  }
  const unitNote = () => (META && META.unit_note) || copy("fallbacks.unitNote");
  function windowText(mins, fallback) {
    const n = Number(mins);
    if (!mins && mins !== 0) return fallback || "";
    if (!Number.isFinite(n)) return fallback || "";
    if (n % 60 === 0 && n >= 60) {
      const h = n / 60;
      return h === 1 ? "1 hour" : h + " hours";
    }
    return (n % 1 === 0 ? n : n) + " minutes";
  }
  function finite(v) {
    return v != null && v !== "" && Number.isFinite(Number(v));
  }
  function plainNum(v) {
    const n = Math.round(Number(v) * 10) / 10;
    return Object.is(n, -0) || Number.isInteger(n) ? String(n) : n.toFixed(1);
  }
  function evPercent(v) {
    if (!finite(v)) return null;
    const n = Number(v);
    return Math.abs(n) <= 2 ? n * 100 : n;
  }
  function reasonText(model, market, ev) {
    const bits = [];
    if (finite(model) && finite(market)) {
      bits.push(copy("templates.reasonChance", { model: plainNum(model), market: plainNum(market) }));
    }
    if (finite(ev)) bits.push(copy("templates.reasonEv", { ev: plainNum(ev) }));
    return bits.filter(Boolean).join(" ");
  }
  function sidePct(game, side, key) {
    if (side !== "home" && side !== "away") return null;
    const raw = game[key + "_" + side];
    if (!finite(raw)) return null;
    const n = Number(raw);
    return n <= 1 ? n * 100 : n;
  }
  function nhlReason(g) {
    if (!(Number(g.stake) > 0)) return "";
    return reasonText(sidePct(g, g.edge_side, "model"), sidePct(g, g.edge_side, "market"), evPercent(g.price_ev));
  }
  function nbaReason(p) {
    return reasonText(p.model_pct, p.market_pct, p.ev_pct);
  }

  function nbaRuleText() {
    const rules = NBA_LIVE && NBA_LIVE.rules;
    const tier = rules && rules.tiers && rules.tiers[0];
    if (!rules || !tier) return copy("fallbacks.nbaRule");
    const ev = tier.min_ev != null && tier.min_ev <= 1 ? Math.round(tier.min_ev * 1000) / 10 : tier.min_ev;
    return copy("templates.nbaRule", {
      ev: String(ev).replace(/\.0$/, ""),
      edge: String(tier.min_edge).replace(/\.0$/, ""),
      units: String(tier.units).replace(/\.0$/, ""),
      unitWord: Number(tier.units) === 1 ? "unit" : "units"
    });
  }
  function fillNumbers() {
    const nhlTech = document.getElementById("nhl-tech");
    if (nhlTech) nhlTech.textContent = copy("templates.nhlTech", { unit: unitNote() });
    const nbaTech = document.getElementById("nba-tech");
    if (nbaTech && NBA_LIVE) nbaTech.textContent = copy("templates.nbaTech", { rule: nbaRuleText() });
    const grade = document.getElementById("grade-unit");
    if (grade) grade.textContent = unitNote();
    const unitDef = document.getElementById("unit-def");
    if (unitDef && META && META.unit_note) unitDef.textContent = META.unit_note;
    const nhl = NHL_BT && NHL_BT.total;
    const nba = CHARTS && CHARTS.nba_test;
    const seo = window.AUSPEX && window.AUSPEX.seo;
    if (seo && nhl && nba) {
      const desc = copy("seo.withNumbers", {
        nhlRoi: sg(nhl.roi) + "%",
        nhlUnits: sg(nhl.units),
        nhlBets: nhl.bets.toLocaleString(),
        nbaRoi: sg(nba.roi) + "%",
        nbaUnits: sg(nba.units),
        nbaBets: nba.bets
      });
      const meta = document.querySelector('meta[name="description"]');
      if (meta) meta.setAttribute("content", desc);
      const og = document.querySelector('meta[property="og:description"]');
      if (og) og.setAttribute("content", desc);
    }
  }

  const STATE = { view: "nba" };
  let NHL_SUM = null, NHL_TODAY = null, NHL_PICKS = [], NHL_BT = null, NBA_DOC = null, NBA_LIVE = null, RESEARCH = null, CHARTS = null, META = null;
  let NHL_UPD = "", NBA_UPD = "";

  function emptyCard(title, body) {
    const d = el("div", "empty-card");
    d.append(el("strong", "", title));
    if (body) d.append(el("p", "", body));
    return d;
  }

  function kpis(host, items) {
    host.innerHTML = "";
    items.forEach(([v, k]) => { const d = el("div", "kpi"); d.append(el("div", "v num", v), el("div", "k", k)); host.append(d); });
  }

  function slip() {
    const box = $("#slip-rows"); if (!box) return;
    box.innerHTML = "";
    const liveNba = NBA_LIVE && NBA_LIVE.summary && NBA_LIVE.summary.bets;
    const liveNhl = NHL_SUM && NHL_SUM.live && NHL_SUM.live.bets;
    const day = box.previousElementSibling;
    if (!liveNba && !liveNhl) {
      if (day && day.classList.contains("sub")) day.textContent = copy("templates.slipNone");
    } else if (day && day.classList.contains("sub")) {
      day.textContent = copy("templates.slipLive");
      const banner = box.parentElement.querySelector(".day1");
      if (banner) banner.remove();
    }
    const add = (dot, what, how, big, cls) => {
      const r = el("div", "row");
      const w = el("div", "what"); w.append(el("i", "dot " + dot), document.createTextNode(what));
      r.append(w, el("div", "big num " + (cls || ""), big), el("div", "how", how));
      box.append(r);
    };
    if (liveNba) add("b", "NBA props, live", `${NBA_LIVE.summary.wins}–${NBA_LIVE.summary.losses} on ${NBA_LIVE.summary.bets} graded`, sg(NBA_LIVE.summary.units, 2) + "u", tone(NBA_LIVE.summary.units));
    if (liveNhl) add("h", "NHL moneylines, live", `${NHL_SUM.live.wins}–${NHL_SUM.live.losses} on ${NHL_SUM.live.bets} graded`, sg(NHL_SUM.live.units, 2) + "u", tone(NHL_SUM.live.units));
    if (NBA_DOC && NBA_DOC.stats) {
      const head = NBA_DOC.stats.find((s) => !/used to set the rules/i.test(s.k)) || NBA_DOC.stats[0];
      add("b", "NBA props, tested", head.k.replace(/^ROI on /, "").replace(", best price across books", " at the best price") + ". Out of sample.", head.v, tone(parseFloat(head.v)));
    }
    if (NHL_BT) add("h", "NHL moneylines, tested", `${NHL_BT.total.bets.toLocaleString()} bets over ${NHL_BT.rows.length} seasons. Out of sample.`, sg(NHL_BT.total.roi) + "%", tone(NHL_BT.total.roi));
  }

  function banner(host, text) {
    host.innerHTML = "";
    if (!text) return;
    const d = el("div", "banner"); d.append(el("strong", "", text)); host.append(d);
  }

  function nhlHeadline() {
    const L = NHL_SUM.live, T = NHL_BT.total, B = NHL_BT.blind;
    const host = $("#stats");
    if (!L.bets) {
      banner($("#nhl-banner"), copy("templates.nhlBanner"));
      kpis(host, [
        [T.bets.toLocaleString(), copy("templates.kpiTestBets")],
        [sg(T.units) + "u", copy("templates.kpiTestUnits")],
        [sg(T.roi) + "%", copy("templates.kpiTestRoi")],
        [T.max_drawdown + "u", copy("templates.kpiTestDrop")],
      ]);
      $("#nhl-words").textContent = copy("templates.nhlWordsEmpty", {
        lo: sg(T.ci[0]), hi: sg(T.ci[1]), dd: Math.abs(T.max_drawdown),
        staked: T.staked.toLocaleString(), games: T.games.toLocaleString(),
        seasons: B.seasons, blindRoi: sg(B.roi), blindPicks: B.picks.toLocaleString(), blindUnits: sg(B.units)
      });
    } else {
      banner($("#nhl-banner"), "");
      const items = [
        [`${L.wins}–${L.losses}`, copy("templates.kpiLive")],
        [sg(L.units, 2) + "u", copy("templates.kpiLiveUnits")],
        [L.roi == null ? "n/a" : sg(L.roi) + "%", copy("templates.kpiLiveRoi")],
      ];
      if (L.beat_close_pct != null) items.push([L.beat_close_pct + "%", copy("templates.kpiBeat")]);
      kpis(host, items);
      $("#nhl-words").textContent = copy("templates.nhlWordsLive", {
        roi: sg(T.roi), bets: T.bets.toLocaleString(), units: sg(T.units),
        lo: sg(T.ci[0]), hi: sg(T.ci[1]), dd: Math.abs(T.max_drawdown)
      });
    }
  }

  function renderGames(box, games) {
    const list = games.slice().sort((a, b) => (b.stake || 0) - (a.stake || 0) || (a.start_utc || "").localeCompare(b.start_utc || ""));
    if (!list.length) { box.append(emptyCard(copy("templates.emptyNoGames"))); return; }
    list.forEach((g) => {
      const isPick = g.stake > 0;
      const c = el("div", "card" + (isPick ? " pick" : ""));
      const top = el("div", "top");
      top.append(el("span", "", mt(g.start_utc)), el("span", "", g.n_books ? g.n_books + " books" : ""));
      c.append(top, el("div", "match", `${team(g.away)} at ${team(g.home)}`));
      if (g.away_goalie) c.append(el("div", "goalies", `${g.away_goalie} vs ${g.home_goalie}`));
      const f = el("div", "foot");
      if (isPick) {
        const side = g.edge_side, price = side === "home" ? g.home_price : g.away_price, p = side === "home" ? g.model_home : g.model_away;
        const why = nhlReason(g);
        const bits = [`${am(price)} · ${pct(p)}`];
        if (!why && g.price_ev != null && Number.isFinite(Number(g.price_ev))) {
          const ev = Number(g.price_ev);
          bits.push("EV " + sg(Math.abs(ev) <= 2 ? ev * 100 : ev) + "%");
        }
        if (why) c.append(el("p", "why", why));
        f.append(el("span", "tag", copy("templates.pickTag", { team: team(g.edge_team), stake: g.stake })), el("span", "num", bits.join(" · ")));
      } else if (g.model_home != null) {
        const fav = g.model_home >= 0.5 ? [g.home, g.model_home] : [g.away, 1 - g.model_home];
        f.append(el("span", "tag pass", copy("templates.noBet")), el("span", "num p", `${team(fav[0])} ${pct(fav[1])}`));
      } else f.append(el("span", "tag pass", copy("templates.priceSoon")));
      c.append(f); box.append(c);
    });
  }

  function nhlToday() {
    const t = NHL_TODAY, today = etToday(), slate = t.date;
    const head = $("#today-h"), note = $("#today-note"), box = $("#cards");
    box.innerHTML = "";
    head.textContent = copy("nhl.today") + " · " + formatSlate(today);
    const lock = windowText(NHL_SUM && NHL_SUM.config && NHL_SUM.config.pregame_minutes, "");
    if (slate === today) {
      note.textContent = lock ? copy("templates.todayNote", { window: lock }) : copy("nhl.todayNote");
      renderGames(box, t.games || []);
    } else if (slate < today) {
      const liveEmpty = !(NHL_SUM.live.bets || NHL_SUM.live.pending);
      note.textContent = copy("templates.todayStale", { today: formatSlate(today), slate: formatSlate(slate) });
      box.append(emptyCard(liveEmpty ? copy("slip.day1") : copy("templates.emptyToday")));
      box.append(el("h3", "", copy("templates.lastSlate") + " · " + formatSlate(slate)));
      renderGames(box, t.games || []);
    } else {
      note.textContent = copy("templates.todayFuture", { today: formatSlate(today), slate: formatSlate(slate) });
      box.append(el("h3", "", copy("templates.upcoming") + " · " + formatSlate(slate)));
      renderGames(box, t.games || []);
    }
  }

  function badge(result) {
    const kind = result === "Won" ? "win" : result === "Lost" ? "loss" : result === "Push" ? "push" : "open";
    return el("span", "badge " + kind, result === "Pending" ? "Open" : result);
  }

  function runningRows(picks, value) {
    const asc = picks.slice().sort((a, b) => (a.date + (a.locked_at || "")).localeCompare(b.date + (b.locked_at || "")));
    let run = 0;
    asc.forEach((p) => { if (p.result === "Won" || p.result === "Lost" || p.result === "Push") run += Number(p.units) || 0; p._run = run; });
    return asc.reverse().filter((p) => !value || value === "all" || p.result === value);
  }

  function nhlHistory() {
    if (!NHL_PICKS) return;
    const live = NHL_PICKS.filter((p) => p.source === "live");
    const rows = runningRows(live, $("#nhl-filter").value);
    const tb = $("#hist tbody"); tb.innerHTML = "";
    if (!live.length) {
      const tr = el("tr"), td = el("td", "", ""); td.colSpan = 9; td.append(emptyCard(copy("slip.day1"), copy("templates.liveEmptyNhl"))); tr.append(td); tb.append(tr); return;
    }
    if (!rows.length) { const tr = el("tr"), td = el("td", "p", copy("templates.filterEmpty")); td.colSpan = 9; tr.append(td); tb.append(tr); return; }
    rows.forEach((p) => {
      const tr = el("tr");
      const c = clvPts(p);
      tr.append(el("td", "num", shortDate(p.date)), el("td", "", `${team(p.team)} to win`), el("td", "r num", p.stake + "u"), el("td", "r num", am(p.price)), el("td", "r num p", p.close_price == null ? "–" : am(p.close_price)));
      tr.append(el("td", "r num " + (c == null ? "p" : c > 0 ? "w" : c < 0 ? "l" : "p"), c == null ? "–" : sg(c) + " pts"));
      const cell = el("td"); cell.append(badge(p.result)); tr.append(cell);
      tr.append(el("td", "r num " + (p.units > 0 ? "w" : p.units < 0 ? "l" : "p"), p.units == null ? "–" : sg(p.units, 2)));
      tr.append(el("td", "r num", sg(p._run, 2)));
      tb.append(tr);
    });
  }

  function csvDownload(name, header, rows) {
    const lines = [header, ...rows].map((r) => r.map((cell) => `"${String(cell ?? "").replaceAll('"', '""')}"`).join(",")).join("\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([lines], { type: "text/csv" }));
    a.download = name; a.click();
  }

  function nhlClv() {
    const live = NHL_PICKS.filter((p) => p.source === "live" && p.close_price != null && p.locked_at && p.close_at && (new Date(p.close_at) - new Date(p.locked_at)) >= 600000);
    const graded = live.filter((p) => p.result === "Won" || p.result === "Lost");
    const box = $("#clv-stats");
    if (!live.length) {
      box.innerHTML = "";
      $("#clv-note").textContent = copy("templates.clvEmpty", {
        missing: publicText(CHARTS && CHARTS.nhl_clv_missing)
      });
      return;
    }
    const stake = graded.reduce((a, p) => a + p.stake, 0);
    const atPost = stake ? graded.reduce((a, p) => a + p.units, 0) / stake * 100 : null;
    const atClose = stake ? graded.reduce((a, p) => a + (p.result === "Won" ? p.stake * (decOdds(p.close_price) - 1) : -p.stake), 0) / stake * 100 : null;
    const withMkt = live.filter((p) => clvPts(p) != null);
    const beat = live.length ? live.filter((p) => decOdds(p.price) > decOdds(p.close_price)).length / live.length * 100 : null;
    const avg = withMkt.length ? withMkt.reduce((a, p) => a + clvPts(p), 0) / withMkt.length : null;
    const items = [];
    if (atPost != null) items.push([sg(atPost) + "%", copy("templates.clvPost")]);
    if (atClose != null) items.push([sg(atClose) + "%", copy("templates.clvClose")]);
    if (beat != null) items.push([beat.toFixed(0) + "%", copy("templates.kpiBeat")]);
    if (items.length) kpis(box, items); else box.innerHTML = "";
    $("#clv-note").textContent = copy("templates.clvNote", {
      n: live.length + (live.length === 1 ? " pick" : " picks"),
      avg: avg != null ? `, average ${sg(avg)} points` : ""
    });
  }

  function nice(x) {
    const p = Math.pow(10, Math.floor(Math.log10(Math.abs(x) || 1)));
    const e = Math.abs(x) / p;
    return (e < 1.5 ? 1 : e < 3.5 ? 2 : e < 7.5 ? 5 : 10) * p;
  }
  function axisTicks(min, max) {
    const step = nice((max - min) / 4 || 1);
    const start = Math.ceil((min - 1e-9) / step) * step;
    const out = [];
    for (let v = start; v <= max + step * 0.01; v += step) out.push(+v.toFixed(4));
    if (!out.length) out.push(0);
    return out;
  }

  function lineChart(host, points, opts) {
    host.innerHTML = "";
    const summary = el("p", "chart-summary", opts.summary || "");
    if (opts.summaryId) summary.id = opts.summaryId;
    if (!points || points.length < 2) {
      host.append(emptyCard(opts.emptyTitle || "No curve yet", opts.emptyBody || "It will draw once there are two points."), summary);
      return;
    }
    const w = Math.max(320, host.clientWidth || 680);
    const h = w < 520 ? 210 : 250;
    const m = { l: 44, r: 12, t: 16, b: 28 };
    const svg = svgEl("svg", { class: "chart", viewBox: `0 0 ${w} ${h}`, role: "img", "aria-labelledby": summary.id || "" });
    svg.style.height = h + "px";
    const ys = points.map((p) => p.units).concat([0]);
    let y0 = Math.min(...ys), y1 = Math.max(...ys);
    if (y0 === y1) { y0 -= 1; y1 += 1; }
    const pad = (y1 - y0) * 0.12;
    y0 -= pad; y1 += pad;
    const X = (i) => m.l + i / (points.length - 1) * (w - m.l - m.r);
    const Y = (v) => m.t + (1 - (v - y0) / (y1 - y0)) * (h - m.t - m.b);
    axisTicks(y0, y1).forEach((v) => {
      const t = svgEl("text", { x: m.l - 8, y: Y(v) + 4, "text-anchor": "end", "font-size": 12, fill: "var(--muted)" });
      t.textContent = Math.abs(v) < 0.05 ? "0" : sg(v, Math.abs(v) >= 10 ? 0 : 1); svg.append(t);
    });
    svg.append(svgEl("line", { x1: m.l, x2: w - m.r, y1: Y(0), y2: Y(0), stroke: "var(--line)" }));
    const d = points.map((p, i) => `${i ? "L" : "M"}${X(i).toFixed(1)},${Y(p.units).toFixed(1)}`).join("");
    svg.append(svgEl("path", { d, fill: "none", stroke: "var(--ink)", "stroke-width": 1.75 }));
    const mark = new Set([0, points.length - 1]);
    if (opts.trough != null) {
      const i = points.findIndex((p) => p.date === opts.trough);
      if (i >= 0) mark.add(i);
    }
    points.forEach((p, i) => {
      if (!mark.has(i)) return;
      svg.append(svgEl("circle", { cx: X(i), cy: Y(p.units), r: 3, fill: "var(--ink)" }));
    });
    const last = points[points.length - 1];
    const lab = svgEl("text", { x: Math.min(X(points.length - 1), w - m.r), y: Math.max(12, Y(last.units) - 8), "text-anchor": "end", "font-size": 13, "font-weight": 650, fill: "var(--ink)" });
    lab.textContent = (opts.endLabel || sg(last.units) + "u"); svg.append(lab);
    [0, points.length - 1].forEach((i, n) => {
      const t = svgEl("text", { x: X(i), y: h - 6, "text-anchor": n ? "end" : "start", "font-size": 12, fill: "var(--muted)" });
      t.textContent = points[i].label || points[i].date; svg.append(t);
    });
    const tip = $("#tip");
    const hit = svgEl("rect", { x: 0, y: 0, width: w, height: h, fill: "transparent" });
    hit.addEventListener("mousemove", (e) => {
      if (!tip) return;
      const r = svg.getBoundingClientRect();
      const i = Math.round((e.clientX - r.left) / r.width * (points.length - 1));
      const p = points[Math.max(0, Math.min(points.length - 1, i))];
      tip.textContent = p.tip || `${p.label || p.date}  ${sg(p.units, 2)}u`;
      tip.style.left = Math.min(e.clientX + 12, innerWidth - 160) + "px";
      tip.style.top = (e.clientY - 28) + "px"; tip.style.opacity = 1;
    });
    hit.addEventListener("mouseleave", () => { if (tip) tip.style.opacity = 0; });
    svg.append(hit);
    host.append(svg, summary);
  }

  function hbars(host, rows, summary) {
    host.innerHTML = "";
    const box = el("div", "bars");
    const mx = Math.max(...rows.map((r) => Math.abs(r.value)), 1);
    rows.forEach((r) => {
      const d = el("div", "b");
      const lab = el("div"); lab.append(document.createTextNode(r.label), el("div", "n", r.note || ""));
      const trk = el("div", "trk"); const i = document.createElement("i");
      const w = Math.abs(r.value) / mx * 100;
      i.style.width = w + "%"; i.style.left = "0"; i.style.background = r.value >= 0 ? "var(--win)" : "var(--loss)";
      trk.append(i);
      d.append(lab, trk, el("div", "num " + (r.value >= 0 ? "w" : "l"), r.display || sg(r.value) + (r.suffix || "")));
      box.append(d);
    });
    host.append(box, el("p", "chart-summary", summary));
  }

  function drawNhlCharts() {
    const live = (NHL_SUM.live_series || []).map((p) => ({ date: p.date, units: p.units, label: shortDate(p.date) }));
    const daily = (NHL_SUM.backtest_series || []).map((p) => ({ date: p.date, units: p.units, label: shortDate(p.date) }));
    if (live.length >= 2) {
      lineChart($("#nhl-live-chart"), live, { summary: copy("templates.chartLiveSummary", { start: live[0].label, end: sg(live[live.length - 1].units, 2), unit: unitNote() }), summaryId: "nhl-live-sum" });
    } else {
      lineChart($("#nhl-live-chart"), [], { emptyTitle: copy("templates.chartLiveEmptyTitle"), emptyBody: copy("templates.chartLiveEmptyBody"), summary: "" });
    }
    const seasons = NHL_BT.rows.map((row) => ({ label: row.season, units: row.units }));
    let run = 0;
    const curve = [{ date: "Start", units: 0, label: "Start" }].concat(seasons.map((s) => { run = Math.round((run + s.units) * 10) / 10; return { date: s.label, units: run, label: s.label }; }));
    const T = NHL_BT.total;
    lineChart($("#nhl-bt-chart"), daily.length >= 2 ? daily : curve, {
      endLabel: sg(T.units) + "u",
      summary: copy("templates.chartBeforeSummary", {
        seasons: seasons.map((s) => s.label + " " + sg(s.units) + "u").join(", "),
        units: sg(T.units), staked: T.staked.toLocaleString(), roi: sg(T.roi),
        dd: Math.abs(T.max_drawdown), lo: sg(T.ci[0]), hi: sg(T.ci[1])
      }),
      summaryId: "nhl-bt-sum",
    });
    hbars($("#nhl-season-chart"), NHL_BT.rows.map((row) => ({
      label: row.season, value: row.roi, note: `${row.bets_5_7 + row.bets_7} bets · ${sg(row.units)}u`, display: sg(row.roi) + "%",
    })), copy("templates.seasonSummary", { bits: NHL_BT.rows.map((r) => r.season + " " + sg(r.roi) + "% on " + (r.bets_5_7 + r.bets_7) + " bets").join(". ") }));
    const move = CHARTS && CHARTS.nhl_clv_move;
    const liveClv = NHL_PICKS.filter((p) => p.source === "live" && clvPts(p) != null).map(clvPts);
    if (liveClv.length) {
      const bins = {};
      liveClv.forEach((v) => { const b = Math.round(v); bins[b] = (bins[b] || 0) + 1; });
      const keys = Object.keys(bins).map(Number).sort((a, b) => a - b);
      hbars($("#clv-chart"), keys.map((k) => ({ label: (k > 0 ? "+" : "") + k, value: bins[k], note: "picks", display: String(bins[k]) })),
        copy("templates.clvLiveSummary", { n: liveClv.length, avg: sg(liveClv.reduce((a, b) => a + b, 0) / liveClv.length) }));
    } else if (move && move.length) {
      hbars($("#clv-chart"), move.map((r) => ({
        label: r.season, value: r.moved_pct, note: r.edges + " older-test bets", display: r.moved_pct.toFixed(1) + "%", suffix: "",
      })), copy("templates.clvOldSummary", { bits: move.map((r) => r.moved_pct.toFixed(1) + "% of " + r.edges + " older-test bets in " + r.season).join(", "), missing: publicText(CHARTS.nhl_clv_missing) }));
    } else {
      $("#clv-chart").innerHTML = "";
    }
  }

  function nbaHeadline() {
    const S = NBA_LIVE.summary;
    const host = $("#nba-live-kpis");
    if (!S.bets) {
      banner($("#nba-banner"), copy("templates.nbaBanner"));
      host.innerHTML = "";
      $("#nba-words").textContent = copy("templates.nbaWordsEmpty");
    } else {
      banner($("#nba-banner"), "");
      const items = [
        [`${S.wins}–${S.losses}${S.pushes ? "–" + S.pushes : ""}`, copy("templates.kpiLive")],
        [sg(S.units, 2) + "u", copy("templates.kpiLiveUnits")],
        [S.roi == null ? "n/a" : sg(S.roi) + "%", copy("templates.kpiLiveRoi")],
      ];
      if (S.beat_close_pct != null) items.push([S.beat_close_pct.toFixed(0) + "%", copy("templates.kpiBeat")]);
      kpis(host, items);
      $("#nba-words").textContent = S.clv_n ? copy("templates.nbaWordsClv", { avg: sg(S.avg_clv_pts, 2), n: S.clv_n }) : copy("templates.nbaWordsWait");
    }
  }

  function nbaToday() {
    const d = NBA_LIVE, today = etToday(), slate = d.today;
    const head = $("#nba-today-h"), box = $("#nba-cards"), gb = $("#nba-games");
    gb.innerHTML = ""; box.innerHTML = "";
    head.textContent = copy("nba.today") + " · " + formatSlate(today);
    const cap = $("#nba-today-cap");
    if (cap && d.rules && d.rules.tiers && d.rules.tiers[0]) {
      cap.textContent = copy("templates.nbaTodayCap", {
        window: windowText(d.rules.lock_minutes, ""),
        units: String(d.rules.tiers[0].units).replace(/\.0$/, ""),
        unitWord: Number(d.rules.tiers[0].units) === 1 ? "unit" : "units"
      });
    }
    const showGames = (games, label) => {
      if (label) box.append(el("h3", "", label));
      games.forEach((g) => {
        const st = g.completed ? `final ${g.as_}–${g.hs}` : g.state === "in" ? "in progress" : g.locked ? `${g.picks} pick${g.picks === 1 ? "" : "s"}` : "locks " + mt(new Date(new Date(g.start_utc) - d.rules.lock_minutes * 60000).toISOString());
        gb.append(el("span", g.locked ? "on" : "", `${team(g.away, "nba")} at ${team(g.home, "nba")}, ${mt(g.start_utc)} · ${st}`));
      });
    };
    const picks = d.picks.filter((p) => p.date === slate);
    const paint = () => {
      if (!picks.length) box.append(emptyCard(d.games.some((g) => g.locked) ? copy("templates.nbaPass") : copy("templates.nbaWaiting")));
      picks.forEach((p) => {
        const c = el("div", "card pick prop");
        const top = el("div", "top"); top.append(el("span", "", `${p.game.replace("@", " at ")}, ${mt(p.start_utc)}`), badge(p.result));
        c.append(top, el("div", "bet", `${p.player} ${p.side.toLowerCase()} ${p.line} ${STAT[p.stat] || p.stat}`));
        const why = nbaReason(p);
        if (why) c.append(el("p", "why", why));
        const f = el("div", "foot");
        f.append(el("span", "tag", `${am(p.price)} at ${BOOK[p.book] || p.book}`));
        if (p.actual != null) f.append(el("span", "num p", copy("templates.actual", { n: p.actual })));
        else if (!why && finite(p.ev_pct)) f.append(el("span", "num p", copy("templates.ev", { n: sg(p.ev_pct) + "%" })));
        c.append(f); box.append(c);
      });
    };
    if (slate === today) {
      if (!d.games.length) box.append(emptyCard(d.next_date ? copy("templates.nbaNoGames") + " " + copy("templates.nbaNext", { date: formatSlate(d.next_date) }) : copy("templates.nbaNoGames")));
      else { showGames(d.games); paint(); }
    } else if (slate < today) {
      box.append(emptyCard(copy("templates.nbaNotPosted")));
      if (d.games.length) { showGames(d.games, "Last published slate · " + formatSlate(slate)); paint(); }
    } else {
      $("#nba-today-cap").textContent = copy("templates.nbaTodayFuture", { today: formatSlate(today), slate: formatSlate(slate) });
      showGames(d.games, "Slate for " + formatSlate(slate));
      paint();
    }
  }

  function nbaHistory() {
    if (!NBA_LIVE) return;
    const rows = runningRows(NBA_LIVE.picks, $("#nba-filter").value);
    const tb = $("#nba-hist tbody"); tb.innerHTML = "";
    if (!NBA_LIVE.picks.length) {
      const tr = el("tr"), td = el("td"); td.colSpan = 9; td.append(emptyCard(copy("slip.day1"), copy("templates.liveEmptyNba"))); tr.append(td); tb.append(tr);
      $("#nba-clv").textContent = copy("templates.nbaClvWait");
      return;
    }
    rows.forEach((p) => {
      const tr = el("tr");
      tr.append(el("td", "num", shortDate(p.date)), el("td", "", `${p.player} ${p.side.toLowerCase()} ${p.line} ${STAT[p.stat] || p.stat}`), el("td", "r num", am(p.price)), el("td", "r p", BOOK[p.book] || p.book));
      tr.append(el("td", "r num " + (p.clv_pts == null ? "p" : p.clv_pts > 0 ? "w" : p.clv_pts < 0 ? "l" : "p"), p.clv_pts == null ? "–" : sg(p.clv_pts) + " pts"));
      tr.append(el("td", "r num", p.actual == null ? "–" : String(p.actual)));
      const cell = el("td"); cell.append(badge(p.result)); tr.append(cell);
      tr.append(el("td", "r num " + (p.units > 0 ? "w" : p.units < 0 ? "l" : "p"), p.units == null ? "–" : sg(p.units, 2)), el("td", "r num", sg(p._run, 2)));
      tb.append(tr);
    });
    const S = NBA_LIVE.summary;
    $("#nba-clv").textContent = S.clv_n ? copy("templates.nbaClv", { avg: sg(S.avg_clv_pts, 2), n: S.clv_n }) : copy("templates.nbaWordsWait");
  }

  function nbaTest() {
    const shown = [], footnote = [];
    (NBA_DOC.stats || []).forEach((s) => (/used to set the rules/i.test(s.k) ? footnote : shown).push(s));
    const host = $("#nba-stats");
    if (CHARTS && CHARTS.nba_test) {
      const t = CHARTS.nba_test;
      kpis(host, [
        [`${t.wins}–${t.losses}`, "Record on unseen bets"],
        [sg(t.units) + "u", "Units, before launch"],
        [sg(t.roi) + "%", "ROI, best price across books"],
        [t.max_drawdown + "u", "Deepest drop on that path"],
      ]);
      const months = (CHARTS.nba_monthly || []).map((m) => `${m.month} ${sg(m.units)}u on ${m.bets} bets (${sg(m.roi)}%)`).join("; ");
      $("#nba-footnote").textContent = copy("templates.nbaFoot", {
        label: t.label, winPct: t.win_pct, lo: sg(t.ci[0]), hi: sg(t.ci[1]),
        dd: Math.abs(t.max_drawdown), trough: t.trough_date ? ", on " + t.trough_date : "",
        months, inSample: footnote.map((s) => s.v + " " + s.k).join(". "),
        roi: sg(t.roi), bets: t.bets
      });
    } else {
      kpis(host, shown.map((s) => [s.v, s.k]));
      $("#nba-footnote").textContent = footnote.map((s) => s.v + " " + s.k + ". That sample was used to set the rules, so it is not the headline.").join(" ");
    }
  }

  function drawNbaCharts() {
    if (!CHARTS || !CHARTS.nba_equity) {
      lineChart($("#nba-equity"), [], { emptyTitle: "The before-launch curve is not loaded", emptyBody: "data/charts.json did not load.", summary: "" });
      return;
    }
    const t = CHARTS.nba_test;
    const pts = CHARTS.nba_equity.map((p) => ({ date: p.date, units: p.units, label: shortDate(p.date) }));
    lineChart($("#nba-equity"), pts, {
      endLabel: sg(t.units) + "u",
      trough: t.trough_date,
      summary: copy("templates.nbaEqSummary", {
        label: t.label, units: sg(t.units), bets: t.bets, roi: sg(t.roi),
        record: t.wins + "–" + t.losses, dd: Math.abs(t.max_drawdown)
      }),
      summaryId: "nba-eq-sum",
    });
    const monthName = (ym) => { const [y, m] = ym.split("-").map(Number); return new Date(Date.UTC(y, m - 1, 1, 16)).toLocaleDateString("en-US", { timeZone: "America/New_York", month: "long", year: "numeric" }); };
    hbars($("#nba-month"), CHARTS.nba_monthly.map((m) => ({
      label: monthName(m.month), value: m.units, note: `${m.wins}–${m.losses} · ${sg(m.roi)}%`, display: sg(m.units) + "u",
    })), copy("templates.nbaMonthSummary", { bits: CHARTS.nba_monthly.map((m) => monthName(m.month) + ": " + m.wins + "–" + m.losses + ", " + sg(m.units) + " units, " + sg(m.roi) + "%").join(". ") }));
    hbars($("#nba-statbars"), CHARTS.nba_by_stat.map((s) => ({
      label: s.stat, value: s.units, note: `${s.bets} bets · ${s.win_pct}% won`, display: sg(s.units) + "u",
    })), copy("templates.nbaStatSummary", {
      bits: CHARTS.nba_by_stat.map((s) => s.stat + " " + sg(s.units) + " units (" + sg(s.roi) + "% on " + s.bets + " bets)").join(". "),
      paths: CHARTS.nba_resample.paths.toLocaleString(),
      pathBets: CHARTS.nba_resample.bets.toLocaleString(),
      profit: CHARTS.nba_resample.p_profit,
      end: sg(CHARTS.nba_resample.median_end),
      drop: CHARTS.nba_resample.median_drawdown
    }));
  }

  function nbaStatic(n) {
    if (n.books) {
      $("#nba-books-cap").textContent = n.books.caption;
      const tb = $("#nba-books tbody"); tb.innerHTML = "";
      n.books.rows.forEach((r, i) => {
        const tr = el("tr");
        tr.append(el("td", i < 1 ? "best" : "", r[0]), el("td", "r num", r[1]), el("td", "r num " + (String(r[2]).startsWith("+") ? "w" : "l"), r[2]), el("td", "r num p", r[3]));
        tb.append(tr);
      });
    }
    const tb = $("#nba-tests tbody"); tb.innerHTML = "";
    (n.tests || []).forEach((t) => {
      const tr = el("tr"); tr.append(el("td", "", t.test), el("td", "p", t.result));
      const v = el("td", "r"); v.append(el("span", "verdict " + t.tone, t.verdict)); tr.append(v); tb.append(tr);
    });
    if (n.sample) {
      $("#nba-sample-cap").textContent = n.sample.caption;
      const sb = $("#nba-sample tbody"); sb.innerHTML = "";
      n.sample.rows.forEach((r) => {
        const best = Math.min(+r.books, +r.model, +r.final);
        const tr = el("tr"); tr.append(el("td", "", r.stat), el("td", "r num", Number(r.lines).toLocaleString()));
        [r.books, r.model, r.final].forEach((v) => tr.append(el("td", "r num" + (+v === best ? " w" : ""), v)));
        sb.append(tr);
      });
    }
  }

  function bars(host, rows) {
    const box = $(host); box.innerHTML = "";
    const mx = Math.max(...rows.map((r) => Math.abs(r[2])), 1);
    rows.forEach(([lab, n, roi]) => {
      const d = el("div", "b");
      const t = el("div", "trk"); const i = document.createElement("i");
      const w = Math.abs(roi) / mx * 100; i.style.width = w + "%"; i.style.left = "0"; i.style.background = roi >= 0 ? "var(--win)" : "var(--loss)";
      t.append(i);
      const l = el("div"); l.append(document.createTextNode(lab), el("div", "n", n.toLocaleString() + " bets"));
      d.append(l, t, el("div", "num " + (roi >= 0 ? "w" : "l"), sg(roi) + "%"));
      box.append(d);
    });
  }

  function drawResearch() {
    if (!RESEARCH) return;
    const r = RESEARCH;
    const svg = $("#cal"); svg.innerHTML = "";
    const W = 460, m = 52; svg.setAttribute("viewBox", `0 0 ${W} ${W}`); svg.style.height = "auto";
    const X = (v) => m + (v - 0.15) / 0.6 * (W - 2 * m);
    const Y = (v) => W - m - (v - 0.15) / 0.6 * (W - 2 * m);
    [0.2, 0.4, 0.6].forEach((v) => {
      const xt = svgEl("text", { x: X(v), y: W - m + 18, "text-anchor": "middle", "font-size": 12, fill: "var(--muted)" }); xt.textContent = Math.round(v * 100) + "%"; svg.append(xt);
      const yt = svgEl("text", { x: m - 8, y: Y(v) + 4, "text-anchor": "end", "font-size": 12, fill: "var(--muted)" }); yt.textContent = Math.round(v * 100) + "%"; svg.append(yt);
    });
    svg.append(svgEl("line", { x1: X(0.15), y1: Y(0.15), x2: X(0.75), y2: Y(0.75), stroke: "var(--bronze)", "stroke-dasharray": "5 4" }));
    const xl = svgEl("text", { x: W / 2, y: W - 8, "text-anchor": "middle", "font-size": 13, fill: "var(--ink)" }); xl.textContent = "Predicted chance of the over"; svg.append(xl);
    const yl = svgEl("text", { x: 14, y: W / 2, "text-anchor": "middle", "font-size": 13, fill: "var(--ink)", transform: `rotate(-90 14 ${W / 2})` }); yl.textContent = "How often it happened"; svg.append(yl);
    const bits = [];
    (r.nba_calibration || []).forEach((b) => {
      if (b.book_n >= 200 && b.book_pred != null) svg.append(svgEl("circle", { cx: X(b.book_pred), cy: Y(b.book_obs), r: 7, fill: "none", stroke: "var(--muted)", "stroke-width": 2 }));
      if (b.model_n >= 200 && b.model_pred != null) {
        svg.append(svgEl("circle", { cx: X(b.model_pred), cy: Y(b.model_obs), r: 6, fill: "var(--bronze)" }));
        bits.push(`${b.bin}: model said ${Math.round(b.model_pred * 100)}% and it happened ${Math.round(b.model_obs * 100)}% (${b.model_n.toLocaleString()} lines)`);
      }
    });
    $("#cal-key").textContent = copy("templates.calKey", { bits: bits.join(". ") });
    bars("#nhl-buckets", r.nhl_buckets);
    bars("#nba-buckets", r.nba_ev_buckets);
    const tb = $("#nhl-seasons tbody"); tb.innerHTML = "";
    r.nhl_seasons.forEach((x) => {
      const tr = el("tr"); const better = x.ll_model < x.ll_market;
      tr.append(el("td", "", x.season), el("td", "r num", x.games.toLocaleString()), el("td", "r num" + (better ? " w" : ""), x.ll_model.toFixed(4)), el("td", "r num" + (!better ? " w" : ""), x.ll_market.toFixed(4)), el("td", "r num", x.bets), el("td", "r num " + (x.roi >= 0 ? "w" : "l"), sg(x.roi) + "%"));
      tb.append(tr);
    });
    const ul = $("#changelog"); ul.innerHTML = "";
    r.changelog.forEach((c) => {
      const li = document.createElement("li"); const t = document.createElement("time");
      t.dateTime = c.date; t.textContent = formatSlate(c.date); li.append(t, el("span", "", c.text)); ul.append(li);
    });
  }

  function fillFaq() {
    document.querySelectorAll("[data-faq='unit']").forEach((node) => {
      if (META && META.unit_note) node.textContent = META.unit_note;
    });
    const nbaMin = NBA_LIVE && NBA_LIVE.rules && NBA_LIVE.rules.lock_minutes;
    const nhlMin = NHL_SUM && NHL_SUM.config && NHL_SUM.config.pregame_minutes;
    if (nbaMin == null && nhlMin == null) return;
    const text = copy("templates.faqLock", {
      nba: windowText(nbaMin != null ? nbaMin : 50, "50 minutes"),
      nhl: windowText(nhlMin != null ? nhlMin : 120, "2 hours")
    });
    if (!text) return;
    document.querySelectorAll("[data-faq='lock']").forEach((node) => { node.textContent = text; });
  }

  const GRADED = { Won: 1, Lost: 1, Push: 1, Void: 1 };

  function matchupName(game, sport) {
    if (!game || String(game).indexOf("@") < 0) return game || "";
    const parts = String(game).split("@");
    return team(parts[0], sport) + " at " + team(parts[1], sport);
  }
  function nhlPickLabel(p) {
    return p.team ? team(p.team, "nhl") + " to win" : "";
  }
  function nbaPickLabel(p) {
    const bits = [];
    if (p.player) bits.push(p.player);
    if (p.side) bits.push(String(p.side).toLowerCase());
    if (p.line != null && p.line !== "") bits.push(String(p.line));
    if (p.stat) bits.push(STAT[p.stat] || p.stat);
    return bits.join(" ");
  }
  function buildRecord(nhlPicks, nbaLive) {
    const rows = [];
    (Array.isArray(nhlPicks) ? nhlPicks : []).forEach((p) => {
      if (!p || p.source !== "live" || !GRADED[p.result]) return;
      rows.push({
        date: p.date || "",
        locked_at: p.locked_at || "",
        league: "NHL",
        matchup: matchupName(p.game, "nhl"),
        pick: nhlPickLabel(p),
        odds: p.price,
        stake: p.stake,
        result: p.result,
        units: finite(p.units) ? Number(p.units) : null
      });
    });
    const nba = nbaLive && Array.isArray(nbaLive.picks) ? nbaLive.picks : [];
    nba.forEach((p) => {
      if (!p || !GRADED[p.result]) return;
      rows.push({
        date: p.date || "",
        locked_at: p.locked_at || "",
        league: "NBA",
        matchup: matchupName(p.game, "nba"),
        pick: nbaPickLabel(p),
        odds: p.price,
        stake: p.stake,
        result: p.result,
        units: finite(p.units) ? Number(p.units) : null
      });
    });
    rows.sort((a, b) => (a.date + " " + a.locked_at).localeCompare(b.date + " " + b.locked_at) || a.league.localeCompare(b.league) || a.pick.localeCompare(b.pick));
    let run = 0, w = 0, l = 0;
    rows.forEach((p) => {
      if (p.result === "Won") w += 1;
      if (p.result === "Lost") l += 1;
      if (p.units != null) run = Math.round((run + p.units) * 1000) / 1000;
      p._run = run;
      p._rec = w + "–" + l;
    });
    return rows;
  }
  function recordLabel(rows) {
    const w = rows.filter((p) => p.result === "Won").length;
    const l = rows.filter((p) => p.result === "Lost").length;
    const pushes = rows.filter((p) => p.result === "Push").length;
    const voids = rows.filter((p) => p.result === "Void").length;
    let s = w + "–" + l;
    if (pushes) s += ", " + pushes + (pushes === 1 ? " push" : " pushes");
    if (voids) s += ", " + voids + (voids === 1 ? " void" : " voids");
    return s;
  }
  function recordTotals(rows) {
    const staked = rows.reduce((sum, p) => {
      if (p.result !== "Won" && p.result !== "Lost" && p.result !== "Push") return sum;
      return sum + (finite(p.stake) ? Number(p.stake) : 0);
    }, 0);
    const raw = rows.reduce((sum, p) => sum + (p.units == null ? 0 : p.units), 0);
    const units = Math.round(raw * 100) / 100;
    return { staked, units, roi: staked ? (100 * units / staked) : null };
  }
  function unitCount(n) {
    if (!finite(n)) return "–";
    const v = Math.round(Number(n) * 100) / 100;
    const text = Math.abs(v - Math.round(v)) < 1e-9 ? String(Math.round(v)) : String(v);
    return text + "u";
  }
  function signedGap(value, up, down, flat) {
    if (!finite(value)) return "";
    const n = Number(value);
    if (n > 0) return copy(up, { n: plainNum(Math.abs(n) * 100) });
    if (n < 0) return copy(down, { n: plainNum(Math.abs(n) * 100) });
    return copy(flat);
  }
  function clvLines(block) {
    const price = (block && block.price) || {};
    const novig = (block && block.novig) || {};
    const lines = [];
    const n = price.n || novig.n || 0;
    if (n) lines.push(copy("record.clvCount", { n: n }));
    if (price.n && finite(price.beat_close)) lines.push(copy("record.clvBeat", { pct: plainNum(price.beat_close * 100) }));
    if (price.n) {
      const gap = signedGap(price.mean, "record.clvPriceUp", "record.clvPriceDown", "record.clvPriceFlat");
      if (gap) lines.push(gap);
      if (finite(price.low) && finite(price.high)) {
        lines.push(copy("record.clvRange", {
          lo: sg(price.low * 100, 1) + "%",
          hi: sg(price.high * 100, 1) + "%"
        }));
      }
    }
    if (novig.n && finite(novig.beat_close)) lines.push(copy("record.clvNovigBeat", { pct: plainNum(novig.beat_close * 100) }));
    if (novig.n) {
      const gap = signedGap(novig.mean, "record.clvNovigUp", "record.clvNovigDown", "record.clvNovigFlat");
      if (gap) lines.push(gap);
    }
    return lines;
  }
  function renderClv(report) {
    const status = $("#clv-status");
    const host = $("#clv-blocks");
    if (!status || !host) return;
    host.replaceChildren();
    const sports = ["nhl", "nba"];
    const ready = report && sports.some((key) => {
      const block = report[key];
      return block && ((block.price && block.price.n) || (block.novig && block.novig.n));
    });
    if (!ready) {
      status.textContent = copy("record.clvMissing");
      return;
    }
    status.textContent = copy("record.clvLede");
    sports.forEach((key) => {
      const card = el("article", "clv-card");
      card.append(el("h3", "", copy("record." + key) || key.toUpperCase()));
      const lines = clvLines(report[key]);
      if (!lines.length) card.append(el("p", "", copy("record.clvMissing")));
      else lines.forEach((line) => card.append(el("p", "", line)));
      host.append(card);
    });
  }

  function bootRecord() {
    const empty = $("#record-empty");
    const tools = $("#record-tools");
    const wrap = $("#record-wrap");
    let rows = [];

    function shownRows() {
      const league = $("#record-league").value;
      const result = $("#record-result").value;
      return rows.filter((p) => (league === "all" || p.league === league) && (result === "all" || p.result === result));
    }
    function paint() {
      const shown = shownRows();
      const tb = $("#record-table tbody");
      tb.replaceChildren();
      if (!shown.length) {
        const tr = el("tr");
        const td = el("td", "", rows.length ? copy("record.filterEmpty") : copy("record.empty"));
        td.colSpan = 10;
        tr.append(td);
        tb.append(tr);
        return;
      }
      shown.slice().reverse().forEach((p) => {
        const tr = el("tr");
        tr.append(
          el("td", "num", p.date ? shortDate(p.date) : "–"),
          el("td", "", p.league),
          el("td", "", p.matchup || "–"),
          el("td", "", p.pick || "–"),
          el("td", "r num", am(p.odds)),
          el("td", "r num", unitCount(p.stake))
        );
        const cell = el("td");
        cell.append(badge(p.result));
        tr.append(cell);
        tr.append(
          el("td", "r num " + (p.units > 0 ? "w" : p.units < 0 ? "l" : "p"), p.units == null ? "–" : sg(p.units, 2)),
          el("td", "r num", sg(p._run, 2)),
          el("td", "r num", p._rec)
        );
        tb.append(tr);
      });
    }
    function drawSummary() {
      const totals = recordTotals(rows);
      const items = [
        [recordLabel(rows), copy("record.kpiRecord")],
        [sg(totals.units, 2) + "u", copy("record.kpiUnits")],
        [unitCount(totals.staked), copy("record.kpiStaked")]
      ];
      if (totals.roi != null) items.push([sg(totals.roi, 1) + "%", copy("record.kpiRoi")]);
      kpis($("#record-kpis"), items);
      const tableHead = $("#record-table-h");
      if (!rows.length) {
        empty.hidden = false;
        tools.hidden = true;
        wrap.hidden = true;
        if (tableHead) tableHead.hidden = true;
        $("#record-chart").replaceChildren();
        return;
      }
      empty.hidden = true;
      tools.hidden = false;
      wrap.hidden = false;
      if (tableHead) tableHead.hidden = false;
      const points = rows.filter((p) => p.units != null).map((p) => ({
        date: p.date,
        units: p._run,
        label: p.date ? shortDate(p.date) : "",
        tip: (p.date ? shortDate(p.date) : "") + "  " + p.league + "  " + (p.pick || p.matchup) + "  " + sg(p.units, 2) + "u"
      }));
      if (points.length) points.unshift({ date: "Start", units: 0, label: "Start", tip: "Start  0.00u" });
      const last = points[points.length - 1];
      lineChart($("#record-chart"), points, {
        summary: last ? copy("record.chartSummary", { end: sg(last.units, 2) }) : "",
        summaryId: "record-chart-sum",
        endLabel: last ? sg(last.units, 2) + "u" : ""
      });
    }

    $("#record-league").addEventListener("change", paint);
    $("#record-result").addEventListener("change", paint);
    $("#record-csv").addEventListener("click", () => {
      csvDownload("auspex-record.csv", ["date", "league", "matchup", "pick", "odds", "stake", "result", "units", "running_units", "running_record"],
        shownRows().slice().reverse().map((p) => [p.date, p.league, p.matchup, p.pick, p.odds, p.stake, p.result, p.units, p.units == null ? "" : p._run.toFixed(2), p._rec]));
    });
    addEventListener("resize", () => {
      clearTimeout(bootRecord.resizeTimer);
      bootRecord.resizeTimer = setTimeout(() => { if (rows.length) drawSummary(); }, 150);
    });

    Promise.all([
      j("data/picks.json").catch(() => null),
      j("data/nba_live.json").catch(() => null),
      j("data/summary.json").catch(() => null)
    ]).then(([picks, nba, summary]) => {
      if (picks == null && nba == null) {
        empty.hidden = false;
        empty.textContent = copy("record.loadError");
        return;
      }
      rows = buildRecord(picks || [], nba);
      const times = [summary && summary.generated_at, nba && nba.generated_at].filter(Boolean).sort();
      if (times.length && $("#record-updated")) $("#record-updated").textContent = when(times[times.length - 1]);
      drawSummary();
      paint();
    });
    // Optional. PR #14 writes data/clv/latest.json outside site/. Until a copy
    // sits at site/data/clv/latest.json the request 404s and the page says so.
    j("data/clv/latest.json").then(renderClv).catch(() => renderClv(null));
  }

  function bootFaq() {
    Promise.all([
      j("data/meta.json").catch(() => null),
      j("data/summary.json").catch(() => null),
      j("data/nba_live.json").catch(() => null)
    ]).then(([meta, summary, nba]) => {
      META = meta;
      NHL_SUM = summary;
      NBA_LIVE = nba;
      fillFaq();
    });
  }

  function show(scroll) {
    const hash = location.hash;
    if (hash === "#nba" || hash === "#nhl" || hash === "#research") STATE.view = hash.slice(1);
    const v = STATE.view;
    document.body.classList.toggle("nba", v === "nba");
    document.body.dataset.view = v;
    ["nhl", "nba", "research"].forEach((k) => { $("#view-" + k).hidden = k !== v; $("#tab-" + k).removeAttribute("aria-current"); });
    $("#tab-" + v).setAttribute("aria-current", "page");
    document.querySelectorAll("#site-nav a").forEach((a) => a.removeAttribute("aria-current"));
    const navHref = hash === "#faq" ? "#faq" : "#" + v;
    const nav = document.querySelector('#site-nav a[href="' + navHref + '"]');
    if (nav) nav.setAttribute("aria-current", "page");
    $("#updated").textContent = v === "nhl" ? NHL_UPD : NBA_UPD;
    $("#sticky-today").setAttribute("href", v === "nhl" ? "#nhl-today" : "#nba-today");
    if (scroll && (hash === "#nba" || hash === "#nhl" || hash === "#research")) {
      $(".switch").scrollIntoView({ behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "start" });
    }
    if (v === "nhl" && NHL_SUM && NHL_BT) drawNhlCharts();
    if (v === "nba" && NBA_DOC) drawNbaCharts();
    if (v === "research" && RESEARCH) drawResearch();
  }

  function bootHome() {
    $("#nhl-filter").addEventListener("change", nhlHistory);
    $("#nba-filter").addEventListener("change", nbaHistory);
    $("#nhl-csv").addEventListener("click", () => {
      const rows = runningRows(NHL_PICKS.filter((p) => p.source === "live"), $("#nhl-filter").value);
      csvDownload("auspex-nhl-picks.csv", ["date", "team", "stake", "price", "close", "clv_pts", "result", "units", "running"],
        rows.map((p) => [p.date, p.team, p.stake, p.price, p.close_price, clvPts(p), p.result, p.units, p._run.toFixed(2)]));
    });
    $("#nba-csv").addEventListener("click", () => {
      const rows = runningRows(NBA_LIVE.picks, $("#nba-filter").value);
      csvDownload("auspex-nba-picks.csv", ["date", "player", "side", "line", "stat", "price", "book", "clv_pts", "actual", "result", "units", "running"],
        rows.map((p) => [p.date, p.player, p.side, p.line, p.stat, p.price, p.book, p.clv_pts, p.actual, p.result, p.units, p._run.toFixed(2)]));
    });
    addEventListener("hashchange", () => show(true));
    let resizeTimer;
    addEventListener("resize", () => { clearTimeout(resizeTimer); resizeTimer = setTimeout(() => show(false), 150); });

    j("data/research.json").then((r) => { RESEARCH = r; if (STATE.view === "research") drawResearch(); }).catch(() => {});
    j("data/charts.json").then((c) => { CHARTS = c; fillNumbers(); if (NBA_DOC) { nbaTest(); if (STATE.view === "nba") drawNbaCharts(); } if (NHL_SUM && STATE.view === "nhl") drawNhlCharts(); }).catch(() => {});
    j("data/nba.json").then((n) => { NBA_DOC = n; nbaStatic(n); nbaTest(); slip(); show(false); }).catch(() => { $("#nba-tagline").textContent = copy("templates.nbaDown"); });
    j("data/nba_live.json").then((d) => { NBA_LIVE = d; NBA_UPD = when(d.generated_at); fillNumbers(); fillFaq(); nbaHeadline(); nbaToday(); nbaHistory(); slip(); show(false); }).catch(() => { $("#nba-cards").append(emptyCard(copy("templates.slateDown"))); });
    Promise.all(["data/meta.json", "data/summary.json", "data/today.json", "data/picks.json", "data/backtest.json"].map(j)).then(([meta, s, t, p, b]) => {
      META = meta; NHL_SUM = s; NHL_TODAY = t; NHL_PICKS = p; NHL_BT = b; NHL_UPD = when(s.generated_at);
      $("#tagline").textContent = meta.tagline;
      fillNumbers(); fillFaq(); nhlHeadline(); nhlToday(); nhlHistory(); nhlClv(); slip(); show(false);
    }).catch(() => { $("#updated").textContent = copy("templates.nhlDown"); });
    show(false);
  }

  const page = document.body && document.body.dataset.page;
  if (page === "record") bootRecord();
  else if (page === "faq") bootFaq();
  else if (page === "home") bootHome();
})();
