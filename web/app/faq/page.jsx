import { getData } from "@/lib/data";
import { pageMeta } from "@/lib/meta";
import { SITE } from "@/lib/site";
import { TERMS } from "@/lib/terms";

export const metadata = pageMeta({
  title: "FAQ",
  description: "How Auspex Sports picks lock, how they're graded, and what a unit, a moneyline, and American odds mean.",
  path: "/faq",
});

export default function Faq() {
  const lock = getData().lockMinutes;
  const QA = [
    ["When do picks lock?", `Each NBA prop locks ${lock} minutes before that game's tip-off, after the injury report. NHL picks lock before the first puck drop of the day. On the home page, a game that is still waiting shows its lock time in your time zone.`],
    [TERMS.unit.q, TERMS.unit.a],
    [TERMS.odds.q, TERMS.odds.a],
    [TERMS.moneyline.q, TERMS.moneyline.a],
    [TERMS.over.q, TERMS.over.a],
    ["How are results graded?", "At the price and book the pick was posted at, juice included. Results stay up, win or lose. If a player doesn't play, the prop is void: not a win or a loss."],
    ["Why do you list a specific sportsbook?", "Prices differ between books, and the best one changes game to game. The pick is graded at the price posted, so the book tells you where that price was available."],
    ["What's closing-line value?", "How many cents the locked price beat the closing median by. One cent is one percentage point of implied probability. Over a few hundred picks it is a steadier sign than wins and losses, which swing a lot in a small sample."],
    ["Do the models update?", "Yes, every morning, with the previous night's games."],
    ["Is it free?", "Yes, while the live record builds. The email list will hear first if member alerts open."],
    ["Is this financial advice?", "No. Picks are information. Bet only what you can afford to lose, and only where it's legal for you."],
  ];
  return (
    <div className="page wrap">
      <div className="intro">
        <h1>Questions</h1>
        <p className="lede">Short answers. Anything else: <a href={`mailto:${SITE.email}`}>{SITE.email}</a>.</p>
      </div>
      <dl className="faq prose">
        {QA.map(([q, a]) => (<div key={q}><dt>{q}</dt><dd>{a}</dd></div>))}
      </dl>
    </div>
  );
}
