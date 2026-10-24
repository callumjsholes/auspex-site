"use client";
import { useState } from "react";
import { timeET, dayLong } from "@/lib/format";
import { useLive } from "@/components/Live";
import { Ticket } from "@/components/Ticket";
import { gamePath, matchupPath } from "@/lib/teams";

// Earliest tip first, so games in progress sit at the top; picks in the same game stay together.
const byTip = (ps) => [...ps].sort((a, b) => (a.start || "").localeCompare(b.start || "") || a.game.localeCompare(b.game));

function NhlGame({ g, href }) {
  return (
    <article className="ticket nhl">
      <div className="meta"><span>{timeET(g.start)}</span><span>{g.score ? `Final ${g.score}` : "No pick"}</span></div>
      <h3 className="call">{href ? <a href={href}>{g.away} at {g.home}</a> : `${g.away} at ${g.home}`}</h3>
    </article>
  );
}

export default function Today({ nbaDate, nhlDate, nbaGames, nbaPicks, nbaNext, nhlGames, lockMinutes }) {
  const [tab, setTab] = useState("nba");
  const locked = nbaGames.filter((g) => g.locked).length;
  const nhlPicks = nhlGames.filter((g) => g.pick);
  const nhlLocked = nhlPicks.length > 0;
  const live = useLive(nbaPicks, nhlPicks.map((g) => ({ ...g.pick, start: g.start })));
  return (
    <section className="block wrap" id="today" aria-labelledby="today-h">
      <div className="head">
        <div>
          <h2 id="today-h">Today's picks</h2>
          <p className="lede">{tab === "nba" ? `${dayLong(nbaDate)}. Each game's props lock about ${lockMinutes} minutes before tip, after the injury report.` : `${dayLong(nhlDate)}. NHL picks lock before the first puck drop.`}</p>
        </div>
        <div className="tabs" role="tablist" aria-label="League">
          <button role="tab" aria-selected={tab === "nba"} onClick={() => setTab("nba")}>NBA props</button>
          <button role="tab" aria-selected={tab === "nhl"} onClick={() => setTab("nhl")}>NHL moneylines</button>
        </div>
      </div>

      {tab === "nba" ? (
        <div role="tabpanel">
          {nbaGames.length > 0 && (
            <div className="slate">
              {nbaGames.map((g) => {
                const href = gamePath("NBA", nbaDate, g.away, g.home);
                const label = `${g.away} at ${g.home}, ${timeET(g.start)}${g.completed ? ": final" : g.locked ? `: ${g.picks} pick${g.picks === 1 ? "" : "s"}` : ""}`;
                return href ? <a key={g.id} className={g.locked ? "on" : ""} href={href}>{label}</a> : <span key={g.id} className={g.locked ? "on" : ""}>{label}</span>;
              })}
            </div>
          )}
          {nbaPicks.length ? (
            <div className="cards">{byTip(nbaPicks).map((p) => <Ticket key={p.id} p={p} live={live} href={matchupPath("NBA", p.date, p.game)} />)}</div>
          ) : (
            <div className="empty">
              {!nbaGames.length ? `No NBA games today${nbaNext ? `. Next slate: ${dayLong(nbaNext)}.` : "."}`
                : locked ? "No prop cleared the bar in the games priced so far. Passing is part of the plan."
                : "Picks post here as each game locks."}
            </div>
          )}
        </div>
      ) : (
        <div role="tabpanel">
          {!nhlGames.length ? <div className="empty" style={{ marginTop: 22 }}>No NHL games on this slate.</div> : (
            <div className="cards" style={{ marginTop: 22 }}>
              {nhlPicks.map((g) => <Ticket key={g.id} p={{ ...g.pick, start: g.start }} nhl live={live} href={gamePath("NHL", nhlDate, g.away, g.home)} />)}
              {!nhlLocked && <div className="empty">Picks post here before the first puck drop.</div>}
              {nhlGames.filter((g) => !g.pick).map((g) => <NhlGame key={g.id} g={g} href={gamePath("NHL", nhlDate, g.away, g.home)} />)}
            </div>
          )}
        </div>
      )}
    </section>
  );
}
