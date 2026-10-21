import { SITE } from "@/lib/site";

// Posts to the Beehiiv subscribe page, which confirms the address and sends the welcome note.
export default function Join() {
  return (
    <section className="join" id="join" aria-labelledby="join-h">
      <div className="wrap join-in">
        <div>
          <h2 id="join-h">Get every pick when it locks.</h2>
          <p>Every pick is free on this site while the live record builds. The email list gets each slate as it posts, and first word when member alerts open. Nothing is charged.</p>
        </div>
        <form className="signup" action={SITE.subscribe} method="get" target="_top">
          <label htmlFor="join-email" className="skip">Email address</label>
          <input id="join-email" type="email" name="email" placeholder="you@example.com" autoComplete="email" required />
          <button className="btn bronze" type="submit">Join the list</button>
          <small>Opens our Beehiiv page to confirm. Unsubscribe any time.</small>
        </form>
      </div>
    </section>
  );
}
