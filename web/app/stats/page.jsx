import StatsPage from "@/components/StatsPage";
import { summaryCopy } from "@/lib/clv";
import { getData } from "@/lib/data";
import { stamp } from "@/lib/format";
import { pageMeta } from "@/lib/meta";
import { SITE } from "@/lib/site";
import { buildStats, readCalibration, readTierIndex, totalsMatch, withTiers } from "@/lib/stats";
import "./stats.css";

export const metadata = pageMeta({
  title: "Stats",
  description: "Charts and splits of the Auspex Sports live record: units and ROI over time, by sport, market, tier and price, with closing-line value.",
  path: "/stats",
});

export default function Page() {
  const data = getData();
  const model = buildStats(withTiers(data.all, readTierIndex()));
  if (!totalsMatch(model.summary, data.sum.all)) {
    throw new Error("Stats unit total does not match the site summary.");
  }
  return (
    <StatsPage
      model={model}
      launch={SITE.launch}
      updated={data.generatedAt ? stamp(data.generatedAt) : ""}
      clvCopy={summaryCopy(data.clv?.all, data.clv?.leagues)}
      calibration={readCalibration()}
    />
  );
}
