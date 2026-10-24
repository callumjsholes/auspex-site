"""The public visitor counter (web/public/visits.js): opt out, production hosts only, one hit per load.

Moved here from NHL-MODEL on 2026-10-21 with the live copy of the script.
Run: python3 -m unittest discover -s tests   (needs node)
"""
import json
import subprocess
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SCRIPT = ROOT / "web" / "public" / "visits.js"
LAYOUT = ROOT / "web" / "app" / "layout.jsx"
VID = "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee"

HARNESS = r"""
const fs = require("fs");
const src = fs.readFileSync(process.argv[1], "utf8");
const cases = JSON.parse(process.argv[2]);
const run = new Function("location", "localStorage", "history", "document", "fetch", "crypto", src);
const out = [];
for (const c of cases) {
  const store = Object.assign({}, c.store || {});
  const calls = [];
  let replaced = null;
  let blewUp = false;
  const storage = {
    getItem(k) {
      if (c.storageThrows) throw new Error("storage blocked");
      return Object.prototype.hasOwnProperty.call(store, k) ? store[k] : null;
    },
    setItem(k, v) { store[k] = String(v); },
    removeItem(k) { delete store[k]; }
  };
  const fetch = (url, opts) => {
    calls.push({ url, opts });
    if (c.fetchThrows) throw new Error("network down");
    return Promise.reject(new Error("ignored"));
  };
  try {
    run(
      {
        hostname: c.hostname,
        pathname: c.pathname,
        search: c.search || "",
        hash: c.hash || ""
      },
      storage,
      { replaceState: (_s, _t, url) => { replaced = url; } },
      { referrer: c.ref || "" },
      fetch,
      c.noUUID ? {} : { randomUUID: () => c.uuid || "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee" }
    );
  } catch (e) {
    blewUp = true;
  }
  out.push({
    blewUp,
    store,
    replaced,
    calls: calls.map((call) => ({
      url: call.url,
      method: call.opts.method,
      headers: call.opts.headers,
      keepalive: call.opts.keepalive,
      body: JSON.parse(call.opts.body)
    }))
  });
}
process.stdout.write(JSON.stringify(out));
"""


def load(cases):
    proc = subprocess.run(
        ["node", "-e", HARNESS, str(SCRIPT), json.dumps(cases)],
        check=True,
        capture_output=True,
        text=True,
    )
    return json.loads(proc.stdout)


class Visits(unittest.TestCase):
    def test_layout_loads_it_and_it_stays_small_and_cookie_free(self):
        self.assertIn('<Script src="/visits.js"', LAYOUT.read_text())
        script = SCRIPT.read_text()
        self.assertLessEqual(len(script.splitlines()), 40)
        self.assertNotIn("document.cookie", script)

    def test_privacy_page_documents_the_counter_and_opt_out(self):
        page = (ROOT / "web" / "app" / "privacy" / "page.jsx").read_text()
        for bit in ("?nocount=1", "?count=1", "auspex_vid", "auspex_nocount", "auspex-visits.callumjsholes.workers.dev"):
            self.assertIn(bit, page)
        self.assertNotIn("document.cookie", page)

    def test_opt_out_strips_the_param_and_sends_nothing(self):
        got = load([{
            "hostname": "auspexsports.com",
            "pathname": "/record.html",
            "search": "?nocount=1&utm=fall",
            "hash": "#picks",
            "ref": "https://example.com/",
        }])[0]
        self.assertFalse(got["blewUp"])
        self.assertEqual(got["store"].get("auspex_nocount"), "1")
        self.assertEqual(got["replaced"], "/record.html?utm=fall#picks")
        self.assertEqual(got["calls"], [])

    def test_stored_opt_out_sends_nothing_until_count_clears_it(self):
        quiet = load([{
            "hostname": "www.auspexsports.com",
            "pathname": "/",
            "store": {"auspex_nocount": "1", "auspex_vid": VID},
        }])[0]
        self.assertEqual(quiet["calls"], [])
        self.assertIsNone(quiet["replaced"])

        loud = load([{
            "hostname": "www.auspexsports.com",
            "pathname": "/",
            "search": "?count=1",
            "ref": "",
            "store": {"auspex_nocount": "1", "auspex_vid": VID},
        }])[0]
        self.assertNotIn("auspex_nocount", loud["store"])
        self.assertEqual(loud["replaced"], "/")
        self.assertEqual(len(loud["calls"]), 1)
        hit = loud["calls"][0]
        self.assertEqual(hit["url"], "https://auspex-visits.callumjsholes.workers.dev/hit")
        self.assertEqual(hit["method"], "POST")
        self.assertEqual(hit["headers"], {"Content-Type": "application/json"})
        self.assertTrue(hit["keepalive"])
        self.assertEqual(hit["body"], {"vid": VID, "path": "/", "ref": ""})

    def test_only_the_public_host_is_counted(self):
        cases = []
        for host in ("auspexsports.com", "www.auspexsports.com", "localhost", "callumjsholes.github.io", "127.0.0.1"):
            cases.append({"hostname": host, "pathname": "/faq.html", "ref": "https://x.com/"})
        got = load(cases)
        counted = [row["calls"][0]["body"]["path"] for row in got if row["calls"]]
        self.assertEqual(counted, ["/faq.html", "/faq.html"])
        self.assertEqual(got[0]["calls"][0]["body"]["vid"], VID)
        self.assertEqual(got[0]["calls"][0]["body"]["ref"], "https://x.com/")
        for row in got[2:]:
            self.assertEqual(row["calls"], [])
            self.assertNotIn("auspex_vid", row["store"])

    def test_vid_is_reused_and_replaced_when_it_does_not_match(self):
        kept = load([{
            "hostname": "auspexsports.com",
            "pathname": "/",
            "store": {"auspex_vid": "abcDEF0123456789"},
            "uuid": "ffffffff-ffff-ffff-ffff-ffffffffffff",
        }])[0]
        self.assertEqual(kept["calls"][0]["body"]["vid"], "abcDEF0123456789")

        fresh = load([{
            "hostname": "auspexsports.com",
            "pathname": "/",
            "store": {"auspex_vid": "too-short"},
        }])[0]
        self.assertEqual(fresh["store"]["auspex_vid"], VID)
        self.assertRegex(fresh["calls"][0]["body"]["vid"], r"^[A-Za-z0-9-]{16,64}$")

    def test_missing_randomuuid_uses_a_32_char_fallback(self):
        got = load([{
            "hostname": "auspexsports.com",
            "pathname": "/terms.html",
            "noUUID": True,
        }])[0]
        vid = got["calls"][0]["body"]["vid"]
        self.assertRegex(vid, r"^[a-z0-9]{32}$")
        self.assertEqual(got["store"]["auspex_vid"], vid)

    def test_storage_and_fetch_failures_stay_on_the_page(self):
        blocked = load([{
            "hostname": "auspexsports.com",
            "pathname": "/",
            "storageThrows": True,
        }])[0]
        self.assertFalse(blocked["blewUp"])
        self.assertEqual(blocked["calls"], [])

        down = load([{
            "hostname": "auspexsports.com",
            "pathname": "/",
            "fetchThrows": True,
        }])[0]
        self.assertFalse(down["blewUp"])
        self.assertEqual(len(down["calls"]), 1)


if __name__ == "__main__":
    unittest.main()
