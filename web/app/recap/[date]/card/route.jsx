// The shareable recap card for one slate date, 1080×1350 PNG (fits X, Reddit and Instagram).
// Built at deploy time from the published record; nothing from the model.
import fs from "node:fs";
import path from "node:path";
import { ImageResponse } from "next/og";
import { recapDays, recordText } from "@/lib/recap";
import { odds, dayLong } from "@/lib/format";

export const dynamic = "force-static";
export const dynamicParams = false;

export function generateStaticParams() {
  return recapDays().map((d) => ({ date: d.date }));
}

const C = { navy: "#13233a", navy2: "#1b2f4b", text: "#eef2f6", muted: "#a9b6c6", bronze: "#d18a43", win: "#5fd3a1", loss: "#f19a8b", line: "rgba(255,255,255,0.12)" };
const u = (v) => `${v > 0 ? "+" : v < 0 ? "-" : ""}${Math.abs(v).toFixed(2)}u`;

function read(...parts) {
  try { return fs.readFileSync(path.join(process.cwd(), "node_modules", ...parts)); } catch { return null; }
}
// Passing any font replaces the generator's built-in one, so the body font (Noto Sans, shipped with
// Next) goes first as the default and Marcellus is used where asked for.
const font = () => read("@fontsource", "marcellus", "files", "marcellus-latin-400-normal.woff");
const body = () => read("next", "dist", "compiled", "@vercel", "og", "noto-sans-v27-latin-regular.ttf");

export async function GET(_req, { params }) {
  const { date } = await params;
  const d = recapDays().find((x) => x.date === date);
  if (!d) return new Response("Not found", { status: 404 });
  const display = font();
  const sans = body();
  const rows = d.picks.slice(0, 18);
  const more = d.picks.length - rows.length;
  const two = rows.length > 9;
  const cols = two ? [rows.slice(0, Math.ceil(rows.length / 2)), rows.slice(Math.ceil(rows.length / 2))] : [rows];
  const tone = d.units > 0 ? C.win : d.units < 0 ? C.loss : C.text;

  const Row = ({ r }) => (
    <div style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 0", borderBottom: `1px solid ${C.line}` }}>
      <div style={{ display: "flex", width: 34, height: 34, borderRadius: 17, alignItems: "center", justifyContent: "center", fontSize: 18,
        background: r.result === "Won" ? C.win : r.result === "Lost" ? C.loss : C.muted, color: C.navy }}>{r.result === "Won" ? "W" : r.result === "Lost" ? "L" : "P"}</div>
      <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
        <div style={{ fontSize: two ? 21 : 27, color: C.text }}>{r.pick}</div>
        <div style={{ fontSize: two ? 16 : 19, color: C.muted }}>{`${r.league} · ${odds(r.price)}${r.actual != null ? ` · ${r.league === "NBA" ? "finished" : "final"} ${r.actual}` : ""}`}</div>
      </div>
      <div style={{ fontSize: two ? 20 : 25, color: (r.units || 0) >= 0 ? C.win : C.loss }}>{u(r.units || 0)}</div>
    </div>
  );

  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", fontFamily: sans ? "Noto Sans" : undefined, padding: "64px 64px 52px", color: C.text,
        background: `linear-gradient(160deg, ${C.navy2} 0%, ${C.navy} 70%)` }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ fontSize: 34, fontFamily: display ? "Marcellus" : undefined, color: C.bronze }}>Auspex Sports</div>
          <div style={{ fontSize: 24, color: C.muted }}>Daily recap</div>
        </div>
        <div style={{ fontSize: 58, fontFamily: display ? "Marcellus" : undefined, marginTop: 34 }}>{dayLong(d.date)}</div>
        <div style={{ display: "flex", gap: 48, marginTop: 18, alignItems: "baseline" }}>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ fontSize: 76 }}>{recordText(d)}</div>
            <div style={{ fontSize: 22, color: C.muted }}>Won–lost</div>
          </div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ fontSize: 76, color: tone }}>{u(d.units)}</div>
            <div style={{ fontSize: 22, color: C.muted }}>{d.roi != null ? `Units · ${d.roi >= 0 ? "+" : "-"}${Math.abs(d.roi).toFixed(1)}% ROI` : "Units"}</div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 36, marginTop: 30, flex: 1 }}>
          {cols.map((c, i) => (
            <div key={i} style={{ display: "flex", flexDirection: "column", flex: 1, borderTop: `1px solid ${C.line}` }}>
              {c.map((r) => <Row key={r.id} r={r} />)}
            </div>
          ))}
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 22, color: C.muted, marginTop: 18 }}>
          <div>{`${more > 0 ? `+${more} more on the site · ` : ""}Flat stakes, graded at the posted price`}</div>
          <div style={{ color: C.bronze }}>auspexsports.com/record</div>
        </div>
      </div>
    ),
    { width: 1080, height: 1350, fonts: [
      ...(sans ? [{ name: "Noto Sans", data: sans, weight: 400, style: "normal" }] : []),
      ...(display ? [{ name: "Marcellus", data: display, weight: 400, style: "normal" }] : []),
    ] },
  );
}
