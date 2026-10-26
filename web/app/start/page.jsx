import HowToRead from "@/components/HowToRead";
import { getData } from "@/lib/data";
import { pageMeta } from "@/lib/meta";
import { recordSentence } from "@/lib/recordText";
import { RESPONSIBLE, SITE } from "@/lib/site";

export const metadata = pageMeta({
  title: "Start here",
  description: "What Auspex Sports is, how to read a pick, and how the live record is kept.",
  path: "/start",
});

export default function Start() {
  const s = getData().sum.all;
  return (
    <div className="page wrap prose start">
      <h1>Start here</h1>
      <p className="lede">A short tour if you are new. The page to share is auspexsports.com/start.</p>

      <h2>What this is</h2>
      <p>Auspex Sports posts NBA player props and NHL moneylines before the game. Each card has the bet, the price, and the book. I grade the pick at that posted price, and I leave it up.</p>
      <p>The live record is only those graded picks. {recordSentence(s, { launch: SITE.launch })}</p>
      <p><a href="/#today">Today's picks</a> · <a href="/record">The full record</a></p>

      <HowToRead level="h2" />

      <h2>How the record is tracked</h2>
      <p>A win, a loss, or a push is graded at the price on the card. One unit is 1% of a bankroll. Closing-line value is how far the market moved toward the pick after I posted it.</p>
      <p>The <a href="/method">method page</a> shows tests on older games. A test is not the live record. Nothing on that page is added into the record above.</p>

      <h2>Play responsibly</h2>
      {RESPONSIBLE.map((p) => <p key={p}>{p}</p>)}
    </div>
  );
}
