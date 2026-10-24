import { pageMeta } from "@/lib/meta";
import { SITE } from "@/lib/site";

export const metadata = pageMeta({
  title: "Terms",
  description: "Terms of use for auspexsports.com.",
  path: "/terms",
});

export default function Terms() {
  return (
    <div className="page wrap prose">
      <h1>Terms</h1>
      <p className="lede">Plain-language terms for using auspexsports.com.</p>
      <p>These terms cover auspexsports.com, run by Auspex Sports. Questions: <a href={`mailto:${SITE.email}`}>{SITE.email}</a>.</p>
      <h2>What the picks are</h2>
      <p>Picks are information. They are not financial, betting or investment advice, and they are not a guarantee of profit. We post a price before the game and grade the result at that price. Past results, including every test on the site, don't guarantee future results.</p>
      <h2>Who may use the site</h2>
      <p>You must be old enough to bet where you live: 18+ generally, 19+ in most of Canada, 21+ in most of the United States. Bet only where it's legal for you, and only what you can afford to lose.</p>
      <h2>The record</h2>
      <p>Live picks are graded at the posted price and book. A player prop is void, not a win or a loss, if the player doesn't play. Graded picks are never deleted. Tests are labelled as tests and kept separate from the live record.</p>
      <h2>Price</h2>
      <p>Picks on the site are free while the live record is new. A paid tier may come later. Joining the email list doesn't charge you and doesn't promise a price.</p>
      <h2>No affiliation</h2>
      <p>We are not the NBA, the NHL or any sportsbook, and we are not endorsed by them.</p>
      <h2>The site can be wrong</h2>
      <p>Lines, injuries and start times change. A pick can be late, missing or mistaken. Check the book before you bet. We are not liable for decisions you make with the information.</p>
    </div>
  );
}
