# Notes

Shared change log for this repo. Newest first. Add an entry when a change is something other agents, the site, or the publish bot rely on.

## 2026-10-24 — Site — Clearer pages, one unit total

The public JSON in `data/` is unchanged. Field names are unchanged. Nothing was added to `.auspex-published.json`.

- Every unit total on the site now comes from `web/lib/summary.js`. It sums graded units as integer thousandths, so order cannot change the result. The home ledger, the record page, the record charts (including a filtered chart's last point), each daily recap, and the recap card all use it. Display rounds that sum half away from zero to the cent (`+20.015u` prints as `+20.02u`). Adding already-rounded league or market rows can still be a cent off the headline. That is display rounding, not a second sum.
- Pick cards and the record table use short definitions from `web/lib/terms.js` (American odds, unit, over, under, moneyline, median price, closing line). The FAQ has three new answers from that same file: what −110 means, what a moneyline is, and what over/under means. Nothing in those answers describes the model.
- Today's slate shows each NBA game's lock time (tip minus `rules.lock_minutes`) and a countdown once the page is running in the browser. Times render in Eastern Time on the server, then switch to the visitor's time zone after mount. The empty state links to the existing `#join` email form.
- Below 600px the Every pick table stacks one row per pick, and `/recap/<date>` shows the picks as HTML instead of the shrunk card. `/recap/<date>/card` is still the PNG.

## 2026-10-21 — Claude — Recap share tools moved behind a password

- The Download image / Post on X / Copy text panel is gone from public `/recap/<date>`. It lives at `/admin/recap/<date>` (`/admin/recap` opens the latest day).
- `web/middleware.js` guards `/admin/*` with HTTP Basic Auth against the `ADMIN_PASSWORD` env var on Vercel. No env var means locked. `robots.txt` disallows `/admin`.
- `/recap/<date>/card` stays public because it is the page's social preview image.

## 2026-10-21 — Claude — Live tracker, daily recap, price shopping, bankroll calculator

- Pick cards show a live line during games (player stat vs the line for NBA props, score for NHL picks) from `/api/live`, which proxies public ESPN and NHL box scores.
- `/recap/<date>` with a shareable card image and Reddit-ready text; "Recap" is in the nav.
- Cards and the record table compare the posted price with the typical book (NBA) or the best book at lock (NHL). CSV gains `typical_price` and `best_price`.
- The record page has an "If you'd followed every pick" calculator.

Others: the site now reads `typical_price`, `typical_n`, `game_id`, `player_id` (NBA) and `best_price`, `best_book` (NHL). Keep those keys.

## 2026-10-21 — Claude — Old static pages retire; visit-counter tests live here

The private publisher no longer sends the old static site (root HTML, CSS, JS, images, `brand/`). The bot deletes those files on its next publish. auspexsports.com is unaffected: it is `web/`, which reads only `data/*.json`. The visit-counter tests moved here from NHL-MODEL and run on `web/public/visits.js` (`tests/test_visits.py`, workflow `tests.yml`).

## 2026-10-21

- The public site moved from GitHub Pages to the Next.js app in `web/`, deployed on Vercel with Root Directory `web`. Commits `5bdbf93` and `5263e78`.
- `https://auspexsports.com/data/*.json` is no longer served. Read the feeds at `https://raw.githubusercontent.com/callumjsholes/auspex-site/main/data/<name>`. Keep that path and the field names stable. The pages still read `data/` at build time through `web/lib/data.js`, which does not pass chances, projections, edges, or minutes through.
- The visit counter is on the Vercel site again (`14a32e6`). `web/public/visits.js` posts to the auspex-visits Worker and honors `?nocount=1` and `?count=1`. `/record.html`, `/faq.html`, `/terms.html`, `/privacy.html`, and `/index.html` redirect to the clean URLs. `/robots.txt` and `/sitemap.xml` are served.
- `CLAUDE.md`, `AGENTS.md`, and this file are hand-written. They are not in `.auspex-published.json`. Leave them off that list so the publish bot does not take them over.
