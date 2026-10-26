import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { getData } from "./data";
import { record, unitsFromMilli } from "./format";
import { SITE } from "./site";

export const ogSize = { width: 1200, height: 630 };
export const ogContentType = "image/png";

const ascii = (s) => String(s).replaceAll("−", "-").replaceAll("–", "-");

async function assets() {
  const root = process.cwd();
  const [font, mark] = await Promise.all([
    readFile(path.join(root, "node_modules/@fontsource/marcellus/files/marcellus-latin-400-normal.woff")),
    readFile(path.join(root, "public/mark.png")),
  ]);
  return {
    fonts: [{ name: "Marcellus", data: font, style: "normal", weight: 400 }],
    mark: `data:image/png;base64,${mark.toString("base64")}`,
  };
}

// A 1200×630 card. Only the public record: wins, losses, and units.
export async function ogCard({ kicker, recordLine, unitsLine, detail }) {
  const { fonts, mark } = await assets();
  const up = String(unitsLine).startsWith("+");
  const down = String(unitsLine).startsWith("-") || String(unitsLine).startsWith("−");
  const unitColor = up ? "#5fd3a1" : down ? "#f19a8b" : "#eef2f6";
  return new ImageResponse(
    (
      <div style={{ display: "flex", flexDirection: "column", width: "100%", height: "100%", background: "#13233a", color: "#eef2f6", fontFamily: "Marcellus" }}>
        <div style={{ display: "flex", height: 8, width: "100%", background: "#8f5418" }} />
        <div style={{ display: "flex", flex: 1, flexDirection: "column", justifyContent: "space-between", padding: "52px 72px 60px" }}>
          <div style={{ display: "flex", alignItems: "center" }}>
            <img src={mark} width={72} height={72} alt="" style={{ borderRadius: 14 }} />
            <div style={{ display: "flex", marginLeft: 22, fontSize: 40 }}>{SITE.name}</div>
          </div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ display: "flex", fontSize: 32, color: "#a9b6c6" }}>{kicker}</div>
            <div style={{ display: "flex", alignItems: "baseline", marginTop: 12 }}>
              <div style={{ display: "flex", fontSize: 112, lineHeight: 1 }}>{ascii(recordLine)}</div>
              <div style={{ display: "flex", fontSize: 112, lineHeight: 1, color: unitColor, marginLeft: 48 }}>{ascii(unitsLine)}</div>
            </div>
          </div>
          <div style={{ display: "flex", fontSize: 32, color: "#c9d3df" }}>{detail}</div>
        </div>
      </div>
    ),
    { ...ogSize, fonts },
  );
}

export function liveCard() {
  const s = getData().sum.all;
  const unitsLine = s.bets ? unitsFromMilli(s.unitMilli) : "0.00u";
  return ogCard({
    kicker: "Live record",
    recordLine: record(s),
    unitsLine,
    detail: `Since ${SITE.launch}, graded at the posted price`,
  });
}

export function dayCard(d, { dayLong }) {
  return ogCard({
    kicker: dayLong(d.date),
    recordLine: `${d.wins}-${d.losses}${d.pushes ? `-${d.pushes}` : ""}`,
    unitsLine: unitsFromMilli(d.unitMilli),
    detail: "One day's graded picks, at the posted price",
  });
}
