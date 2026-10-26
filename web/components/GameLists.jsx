import { getCatalog, datesFor, gameStatus, dateBlurb } from "@/lib/games";
import { dayLongYear, dayTitle, timeET, stamp } from "@/lib/format";
import { pageMeta } from "@/lib/meta";

function GameLinks({ games }) {
  if (!games.length) return <p className="note">Nothing on the current slate.</p>;
  return (
    <div className="slate">
      {games.map((g) => (
        <a key={g.path} className={g.picks.length ? "on" : ""} href={g.path}>
          {g.away} at {g.home}{g.start ? `, ${timeET(g.start)}` : ""}
        </a>
      ))}
    </div>
  );
}

export function GameDirectory() {
  const { games, nbaDate, nhlDate } = getCatalog();
  const nba = games.filter((g) => g.league === "NBA" && g.date === nbaDate);
  const nhl = games.filter((g) => g.league === "NHL" && g.date === nhlDate);
  return (
    <section className="block wrap" id="games" aria-labelledby="games-h">
      <div className="head">
        <div>
          <h2 id="games-h">Game pages</h2>
          <p className="lede">Each matchup has a page. I add the pick there after it locks, with the price and the book.</p>
        </div>
      </div>
      <h3 className="subhead"><a href="/nba">NBA</a></h3>
      <GameLinks games={nba} />
      <h3 className="subhead"><a href="/nhl">NHL</a></h3>
      <GameLinks games={nhl} />
    </section>
  );
}

export function LeagueIndex({ league }) {
  const { lockMinutes, nbaNext, generatedAt } = getCatalog();
  const dates = datesFor(league);
  const nextLabel = league === "NBA" && nbaNext && !dates.some((d) => d.date === nbaNext) ? dayLongYear(nbaNext) : null;
  return (
    <div className="page wrap">
      <div className="intro">
        <h1>{league} games</h1>
        <p className="lede">
          {league === "NBA"
            ? `One page per game on the slate. The prop, if there is one, posts about ${lockMinutes} minutes before tip with the price and the book. Older pages are games that had a pick.`
            : "One page per game on the current slate, plus earlier games that had a posted moneyline. Picks lock before the first puck drop. Most games are a pass."}
        </p>
      </div>
      {dates.length === 0 && <p className="empty">No games in the public data yet.</p>}
      <ul className="datelist">
        {dates.map((d) => {
          const withPicks = d.games.filter((g) => g.picks.length).length;
          return (
            <li key={d.date}>
              <a href={`/${league.toLowerCase()}/${d.date}`}>
                <span>{dayLongYear(d.date)}</span>
                <span className="count">{`${d.games.length} ${d.games.length === 1 ? "game" : "games"}${withPicks ? `, ${withPicks} with ${withPicks === 1 ? "a pick" : "picks"}` : ""}`}</span>
              </a>
            </li>
          );
        })}
      </ul>
      {nextLabel && <p className="note">The next slate is {nextLabel}. Matchups for that day aren't published yet.</p>}
      {generatedAt && <p className="note">Updated {stamp(generatedAt)}.</p>}
    </div>
  );
}

export function DateIndex({ league, date }) {
  const days = datesFor(league);
  const day = days.find((d) => d.date === date);
  if (!day) return null;
  return (
    <div className="page wrap">
      <div className="intro">
        <p className="crumb"><a href={`/${league.toLowerCase()}`}>{league} games</a></p>
        <h1>{league} games, {dayLongYear(date)}</h1>
        <p className="lede">Start times are Eastern Time. A pick shows up here only after it has locked and been published.</p>
      </div>
      <ul className="gamelist">
        {day.games.map((g) => {
          const status = gameStatus(g);
          return (
            <li key={g.path}>
              <a href={g.path}>
                <span className="match">{g.awayNick} at {g.homeNick}</span>
                <span className="when">{g.start ? timeET(g.start) : "Time not posted"}</span>
                <span className={"gstatus " + status.tone}>{status.text}</span>
              </a>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function social(title, description, path) {
  return pageMeta({ title, description, path });
}

export function leagueMetadata(league) {
  const { lockMinutes } = getCatalog();
  const path = `/${league.toLowerCase()}`;
  const title = league === "NBA" ? "NBA game previews and player props" : "NHL game previews and moneylines";
  const description = league === "NBA"
    ? `NBA games with the player prop once it locks, about ${lockMinutes} minutes before tip. Graded at the posted price.`
    : "NHL games with the moneyline once it locks, before the first puck drop. Graded at the posted price.";
  return social(title, description, path);
}

export function dateStaticParams(league) {
  return datesFor(league).map((d) => ({ date: d.date }));
}

export async function dateMetadata(league, params) {
  const { date } = await params;
  const day = datesFor(league).find((d) => d.date === date);
  if (!day) return {};
  const { lockMinutes } = getCatalog();
  return social(`${league} games - ${dayTitle(date)}`, dateBlurb(league, date, day.games, lockMinutes), `/${league.toLowerCase()}/${date}`);
}
