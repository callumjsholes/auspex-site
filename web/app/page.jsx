import { getData } from "@/lib/data";
import { SITE } from "@/lib/site";
import { pct, record, signed, stamp, units, unitsFromMilli, dayShort, resultTone, odds } from "@/lib/format";
import { formatPct, headlineCents } from "@/lib/clv";
import Today from "@/components/Today";
import UnitsChart from "@/components/UnitsChart";
import Join from "@/components/Join";
import { matchupPath } from "@/lib/teams";

export default function Home() {
  const D = getData();
  const S = D.sum;
  const cents = headlineCents(D.clv, { nba: D.nba.length, nhl: D.nhl.length });
  const tape = D.all.filter((r) => r.result === "Won" || r.result === "Lost" || r.result === "Push").slice(0, 24);

  return (
    <>
      <section className="hero" aria-labelledby="hero-h">
        <div className="wrap hero-copy">
          <p className="kicker">Live record since {SITE.launch}</p>
          <h1 id="hero-h">Every pick posted before the game. Every result kept.</h1>
          <p className="deck">NBA player props and NHL moneylines, posted with the price and the book, then graded at that price.</p>
          <a className="btn bronze" href="#today">Today's picks</a>
        </div>
      </section>
      <section className="strip" aria-label="Live record">
        <div className="wrap strip-in">
          <div><b className="num">{record(S.all)}</b><span>Won–lost</span></div>
          <div><b className={"num " + (S.all.units > 0 ? "pos" : S.all.units < 0 ? "neg" : "")}>{S.all.bets ? unitsFromMilli(S.all.unitMilli) : "–"}</b><span>Units</span></div>
          <div><b className={"num " + (S.all.roi > 0 ? "pos" : S.all.roi < 0 ? "neg" : "")}>{S.all.roi != null ? `${signed(S.all.roi, 1)}%` : "–"}</b><span>ROI</span></div>
          <div><b className="num">{cents && cents.beat != null ? formatPct(cents.beat) : (S.all.clvN ? pct(S.all.beatClose) : "–")}</b><span>Beat the close</span></div>
          <a className="more" href="/record">Full record</a>
        </div>
        <p className="wrap strip-note">1 unit is 1% of a bankroll. NBA {S.nba.bets ? `${record(S.nba)}, ${unitsFromMilli(S.nba.unitMilli)}` : "not graded yet"}. NHL {S.nhl.bets ? `${record(S.nhl)}, ${unitsFromMilli(S.nhl.unitMilli)}` : "not graded yet"}.{D.generatedAt ? ` Updated ${stamp(D.generatedAt)}.` : ""}</p>
      </section>
      {tape.length > 0 && (
        <div className="tape">
          <div className="wrap tape-in" tabIndex={0} role="region" aria-label="Latest results. Scroll sideways for more.">
            <span className="tape-label">Latest</span>
            {tape.map((r) => (
              <a className="tick" key={r.id} href={matchupPath(r.league, r.date, r.game) || "/record"}>
                <span>{dayShort(r.date)}</span><b title={r.short}>{r.short}</b><span className="num">{odds(r.price)}</span>
                <span className={"r num " + resultTone(r.result)}>{r.result === "Push" ? "Push" : units(r.units)}</span>
              </a>
            ))}
          </div>
        </div>
      )}

      <Today nbaDate={D.nbaDate} nhlDate={D.nhlDate} nbaGames={D.nbaGames} nbaPicks={D.nbaToday} nbaNext={D.nbaNext}
             nhlGames={D.nhlToday} lockMinutes={D.lockMinutes} />

      <section className="block wrap" aria-labelledby="rec-h">
        <div className="head">
          <div>
            <h2 id="rec-h">Units, pick by pick</h2>
            <p className="lede">The running total after every graded pick, NBA and NHL together. Nothing is edited or removed.</p>
          </div>
          <a className="more" href="/record">See every pick</a>
        </div>
        <div className="panel"><UnitsChart points={D.curve} /></div>
        <p className="note">A small sample swings a lot. Closing-line value, whether the market moved toward the pick after it posted, is the steadier sign. Splits of this record are on <a href="/stats">stats</a>. Older tests are on the <a href="/method">method page</a>, and they are not this record.</p>
      </section>

      <section className="block wrap" id="games" aria-labelledby="next-h">
        <h2 id="next-h" className="side-h">Also</h2>
        <div className="routes">
          <a href="/nba"><b>NBA games</b><span>One page per game. The prop shows up after it locks.</span></a>
          <a href="/nhl"><b>NHL games</b><span>One page per game. Most games are a pass.</span></a>
          <a href="/method"><b>Method and tests</b><span>How a pick is posted. Tests are not this record.</span></a>
          <a href="/start"><b>Start here</b><span>How to read a card, and how the record is counted.</span></a>
        </div>
      </section>

      <Join />
    </>
  );
}
