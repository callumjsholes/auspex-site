import { RESPONSIBLE, SITE } from "@/lib/site";

export default function Footer() {
  return (
    <footer className="wrap">
      <div className="legal">
        <div>
          <h3>Play responsibly</h3>
          {RESPONSIBLE.map((text) => <p key={text}>{text}</p>)}
        </div>
        <div>
          <h3>On the site</h3>
          <ul>
            <li><a href="/#today">Today's picks</a></li>
            <li><a href="/nba">NBA games</a></li>
            <li><a href="/nhl">NHL games</a></li>
            <li><a href="/record">Every graded pick</a></li>
            <li><a href="/stats">Stats</a></li>
            <li><a href="/recap">Daily recap</a></li>
          </ul>
        </div>
        <div>
          <h3>Auspex Sports</h3>
          <ul>
            <li><a href="/start">Start here</a></li>
            <li><a href="/method">Method and tests</a></li>
            <li><a href="/faq">FAQ</a></li>
            <li><a href={`mailto:${SITE.email}`}>{SITE.email}</a></li>
            <li><a href={SITE.x} rel="noopener">{SITE.xHandle} on X</a></li>
            <li><a href="/terms">Terms of use</a></li>
            <li><a href="/privacy">Privacy policy</a></li>
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
