"use client";
import { odds, timeET, resultLabel, resultTone, units as u } from "@/lib/format";
import { PriceShop } from "@/components/PriceShop";
import { LiveLine, liveView } from "@/components/Live";

// The pick card used on the home page and on a game page. Same markup in both places.
export function Ticket({ p, nhl, live, href }) {
  const done = p.result !== "Pending";
  const lv = done ? null : liveView(p, nhl, live);
  const status = lv ? (lv.label === "Final" ? "Final, grading" : "Live") : resultLabel(p.result);
  const game = href ? <a href={href}>{p.game}</a> : p.game;
  return (
    <article className={"ticket is-pick" + (nhl ? " nhl" : "") + (lv && lv.label === "Live" ? " is-live" : "")}>
      <div className="meta"><span>{game}{p.start ? `, ${timeET(p.start)}` : ""}</span><span className={"state " + (lv ? lv.tone : resultTone(p.result))}>{status}{done && p.units != null ? ` ${u(p.units)}` : ""}</span></div>
      <h3 className="call">{p.pick}</h3>
      <div className="price"><b>{odds(p.price)} <span>{nhl ? "median price" : `at ${p.book}`}</span></b><span>{p.actual != null ? (nhl ? `Final ${p.actual}` : `Finished with ${p.actual}`) : `${p.stake} unit${p.stake === 1 ? "" : "s"}`}</span></div>
      <PriceShop p={p} nhl={nhl} />
      {!done && <LiveLine p={p} nhl={nhl} live={live} />}
    </article>
  );
}
