export default function sitemap() {
  const base = "https://auspexsports.com";
  return ["", "/record", "/recap", "/method", "/faq", "/terms", "/privacy"].map((p) => ({ url: base + p, changeFrequency: p === "" || p === "/record" || p === "/recap" ? "daily" : "monthly" }));
}
