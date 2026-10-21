"use client";
import { useEffect, useState } from "react";

// Live tracker for today's open picks. Polls /api/live only while a picked game is about to start or
// in progress and the tab is visible; otherwise it makes no requests.
const POLL_MS = 45_000;
const BEFORE_MS = 10 * 60_000;      // start polling 10 minutes before the start time
const AFTER_MS = 4 * 3600_000;      // and stop 4 hours after it
const STAT = { pts: "pts", reb: "reb", ast: "ast" };

function liveWindow(p, now) {
  if (!p || p.result !== "Pending" || !p.start) return false;
  const t = Date.parse(p.start);
  return Number.isFinite(t) && now >= t - BEFORE_MS && now <= t + AFTER_MS;
}

export function useLive(nbaPicks, nhlPicks) {
  const [data, setData] = useState(null);
  const nbaKey = nbaPicks.filter((p) => p.espnGame && p.espnPlayer).map((p) => `${p.espnGame}:${p.espnPlayer}:${p.start}:${p.result}`).join(",");
  const nhlKey = nhlPicks.filter((p) => p.nhlGame).map((p) => `${p.nhlGame}:${p.start}:${p.result}`).join(",");

  useEffect(() => {
    let timer = null;
    let stopped = false;
    const tick = async () => {
      const now = Date.now();
      const nba = nbaPicks.filter((p) => p.espnGame && p.espnPlayer && liveWindow(p, now)).map((p) => `${p.espnGame}:${p.espnPlayer}`);
      const nhl = nhlPicks.filter((p) => p.nhlGame && liveWindow(p, now)).map((p) => p.nhlGame);
      if (nba.length || nhl.length) {
        if (document.visibilityState === "visible") {
          try {
            const q = new URLSearchParams();
            if (nba.length) q.set("nba", [...new Set(nba)].join(","));
            if (nhl.length) q.set("nhl", [...new Set(nhl)].join(","));
            const res = await fetch(`/api/live?${q}`, { cache: "no-store" });
            if (res.ok && !stopped) setData(await res.json());
          } catch {
            /* keep the last good reading */
          }
        }
      }
      if (!stopped) timer = setTimeout(tick, POLL_MS);
    };
    tick();
    const onVisible = () => { if (document.visibilityState === "visible") { clearTimeout(timer); tick(); } };
    document.addEventListener("visibilitychange", onVisible);
    return () => { stopped = true; clearTimeout(timer); document.removeEventListener("visibilitychange", onVisible); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nbaKey, nhlKey]);
  return data;
}

// One line on a pick card: the live stat against the line (NBA) or the live score (NHL).
export function liveView(p, nhl, live) {
  if (!live) return null;
  if (nhl) {
    const g = live.nhl?.[String(p.nhlGame)];
    if (!g || g.state === "pre" || g.hs == null || g.as == null) return null;
    const mine = p.team === g.home ? g.hs : p.team === g.away ? g.as : null;
    const theirs = p.team === g.home ? g.as : p.team === g.away ? g.hs : null;
    const tone = mine == null ? "" : mine > theirs ? "pos" : mine < theirs ? "neg" : "";
    return { tone, label: g.state === "post" ? "Final" : "Live", text: `${g.away} ${g.as}–${g.hs} ${g.home}`, detail: g.detail, bar: null };
  }
  const g = live.nba?.[String(p.espnGame)];
  if (!g || g.state === "pre") return null;
  const s = g.players?.[String(p.espnPlayer)];
  const label = g.state === "post" ? "Final" : "Live";
  if (!s || !s.played) return { tone: "", label, text: g.state === "post" ? "Did not play" : "Not in the box score yet", detail: g.detail, bar: null };
  const v = s[p.stat];
  if (v == null) return null;
  const line = Number(p.line);
  const need = Math.floor(line) + 1;           // an over on 2.5 needs 3
  const name = STAT[p.stat] || p.stat;
  let tone = "";
  let text = `${v} ${name}`;
  if (p.side === "Over") {
    if (v > line) { tone = "pos"; text += `, over ${line} hit`; }
    else { text += `, ${need - v} more for the over`; if (g.state === "post") tone = "neg"; }
  } else {
    if (v > line) { tone = "neg"; text += `, past ${line}`; }
    else { tone = "pos"; text += `, under ${line} so far`; }
  }
  return { tone, label, text, detail: [g.detail, s.min != null ? `${s.min} min` : ""].filter(Boolean).join(" · "), bar: Math.max(0, Math.min(1, v / need)) };
}

export function LiveLine({ p, nhl, live }) {
  const v = liveView(p, nhl, live);
  if (!v) return null;
  return (
    <div className={"live " + v.tone} aria-live="polite">
      <span className="dot" aria-hidden="true" /><b>{v.label}</b> <span className="txt">{v.text}</span>
      {v.detail ? <span className="det">{v.detail}</span> : null}
      {v.bar != null ? <span className="bar" aria-hidden="true"><i style={{ width: `${Math.round(v.bar * 100)}%` }} /></span> : null}
    </div>
  );
}
