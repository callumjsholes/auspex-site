import Term from "@/components/Term";

// The short explainer next to Today's picks, also used on the start page.
export default function HowToRead({ level = "h3" }) {
  const Title = level;
  return (
    <aside className="howto" aria-labelledby="howto-h">
      <Title id="howto-h">How to read a pick</Title>
      <p>
        I put the bet, the price, and the book on each card.
        A price like <Term k="odds">−110</Term> is American odds: you risk $110 to win $100.{" "}
        <Term k="unit">1 unit</Term> is 1% of a bankroll.{" "}
        <Term k="over">Over</Term> means the player finishes above the line, and <Term k="under">under</Term> means below it.{" "}
        A <Term k="moneyline">moneyline</Term> is a bet on which team wins.
        NHL cards use the <Term k="median">median price</Term>.
        The <Term k="closing">closing line</Term> is the last price before the game.
        {" "}<a href="/faq">More answers</a>
      </p>
    </aside>
  );
}
