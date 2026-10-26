"use client";

import { useRef, useState } from "react";
import { SITE } from "@/lib/site";

const FORM_PAGE = `https://subscribe-forms.beehiiv.com/${SITE.subscribeForm}`;
const SUBMIT_URL = "https://subscribe-forms.beehiiv.com/api/submit";

function validEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

// Posts to the existing Beehiiv form (no API key). The reply renders in the frame below.
export default function Join() {
  const emailRef = useRef(null);
  const frameRef = useRef(null);
  const [status, setStatus] = useState("idle");
  const [message, setMessage] = useState("");

  async function onSubmit(e) {
    e.preventDefault();
    const email = emailRef.current?.value.trim() || "";
    if (!validEmail(email)) {
      setStatus("error");
      setMessage("Enter a full email address, like you@example.com.");
      emailRef.current?.focus();
      return;
    }
    setStatus("sending");
    setMessage("Sending…");
    try {
      const res = await fetch(FORM_PAGE, { cache: "no-store" });
      if (!res.ok) throw new Error("form");
      const html = await res.text();
      const token = html.match(/name="authenticity_token" value="([^"]+)"/)?.[1];
      const formId = html.match(/name="form_id"[^>]*value="([^"]+)"/)?.[1] || SITE.subscribeForm;
      if (!token) throw new Error("token");
      const form = document.createElement("form");
      form.method = "POST";
      form.action = SUBMIT_URL;
      form.target = "beehiiv-reply";
      form.acceptCharset = "UTF-8";
      const fields = {
        authenticity_token: token,
        form_id: formId,
        utm_source: "auspexsports.com",
        utm_medium: "site",
        utm_campaign: "",
        referrer: window.location.href,
        "form[email]": email,
      };
      for (const [name, value] of Object.entries(fields)) {
        const input = document.createElement("input");
        input.type = "hidden";
        input.name = name;
        input.value = value;
        form.appendChild(input);
      }
      document.body.appendChild(form);
      form.submit();
      form.remove();
      setStatus("sent");
      setMessage("Sent. Beehiiv's reply is in the box below. If it says you're on the list, a welcome email is on its way. If it shows an error, the address was not added.");
    } catch {
      setStatus("error");
      setMessage("I couldn't reach the list just now. You can join on the Beehiiv page instead.");
    }
  }

  return (
    <section className="join" id="join" aria-labelledby="join-h">
      <div className="wrap join-in">
        <div>
          <h2 id="join-h">Get the picks by email.</h2>
          <p>I'll email you about Auspex picks and news. Nothing is charged, and every note has an unsubscribe link.</p>
        </div>
        <form className="signup" onSubmit={onSubmit} noValidate>
          <label htmlFor="join-email">Email</label>
          <input
            id="join-email"
            ref={emailRef}
            type="email"
            name="email"
            placeholder="you@example.com"
            autoComplete="email"
            required
            aria-invalid={status === "error"}
            aria-describedby="join-note"
          />
          <button className="btn bronze" type="submit" disabled={status === "sending"}>
            {status === "sending" ? "Sending…" : "Join the list"}
          </button>
          <p id="join-note" className={"form-msg" + (status === "error" ? " is-error" : status === "sent" ? " is-sent" : "")} role={status === "error" ? "alert" : "status"}>
            {message || "Beehiiv stores the address and sends the mail."}
          </p>
          {status === "error" && (
            <p className="form-msg"><a href={SITE.subscribe}>Open the Beehiiv page</a></p>
          )}
            <iframe
            ref={frameRef}
            name="beehiiv-reply"
            title="Beehiiv reply"
            className={"join-reply" + (status === "sent" ? " on" : "")}
          />
        </form>
      </div>
    </section>
  );
}
