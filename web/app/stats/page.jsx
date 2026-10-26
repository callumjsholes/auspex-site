import StatsPage from "@/components/StatsPage";
import { summaryCopy } from "@/lib/clv";
import { getData } from "@/lib/data";
import { stamp } from "@/lib/format";
import { pageMeta } from "@/lib/meta";
import { SITE } from "@/lib/site";
import { buildRigor } from "@/lib/rigor";
import { buildStats, readCalibration, readContextIndex, readOlderTests, readPriceShopping, readTierIndex, totalsMatch, withContext, withTiers } from "@/lib/stats";
import "./stats.css";

export const metadata = pageMeta({
  title: "Stats",
  description: "Charts and splits of the Auspex Sports live record: units, ROI, drawdown, rolling windows, price, closing line, the older tests kept apart from the live total, and a longer statistics section.",
  path: "/stats",
});

export default function Page() {
  const data = getData();
  const rows = withContext(withTiers(data.all, readTierIndex()), readContextIndex());
  const model = buildStats(rows);
  if (!totalsMatch(model.summary, data.sum.all)) {
    throw new Error("Stats unit total does not match the site summary.");
  }
  const rigor = buildRigor(rows);
  return (
    <StatsPage
      model={model}
      rigor={rigor}
      launch={SITE.launch}
      updated={data.generatedAt ? stamp(data.generatedAt) : ""}
      clvCopy={summaryCopy(data.clv?.all, data.clv?.leagues)}
      calibration={readCalibration()}
      shopping={readPriceShopping()}
      tests={readOlderTests()}
      nhlTest={data.nhlTest}
    />
  );
}
