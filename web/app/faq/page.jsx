import { SITE } from "@/lib/site";

export const metadata = { title: "FAQ", description: "How Auspex Sports picks lock, how they're graded, and what a unit is." };

const QA = [
  ["When do picks lock?", "Each NBA prop locks about 50 minutes before that game's tip-off, after the injury report. NHL picks lock before the first puck drop of the day. Every pick shows its lock time in the raw data."],
  ["What is a unit?", "1 unit is 1% of your bankroll. NBA props are 1 unit each. NHL picks are 1 unit, or 2 for the strongest edges."],
  ["How are results graded?", "At the price and book the pick was posted at, juice included. Results stay up, win or lose. If a player doesn't play, the prop is void: not a win or a loss."],
  ["Why do you list a specific sportsbook?", "Prices differ between books, and the best one changes game to game. The pick is graded at the price posted, so the book tells you where that price was available."],
  ["What's closing-line value?", "Whether the market moved toward the pick after it posted. Over a few hundred picks it's a steadier sign of skill than wins and losses, which swing a lot in small samples."],
  ["Do the models update?", "Yes, every morning, with the previous night's games."],
  ["Is it free?", "Yes, while the live record builds. The email list will hear first if member alerts open."],
  ["Is this financial advice?", "No. Picks are information. Bet only what you can afford to lose, and only where it's legal for you."],
];

export default function Faq() {
  return (
    <div className="page wrap">
      <div className="intro">
        <h1>Questions</h1>
        <p className="lede">Short answers. Anything else: <a href={`mailto:${SITE.email}`}>{SITE.email}</a>.</p>
      </div>
      <dl className="faq prose" style={{ marginTop: 20 }}>
        {QA.map(([q, a]) => (<div key={q}><dt>{q}</dt><dd>{a}</dd></div>))}
      </dl>
    </div>
  );
}
