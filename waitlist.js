/* Renders the email list from window.AUSPEX.waitlist in content.js.
   Beehiiv is the live provider. The box is on this page. Submitting it opens
   Beehiiv's subscribe page in this tab, with the address in the link.
   That page adds the address and sends the welcome note.
   The embed iframe is not loaded. It does not show up on iPhone Safari.
   One form, in #access-waitlist. Other spots are links to #waitlist.
   workerUrl, if set, is tried first. Any failure still opens the subscribe page.
   There is no mailto form. hello@auspexsports.com stays a contact link. */
(function () {
  const cfg = () => (window.AUSPEX && window.AUSPEX.waitlist) || {};
  const words = () => (window.AUSPEX && window.AUSPEX.email) || {};

  function el(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text != null) node.textContent = text;
    return node;
  }

  function subscribePage(c) {
    if (c.subscribePage) return c.subscribePage;
    const base = String(c.subscribeUrl || "https://auspexsports.beehiiv.com").replace(/\/$/, "");
    return base + "/subscribe";
  }

  function pageWithEmail(page, email) {
    const url = new URL(page, window.location.href);
    url.searchParams.set("email", email);
    if (!url.searchParams.get("utm_source")) url.searchParams.set("utm_source", "auspexsports.com");
    return url.href;
  }

  function subscribeLine(strong) {
    const c = cfg();
    const w = words();
    const p = el("p", strong ? "form-note form-fallback" : "form-note");
    if (strong && w.failed) p.append(document.createTextNode(w.failed + " "));
    p.append(document.createTextNode((w.or || "Or subscribe at") + " "));
    const a = el("a", "", c.subscribeHost || "auspexsports.beehiiv.com");
    a.href = c.subscribeUrl || "https://auspexsports.beehiiv.com";
    p.append(a, document.createTextNode("."));
    return p;
  }

  function emailInput(host) {
    const input = document.createElement("input");
    input.type = "email";
    input.required = true;
    input.placeholder = "you@example.com";
    input.autocomplete = "email";
    input.setAttribute("autocapitalize", "none");
    input.setAttribute("autocorrect", "off");
    input.spellcheck = false;
    input.setAttribute("inputmode", "email");
    input.id = host.id + "-email";
    return input;
  }

  function postWorker(url, email) {
    const body = new URLSearchParams();
    body.set("email", email);
    const timer = new AbortController();
    const timeout = window.setTimeout(() => timer.abort(), 8000);
    return fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: body.toString(),
      signal: timer.signal
    }).then((res) => (res.ok ? res.json() : null)).then((data) => !!(data && data.ok)).catch(() => false).finally(() => {
      window.clearTimeout(timeout);
    });
  }

  function mountBeehiiv(host) {
    const c = cfg();
    const w = words();
    const form = el("form", "waitlist");
    const page = subscribePage(c);
    form.method = "get";
    form.action = page;
    const label = el("label", "sr", "Email address");
    const input = emailInput(host);
    input.name = "email";
    label.htmlFor = input.id;
    const button = el("button", "btn fill", w.button || "Join the list");
    button.type = "submit";
    const source = document.createElement("input");
    source.type = "hidden";
    source.name = "utm_source";
    source.value = "auspexsports.com";
    form.append(label, input, button, source);
    if (w.next) form.append(el("p", "form-note", w.next));
    if (c.workerUrl) {
      form.addEventListener("submit", (event) => {
        event.preventDefault();
        const email = input.value.trim();
        if (!email) return;
        button.disabled = true;
        postWorker(c.workerUrl, email).then((ok) => {
          if (ok) {
            form.replaceWith(el("p", "form-note", w.joined || "You're on the list. Watch for the welcome note."));
            return;
          }
          window.location.assign(pageWithEmail(page, email));
        });
      });
    }
    host.append(form);
  }

  function mountPost(host, action, emailField) {
    const form = el("form", "waitlist");
    form.action = action;
    form.method = "post";
    const label = el("label", "sr", "Email address");
    const input = emailInput(host);
    input.name = emailField || "email";
    label.htmlFor = input.id;
    const button = el("button", "btn fill", words().button || "Join the list");
    button.type = "submit";
    Object.entries(cfg().extra || {}).forEach(([key, value]) => {
      const hidden = document.createElement("input");
      hidden.type = "hidden";
      hidden.name = key;
      hidden.value = value;
      form.append(hidden);
    });
    form.append(label, input, button, subscribeLine(false));
    host.append(form);
  }

  function mount() {
    const host = document.getElementById("access-waitlist");
    if (!host || host.dataset.ready) return;
    host.dataset.ready = "1";
    const c = cfg();
    if (c.provider === "beehiiv" && (c.subscribePage || c.subscribeUrl)) {
      mountBeehiiv(host);
      return;
    }
    if (c.provider === "kit" && c.kitAction) {
      mountPost(host, c.kitAction, c.kitEmailField);
      return;
    }
    if (c.provider === "buttondown" && c.buttondownAction) {
      mountPost(host, c.buttondownAction, c.buttondownEmailField);
      return;
    }
    host.append(subscribeLine(true));
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", mount);
  else mount();
})();
