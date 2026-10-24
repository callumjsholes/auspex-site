import { SITE } from "@/lib/site";

export const metadata = {
  title: "Privacy policy",
  description: "What auspexsports.com collects: the Beehiiv email list, a visit counter, and host logs. No accounts and no analytics script.",
};

export default function Privacy() {
  return (
    <div className="page wrap prose">
      <h1>Privacy policy</h1>
      <p className="lede">What this site collects, and how to opt out or ask me to delete it.</p>
      <p className="updated">Last updated October 24, 2026.</p>

      <p>I'm Callum. I run Auspex Sports from Alberta, Canada. Contact: <a href={`mailto:${SITE.email}`}>{SITE.email}</a>.</p>
      <p>The site has no accounts, no log-in, and no payments. I don't sell personal information.</p>

      <h2>Email list</h2>
      <p>The signup form opens Beehiiv's subscribe page at auspexsports.beehiiv.com and puts the address you typed into that page's link, so Beehiiv can ask you to confirm it. I don't receive that form on this site, and I don't store the address here. Beehiiv stores it and sends the mail. <a href="https://www.beehiiv.com/privacy" rel="noopener">Beehiiv's privacy policy</a> applies to that.</p>
      <p>I use the list to send picks and news about Auspex Sports, including if a paid tier opens. I don't sell the list. Every email has an unsubscribe link. You can also email <a href={`mailto:${SITE.email}`}>{SITE.email}</a> and I will have the address removed.</p>

      <h2>Visit counter</h2>
      <p>On auspexsports.com and www.auspexsports.com, each page load sends one ping to a Cloudflare Worker I run, auspex-visits, at auspex-visits.callumjsholes.workers.dev. The ping is three fields: a random id, the page path, and the referrer. The path is the page name only, not the query string. The referrer is the previous page's address, if your browser sends one.</p>
      <p>I use the counter to tally unique visitors by day, plus country and referrer. The page does not send your name, your email, or a country. Cloudflare can tell the country from the connection. As with any request to a server, that connection includes an IP address. The page does not read the IP. The counter is not tied to the email list. I don't use it to advertise to you.</p>
      <p>The script does not use cookies. It does not run on preview or local copies of the site. It runs only on those two host names. The site does not display a visitor count.</p>
      <p>The id is stored in this browser's local storage as auspex_vid. To stop the pings, add ?nocount=1 to any address on the site. That stores auspex_nocount in local storage and sends nothing further from this browser. Add ?count=1 to remove that flag and turn counting back on. Opting out leaves auspex_vid in place. Clear site data for auspexsports.com to remove both keys.</p>

      <h2>Hosting</h2>
      <p>Vercel hosts the site. Vercel may keep ordinary server logs for a request, such as the IP address, the browser, and the page asked for. I don't keep a separate copy of those logs. <a href="https://vercel.com/legal/privacy-notice" rel="noopener">Vercel's privacy notice</a> covers them.</p>
      <p>The app does not load Vercel Web Analytics, Speed Insights, Google Analytics, or any other analytics script. The only script is the visit counter above. <a href="https://www.cloudflare.com/privacypolicy/" rel="noopener">Cloudflare's privacy policy</a> covers the worker.</p>

      <h2>Live scores</h2>
      <p>While a picked game is starting or in progress, and this tab is visible, the page asks this site for the public box score. The server reads that from ESPN for NBA games and from the NHL's public API. The request sends a game id and, for NBA, a player id. It does not send the visit id or your email.</p>

      <h2>X</h2>
      <p>The site links to <a href={SITE.x} rel="noopener">{SITE.xHandle} on X</a>. It does not embed X posts, and it does not load X's widgets. If you follow a link to X, <a href="https://x.com/en/privacy" rel="noopener">X's privacy policy</a> applies there.</p>

      <h2>Cookies and local storage</h2>
      <p>This site does not set cookies. It uses local storage for two keys, both for the visit counter: auspex_vid, the random id, and auspex_nocount, which is 1 if you opted out. Beehiiv may set its own cookies on Beehiiv's site after you leave to confirm an email. I don't control those.</p>

      <h2>How long I keep it</h2>
      <p>auspex_vid stays in your browser until you clear it. I keep the counter so I can see daily unique visitors, country, and referrer. The site has no fixed deletion date for that tally. Email me if you want the id from this browser removed, and I will delete what I can still match.</p>
      <p>Beehiiv keeps an email address until you unsubscribe or I remove it. Vercel keeps host logs on its own schedule.</p>

      <h2>Access, correction, and deletion</h2>
      <p>Email <a href={`mailto:${SITE.email}`}>{SITE.email}</a> to ask what I hold about you, to correct it, or to delete it. That covers a visit id and, if you joined, the email list. I will respond. Asking does not change what you can read here. There is no account to close.</p>
      <p>I collect only what this page describes, and I use it for the reasons given here. In Canada, those requests sit under PIPEDA and, in Alberta, the Personal Information Protection Act. If you are in California, the same email is how you ask for access, correction, or deletion under the CCPA. I do not sell personal information, and I do not share it for cross-context behavioural advertising.</p>
      <p>Beehiiv, Vercel, and Cloudflare process data for the site. They operate in the United States and in other countries, so information may be handled outside Canada.</p>

      <h2>Children</h2>
      <p>The site is not for anyone under the betting age where they live. I don't knowingly collect information from children.</p>

      <h2>Changes</h2>
      <p>If I collect something new, I will update this page and the date at the top. How the picks may be used is in the <a href="/terms">terms of use</a>.</p>
    </div>
  );
}
