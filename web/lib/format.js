export const odds = (v) => (v == null ? "–" : v > 0 ? `+${v}` : `${v}`);
export const signed = (v, d = 1) => (v == null || Number.isNaN(v) ? "–" : `${v > 0 ? "+" : v < 0 ? "−" : ""}${Math.abs(v).toFixed(d)}`);
export const units = (v) => (v == null ? "–" : `${signed(v, 2)}u`);
export const pct = (v, d = 0) => (v == null ? "–" : `${Number(v).toFixed(d)}%`);
export const record = (s) => (s.bets ? `${s.wins}–${s.losses}${s.pushes ? `–${s.pushes}` : ""}` : "0–0");

const ET = "America/New_York";
export const timeET = (iso) =>
  iso ? new Date(iso).toLocaleTimeString("en-US", { timeZone: ET, hour: "numeric", minute: "2-digit" }) + " ET" : "";
export const dayLong = (d) =>
  d ? new Date(d + "T12:00:00Z").toLocaleDateString("en-US", { timeZone: "UTC", weekday: "long", month: "long", day: "numeric" }) : "";
export const dayShort = (d) =>
  d ? new Date(d + "T12:00:00Z").toLocaleDateString("en-US", { timeZone: "UTC", month: "short", day: "numeric" }) : "";
export const stamp = (iso) =>
  iso ? new Date(iso).toLocaleString("en-US", { timeZone: ET, month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }) + " ET" : "";
export const tone = (v) => (v > 0 ? "pos" : v < 0 ? "neg" : "");
export const resultTone = (r) => (r === "Won" ? "pos" : r === "Lost" ? "neg" : "");
export const resultLabel = (r) => (r === "Pending" ? "Open" : r);

// Implied probability of an American price, and how much better one price is than another in
// cents (the betting shorthand: -106 vs -115 is "9 cents better"). Positive = `a` pays more.
export const implied = (v) => (v == null ? null : v > 0 ? 100 / (v + 100) : -v / (-v + 100));
export const centsBetter = (a, b) => {
  if (a == null || b == null) return null;
  const line = (v) => (v > 0 ? v - 100 : v + 100); // put both on one scale through even money
  return Math.round(line(a) - line(b));
};
