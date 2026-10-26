import { unitsWords } from "./format";

function list(parts) {
  if (parts.length <= 1) return parts[0] || "";
  if (parts.length === 2) return `${parts[0]} and ${parts[1]}`;
  return `${parts.slice(0, -1).join(", ")}, and ${parts[parts.length - 1]}`;
}

function resultWords(s) {
  const bits = [`${s.wins} win${s.wins === 1 ? "" : "s"}`, `${s.losses} loss${s.losses === 1 ? "" : "es"}`];
  if (s.pushes) bits.push(`${s.pushes} push${s.pushes === 1 ? "" : "es"}`);
  return `${list(bits)}, ${unitsWords(s.unitMilli)}, at the posted prices`;
}

// One sentence for the record page and the start page. Built only from graded picks.
export function recordSentence(s, { launch, league = "All", range = "all" } = {}) {
  if (!s.bets) {
    if (league === "All" && range === "all") return "No graded picks yet. The record starts once the first slate settles.";
    return "No graded picks in this filter.";
  }
  const core = resultWords(s);
  if (range === "all" && league === "All") return `Since ${launch} I have ${core}.`;
  if (range === "all") return `Since ${launch}, ${league} picks are ${core}.`;
  const window = range === "7" ? "the last 7 days" : range === "30" ? "the last 30 days" : "this window";
  if (league === "All") return `In ${window} I have ${core}.`;
  return `In ${window}, ${league} picks are ${core}.`;
}
