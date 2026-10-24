import { getCatalog, previewState } from "@/lib/games";
import { SITE } from "@/lib/site";

export default function sitemap() {
  const base = SITE.url;
  const pages = ["", "/start", "/record", "/recap", "/method", "/faq", "/terms", "/privacy", "/nba", "/nhl"].map((p) => ({
    url: base + p,
    changeFrequency: p === "" || p === "/record" || p === "/recap" || p === "/nba" || p === "/nhl" ? "daily" : "monthly",
  }));
  const { games, generatedAt } = getCatalog();
  const dates = new Set();
  const extra = [];
  for (const g of games) {
    const datePath = `/${g.league.toLowerCase()}/${g.date}`;
    if (!dates.has(datePath)) {
      dates.add(datePath);
      extra.push({ url: base + datePath, changeFrequency: "daily", lastModified: generatedAt || undefined });
    }
    const done = previewState(g) === "graded";
    extra.push({ url: base + g.path, changeFrequency: done ? "monthly" : "daily", lastModified: generatedAt || undefined });
  }
  return [...pages, ...extra];
}
