# Auspex Sports site

Shared instructions for Claude Code and other agents working in this public repo. Read this before editing. After a change other agents rely on, add a dated entry to NOTES.md.

## What this repo is

auspexsports.com is the Next.js app in `web/`. Vercel deploys it with Root Directory `web`. `npm run build` in `web/` before pushing.

The pages read `data/*.json` at build time through `web/lib/data.js`. A commit that changes `web/` or `data/` triggers a Vercel build (`web/vercel.json` `ignoreCommand`).

## Do not hand-edit bot files

A bot (`auspex-bot`, commit message `Publish site`) writes these from a private pipeline. Never edit, rename, move, or delete them by hand. Never add hand-written files to `.auspex-published.json`. That file is the bot's list. The bot overwrites every path on the list, and when it removes a path from the list it deletes that file. Paths that are not on the list are left alone. `web/`, `README.md`, this file, `AGENTS.md`, and `NOTES.md` are not on the list. Leave it that way.

Bot-owned paths:

- `.auspex-published.json`
- `.github/timer.py`
- `.github/workflows/timer.yml`
- `.github/workflows/timer-arm.yml`
- `data/backtest.json`, `data/charts.json`, `data/meta.json`, `data/nba.json`, `data/nba_live.json`, `data/picks.json`, `data/research.json`, `data/summary.json`, `data/today.json`, `data/wake.json`
- `.nojekyll`. The old static site files (`index.html`, `record.html`, `site.js`, root `visits.js` and the rest) were dropped from the private publisher on 2026-10-21; the bot deletes them on its next publish. Do not recreate them.

`data/wake.json` feeds the site timer. The website does not read it.

## Feeds other agents read

Bibo, Auspex Social, Auspex Model Lab, and other agents read the public JSON at:

`https://raw.githubusercontent.com/callumjsholes/auspex-site/main/data/<name>`

The site does not serve `/data/*.json`. Keep the `data/` directory and the field names stable. Do not rename or remove a key because the website ignores it.

## What the website uses

`web/lib/data.js` keeps the pick, the price, the book, the result, and closing-line value. It drops chances, projections, edges, and minutes so they never reach a pick card or a pick row.

| File | Fields the site uses |
|---|---|
| `data/nba_live.json` | `generated_at`, `today`, `next_date`, `rules.lock_minutes`. Each game: `game_id`, `away`, `home`, `start_utc`, `completed`, `locked`, `picks`, and `hs` / `as_` for the final score on a game page. Each pick: `id`, `player`, `stat`, `side`, `line`, `date`, `start_utc`, `locked_at`, `game`, `price`, `book`, `stake`, `result`, `units`, `clv_pts`, `clv_cents`, `close_median`, `close_best`, `close_best_book`, `close_quote_line`, `close_line_exact`, `actual`, `typical_price`, `typical_n` (price shopping), `game_id`, `player_id` (public ESPN ids for the live tracker). `summary` and `by_tier`: `avg_clv_cents`, `beat_close_cents_pct`, `clv_cents_n`, `clv_na`. |
| `data/picks.json` | Rows with `source` `live` only. `game_id`, `game`, `team`, `date`, `locked_at`, `price`, `best_price`, `best_book`, `stake`, `result`, `units`, `clv_pts`, `clv_cents`, `close_median`, `close_best`, `close_best_book`, `home_score`, `away_score`. |
| `data/today.json` | `date`. Each game: `game_id`, `start_utc`, `away`, `home`, `home_score`, `away_score`, `locked` (the game page uses this to tell a game that has not locked from a pass). |
| `data/nba.json` | `stats[].k` and `stats[].v` when the label matches ROI, won, or Unseen. `books.caption`, `books.rows`. |
| `data/backtest.json` | `total`. Each row: `season`, `units`, `roi`. |
| `data/summary.json` | `generated_at`. `live` and `live_by_tier`: `avg_clv_cents`, `beat_close_cents_pct`, `clv_cents_n`, `clv_na`. |
| `data/research.json` | `nba_calibration` and `nhl_calibration`, for the aggregated calibration chart on `/stats`. Each bucket: `bin`, `model_pred`, `model_obs`, `model_n`, and `book_pred`, `book_obs`, `book_n` when those numbers are on the same bucket. `book_obs` and `book_n` are the same picks and the same results as the model side. |
| `data/charts.json` | Older NBA test only, drawn on `/stats` apart from the live record: `nba_test.label`, `nba_equity` (`date`, `units`), `nba_monthly` (`month`, `bets`, `units`, `roi`), `nba_by_stat` (`stat`, `bets`, `units`, `roi`), `nba_resample` (`paths`, `p_profit`, `median_end`, `p5_end`, `median_drawdown`). |

