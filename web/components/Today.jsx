"use client";
import { useEffect, useState } from "react";
import { dayLong } from "@/lib/format";
import { Ticket } from "@/components/Ticket";
import { useLive } from "@/components/Live";
import LocalTime from "@/components/LocalTime";
import HowToRead from "@/components/HowToRead";
import { gamePath, matchupPath } from "@/lib/teams";

const byTip = (ps) => [...ps].sort((a, b) => (a.start || "").localeCompare(b.start || "") || a.game.localeCompare(b.game));
const byStart = (gs) => [...gs].sort((a, b) => (a.start || "").localeCompare(b.start || ""));

function useNow() {
  const [now, setNow] = useState(null);
  useEffect(() => {
    const tick = () => setNow(Date.now());
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);
  return now;
}

function remain(ms) {
  const s = Math.max(0, Math.round(ms / 1000));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${sec}s`;
  return `${sec}s`;
}

function lockIso(start, minutes) {
  if (!start) return null;
  return new Date(Date.parse(start) - minutes * 60 * 1000).toISOString();
}

function namesOf(games) {
  const names = games.map((g) => `${g.away} at ${g.home}`);
  if (names.length <= 2) return names.join(" and ");
  return `${names[0]} and ${names.length - 1} other games`;
}

function GameName({ league, date, away, home }) {
  const href = gamePath(league, date, away, home);
  const label = `${away} at ${home}`;
  return href ? <a href={href}>{label}</a> : label;
}

function NextLock({ games, lockMinutes, now }) {
  const pending = byStart(games.filter((g) => !g.locked && !g.completed && g.start))
    .map((g) => ({ ...g, lockAt: lockIso(g.start, lockMinutes) }));
  if (!pending.length) return null;
  const nextAt = pending[0].lockAt;
  const batch = pending.filter((g) => g.lockAt === nextAt);
  const who = namesOf(batch);
  const when = <LocalTime iso={nextAt} />;
  const ms = now == null ? null : Date.parse(nextAt) - now;
  if (ms != null && ms <= 0) {
    return (
      <p className="lockline">
        The lock time for {who} has passed ({when}). Picks post here once {batch.length > 1 ? "those games lock" : "that game locks"}.
      </p>
    );
  }
  const verb = batch.length > 1 ? "picks lock" : "pick locks";
  const left = ms != null ? `in ${remain(ms)}, ` : "";
  return <p className="lockline">Next {verb} {left}at {when}: {who}.</p>;
}

function named(game) {
  return `${game.away} at ${game.home}`;
}

function GameBoard({ games, lockMinutes, date, picks }) {
  const covered = new Set(picks.map((p) => p.game));
  const ordered = byStart(games).filter((g) => !covered.has(named(g)));
  const pending = ordered.filter((g) => !g.locked && !g.completed);
  const posted = ordered.filter((g) => g.locked || g.completed);
  if (!ordered.length) return null;
  return (
    <div className="board">
      {pending.length > 0 && (
        <div>
          <h3 className="board-h">Still to lock</h3>
          <ul className="board-list">
            {pending.map((g) => (
              <li key={g.id}>
                <b><GameName league="NBA" date={date} away={g.away} home={g.home} /></b>
                <span className="status">Waiting</span>
                <span>Locks <LocalTime iso={lockIso(g.start, lockMinutes)} /></span>
                <span>Tips <LocalTime iso={g.start} /></span>
              </li>
            ))}
          </ul>
        </div>
      )}
      {posted.length > 0 && (
        <div>
          <h3 className="board-h">{posted.every((g) => !g.picks) ? "No pick" : "Locked"}</h3>
          <ul className="board-list">
            {posted.map((g) => (
              <li key={g.id} className="posted">
                <b><GameName league="NBA" date={date} away={g.away} home={g.home} /></b>
                <span className="status">{g.completed ? "Final" : g.picks ? `${g.picks} pick${g.picks === 1 ? "" : "s"} posted` : "No prop posted"}</span>
                <span>Tipped <LocalTime iso={g.start} /></span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function MailLink() {
  return <p className="mail-line"><a href="#join">Email me when picks lock</a></p>;
}

function NhlNote({ games, now, hasPick }) {
  const first = byStart(games.filter((g) => g.start))[0];
  if (!first || hasPick) return null;
  const when = <LocalTime iso={first.start} />;
  const who = `${first.away} at ${first.home}`;
  const ms = now == null ? null : Date.parse(first.start) - now;
  if (ms != null && ms <= 0) {
    return <p className="lockline">The first game has started ({when}, {who}), and no moneyline was posted for this slate.</p>;
  }
  const left = ms != null ? `in ${remain(ms)}, ` : "";
  return <p className="lockline">Picks lock before the first puck drop, {left}at {when}: {who}.</p>;
}

function NhlSlate({ games, now, date }) {
  const open = games.filter((g) => !g.pick);
  if (!open.length) return null;
  return (
    <ul className="board-list">
      {byStart(open).map((g) => {
        const started = now != null && g.start && Date.parse(g.start) <= now;
        return (
          <li key={g.id} className={started ? "posted" : ""}>
            <b><GameName league="NHL" date={date} away={g.away} home={g.home} /></b>
            <span className="status">{g.score ? `Final ${g.score}` : started ? "No pick" : "No pick yet"}</span>
            <span>Puck drop <LocalTime iso={g.start} /></span>
          </li>
        );
      })}
    </ul>
  );
}

export default function Today({ nbaDate, nhlDate, nbaGames, nbaPicks, nbaNext, nhlGames, lockMinutes }) {
  const [tab, setTab] = useState("nba");
  const now = useNow();
  const locked = nbaGames.filter((g) => g.locked).length;
  const nhlWithPicks = nhlGames.filter((g) => g.pick);
  const live = useLive(nbaPicks, nhlWithPicks.map((g) => ({ ...g.pick, start: g.start })));
  const nbaPending = nbaGames.some((g) => !g.locked && !g.completed);
  return (
    <section className="block tight wrap" id="today" aria-labelledby="today-h">
      <div className="head">
        <div>
          <h2 id="today-h">Today's picks</h2>
          <p className="lede">
            {tab === "nba"
              ? `${dayLong(nbaDate)}. Each game locks ${lockMinutes} minutes before tip, after the injury report.`
              : `${dayLong(nhlDate)}. NHL picks lock before the first puck drop.`}
          </p>
        </div>
        <div className="tabs" role="tablist" aria-label="League">
          <button role="tab" aria-selected={tab === "nba"} onClick={() => setTab("nba")}>NBA props</button>
          <button role="tab" aria-selected={tab === "nhl"} onClick={() => setTab("nhl")}>NHL moneylines</button>
        </div>
      </div>

      {tab === "nba" ? (
        <div role="tabpanel">
          <NextLock games={nbaGames} lockMinutes={lockMinutes} now={now} />
          {nbaPicks.length ? (
            <div className="cards">{byTip(nbaPicks).map((p) => <Ticket key={p.id} p={p} live={live} href={matchupPath("NBA", p.date, p.game)} />)}</div>
          ) : (
            <div className="empty">
              {!nbaGames.length
                ? `No NBA games today${nbaNext ? `. Next slate: ${dayLong(nbaNext)}.` : "."}`
                : locked
                  ? "No prop cleared the bar in the games priced so far. Passing is part of the plan."
                  : "No picks posted yet. They go up as each game locks."}
              <MailLink />
            </div>
          )}
          <GameBoard games={nbaGames} lockMinutes={lockMinutes} date={nbaDate} picks={nbaPicks} />
          {nbaPicks.length > 0 && nbaPending && <MailLink />}
        </div>
      ) : (
        <div role="tabpanel">
          {!nhlGames.length ? <div className="empty">No NHL games on this slate.<MailLink /></div> : (
            <>
              <NhlNote games={nhlGames} now={now} hasPick={nhlWithPicks.length > 0} />
              {nhlWithPicks.length > 0 && (
                <div className="cards">{nhlWithPicks.map((g) => <Ticket key={g.id} p={{ ...g.pick, start: g.start }} nhl live={live} href={gamePath("NHL", nhlDate, g.away, g.home)} />)}</div>
              )}
              <NhlSlate games={nhlGames} now={now} date={nhlDate} />
              {!nhlWithPicks.length && <MailLink />}
            </>
          )}
        </div>
      )}
      <HowToRead collapsed />
    </section>
  );
}
