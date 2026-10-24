import { SITE } from "@/lib/site";

export const metadata = {
  title: "Terms of use",
  description: "Terms of use for auspexsports.com. Picks are information and entertainment, not betting advice.",
};

export default function Terms() {
  return (
    <div className="page wrap prose">
      <h1>Terms of use</h1>
      <p className="lede">Plain-language terms for using auspexsports.com.</p>
      <p className="updated">Last updated October 24, 2026.</p>

      <h2>Who I am</h2>
      <p>I'm Callum. I run Auspex Sports from Alberta, Canada. These terms cover auspexsports.com. Questions: <a href={`mailto:${SITE.email}`}>{SITE.email}</a>.</p>

      <h2>What the picks are</h2>
      <p>Picks are information and entertainment. They are not financial, betting, or investment advice, and they are not a recommendation that you bet. There is no guarantee of profit or of any result.</p>
      <p>I post a price before the game and grade the result at that price. Lines, injuries, and start times change. A pick can be late, missing, or wrong. Check the book before you act on one.</p>

      <h2>Past results</h2>
      <p>Past results don't predict future results. That includes the live record and every test on the site. Tests are labelled as tests. They are not the live record. A short sample swings a lot.</p>

      <h2>Who may use the site</h2>
      <p>Use the site only if you are old enough to bet where you live, and only if betting is legal for you there. That is generally 18+, 19+ in most of Canada, and 21+ in most of the United States. Some places set a different age, or ban betting. You are responsible for the rule that applies to you.</p>
      <p>I don't take bets. Nothing on this site is an offer to place one.</p>

      <h2>Responsible gambling</h2>
      <p>Bet only what you can afford to lose. If betting stops being fun, stop. Help is free and confidential.</p>
      <p>In Canada, ConnexOntario is 1-866-531-2600 (<a href="https://www.connexontario.ca/" rel="noopener">connexontario.ca</a>). Other provinces have their own lines.</p>
      <p>In the United States, call 1-800-GAMBLER (1-800-426-2537). The National Council on Problem Gambling is at <a href="https://www.ncpgambling.org/" rel="noopener">ncpgambling.org</a>.</p>

      <h2>No affiliation</h2>
      <p>I am not affiliated with the NBA, the NHL, any team, or any sportsbook, and none of them endorse this site. A book named on a pick is where that posted price was available. It is not a partnership.</p>

      <h2>The record</h2>
      <p>Live picks are graded at the posted price and book, juice included. A player prop is void, not a win or a loss, if the player doesn't play. Graded picks stay up. I don't delete them.</p>

      <h2>Limitation of liability</h2>
      <p>You use the site at your own risk. To the extent the law allows, I am not liable for betting losses or other decisions you make from the information here, including a wrong line, a missed game, or a site that is down. The site is provided as is. I don't warrant that it is accurate, complete, or available. Some places don't allow certain limits. Those limits apply only as far as they legally can.</p>
      <p>These terms are governed by the laws of Alberta and the federal laws of Canada that apply in Alberta.</p>

      <h2>Paid subscriptions (not active)</h2>
      <p>This section is not in effect. There is no paid subscription today. Picks on the site are free. There is no checkout, no charge, and no stored payment card. Joining the email list does not charge you and does not lock in a future price.</p>
      <p>If I open a paid tier later, I will update this section before anyone is billed. The update will state the price, the billing period, how to cancel, and how refunds work. Until that text is on this page, nothing on the site is a paid offer.</p>

      <h2>Changes</h2>
      <p>If I change these terms, I will change the date at the top. What the site collects is in the <a href="/privacy">privacy policy</a>.</p>
    </div>
  );
}
