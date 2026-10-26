# Notes

Shared change log for this repo. Newest first. Add an entry when a change is something other agents, the site, or the publish bot rely on.

## 2026-10-26 — Site — Calibration bins with real volume

The public JSON in `data/` is unchanged. Field names are unchanged. Nothing was added to `.auspex-published.json`.

- `/stats` reads `nba_calibration` and `nhl_calibration` from `data/research.json`. Each bucket keeps `bin`, `model_pred`, `model_obs`, `model_n`, `book_pred`, `book_obs`, `book_n`.
- A bucket is plotted only when `model_n` is at least 30. That cutoff is `SHORT_SAMPLE` in `web/lib/stats.js`, and it is the only cutoff. A sport with no bucket that large is not drawn. This publish's NHL list is all under 30, so the page does not draw an NHL chart. The pick count and the short-sample mark stay on a bucket the chart does draw.
- `book_pred` is where the market priced these same picks. `book_obs` and `book_n` are the same results and the same count as the model side. The chart uses one hit rate.

## 2026-10-26 — Site — Game page write-ups

The public JSON in `data/` is unchanged. Field names are unchanged. Nothing was added to `.auspex-published.json`.

- Each NBA and NHL game page has a short write-up, built at build time in `web/lib/previews.js`. Wording varies by a stable hash of the game path. There is no model call and no new service.
- The write-up uses the matchup, the posted pick, the price, the book, and the stake. When `typical_price` is present it gives that median (and `typical_n` when present). An NHL page says the posted price is the median, and names the best book at lock when that price differs. After grading it adds the result, the units, the actual line or final score, and closing-line value in cents when those fields are present. A missing field is left out.
- It does not show a chance, an edge, a projection, or minutes, and it does not describe the model. A game with no posted pick says so. A slate with more than four picks summarizes the median comparison instead of repeating every line.
- The page `<title>` and meta description still come from `generateMetadata`. The JSON-LD `SportsEvent` names the teams, the sport, and the start time. Its description is the matchup only, with no price and no pick.
- The footer responsible-gambling lines are unchanged. The write-up adds a short note of its own.

## 2026-10-26 — Site — Stats tests on the live record

The public JSON in `data/` is unchanged. Field names are unchanged. Nothing was added to `.auspex-published.json`.

- `/stats` adds a section headed "For the stats nerds." It is computed at build time in `web/lib/rigor.js` from the same graded rows as the rest of the page. The resamples use seed `20261025` and 2,000 draws, so a rebuild of the same record draws the same intervals.
- The tests use the posted American price and the graded result. Wilson intervals on the hit rate, bootstrap intervals on units and ROI, a z-test of wins against the price-implied total, a beta posterior, a reshuffle of the live unit results, a t interval and correlation for closing-line cents, a runs test, a sample-size sketch, and a funnel of split ROI. None of these is a model probability.
- Left off, still: research changelog, log loss, edge-threshold buckets, closing expected value, the NHL closing-movement edge counts, and any per-pick probability or edge. Pick cards and pick rows still do not show a chance, an edge, a projection, or minutes.

## 2026-10-26 — Site — More stats charts

The public JSON in `data/` is unchanged. Field names are unchanged. Nothing was added to `.auspex-published.json`.

- Callum signed off on aggregated model-data charts on `/stats` on 2026-10-25. Charts stay in buckets, counts, and averages. Nothing on the page is precise enough to rebuild the model. This change is still not merged.
- New live-record charts: rolling hit rate and ROI (25 and 50), drawdown, unit bins, streaks, day of week, start time, over/under, home/away, team, opponent, book, hit rate against the break-even implied by the posted price, cents bands against the result, and posted units against typical-price units.
- Older tests are charted under their own heading and are not added to the live total. They use `charts.json` equity, months, stat, and reshuffle summary, plus the season units `data.js` already keeps from `backtest.json`.
- Left off, because they would show model internals or a procedure: research changelog, log loss, edge-threshold buckets, closing expected value, and the NHL closing-movement edge counts.
- Pick cards and pick rows still do not show a chance, an edge, a projection, or minutes. Tier, team, and opponent are joined in `web/lib/stats.js` and are not added to the pick row in `web/lib/data.js`.

