import { SITE } from "@/lib/site";

export default function Footer() {
  return (
    <footer className="wrap">
      <div className="legal">
        <div>
          <h3>Play responsibly</h3>
          <p>Picks are information, not financial or betting advice. Past results, including tests, don't guarantee future results. Bet only what you can afford to lose, and only where it's legal for you: 18+, 19+ in most of Canada, 21+ in most US states.</p>
          <p>If betting stops being fun, help is free and confidential: 1-800-GAMBLER in the US, ConnexOntario 1-866-531-2600, or your provincial helpline.</p>
        </div>
        <div>
          <h3>The record</h3>
          <ul>
            <li><a href="/record">Every graded pick</a></li>
            <li><a href="/nba">NBA games</a></li>
            <li><a href="/nhl">NHL games</a></li>
            <li><a href="/method">Method and tests</a></li>
            <li><a href="/faq">FAQ</a></li>
          </ul>
        </div>
        <div>
          <h3>Auspex Sports</h3>
          <ul>
            <li><a href={`mailto:${SITE.email}`}>{SITE.email}</a></li>
            <li><a href={SITE.x} rel="noopener">{SITE.xHandle} on X</a></li>
            <li><a href="/terms">Terms</a></li>
            <li><a href="/privacy">Privacy</a></li>
          </ul>
        </div>
      </div>
      <div className="base">
        <span>© 2026 Auspex Sports</span>
        <span>Not affiliated with the NBA, the NHL or any sportsbook.</span>
      </div>
    </footer>
  );
}
