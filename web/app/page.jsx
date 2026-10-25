import { getData } from "@/lib/data";
import { SITE } from "@/lib/site";
import { pct, record, signed, stamp, units, unitsFromMilli, dayShort, resultTone, odds } from "@/lib/format";
import Today from "@/components/Today";
import UnitsChart from "@/components/UnitsChart";
import Join from "@/components/Join";
import { GameDirectory } from "@/components/GameLists";
import { matchupPath } from "@/lib/teams";

export default function Home() {
  const D = getData();
  const S = D.sum;
  const tape = D.all.filter((r) => r.result === "Won" || r.result === "Lost" || r.result === "Push").slice(0, 24);
  const nbaTest = D.nbaHeadline?.[0];
  const nhlT = D.nhlTest?.total;

  return (
    <>
      <section className="hero" aria-labelledby="hero-h">
        <div className="wrap hero-grid">
          <div>
            <p className="status"><i aria-hidden="true" />Live record since {SITE.launch}</p>
            <h1 id="hero-h">Every pick posted before the game. Every result kept.</h1>
            <p className="deck">Auspex posts NBA player props and NHL moneylines from its own pricing models. Each pick goes up before tip-off or puck drop with the price and the book, and is graded at that price, win or lose.</p>
            <div className="ctas">
              <a className="btn bronze" href="#today">See today's picks</a>
              <a className="btn ghost" href="/start">Start here</a>
              <a className="btn quiet" href="/record">Full record</a>
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
              <li><span>Beat the closing line</span><em>Share of picks where the market moved our way after posting</em><strong className="num">{S.all.clvN ? pct(S.all.beatClose) : "–"}</strong></li>
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

      <GameDirectory />

      <section className="block wrap" aria-labelledby="rec-h">
        <div className="head">
          <div>
            <h2 id="rec-h">The record, pick by pick</h2>
            <p className="lede">Units won or lost after every graded pick, NBA and NHL together. Nothing is edited or removed.</p>
          </div>
          <a className="more" href="/record">See every pick</a>
        </div>
        <div className="split">
          <div className="panel"><UnitsChart points={D.curve} /></div>
          <div>
            <div className="stats">
              <div className="stat"><b className="num">{record(S.all)}</b><span>Record</span></div>
              <div className="stat"><b className={"num " + (S.all.roi > 0 ? "pos" : S.all.roi < 0 ? "neg" : "")}>{S.all.roi != null ? `${signed(S.all.roi, 1)}%` : "–"}</b><span>ROI at the posted price</span></div>
              <div className="stat"><b className="num">{S.all.staked ? S.all.staked.toFixed(0) : "0"}u</b><span>Staked</span></div>
              <div className="stat"><b className="num">{S.all.avgClv != null ? signed(S.all.avgClv, 2) : "–"}</b><span>Average closing-line value, points</span></div>
            </div>
            <p className="note">A small sample swings a lot. Closing-line value, whether the market moved toward the pick after it posted, is the steadier sign of an edge.</p>
          </div>
        </div>
      </section>

      <section className="block wrap" aria-labelledby="how-h">
        <div className="head"><div><h2 id="how-h">How a pick gets made</h2></div><a className="more" href="/method">Read the method</a></div>
        <ol className="steps">
          <li><h3>Price the game</h3><p>Private models put a price on every NBA player prop and NHL moneyline on the slate, updated each morning with the previous night's games.</p></li>
          <li><h3>Compare to the books</h3><p>That price is checked against every major sportsbook. A pick needs real value at a price you can actually bet. Most games are a pass.</p></li>
          <li><h3>Post it and grade it</h3><p>The pick locks before the game with a timestamp, the price and the book. It's graded at that price, and the closing line is logged.</p></li>
        </ol>
      </section>

      <section className="block wrap" aria-labelledby="test-h">
        <div className="head"><div><h2 id="test-h">Tested before launch</h2><p className="lede">Both models were tested on games they never saw. These are tests, not the live record.</p></div></div>
        <div className="tests">
          <div className="panel">
            <h3><span className="tag nba">NBA</span>Player props, 2025-26</h3>
            <div className="fig num pos">{nbaTest ? nbaTest.v : "–"}</div>
            <p>{nbaTest ? `${nbaTest.k}. A promising test, but the live record is what counts.` : ""}</p>
          </div>
          <div className="panel">
            <h3><span className="tag nhl">NHL</span>Moneylines, 2022-23 to 2025-26</h3>
            <div className="fig num pos">{nhlT ? `${signed(nhlT.roi, 1)}%` : "–"}</div>
            <p>{nhlT ? `ROI on ${nhlT.bets.toLocaleString()} bets over ${nhlT.games.toLocaleString()} games, ${signed(nhlT.units, 1)} units.` : ""}</p>
          </div>
        </div>
      </section>

      <Join />
    </>
  );
}
