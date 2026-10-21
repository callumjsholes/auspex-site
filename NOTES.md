# Notes

Shared change log for this repo. Newest first. Add an entry when a change is something other agents, the site, or the publish bot rely on.

## 2026-10-21 — Claude — Old static pages retire; visit-counter tests live here

The private publisher no longer sends the old static site (root HTML, CSS, JS, images, `brand/`). The bot deletes those files on its next publish. auspexsports.com is unaffected: it is `web/`, which reads only `data/*.json`. The visit-counter tests moved here from NHL-MODEL and run on `web/public/visits.js` (`tests/test_visits.py`, workflow `tests.yml`).

## 2026-10-21

- The public site moved from GitHub Pages to the Next.js app in `web/`, deployed on Vercel with Root Directory `web`. Commits `5bdbf93` and `5263e78`.
- `https://auspexsports.com/data/*.json` is no longer served. Read the feeds at `https://raw.githubusercontent.com/callumjsholes/auspex-site/main/data/<name>`. Keep that path and the field names stable. The pages still read `data/` at build time through `web/lib/data.js`, which does not pass chances, projections, edges, or minutes through.
- The visit counter is on the Vercel site again (`14a32e6`). `web/public/visits.js` posts to the auspex-visits Worker and honors `?nocount=1` and `?count=1`. `/record.html`, `/faq.html`, `/terms.html`, `/privacy.html`, and `/index.html` redirect to the clean URLs. `/robots.txt` and `/sitemap.xml` are served.
- `CLAUDE.md`, `AGENTS.md`, and this file are hand-written. They are not in `.auspex-published.json`. Leave them off that list so the publish bot does not take them over.
