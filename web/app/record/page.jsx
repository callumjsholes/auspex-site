import RecordBoard from "@/components/RecordBoard";
import { getData } from "@/lib/data";
import { stamp } from "@/lib/format";
import { pageMeta } from "@/lib/meta";
import { SITE } from "@/lib/site";

export const metadata = pageMeta({
  title: "Record",
  description: "Every Auspex Sports pick since launch, graded at the posted price, with closing-line value.",
  path: "/record",
});

export default function RecordPage() {
  const D = getData();
  return <RecordBoard rows={D.all} launch={SITE.launch} updated={D.generatedAt ? stamp(D.generatedAt) : ""} />;
}
