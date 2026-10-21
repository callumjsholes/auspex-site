// Daily recap: graded picks grouped by slate date. Built from the same rows as the record page.
import { getData } from "@/lib/data";
import { odds, dayLong, dayShort } from "@/lib/format";
import { SITE } from "@/lib/site";

const graded = (r) => r === "Won" || r === "Lost" || r === "Push";
const uText = (v) => `${v > 0 ? "+" : v < 0 ? "-" : ""}${Math.abs(v).toFixed(2)}u`;

export function recapDays() {
  const D = getData();
  const by = new Map();
  for (const r of D.all) {
    if (!by.has(r.date)) by.set(r.date, []);
    by.get(r.date).push(r);
  }
  const days = [];
  for (const [date, rows] of by) {
    const done = rows.filter((r) => graded(r.result));
    if (!done.length) continue;
    const order = (r) => (r.league === "NBA" ? 0 : 1);
    done.sort((a, b) => order(a) - order(b) || a.game.localeCompare(b.game) || a.pick.localeCompare(b.pick));
    const units = done.reduce((a, r) => a + (r.units || 0), 0);
    const staked = done.reduce((a, r) => a + (r.stake || 0), 0);
    days.push({
      date, picks: done, open: rows.length - done.length,
      wins: done.filter((r) => r.result === "Won").length, losses: done.filter((r) => r.result === "Lost").length,
      pushes: done.filter((r) => r.result === "Push").length, units, roi: staked ? (100 * units) / staked : null,
    });
  }
  return days.sort((a, b) => b.date.localeCompare(a.date));
}

export const recordText = (d) => `${d.wins}-${d.losses}${d.pushes ? `-${d.pushes}` : ""}`;

// Plain text for Reddit or the newsletter (Reddit's markdown editor renders the bullets).
export function recapText(d) {
  const lines = [`**${dayLong(d.date)}: ${recordText(d)}, ${uText(d.units)}**`, ""];
  for (const r of d.picks) {
    const mark = r.result === "Won" ? "✅" : r.result === "Lost" ? "❌" : "➖";
    const where = r.league === "NBA" ? ` at ${r.book}` : " (median)";
    const fin = r.actual != null ? (r.league === "NBA" ? ` - finished ${r.actual}` : ` - final ${r.actual}`) : "";
    lines.push(`* ${mark} ${r.league} ${r.pick} (${odds(r.price)}${where})${fin}, ${uText(r.units || 0)}`);
  }
  if (d.open) lines.push("", `${d.open} pick${d.open === 1 ? "" : "s"} from this slate still open.`);
  lines.push("", `Flat stakes, graded at the posted price. Full record: ${SITE.url}/record`);
  return lines.join("\n");
}

export function shareText(d) {
  return `${dayShort(d.date)} recap: ${recordText(d)}, ${uText(d.units)} at the posted prices.`;
}
