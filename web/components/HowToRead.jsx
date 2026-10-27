import Term from "@/components/Term";

function Body() {
  return (
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
  );
}

// The short explainer next to Today's picks, also used on the start page.
// Collapsed on the home slate so the picks stay first.
export default function HowToRead({ level = "h3", collapsed = false }) {
  const Title = level;
  if (collapsed) {
    return (
      <details className="howto howto-fold">
        <summary><Title id="howto-h">How to read a pick</Title></summary>
        <div className="howto-body"><Body /></div>
      </details>
    );
  }
  return (
    <aside className="howto" aria-labelledby="howto-h">
      <Title id="howto-h">How to read a pick</Title>
      <Body />
    </aside>
  );
}
