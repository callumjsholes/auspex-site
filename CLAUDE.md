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
- The old static site files also on the list: `.nojekyll`, `404.html`, `apple-touch-icon.png`, `brand/mark.png`, `content.js`, `faq.html`, `favicon-32.png`, `favicon.ico`, `icon-192.png`, `icon-512.png`, `index.html`, `og.png`, `privacy.html`, `record.html`, `robots.txt`, `site.js`, `sitemap.xml`, `styles.css`, `terms.html`, `visits.js`, `waitlist.js`

`data/wake.json` feeds the site timer. The website does not read it.

## Feeds other agents read

Bibo, Auspex Social, Auspex Model Lab, and other agents read the public JSON at:

`https://raw.githubusercontent.com/callumjsholes/auspex-site/main/data/<name>`

The site does not serve `/data/*.json`. Keep the `data/` directory and the field names stable. Do not rename or remove a key because the website ignores it.

## What the website uses

`web/lib/data.js` keeps the pick, the price, the book, the result, and closing-line value. It drops chances, projections, edges, and minutes. Do not show those on the site.

| File | Fields the site uses |
|---|---|
| `data/nba_live.json` | `generated_at`, `today`, `next_date`, `rules.lock_minutes`. Each game: `game_id`, `away`, `home`, `start_utc`, `completed`, `locked`, `picks`. Each pick: `id`, `player`, `stat`, `side`, `line`, `date`, `start_utc`, `locked_at`, `game`, `price`, `book`, `stake`, `result`, `units`, `clv_pts`, `actual`. |
| `data/picks.json` | Rows with `source` `live` only. `game_id`, `game`, `team`, `date`, `locked_at`, `price`, `stake`, `result`, `units`, `clv_pts`, `home_score`, `away_score`. |
| `data/today.json` | `date`. Each game: `game_id`, `start_utc`, `away`, `home`, `home_score`, `away_score`. |
| `data/nba.json` | `stats[].k` and `stats[].v` when the label matches ROI, won, or Unseen. `books.caption`, `books.rows`. |
| `data/backtest.json` | `total`. Each row: `season`, `units`, `roi`. |
| `data/summary.json` | `generated_at` only. |

`data/charts.json`, `data/meta.json`, `data/research.json`, and `data/wake.json` are not read by the pages. They still stay where they are.

## Timer

`.github/workflows/timer.yml` and `timer-arm.yml` dispatch the private pipeline at lock and close times. Do not delete or disable them. Do not edit `timer.py` or `data/wake.json` by hand.

## Visitor counter

Keep it. `web/public/visits.js` is loaded from `web/app/layout.jsx`. On auspexsports.com and www it posts one visit to the auspex-visits Cloudflare Worker. `?nocount=1` turns that off for the browser. `?count=1` turns it back on. The privacy page says so. The root `visits.js` is the bot's copy. Change the copy in `web/public/` if the site's counter needs a change.

## Writing

Clean visuals. Plain, short, first-person sentences. No hype.

Be honest about the model. The live record is the graded picks at the posted price. Older test numbers are tests, not the live record. Do not invent a record, a sample size, or a reason the model wins. Do not describe how the model works. No secrets and no private-repo internals in this public repo.