## 2026-10-26 — Site — Stats page

The public JSON in `data/` is unchanged. Field names are unchanged. Nothing was added to `.auspex-published.json`.

- Callum signed off on the aggregated calibration chart on 2026-10-25, on the condition that he reviews it before it goes live. This change is not merged until that review.
- `/stats` is a public page. It is in the header, the footer, the record page, and the sitemap.
- Headline units, record, and ROI come from `web/lib/summary.js` on `getData().all`. Open picks are counted and left out of the units.
- Splits: sport, market (the stat on the card), tier, and American-odds band. Fewer than 30 graded picks is marked short sample.
- Tier is not added to the pick row in `web/lib/data.js`. The closing-line check still rejects that key on a row. `web/lib/stats.js` reads only `tier` from `nba_live.json` picks and live `picks.json` rows and joins it on `nba-` + id and `nhl-` + game_id. A row that already has `tier` wins.
- Closing-line value on this page reuses `summaryCopy` and `formatCents` from `web/lib/clv.js`. The three totals are the published cents figures. The line is the running average of `clvCents` on each pick. It does not derive cents from `clv_pts` or from the American price.
- Calibration reads `data/research.json` `nba_calibration` only. This publish's list is empty, so the page plots nothing and says so. It does not rebuild buckets from prices. `nba_ev_buckets`, `nhl_buckets`, `nhl_seasons`, and `changelog` are not read.
- Pick cards and pick rows still do not show a chance or a probability. Edges, projections, and minutes stay off every page.
- `CLAUDE.md` now allows only that aggregated chart.

## 2026-10-25 — Site — Visual system

The public JSON in `data/` is unchanged. Field names are unchanged. Nothing was added to `.auspex-published.json`. No route, label, or record number changed.

- The look of the public pages is set in `web/app/globals.css`: navy `#13233a` and bronze buttons `#8f5418`, with a tighter neutral scale, an 8px spacing step, and three radii (8, 12, 16). Marcellus is still the display face and Archivo is still the text face. Dark mode still follows `prefers-color-scheme`.
- Green and red are only for results. The pages still do not show chances, projections, edges, or minutes, and they still do not describe the model.
- Preview cards use the same bronze bar as the header. The visit counter, `/admin`, and the responsible-gambling lines are unchanged.

## 2026-10-24 — Site — Start page, previews, signup, filters

The public JSON in `data/` is unchanged. Field names are unchanged. Nothing was added to `.auspex-published.json`.

- `/start` is a short page for a new visitor: what the site is, the same "How to read a pick" explainer as the home page, how the live record is counted, and the same responsible-gambling lines as the footer. It is in the header, the home page, the footer, and the sitemap. The live sentence is built from `web/lib/summary.js`. Tests stay on the method page and are not added into that sentence.
- Public pages set their own Open Graph and Twitter title and description. The preview image is generated at build time (`opengraph-image` / `twitter-image`) from the published record. The home image shows the live record. A recap image shows that day's record. Both are 1200×630. They do not add a field the pages do not already show.
- The email form still uses the existing Beehiiv form (`Auspex site waitlist`, id in `web/lib/site.js`). It does not use an API key. Beehiiv has one published note and no live automation, so the form does not name a send schedule.
- `/record` has one league control (All / NBA / NHL) and one date control (All time / Last 7 days / Last 30 days). The summary, the chart, the calculator, and the table all use that slice, summed in `web/lib/summary.js`. The chart still has its market filter. The table still has its result filter. Last 7 days and last 30 days use the visitor's calendar. The live record currently starts October 20, 2026, so both windows are the whole record until more days are graded.
- `/recap` renders the latest day directly. It no longer redirects.

## 2026-10-24 — Site — Clearer pages, one unit total

The public JSON in `data/` is unchanged. Field names are unchanged. Nothing was added to `.auspex-published.json`.

