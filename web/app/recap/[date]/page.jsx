import { notFound } from "next/navigation";
import RecapView from "@/components/RecapView";
import { dayShort } from "@/lib/format";
import { pageMeta } from "@/lib/meta";
import { recapDays, recordText, shareText } from "@/lib/recap";

export const dynamicParams = false;

export function generateStaticParams() {
  return recapDays().map((d) => ({ date: d.date }));
}

export async function generateMetadata({ params }) {
  const { date } = await params;
  const d = recapDays().find((x) => x.date === date);
  if (!d) return {};
  return pageMeta({
    title: `${dayShort(d.date)} recap: ${recordText(d)}`,
    description: shareText(d),
    path: `/recap/${d.date}`,
    image: `/recap/${d.date}/opengraph-image`,
  });
}

export default async function RecapDay({ params }) {
  const { date } = await params;
  const days = recapDays();
  const d = days.find((x) => x.date === date);
  if (!d) notFound();
  return <RecapView d={d} days={days} />;
}
