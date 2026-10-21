"use client";
import { useState } from "react";
import { odds, timeET, dayLong, resultLabel, resultTone, units as u } from "@/lib/format";

function Ticket({ p, nhl }) {
  const done = p.result !== "Pending";
  return (
    <article className={"ticket is-pick" + (nhl ? " nhl" : "")}>
      <div className="meta"><span>{p.game}{p.start ? `, ${timeET(p.start)}` : ""}</span><span className={"state " + resultTone(p.result)}>{resultLabel(p.result)}{done && p.units != null ? ` ${u(p.units)}` : ""}</span></div>
      <h3 className="call">{p.pick}</h3>
      <div className="price"><b>{odds(p.price)} <span>{nhl ? "median price" : `at ${p.book}`}</span></b><span>{p.actual != null ? (nhl ? `Final ${p.actual}` : `Finished with ${p.actual}`) : `${p.stake} unit${p.stake === 1 ? "" : "s"}`}</span></div>
    </article>
  );
}

function NhlGame({ g }) {
  return (
    <article className="ticket nhl">
      <div className="meta"><span>{timeET(g.start)}</span><span>{g.score ? `Final ${g.score}` : "No pick"}</span></div>
      <h3 className="call">{g.away} at {g.home}</h3>
    </article>
  );
}

export default function Today({ nbaDate, nhlDate, nbaGames, nbaPicks, nbaNext, nhlGames, lockMinutes }) {
  const [tab, setTab] = useState("nba");
  const locked = nbaGames.filter((g) => g.locked).length;
  const nhlPicks = nhlGames.filter((g) => g.pick);
  const nhlLocked = nhlPicks.length > 0;
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
              {nbaGames.map((g) => (
                <span key={g.id} className={g.locked ? "on" : ""}>
                  {g.away} at {g.home}, {timeET(g.start)}{g.completed ? ": final" : g.locked ? `: ${g.picks} pick${g.picks === 1 ? "" : "s"}` : ""}
                </span>
              ))}
            </div>
          )}
          {nbaPicks.length ? (
            <div className="cards">{nbaPicks.map((p) => <Ticket key={p.id} p={p} />)}</div>
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
              {nhlPicks.map((g) => <Ticket key={g.id} p={{ ...g.pick, start: g.start }} nhl />)}
              {!nhlLocked && <div className="empty">Picks post here before the first puck drop.</div>}
              {nhlGames.filter((g) => !g.pick).map((g) => <NhlGame key={g.id} g={g} />)}
            </div>
          )}
        </div>
      )}
    </section>
  );
}
