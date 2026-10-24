import RecapView from "@/components/RecapView";
import { dayShort } from "@/lib/format";
import { pageMeta } from "@/lib/meta";
import { recapDays, recordText, shareText } from "@/lib/recap";

export function generateMetadata() {
  const d = recapDays()[0];
  if (!d) return pageMeta({ title: "Daily recap", description: "Each slate's graded picks.", path: "/recap" });
  return pageMeta({
    title: `${dayShort(d.date)} recap: ${recordText(d)}`,
    description: shareText(d),
    path: "/recap",
    image: "/recap/opengraph-image",
  });
}

export default function RecapIndex() {
  const days = recapDays();
  if (!days.length) {
    return (
      <div className="page wrap">
        <div className="intro"><h1>Daily recap</h1><p className="lede">The first recap appears once a slate's picks are graded.</p></div>
      </div>
    );
  }
  return <RecapView d={days[0]} days={days} />;
}
