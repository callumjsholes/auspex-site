/* Renders the email list from window.AUSPEX.waitlist in content.js.
   Beehiiv is the live provider. The loader script inserts the form where it sits.
   One embed, in #access-waitlist. Other spots are links to #waitlist.
   If the iframe never appears, the public newsletter link is the fallback.
   There is no mailto form. hello@auspexsports.com stays a contact link in the footer. */
(function () {
  const cfg = () => (window.AUSPEX && window.AUSPEX.waitlist) || {};
  const words = () => (window.AUSPEX && window.AUSPEX.email) || {};

  function el(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text != null) node.textContent = text;
    return node;
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

  function addAttribution() {
    const url = cfg().attributionUrl;
    if (!url || document.querySelector("script[data-auspex-attribution]")) return;
    const s = document.createElement("script");
    s.async = true;
    s.src = url;
    s.setAttribute("data-auspex-attribution", "1");
    document.head.appendChild(s);
  }

  function mountBeehiiv(host) {
    const c = cfg();
    host.classList.add("waitlist-slot");
    const s = document.createElement("script");
    s.async = true;
    s.src = c.loaderUrl;
    s.setAttribute("data-beehiiv-form", c.formId);
    host.append(s);
    const note = subscribeLine(false);
    host.append(note);
    window.setTimeout(() => {
      if (!host.querySelector("iframe")) note.replaceWith(subscribeLine(true));
    }, 5000);
  }

  function mountPost(host, action, emailField) {
    const form = el("form", "waitlist");
    form.action = action;
    form.method = "post";
    const label = el("label", "sr", "Email address");
    const input = document.createElement("input");
    input.type = "email";
    input.required = true;
    input.placeholder = "you@example.com";
    input.autocomplete = "email";
    input.name = emailField || "email";
    input.id = host.id + "-email";
    label.htmlFor = input.id;
    const button = el("button", "btn fill", "Join the list");
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
    if (c.provider === "beehiiv" && c.formId) {
      addAttribution();
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
