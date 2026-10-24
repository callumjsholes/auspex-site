// Daily recap: graded picks grouped by slate date. Built from the same rows as the record page.
import { getData } from "./data.js";
import { summarize } from "./summary.js";
import { odds, dayLong, dayShort, units, unitsFromMilli } from "./format.js";
import { SITE } from "./site.js";

const graded = (r) => r === "Won" || r === "Lost" || r === "Push";
const pickUnits = (v) => units(v || 0);

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
    const s = summarize(done);
    days.push({
      date, picks: done, open: rows.length - done.length,
      wins: s.wins, losses: s.losses, pushes: s.pushes,
      units: s.units, unitMilli: s.unitMilli, roi: s.roi,
    });
  }
  return days.sort((a, b) => b.date.localeCompare(a.date));
}

export const recordText = (d) => `${d.wins}-${d.losses}${d.pushes ? `-${d.pushes}` : ""}`;

// Plain text for Reddit or the newsletter (Reddit's markdown editor renders the bullets).
export function recapText(d) {
  const lines = [`**${dayLong(d.date)}: ${recordText(d)}, ${unitsFromMilli(d.unitMilli)}**`, ""];
  for (const r of d.picks) {
    const mark = r.result === "Won" ? "✅" : r.result === "Lost" ? "❌" : "➖";
    const where = r.league === "NBA" ? ` at ${r.book}` : " (median)";
    const fin = r.actual != null ? (r.league === "NBA" ? ` - finished ${r.actual}` : ` - final ${r.actual}`) : "";
    lines.push(`* ${mark} ${r.league} ${r.pick} (${odds(r.price)}${where})${fin}, ${pickUnits(r.units)}`);
  }
  if (d.open) lines.push("", `${d.open} pick${d.open === 1 ? "" : "s"} from this slate still open.`);
  lines.push("", `Flat stakes, graded at the posted price. Full record: ${SITE.url}/record`);
  return lines.join("\n");
}

export function shareText(d) {
  return `${dayShort(d.date)} recap: ${recordText(d)}, ${unitsFromMilli(d.unitMilli)} at the posted prices.`;
}
