"use client";
import { odds, resultLabel, resultTone, units as u } from "@/lib/format";
import { PriceShop } from "@/components/PriceShop";
import { CloseLine } from "@/components/CloseLine";
import { LiveLine, liveView } from "@/components/Live";
import Term from "@/components/Term";
import LocalTime from "@/components/LocalTime";

const STAT_NAME = { pts: "points", reb: "rebounds", ast: "assists" };

function Call({ p, nhl }) {
  if (nhl) return <>{p.team} <Term k="moneyline">to win</Term></>;
  const verb = p.side === "Over" ? "over" : p.side === "Under" ? "under" : null;
  if (!verb || !p.player) return p.pick;
  return <>{p.player} <Term k={verb}>{verb}</Term> {p.line} {STAT_NAME[p.stat] || p.stat}</>;
}

// One pick card, on the home slate and on a game page.
export function Ticket({ p, nhl, live, href }) {
  const done = p.result !== "Pending";
  const lv = done ? null : liveView(p, nhl, live);
  const status = lv ? (lv.label === "Final" ? "Final, grading" : "Live") : resultLabel(p.result);
  const game = href ? <a href={href}>{p.game}</a> : p.game;
  return (
    <article className={"ticket is-pick" + (nhl ? " nhl" : "") + (lv && lv.label === "Live" ? " is-live" : "")}>
      <div className="meta">
        <span>{game}{p.start ? <>, <LocalTime iso={p.start} /></> : ""}</span>
        <span className={"state" + (done ? " mark" : "") + " " + (lv ? lv.tone : resultTone(p.result))}>{status}{done && p.units != null ? ` ${u(p.units)}` : ""}</span>
      </div>
      <h3 className="call"><Call p={p} nhl={nhl} /></h3>
      <div className="price">
        <b><Term k="odds">{odds(p.price)}</Term> <span>{nhl ? <Term k="median">median price</Term> : `at ${p.book}`}</span></b>
        <span>{p.actual != null
          ? (nhl ? `Final ${p.actual}` : `Finished with ${p.actual}`)
          : <>{p.stake} <Term k="unit">{p.stake === 1 ? "unit" : "units"}</Term></>}</span>
      </div>
      <PriceShop p={p} nhl={nhl} />
      <CloseLine p={p} />
      {!done && <LiveLine p={p} nhl={nhl} live={live} />}
    </article>
  );
}
