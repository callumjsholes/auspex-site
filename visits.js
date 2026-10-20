/* One visit ping per page load on the public site. Opt out with ?nocount=1. No cookies. */
(function () {
  try {
    var q = new URLSearchParams(location.search), changed = false;
    if (q.get("nocount") === "1") {
      localStorage.setItem("auspex_nocount", "1");
      q.delete("nocount");
      changed = true;
    }
    if (q.get("count") === "1") {
      localStorage.removeItem("auspex_nocount");
      q.delete("count");
      changed = true;
    }
    if (changed) {
      var s = q.toString();
      history.replaceState(null, "", location.pathname + (s ? "?" + s : "") + location.hash);
    }
    if (localStorage.getItem("auspex_nocount") === "1") return;
    var host = location.hostname;
    if (host !== "auspexsports.com" && host !== "www.auspexsports.com") return;
    var vid = localStorage.getItem("auspex_vid");
    if (!vid || !/^[A-Za-z0-9-]{16,64}$/.test(vid)) {
      vid = "";
      try { vid = crypto.randomUUID(); } catch (err) {}
      if (!vid) {
        var alphabet = "abcdefghijklmnopqrstuvwxyz0123456789";
        for (var i = 0; i < 32; i++) vid += alphabet[Math.random() * 36 | 0];
      }
      localStorage.setItem("auspex_vid", vid);
    }
    fetch("https://auspex-visits.callumjsholes.workers.dev/hit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ vid: vid, path: location.pathname, ref: document.referrer }),
      keepalive: true
    }).catch(function () {});
  } catch (e) {}
})();