- Every unit total on the site now comes from `web/lib/summary.js`. It sums graded units as integer thousandths, so order cannot change the result. The home ledger, the record page, the record charts (including a filtered chart's last point), each daily recap, and the recap card all use it. Display rounds that sum half away from zero to the cent (`+20.015u` prints as `+20.02u`). Adding already-rounded league or market rows can still be a cent off the headline. That is display rounding, not a second sum.
- Pick cards and the record table use short definitions from `web/lib/terms.js` (American odds, unit, over, under, moneyline, median price, closing line). The FAQ has three new answers from that same file: what −110 means, what a moneyline is, and what over/under means. Nothing in those answers describes the model.
- Today's slate shows each NBA game's lock time (tip minus `rules.lock_minutes`) and a countdown once the page is running in the browser. Times render in Eastern Time on the server, then switch to the visitor's time zone after mount. The empty state links to the existing `#join` email form.
- Below 600px the Every pick table stacks one row per pick, and `/recap/<date>` shows the picks as HTML instead of the shrunk card. `/recap/<date>/card` is still the PNG.

## 2026-10-24 — Terms of use and privacy policy

- `/terms` and `/privacy` are the public terms and the privacy policy. The footer links to both. The privacy page still documents the visit counter: local storage keys `auspex_vid` and `auspex_nocount`, the auspex-visits Worker, and `?nocount=1` / `?count=1`.
- Contact on both pages is `hello@auspexsports.com` from `web/lib/site.js`. The site has no accounts, no payments, no analytics script, and no X embed. Paid subscriptions are described as not active.
- The privacy page says the signup form sends the address to Beehiiv from this site. The site does not store it.
- `CLAUDE.md`, `AGENTS.md`, and this file stay off `.auspex-published.json`.

## 2026-10-24 — Game pages

- Static pages for every NHL and NBA game in the public feed: `/nhl/<date>/<away>-at-<home>` and `/nba/...`. League indexes are `/nba` and `/nhl`. Date indexes are `/nba/<date>` and `/nhl/<date>`.
- Built only from `web/lib/data.js`. A pick is shown only after it is in the public picks. Today's full slate, including games that have not locked, comes from `nba_live.json` `games` and `today.json` `games` (matchup and start time). Older pages are games that have a locked or graded pick. The publish files do not keep a full slate once the day rolls, and they do not list future games (NBA `next_date` is a date with no matchups).
- `nhlToday` now includes `locked` from `today.json`. NBA game pages read `hs` and `as_` when `completed` is true, for the final score. No prices, edges, or other model fields were added to what the pages receive.
- NHL rows in `picks.json` have no `start_utc`, so a graded NHL page from an earlier day has the date and not the puck-drop time.
- `sitemap.js` lists the new URLs. `robots.txt` was already in place. `CLAUDE.md`, `AGENTS.md`, and this file stay off `.auspex-published.json`.

## 2026-10-24 — Closing prices and CLV in cents

- Pick cards show the locked price against `close_median`, the CLV in cents, and a tick when `clv_cents` is positive. If `close_line_exact` is false, the close is labeled the nearest line, with `close_quote_line` when that is a number. `close_best` and `close_best_book` show when the best close differs from the median.
- The record page adds a closing-line value summary: average CLV in cents, the share of picks that beat the close, and the sample size. One cent is one percentage point of implied probability. Positive means the locked price was longer than the closing median.
- Totals come from `nba_live.json` `summary` (else `by_tier`) and `summary.json` `live` (else `live_by_tier`): `avg_clv_cents`, `beat_close_cents_pct`, `clv_cents_n`, `clv_na`. Per-pick `clv_cents` is the fallback only when that league has no totals.
- A missing field renders as nothing or n/a. The site does not invent cents from the American price or from `clv_pts`. The points CLV already on the record stays labeled "in points".
- The cents summary is on the record board. All time uses the published totals for the league filter (both leagues together on All). Last 7 days and last 30 days use the cents on the picks in that window, so a short window does not show the full-sample average.
- Keep these keys. `tests/fixtures/clv/` covers a publish with the fields and one without.

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
