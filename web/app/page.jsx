import { getData } from "@/lib/data";
import { SITE } from "@/lib/site";
import { pct, record, stamp, units, unitsFromMilli, dayShort, resultTone, odds } from "@/lib/format";
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
        <div className="wrap hero-grid">
          <div>
            <p className="status"><i aria-hidden="true" />Live record since {SITE.launch}</p>
            <h1 id="hero-h">Every pick posted before the game. Every result kept.</h1>
            <p className="deck">NBA player props and NHL moneylines. Each one is posted before the game with the price and the book, then graded at that price.</p>
            <div className="ctas">
              <a className="btn bronze" href="#today">Today's picks</a>
              <a className="btn ghost" href="/record">The record</a>
              <a className="btn quiet" href="/stats">Stats</a>
            </div>
          </div>
          <aside className="ledger" aria-label="Live record">
            <h2>The live record</h2>
            <p className="sub">All graded picks since {SITE.launch}, at the posted price.</p>
            <div className="big">
              <div><b className="num">{record(S.all)}</b><span>Won–lost</span></div>
              <div><b className={"num " + (S.all.units > 0 ? "pos" : S.all.units < 0 ? "neg" : "")}>{S.all.bets ? unitsFromMilli(S.all.unitMilli) : "–"}</b><span>Units</span></div>
            </div>
            <p className="unit-note">1 unit = 1% of your bankroll.</p>
            <ul>
              <li><span><span className="tag nba">NBA</span>Player props</span><em>{S.nba.bets ? `${record(S.nba)}, ${pct(S.nba.roi, 1)} ROI` : "First picks lock tonight"}{S.nba.pending ? `, ${S.nba.pending} open` : ""}</em><strong className={"num " + (S.nba.units > 0 ? "pos" : S.nba.units < 0 ? "neg" : "")}>{S.nba.bets ? unitsFromMilli(S.nba.unitMilli) : "–"}</strong></li>
              <li><span><span className="tag nhl">NHL</span>Moneylines</span><em>{S.nhl.bets ? `${record(S.nhl)}, ${pct(S.nhl.roi, 1)} ROI` : "First picks lock on the next slate"}{S.nhl.pending ? `, ${S.nhl.pending} open` : ""}</em><strong className={"num " + (S.nhl.units > 0 ? "pos" : S.nhl.units < 0 ? "neg" : "")}>{S.nhl.bets ? unitsFromMilli(S.nhl.unitMilli) : "–"}</strong></li>
              <li><span>Beat the closing line</span><em>{cents && cents.beat != null ? `${cents.n} picks where the locked price was longer than the close` : "Share of picks where the market moved our way after posting"}</em><strong className="num">{cents && cents.beat != null ? formatPct(cents.beat) : (S.all.clvN ? pct(S.all.beatClose) : "–")}</strong></li>
            </ul>
            <div className="foot"><span>{D.generatedAt ? `Updated ${stamp(D.generatedAt)}` : ""}</span><a href="/record">Every pick</a></div>
          </aside>
        </div>
        {tape.length > 0 && (
          <div className="tape">
            <div className="wrap tape-in" tabIndex={0} role="region" aria-label="Latest results. Scroll sideways for more.">
              <span className="tape-label">Latest results</span>
              {tape.map((r) => (
                <a className="tick" key={r.id} href={matchupPath(r.league, r.date, r.game) || "/record"}>
                  <span>{dayShort(r.date)}</span><b title={r.short}>{r.short}</b><span>{odds(r.price)}</span>
                  <span className={"r " + resultTone(r.result)}>{r.result === "Push" ? "Push" : units(r.units)}</span>
                </a>
              ))}
            </div>
          </div>
        )}
      </section>

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
        <div className="head">
          <div>
            <h2 id="next-h">The rest of the site</h2>
            <p className="lede">Game pages, the posting rules, and a short tour if you are new.</p>
          </div>
        </div>
        <div className="routes">
          <a href="/nba"><span className="tag nba">NBA</span><b>Game pages</b><span>One page per game. The prop shows up after it locks.</span></a>
          <a href="/nhl"><span className="tag nhl">NHL</span><b>Game pages</b><span>One page per game. Most games are a pass.</span></a>
          <a href="/method"><b>Method and tests</b><span>How a pick is posted and graded. Tests are not the live record.</span></a>
          <a href="/start"><b>Start here</b><span>How to read a card, and how the record is counted.</span></a>
        </div>
      </section>

      <Join />
    </>
  );
}