`data/meta.json` and `data/wake.json` are not read by the pages. They still stay where they are. `data/research.json` is read only for the calibration row above.

`/stats` may show aggregated model-data charts. Callum signed off on that on 2026-10-25. A chart may use a model-derived field or a research summary that is already in `data/`, and only as buckets, counts, or averages. It does not show a per-pick probability, a per-pick edge, a feature weight, a coefficient, or a formula, and it does not explain how the model works. If a published field would still reveal those internals once grouped, leave it out.

The calibration chart is one of those charts. It is buckets only: the published bin, the average probability in that bin, the hit rate, and the pick count. A bin is drawn only when its count is at least 30 (`SHORT_SAMPLE` in `web/lib/stats.js`, the one threshold). A sport with no bin that large is not drawn, and the page does not leave empty axes up for it. The short-sample mark and the pick count stay on any bucket the chart does draw. `book_pred` is where the market priced these same picks, plotted against the same hit rate. Do not treat `book_obs` or `book_n` as a second set of results. Do not derive a model probability from the American price or from any other field. The break-even rate on the price chart is the posted price, not a model probability. If both lists are missing, empty, or have no bin of 30, draw nothing and say so.

The section headed "For the stats nerds" tests the graded record against the posted price. Those tests use the American price and the graded result. They do not show a model probability, a weight, or a formula.

These stay off `/stats`, even as aggregates: `nba_ev_buckets`, `nhl_buckets`, `nhl_seasons`, `changelog`, log loss (`ll_model`, `ll_market`), the backtest edge columns and `buckets`, and closing expected value (`close_ev_units`, `close_ev_roi`). `charts.json` `nhl_clv_move` stays off too.

Pick cards, pick rows, and every other page still do not show a chance, an edge, a projection, or minutes.

## Live tracker, recap, calculator

- `/api/live` (`web/app/api/live/route.js`) is the only server route. It takes ESPN game/player ids and NHL game ids from the page, reads public box scores from ESPN and api-web.nhle.com (cached 20 s), and returns stat lines and scores. It reads no `data/` file at request time and returns nothing from the model. `web/components/Live.jsx` polls it every 45 s only while a picked game is starting or in progress and the tab is visible.
- `/recap/<date>` and `/recap/<date>/card` (1080×1350 PNG) are built at deploy time from graded picks (`web/lib/recap.js`). `/recap` opens the latest day. The public recap shows the card and the day list only.
- The share tools (download image, post on X, Reddit/newsletter text) are owner-only at `/admin/recap/<date>`. `web/middleware.js` locks everything under `/admin` with HTTP Basic Auth against the `ADMIN_PASSWORD` Vercel env var (any username). Do not put share tools or other owner tools on public pages.
- The bankroll calculator (`web/components/BankrollCalc.jsx`) runs in the browser on the graded record.

## Timer

`.github/workflows/timer.yml` and `timer-arm.yml` dispatch the private pipeline at lock and close times. Do not delete or disable them. Do not edit `timer.py` or `data/wake.json` by hand.

## Visitor counter

Keep it. `web/public/visits.js` is loaded from `web/app/layout.jsx`. On auspexsports.com and www it posts one visit to the auspex-visits Cloudflare Worker. `?nocount=1` turns that off for the browser. `?count=1` turns it back on. The privacy page says so. Change it in `web/public/visits.js`; `tests/test_visits.py` covers it (`python3 -m unittest discover -s tests`, needs node).

## Writing

Clean visuals. Plain, short, first-person sentences. No hype.

Be honest about the model. The live record is the graded picks at the posted price. Older test numbers are tests, not the live record. Do not invent a record, a sample size, or a reason the model wins. Do not describe how the model works. No secrets and no private-repo internals in this public repo.
