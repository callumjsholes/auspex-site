# Auspex Sports website

Next.js site for auspexsports.com, deployed on Vercel (project Root Directory: `web`).

It reads the results the private model publishes to `../data/*.json` at build time and shows only picks, prices, books and results. No model code or model outputs live here. A commit that changes `data/` or `web/` triggers a new deploy.

Local: `npm install && npm run build && npm start`
