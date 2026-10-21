import { SITE } from "@/lib/site";

export const metadata = { title: "Privacy", description: "What auspexsports.com collects, and how to opt out." };

export default function Privacy() {
  return (
    <div className="page wrap prose">
      <h1>Privacy</h1>
      <p className="lede">A draft for the owner to review; not a lawyer's document.</p>
      <p>Auspex Sports runs auspexsports.com. Contact: <a href={`mailto:${SITE.email}`}>{SITE.email}</a>.</p>
      <h2>Email list</h2>
      <p>The site has no accounts and no log-in. If you join the email list, your address is collected and stored by Beehiiv, our email service, and Beehiiv's privacy policy applies to it.</p>
      <h2>What the address is used for</h2>
      <p>Sending picks and news about Auspex Sports, including whether a paid tier opens. The list is never sold.</p>
      <h2>Hosting</h2>
      <p>The site is hosted on Vercel, which may keep ordinary server logs such as the IP address of a request.</p>
      <h2>How to leave</h2>
      <p>Every email has an unsubscribe link, or email <a href={`mailto:${SITE.email}`}>{SITE.email}</a> to be removed.</p>
    </div>
  );
}
