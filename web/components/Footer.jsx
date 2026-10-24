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
          <h3>The record</h3>
          <ul>
            <li><a href="/start">Start here</a></li>
            <li><a href="/record">Every graded pick</a></li>
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
