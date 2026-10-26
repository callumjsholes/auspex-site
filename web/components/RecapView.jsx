import { dayLong, dayShort, odds, resultTone, signedMilli, units } from "@/lib/format";
import { recordText, shareText } from "@/lib/recap";

const TINY = "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";

export default function RecapView({ d, days }) {
  return (
    <div className="page wrap">
      <div className="intro">
        <h1>{dayLong(d.date)}</h1>
        <p className="lede">A recap is one day's graded picks: the record, the units, and each result.</p>
        <p className="lede">{recordText(d)}, {signedMilli(d.unitMilli)} units at the posted prices{d.open ? `. ${d.open} pick${d.open === 1 ? "" : "s"} from this slate still open` : ""}.</p>
      </div>
      <div className="recap">
        <picture className="recap-hero">
          <source media="(max-width: 600px)" srcSet={TINY} />
          <img className="recap-card" src={`/recap/${d.date}/card`} width="1080" height="1350" alt={`Recap card: ${shareText(d)}`} fetchPriority="high" />
        </picture>
        <ol className="recap-picks">
          {d.picks.map((p) => (
            <li key={p.id}>
              <div className="recap-row">
                <span><span className={"tag " + p.league.toLowerCase()}>{p.league}</span>{p.game}</span>
                <span className={resultTone(p.result)}>{p.result} {p.units == null ? "" : units(p.units)}</span>
              </div>
              <strong>{p.pick}</strong>
              <span className="muted">{odds(p.price)}{p.league === "NBA" ? ` at ${p.book}` : " median"}{p.actual != null ? ` · finished ${p.actual}` : ""}</span>
            </li>
          ))}
        </ol>
        <div>
          <h2 className="side-h">Other days</h2>
          <nav className="days" aria-label="Recap days">
            {days.slice(0, 30).map((x) => (
              <a key={x.date} href={`/recap/${x.date}`} aria-current={x.date === d.date ? "page" : undefined}>{dayShort(x.date)} · {recordText(x)}</a>
            ))}
          </nav>
        </div>
      </div>
    </div>
  );
}
