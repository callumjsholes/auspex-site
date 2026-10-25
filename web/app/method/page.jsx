import { getData } from "@/lib/data";
import { signed } from "@/lib/format";
import { pageMeta } from "@/lib/meta";

export const metadata = pageMeta({
  title: "Method",
  description: "How Auspex Sports posts and grades picks, and how the models performed on games they never saw.",
  path: "/method",
});

export default function Method() {
  const D = getData();
  const tone = (v) => (String(v).trim().startsWith("+") ? "pos" : /^[-−]/.test(String(v).trim()) ? "neg" : "");
  const h = D.nhlTest;
  return (
    <div className="page wrap">
      <div className="intro">
        <h1>Method</h1>
        <p className="lede">The models are private. What's public is how picks are posted and graded, and how each model did on games it never saw before launch.</p>
      </div>

      <section className="block" aria-labelledby="rules-h">
        <div className="head"><h2 id="rules-h">The rules</h2></div>
        <div className="cols3">
          <div><h3>Posted before the game</h3><p>Every pick locks before tip-off or puck drop, with a timestamp, the price and the book. Nothing is added after the fact.</p></div>
          <div><h3>Graded at the posted price</h3><p>Results use the price that was posted, juice included. A prop is void if the player doesn't play. Nothing is edited or deleted.</p></div>
          <div><h3>Checked against the close</h3><p>The closing price is logged before every game. Beating it over hundreds of picks is the clearest sign the edge is real.</p></div>
        </div>
      </section>

      <section className="block" aria-labelledby="nba-h">
        <div className="head"><div><h2 id="nba-h">NBA player props: the test</h2><p className="lede">Points, rebounds and assists, 1 unit per pick. Tested on 2025-26 games the model never saw, against real sportsbook prices.</p></div></div>
        {D.nbaHeadline.length > 0 && (
          <div className="kpis">{D.nbaHeadline.map((s) => <div key={s.k}><b className="num">{s.v}</b><span>{s.k}</span></div>)}</div>
        )}
        {D.nbaBooks && (
          <div className="tablewrap spaced"><table>
            <caption>Same bets, different sportsbooks. The 95% range shows how much luck is still in a sample this size.</caption>
            <thead><tr><th>Where you bet</th><th className="r">Bets</th><th className="r">ROI</th><th className="r">95% range</th></tr></thead>
            <tbody>{D.nbaBooks.rows.map((r) => <tr key={r[0]}><td>{r[0]}</td><td className="r num">{r[1]}</td><td className={"r num " + tone(r[2])}>{r[2]}</td><td className="r num muted">{r[3]}</td></tr>)}</tbody>
          </table></div>
        )}
      </section>

      {h && (
        <section className="block" aria-labelledby="nhl-h">
          <div className="head"><div><h2 id="nhl-h">NHL moneylines: the test</h2><p className="lede">Four seasons, each priced only from games before it.</p></div></div>
          <div className="kpis">
            <div><b className="num">{h.total.bets.toLocaleString()}</b><span>Bets over {h.total.games.toLocaleString()} games</span></div>
            <div><b className="num pos">{signed(h.total.units, 1)}u</b><span>Units won</span></div>
            <div><b className="num">{signed(h.total.roi, 1)}%</b><span>ROI, 95% range {h.total.ci[0]}% to +{h.total.ci[1]}%</span></div>
            <div><b className="num">{h.total.max_drawdown}u</b><span>Deepest drop from a peak</span></div>
          </div>
          <div className="tablewrap spaced"><table>
            <thead><tr><th>Season</th><th className="r">Units</th><th className="r">ROI</th></tr></thead>
            <tbody>{h.rows.map((r) => <tr key={r.season}><td>{r.season}</td><td className="r num">{signed(r.units, 1)}</td><td className={"r num " + (r.roi >= 0 ? "pos" : "neg")}>{signed(r.roi, 1)}%</td></tr>)}</tbody>
          </table></div>
        </section>
      )}

      <section className="block prose" aria-labelledby="terms-h">
        <h2 id="terms-h">Terms used on this site</h2>
        <dl className="faq">
          <dt>Unit</dt><dd>1% of bankroll. NBA props are 1 unit each. NHL picks are 1 or 2 units.</dd>
          <dt>ROI</dt><dd>Units won divided by units staked.</dd>
          <dt>Closing-line value (CLV)</dt><dd>How far the market moved toward the pick between posting and the last price before the game, in percentage points.</dd>
          <dt>Out of sample</dt><dd>Games the model never saw while it was being built.</dd>
        </dl>
      </section>
    </div>
  );
}
