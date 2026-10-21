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
