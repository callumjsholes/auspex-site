import { notFound } from "next/navigation";
import { findGame, datesFor, getCatalog, previewState, gameIntro, gameTitle, sportsEvent, finalText, gameStatus } from "@/lib/games";
import { eventBlurb, gamePreview, previewDescription } from "@/lib/previews";
import { dayMonthYear, timeET } from "@/lib/format";
import { SITE } from "@/lib/site";
import { pageMeta } from "@/lib/meta";
import GamePicks from "@/components/GamePicks";
import Join from "@/components/Join";

export default async function GameScreen({ league, params }) {
  const { date, slug } = await params;
  const game = findGame(league, date, slug);
  if (!game) notFound();
  const { lockMinutes } = getCatalog();
  const state = previewState(game);
  const preview = gamePreview(game);
  const ld = JSON.stringify(sportsEvent(game, eventBlurb(game))).replace(/</g, "\\u003c");
  const score = finalText(game);
  const others = (datesFor(league).find((d) => d.date === date)?.games || []).filter((g) => g.path !== game.path);
  const leaguePath = `/${league.toLowerCase()}`;

  return (
    <>
      <div className={"page wrap" + (state === "wait" ? " flush" : "")}>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: ld }} />
        <div className="intro">
          <p className="crumb">
            <a href={leaguePath}>{league} games</a>
            {" · "}
            <a href={`${leaguePath}/${date}`}>{dayMonthYear(date)}</a>
          </p>
          <h1>{game.awayNick} at {game.homeNick}</h1>
          <p className="lede">{gameIntro(game, lockMinutes)}</p>
          {state === "wait" && (
            <p className="note">When it locks, the pick goes up here, on <a href={SITE.x} rel="noopener">X</a>, and in the <a href="/#join">newsletter</a>.</p>
          )}
        </div>
        {score && <p className="final">{score}</p>}
        {game.picks.length > 0 ? (
          <section className="block tight" aria-labelledby="pick-h">
            <div className="head"><h2 id="pick-h">{game.picks.length > 1 ? "Picks" : "Pick"}</h2></div>
            <GamePicks picks={game.picks} nhl={league === "NHL"} />
          </section>
        ) : (
          <div className="empty">
            {state === "wait" ? "Nothing posted for this game yet." : "No pick on this game."}
          </div>
        )}
        <section className="preview" aria-labelledby="preview-h">
          <h2 id="preview-h">About this game</h2>
          {preview.paragraphs.map((text, i) => <p key={i}>{text}</p>)}
          <p className="rg">{preview.note}</p>
        </section>
        {others.length > 0 && (
          <section className="block" aria-labelledby="others-h">
            <div className="head"><h2 id="others-h">Other games this day</h2></div>
            <ul className="gamelist">
              {others.map((g) => {
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
          </section>
        )}
      </div>
      {state === "wait" && <Join />}
    </>
  );
}

export function gameStaticParams(league) {
  return getCatalog().games.filter((g) => g.league === league).map((g) => ({ date: g.date, slug: g.slug }));
}

export async function gameMetadata(league, params) {
  const { date, slug } = await params;
  const game = findGame(league, date, slug);
  if (!game) return {};
  const title = gameTitle(game);
  const description = previewDescription(game);
  return pageMeta({ title, description, path: game.path });
}
